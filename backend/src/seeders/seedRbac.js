const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const { env } = require('../config/env');
const { DEFAULT_ROLES, SYSTEM_ROLE_SLUGS } = require('../constants/roles');
const {
  PERMISSION_CATALOG,
  DEFAULT_ROLE_PERMISSION_SLUGS,
} = require('../constants/permissions');

async function seedPermissions() {
  const bulkOps = PERMISSION_CATALOG.map((perm) => ({
    updateOne: {
      filter: { slug: perm.slug },
      update: {
        $setOnInsert: {
          name: perm.name,
          slug: perm.slug,
          module: perm.module,
          description: perm.description,
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await Permission.bulkWrite(bulkOps);
  }

  const allPermissions = await Permission.find({}).lean();
  const permissionBySlug = new Map(
    allPermissions.map((perm) => [perm.slug, perm._id])
  );

  return { allPermissions, permissionBySlug };
}

async function seedRoles(permissionBySlug) {
  const roleBySlug = new Map();

  for (const roleDef of DEFAULT_ROLES) {
    let role = await Role.findOne({ slug: roleDef.slug });

    if (!role) {
      const defaultSlugs = DEFAULT_ROLE_PERMISSION_SLUGS[roleDef.slug] || [];
      const defaultPermissionIds = defaultSlugs
        .map((slug) => permissionBySlug.get(slug))
        .filter(Boolean);

      role = await Role.create({
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
        isActive: roleDef.isActive,
        permissions: defaultPermissionIds,
      });
    } else {
      // Ensure system flags remain intact without overwriting custom permissions
      let dirty = false;
      if (!role.isSystem) {
        role.isSystem = true;
        dirty = true;
      }
      if (role.slug === SYSTEM_ROLE_SLUGS.SUPER_ADMIN && !role.isActive) {
        role.isActive = true;
        dirty = true;
      }
      if (dirty) {
        await role.save();
      }
    }

    roleBySlug.set(role.slug, role);
  }

  return roleBySlug;
}

async function seedSuperAdminAccount(superAdminRole) {
  if (!env.superAdminEmail || !env.superAdminPassword) {
    console.warn(
      '[Seed] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is not set; skipping initial Super Admin creation.'
    );
    return null;
  }

  const normalizedEmail = env.superAdminEmail.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    const hasSuperAdminRole = existingUser.roles.some(
      (id) => String(id) === String(superAdminRole._id)
    );
    if (!hasSuperAdminRole || !existingUser.isActive) {
      if (!hasSuperAdminRole) {
        existingUser.roles.push(superAdminRole._id);
      }
      existingUser.isActive = true;
      await existingUser.save();
    }
    return existingUser;
  }

  const user = await User.create({
    name: env.superAdminName || 'Super Admin',
    email: normalizedEmail,
    password: env.superAdminPassword,
    roles: [superAdminRole._id],
    isActive: true,
  });

  return user;
}

async function seedRbac() {
  const { allPermissions, permissionBySlug } = await seedPermissions();
  const roleBySlug = await seedRoles(permissionBySlug);
  const superAdminRole = roleBySlug.get(SYSTEM_ROLE_SLUGS.SUPER_ADMIN);
  const superAdminUser = await seedSuperAdminAccount(superAdminRole);

  console.log(
    `[Seed] RBAC ready: ${allPermissions.length} permissions, ${roleBySlug.size} system roles${
      superAdminUser ? `, Super Admin (${superAdminUser.email})` : ''
    }`
  );

  return {
    permissionsCount: allPermissions.length,
    roles: roleBySlug,
    superAdminUser,
  };
}

module.exports = {
  seedRbac,
  seedPermissions,
  seedRoles,
  seedSuperAdminAccount,
};
