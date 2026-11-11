const User = require('../models/User');
const Role = require('../models/Role');
const Doctor = require('../models/Doctor');
const { Patient } = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const { SYSTEM_ROLE_SLUGS } = require('../constants/roles');
const { ensureNotLastActiveSuperAdmin } = require('./rbacService');
const {
  escapeRegex,
  buildPagination,
  buildPaginationMeta,
  buildDateRangeFilter,
} = require('../utils/queryHelpers');

async function listUsers(query = {}) {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (query.roleId) {
    filter.roles = query.roleId;
  }

  if (query.isActive === 'true' || query.isActive === true) {
    filter.isActive = true;
  } else if (query.isActive === 'false' || query.isActive === false) {
    filter.isActive = false;
  }

  const dateFilter = buildDateRangeFilter(query.startDate, query.endDate);
  if (dateFilter) {
    filter.createdAt = dateFilter;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('roles', 'name slug isActive isSystem')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

async function getAssignableRoles(actorAuth) {
  const filter = { isActive: true };
  if (!actorAuth.isSuperAdmin) {
    filter.slug = { $ne: SYSTEM_ROLE_SLUGS.SUPER_ADMIN };
  }

  return Role.find(filter)
    .select('_id name slug description isActive isSystem')
    .sort({ isSystem: -1, name: 1 })
    .lean();
}

async function getUserById(userId) {
  const user = await User.findById(userId)
    .select('-password')
    .populate('roles', 'name slug description isActive isSystem')
    .lean();

  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

async function validateAndResolveRoles(roleIds, actorAuth) {
  const uniqueIds = [...new Set(roleIds.map(String))];
  const roles = await Role.find({ _id: { $in: uniqueIds } }).lean();

  if (roles.length !== uniqueIds.length) {
    throw ApiError.badRequest('One or more selected roles do not exist');
  }

  if (!actorAuth.isSuperAdmin) {
    const triesToAssignSuperAdmin = roles.some(
      (r) => r.slug === SYSTEM_ROLE_SLUGS.SUPER_ADMIN
    );
    if (triesToAssignSuperAdmin) {
      throw ApiError.forbidden(
        'Only Super Admin can assign the Super Admin role'
      );
    }
  }

  return uniqueIds;
}

async function createUser(payload, actorAuth) {
  const existing = await User.findOne({ email: payload.email }).lean();
  if (existing) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const validatedRoleIds = await validateAndResolveRoles(
    payload.roles,
    actorAuth
  );

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    roles: validatedRoleIds,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  });

  return getUserById(user._id);
}

async function updateUser(targetUserId, payload, actorAuth) {
  const targetUser = await User.findById(targetUserId).populate(
    'roles',
    'name slug isActive'
  );
  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  const isSelf = String(targetUser._id) === String(actorAuth.user._id);
  const targetIsSuperAdmin = (targetUser.roles || []).some(
    (r) => r.slug === SYSTEM_ROLE_SLUGS.SUPER_ADMIN
  );

  // Prevent privilege escalation by non-Super-Admin users
  if (!actorAuth.isSuperAdmin) {
    if (targetIsSuperAdmin) {
      throw ApiError.forbidden(
        'Only Super Admin can modify a Super Admin account'
      );
    }
    if (isSelf && (payload.roles !== undefined || payload.isActive !== undefined)) {
      throw ApiError.forbidden(
        'You cannot modify your own roles or activation status'
      );
    }
  }

  if (isSelf && payload.isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own active session account');
  }

  let nextRoles = targetUser.roles.map((r) => String(r._id));
  if (payload.roles !== undefined) {
    nextRoles = await validateAndResolveRoles(payload.roles, actorAuth);
  }

  // Check if update removes Super Admin role or deactivates the last Super Admin
  const superAdminRole = await Role.findOne({
    slug: SYSTEM_ROLE_SLUGS.SUPER_ADMIN,
  })
    .select('_id')
    .lean();

  const willStillHaveSuperAdmin =
    superAdminRole && nextRoles.includes(String(superAdminRole._id));
  const willBeActive =
    payload.isActive !== undefined ? payload.isActive : targetUser.isActive;

  if (targetIsSuperAdmin && (!willStillHaveSuperAdmin || !willBeActive)) {
    await ensureNotLastActiveSuperAdmin(
      targetUser._id,
      !willBeActive ? 'deactivate' : 'remove Super Admin role from'
    );
  }

  if (payload.email && payload.email !== targetUser.email) {
    const duplicate = await User.findOne({
      email: payload.email,
      _id: { $ne: targetUser._id },
    }).lean();
    if (duplicate) {
      throw ApiError.conflict('A user with this email already exists');
    }
    targetUser.email = payload.email;
  }

  if (payload.name !== undefined) {
    targetUser.name = payload.name;
  }

  if (payload.roles !== undefined) {
    targetUser.roles = nextRoles;
  }

  if (payload.isActive !== undefined) {
    if (targetUser.isActive && !payload.isActive) {
      targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    }
    targetUser.isActive = payload.isActive;
  }

  if (payload.password && payload.password.trim().length > 0) {
    targetUser.password = payload.password;
    targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
  }

  await targetUser.save();
  return getUserById(targetUser._id);
}

async function deleteUser(targetUserId, actorAuth) {
  if (String(targetUserId) === String(actorAuth.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const targetUser = await User.findById(targetUserId).populate(
    'roles',
    'slug'
  );
  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  const targetIsSuperAdmin = (targetUser.roles || []).some(
    (r) => r.slug === SYSTEM_ROLE_SLUGS.SUPER_ADMIN
  );

  if (!actorAuth.isSuperAdmin && targetIsSuperAdmin) {
    throw ApiError.forbidden(
      'Only Super Admin can delete a Super Admin account'
    );
  }

  if (targetIsSuperAdmin) {
    await ensureNotLastActiveSuperAdmin(targetUser._id, 'delete');
  }

  await Promise.all([
    Doctor.updateMany({ user: targetUser._id }, { $set: { user: null } }),
    Patient.updateMany({ user: targetUser._id }, { $set: { user: null } }),
  ]);

  await User.deleteOne({ _id: targetUser._id });
  return { id: String(targetUser._id) };
}

module.exports = {
  listUsers,
  getAssignableRoles,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
