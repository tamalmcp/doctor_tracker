const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/authService');
const { setAuthCookies, clearAuthCookies } = require('../utils/jwt');

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);

  return ApiResponse.success(res, {
    message: 'Login successful',
    data: {
      ...result.auth,
      accessToken: result.accessToken,
    },
  });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  return ApiResponse.success(res, {
    message: 'Logged out successfully',
    data: null,
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refreshSession(refreshToken);
  setAuthCookies(res, result.accessToken, result.refreshToken);

  return ApiResponse.success(res, {
    message: 'Session refreshed successfully',
    data: {
      ...result.auth,
      accessToken: result.accessToken,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, {
    message: 'Authenticated user profile retrieved',
    data: authService.formatAuthMeResponse(req.auth),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.changePassword(
    req.user._id,
    req.body
  );
  setAuthCookies(res, accessToken, refreshToken);

  return ApiResponse.success(res, {
    message: 'Password updated successfully',
    data: null,
  });
});

module.exports = {
  login,
  logout,
  refresh,
  me,
  changePassword,
};
