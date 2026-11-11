const ApiError = require('../utils/ApiError');
const {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
} = require('../services/rbacService');

function requirePermission(permissionSlug) {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (hasPermission(req.auth, permissionSlug)) {
      return next();
    }

    return next(
      ApiError.forbidden(
        `Missing required permission: ${permissionSlug}`
      )
    );
  };
}

function requireAnyPermission(permissionSlugs = []) {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (hasAnyPermission(req.auth, permissionSlugs)) {
      return next();
    }

    return next(
      ApiError.forbidden(
        `Missing one of required permissions: ${permissionSlugs.join(', ')}`
      )
    );
  };
}

function requireAllPermissions(permissionSlugs = []) {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (hasAllPermissions(req.auth, permissionSlugs)) {
      return next();
    }

    return next(
      ApiError.forbidden(
        `Missing required permissions: ${permissionSlugs.join(', ')}`
      )
    );
  };
}

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const matched = allowedRoles.some((roleSlug) =>
      hasRole(req.auth, roleSlug)
    );

    if (matched) {
      return next();
    }

    return next(
      ApiError.forbidden(
        `Requires one of the following roles: ${allowedRoles.join(', ')}`
      )
    );
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
};
