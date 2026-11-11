const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const { resolveUserAuthContext } = require('../services/rbacService');

function extractTokenFromRequest(req) {
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

async function requireAuth(req, _res, next) {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return next(ApiError.unauthorized('Authentication token is required'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (_err) {
      return next(ApiError.unauthorized('Invalid or expired authentication token'));
    }

    const includeAllForMe = req.originalUrl.includes('/auth/me');
    const authContext = await resolveUserAuthContext(decoded.sub, {
      includeAllPermissionsForSuperAdmin: includeAllForMe,
    });
    if (!authContext) {
      return next(ApiError.unauthorized('User account no longer exists'));
    }

    if (!authContext.user.isActive) {
      return next(
        ApiError.forbidden('Account is deactivated. Please contact an administrator.')
      );
    }

    if ((decoded.tokenVersion || 0) !== (authContext.user.tokenVersion || 0)) {
      return next(
        ApiError.unauthorized('Session has been invalidated. Please log in again.')
      );
    }

    req.user = authContext.user;
    req.auth = authContext;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  requireAuth,
  extractTokenFromRequest,
};
