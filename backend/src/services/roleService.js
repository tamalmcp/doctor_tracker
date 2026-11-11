const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { SYSTEM_ROLE_SLUGS } = require('../constants/roles');
const {
  escapeRegex,
  buildPagination,
  buildPaginationMeta,
} = require('../utils/queryHelpers');

function slugifyRoleName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function listRoles(query = {}) {
  const { page, limit, skip } = buildPagination(query);
  const match = {};

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    match.$or = [
      { name: regex },
      { slug: regex },
      { description: regex },
    ];
  }

  if (query.isActive === 'true' || query.isActive === true) {
    match.isActive = true;
  } else if (query.isActive === 'false' || query.isActive === false) {
    match.isActive = false;
  }

  if (query.isSystem === 'true' || query.isSystem === true) {
    match.isSystem = true;
  } else if (query.isSystem === 'false' || query.isSystem === false) {
    match.isSystem = false;
  }

  const pipeline = [
    { $match: match },
    { $sort: { isSystem: -1, createdAt: -1 } },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: 'roles',
              as: '_assignedUsers',
            },
          },
          {
            $lookup: {
              from: 'permissions',
              localField: 'permissions',
              foreignField: '_id',
              as: 'permissionDocs',
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              slug: 1,
              description: 1,
              isActive: 1,
              isSystem: 1,
              permissions: 1,
              permissionDocs: {
                _id: 1,
                name: 1,
                slug: 1,
                module: 1,
              },
              permissionCount: { $size: { $ifNull: ['$permissions', []] } },
              assignedUsersCount: { $size: '$_assignedUsers' },
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Role.aggregate(pipeline);
  const roles = result?.items || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return {
    roles,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

async function getRoleById(roleId) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw ApiError.badRequest('Invalid role ID');
  }

  const [role, assignedUsersCount] = await Promise.all([
    Role.findById(roleId)
      .populate('permissions', 'name slug module description')
      .lean(),
    User.countDocuments({ roles: roleId }),
  ]);

  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  return {
    ...role,
    assignedUsersCount,
  };
}

async function validatePermissionIds(permissionIds = []) {
  const uniqueIds = [...new Set(permissionIds.map(String))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const foundCount = await Permission.countDocuments({
    _id: { $in: uniqueIds },
  });

  if (foundCount !== uniqueIds.length) {
    throw ApiError.badRequest('One or more permission IDs are invalid');
  }

  return uniqueIds;
}

async function createRole(payload) {
  const slug = payload.slug || slugifyRoleName(payload.name);
  if (!slug) {
    throw ApiError.badRequest('Valid role slug is required');
  }

  const existing = await Role.findOne({
    $or: [{ name: payload.name }, { slug }],
  }).lean();

  if (existing) {
    throw ApiError.conflict('A role with this name or slug already exists');
  }

  const validPermissionIds = await validatePermissionIds(payload.permissions);

  const role = await Role.create({
    name: payload.name,
    slug,
    description: payload.description || '',
    permissions: validPermissionIds,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    isSystem: false,
  });

  return getRoleById(role._id);
}

async function updateRole(roleId, payload) {
  const role = await Role.findById(roleId);
  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  if (role.slug === SYSTEM_ROLE_SLUGS.SUPER_ADMIN) {
    if (payload.isActive === false) {
      throw ApiError.forbidden('Super Admin role cannot be deactivated');
    }
    if (payload.slug && payload.slug !== role.slug) {
      throw ApiError.forbidden('Super Admin role slug cannot be modified');
    }
  }

  if (role.isSystem && payload.slug && payload.slug !== role.slug) {
    throw ApiError.forbidden('System role slug cannot be modified');
  }

  if (payload.name && payload.name !== role.name) {
    const duplicate = await Role.findOne({
      name: payload.name,
      _id: { $ne: role._id },
    }).lean();
    if (duplicate) {
      throw ApiError.conflict('A role with this name already exists');
    }
    role.name = payload.name;
  }

  if (!role.isSystem && payload.slug && payload.slug !== role.slug) {
    const duplicateSlug = await Role.findOne({
      slug: payload.slug,
      _id: { $ne: role._id },
    }).lean();
    if (duplicateSlug) {
      throw ApiError.conflict('A role with this slug already exists');
    }
    role.slug = payload.slug;
  }

  if (payload.description !== undefined) {
    role.description = payload.description;
  }

  if (payload.isActive !== undefined) {
    role.isActive = payload.isActive;
  }

  if (payload.permissions !== undefined) {
    role.permissions = await validatePermissionIds(payload.permissions);
  }

  await role.save();
  return getRoleById(role._id);
}

async function setRoleActiveStatus(roleId, isActive) {
  const role = await Role.findById(roleId);
  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  if (!isActive && role.slug === SYSTEM_ROLE_SLUGS.SUPER_ADMIN) {
    throw ApiError.forbidden('Super Admin role cannot be deactivated');
  }

  role.isActive = isActive;
  await role.save();
  return getRoleById(role._id);
}

async function assignPermissionsToRole(roleId, permissionIds) {
  const role = await Role.findById(roleId);
  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  const validIds = await validatePermissionIds(permissionIds);
  role.permissions = validIds;
  await role.save();

  return getRoleById(role._id);
}

async function deleteRole(roleId) {
  const role = await Role.findById(roleId);
  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  if (role.slug === SYSTEM_ROLE_SLUGS.SUPER_ADMIN || role.isSystem) {
    throw ApiError.forbidden('System roles cannot be deleted');
  }

  const pullResult = await User.updateMany(
    { roles: role._id },
    { $pull: { roles: role._id } }
  );

  await Role.deleteOne({ _id: role._id });

  return {
    id: String(role._id),
    unassignedUsersCount: pullResult.modifiedCount || 0,
  };
}

async function getRoleAssignedUsers(roleId, query = {}) {
  const role = await Role.findById(roleId).select('name slug isActive isSystem').lean();
  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  const { page, limit, skip } = buildPagination(query);
  const filter = { roles: role._id };

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('roles', 'name slug isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    role,
    users,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  setRoleActiveStatus,
  assignPermissionsToRole,
  deleteRole,
  getRoleAssignedUsers,
};
