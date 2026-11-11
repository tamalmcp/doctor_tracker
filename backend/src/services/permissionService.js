const Permission = require('../models/Permission');
const ApiError = require('../utils/ApiError');
const { PERMISSION_MODULES } = require('../constants/permissions');
const { escapeRegex } = require('../utils/queryHelpers');

async function listPermissions(query = {}) {
  const filter = {};

  if (query.module) {
    filter.module = query.module;
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { name: regex },
      { slug: regex },
      { module: regex },
      { description: regex },
    ];
  }

  const permissions = await Permission.find(filter)
    .sort({ module: 1, slug: 1 })
    .lean();

  const groupedMap = new Map();

  for (const mod of PERMISSION_MODULES) {
    groupedMap.set(mod, []);
  }

  for (const perm of permissions) {
    if (!groupedMap.has(perm.module)) {
      groupedMap.set(perm.module, []);
    }
    groupedMap.get(perm.module).push(perm);
  }

  const grouped = [];
  for (const [moduleName, items] of groupedMap.entries()) {
    if (items.length > 0) {
      grouped.push({
        module: moduleName,
        permissions: items,
      });
    }
  }

  return {
    permissions,
    grouped,
    modules: grouped.map((g) => g.module),
  };
}

async function createPermission(payload) {
  const existing = await Permission.findOne({ slug: payload.slug }).lean();
  if (existing) {
    throw ApiError.conflict('A permission with this slug already exists');
  }

  const permission = await Permission.create(payload);
  return permission.toObject();
}

module.exports = {
  listPermissions,
  createPermission,
};
