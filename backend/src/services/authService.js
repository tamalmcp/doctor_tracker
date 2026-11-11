const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const { resolveUserAuthContext } = require('./rbacService');

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden(
      'Your account has been deactivated. Please contact an administrator.'
    );
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } }
  );

  const authContext = await resolveUserAuthContext(user._id, {
    includeAllPermissionsForSuperAdmin: true,
  });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    auth: {
      user: authContext.user,
      isSuperAdmin: authContext.isSuperAdmin,
      roles: authContext.activeRoles.map((r) => ({
        _id: r._id,
        name: r.name,
        slug: r.slug,
        isActive: r.isActive,
        isSystem: r.isSystem,
      })),
      permissions: authContext.effectivePermissions,
    },
  };
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const authContext = await resolveUserAuthContext(decoded.sub, {
    includeAllPermissionsForSuperAdmin: true,
  });
  if (!authContext) {
    throw ApiError.unauthorized('User account no longer exists');
  }

  if (!authContext.user.isActive) {
    throw ApiError.forbidden('Account is deactivated');
  }

  if ((decoded.tokenVersion || 0) !== (authContext.user.tokenVersion || 0)) {
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  const accessToken = signAccessToken(authContext.user);
  const nextRefreshToken = signRefreshToken(authContext.user);

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    auth: {
      user: authContext.user,
      isSuperAdmin: authContext.isSuperAdmin,
      roles: authContext.activeRoles.map((r) => ({
        _id: r._id,
        name: r.name,
        slug: r.slug,
        isActive: r.isActive,
        isSystem: r.isSystem,
      })),
      permissions: authContext.effectivePermissions,
    },
  };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return { accessToken, refreshToken };
}

function formatAuthMeResponse(authContext) {
  return {
    user: authContext.user,
    isSuperAdmin: authContext.isSuperAdmin,
    roles: authContext.activeRoles.map((r) => ({
      _id: r._id,
      name: r.name,
      slug: r.slug,
      isActive: r.isActive,
      isSystem: r.isSystem,
    })),
    permissions: authContext.effectivePermissions,
  };
}

module.exports = {
  loginUser,
  refreshSession,
  changePassword,
  formatAuthMeResponse,
};
