const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Doctor = require('../models/Doctor');
const { Patient } = require('../models/Patient');
const { SYSTEM_ROLE_SLUGS } = require('../constants/roles');
const ApiError = require('../utils/ApiError');

/**
 * Loads fresh user identity, active roles, and effective permissions from MongoDB
 * in a single $lookup aggregation round-trip. Executed per request so permission or
 * role changes take effect immediately without requiring users to log out and back in.
 */
async function resolveUserAuthContext(
  userId,
  { includeAllPermissionsForSuperAdmin = false } = {}
) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  const [user] = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'roles',
        localField: 'roles',
        foreignField: '_id',
        as: 'roleDocs',
      },
    },
    {
      $lookup: {
        from: 'permissions',
        let: {
          permIds: {
            $reduce: {
              input: {
                $filter: {
                  input: '$roleDocs',
                  as: 'r',
                  cond: { $eq: ['$$r.isActive', true] },
                },
              },
              initialValue: [],
              in: {
                $concatArrays: [
                  '$$value',
                  { $ifNull: ['$$this.permissions', []] },
                ],
              },
            },
          },
        },
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$permIds'] } } },
          { $project: { slug: 1 } },
        ],
        as: 'effectivePermissionDocs',
      },
    },
    {
      $project: {
        password: 0,
      },
    },
  ]);

  if (!user) {
    return null;
  }

  const allAssignedRoles = Array.isArray(user.roleDocs) ? user.roleDocs : [];
  const activeRoles = allAssignedRoles.filter((role) => role.isActive === true);
  const roleSlugs = activeRoles.map((role) => role.slug);
  const isSuperAdmin = roleSlugs.includes(SYSTEM_ROLE_SLUGS.SUPER_ADMIN);

  let effectivePermissions = [];
  if (isSuperAdmin) {
    if (includeAllPermissionsForSuperAdmin) {
      effectivePermissions = await Permission.distinct('slug');
    }
  } else {
    const permissionSet = new Set();
    for (const perm of user.effectivePermissionDocs || []) {
      if (perm && perm.slug) {
        permissionSet.add(perm.slug);
      }
    }
    effectivePermissions = Array.from(permissionSet);
  }

  return {
    user: {
      _id: user._id,
      id: String(user._id),
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion || 0,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: allAssignedRoles.map((r) => ({
        _id: r._id,
        name: r.name,
        slug: r.slug,
        isActive: r.isActive,
        isSystem: r.isSystem,
      })),
    },
    activeRoles,
    roleSlugs,
    isSuperAdmin,
    effectivePermissions,
    permissionSet: new Set(effectivePermissions),
  };
}

function hasPermission(authContext, permissionSlug) {
  if (!authContext) return false;
  if (authContext.isSuperAdmin) return true;
  return authContext.permissionSet.has(permissionSlug);
}

function hasAnyPermission(authContext, permissionSlugs = []) {
  if (!authContext) return false;
  if (authContext.isSuperAdmin) return true;
  return permissionSlugs.some((slug) => authContext.permissionSet.has(slug));
}

function hasAllPermissions(authContext, permissionSlugs = []) {
  if (!authContext) return false;
  if (authContext.isSuperAdmin) return true;
  return permissionSlugs.every((slug) => authContext.permissionSet.has(slug));
}

function hasRole(authContext, roleSlug) {
  if (!authContext) return false;
  return authContext.roleSlugs.includes(roleSlug);
}

/**
 * Resolves data-access scope for Doctor and Patient entities.
 * - Super Admin, Admin, or any custom non-clinical role => 'all'
 * - Doctor-only => 'doctor' (scoped to their own Doctor record & assigned patients)
 * - Patient-only => 'patient' (scoped to their own Patient record & assigned doctor)
 */
async function resolveDataAccessScope(authContext) {
  if (!authContext) {
    return { level: 'none' };
  }

  if (authContext.isSuperAdmin) {
    return { level: 'all' };
  }

  const slugs = authContext.roleSlugs || [];
  if (slugs.length === 0) {
    return { level: 'none' };
  }

  const hasElevatedOrCustomRole = slugs.some(
    (slug) =>
      slug !== SYSTEM_ROLE_SLUGS.DOCTOR && slug !== SYSTEM_ROLE_SLUGS.PATIENT
  );

  if (hasElevatedOrCustomRole) {
    return { level: 'all' };
  }

  if (slugs.includes(SYSTEM_ROLE_SLUGS.DOCTOR)) {
    const doctorProfile = await Doctor.findOne({
      $or: [
        { user: authContext.user._id },
        { email: authContext.user.email },
      ],
    })
      .select('_id')
      .lean();

    return {
      level: 'doctor',
      doctorId: doctorProfile ? doctorProfile._id : null,
    };
  }

  if (slugs.includes(SYSTEM_ROLE_SLUGS.PATIENT)) {
    const ownPatients = await Patient.find({
      $or: [
        { user: authContext.user._id },
        { email: authContext.user.email },
      ],
    })
      .select('_id doctor')
      .lean();

    return {
      level: 'patient',
      patientIds: ownPatients.map((p) => p._id),
      doctorIds: ownPatients.map((p) => p.doctor).filter(Boolean),
    };
  }

  return { level: 'none' };
}

/**
 * Protects against deleting, deactivating, or stripping Super Admin
 * from the final remaining active Super Admin account.
 */
async function ensureNotLastActiveSuperAdmin(targetUserId, actionLabel = 'modify') {
  const superAdminRole = await Role.findOne({
    slug: SYSTEM_ROLE_SLUGS.SUPER_ADMIN,
  })
    .select('_id')
    .lean();

  if (!superAdminRole) {
    return;
  }

  const targetUser = await User.findById(targetUserId)
    .select('isActive roles')
    .lean();

  if (!targetUser) {
    return;
  }

  const targetHasSuperAdmin = (targetUser.roles || []).some(
    (roleId) => String(roleId) === String(superAdminRole._id)
  );

  if (!targetHasSuperAdmin || !targetUser.isActive) {
    return;
  }

  const otherActiveSuperAdmins = await User.countDocuments({
    _id: { $ne: targetUserId },
    isActive: true,
    roles: superAdminRole._id,
  });

  if (otherActiveSuperAdmins === 0) {
    throw ApiError.badRequest(
      `Cannot ${actionLabel} the final active Super Admin account`
    );
  }
}

module.exports = {
  resolveUserAuthContext,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  resolveDataAccessScope,
  ensureNotLastActiveSuperAdmin,
};
