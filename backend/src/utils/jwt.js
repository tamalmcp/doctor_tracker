const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      tokenVersion: user.tokenVersion || 0,
      type: 'access',
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      tokenVersion: user.tokenVersion || 0,
      type: 'refresh',
    },
    env.jwtRefreshSecret,
    {
      expiresIn: env.jwtRefreshExpiresIn,
    }
  );
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.type && decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, env.jwtRefreshSecret);
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  return decoded;
}

function parseDurationToMs(durationStr, fallbackMs) {
  if (!durationStr || typeof durationStr !== 'string') {
    return fallbackMs;
  }
  const match = durationStr.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return fallbackMs;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}

function getCookieOptions(maxAgeMs, cookiePath = '/') {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: cookiePath,
    maxAge: maxAgeMs,
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  const accessMaxAge = parseDurationToMs(env.jwtExpiresIn, 24 * 60 * 60 * 1000);
  const refreshMaxAge = parseDurationToMs(
    env.jwtRefreshExpiresIn,
    7 * 24 * 60 * 60 * 1000
  );

  res.cookie('accessToken', accessToken, getCookieOptions(accessMaxAge, '/'));
  res.cookie(
    'refreshToken',
    refreshToken,
    getCookieOptions(refreshMaxAge, '/api/v1/auth')
  );
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', getCookieOptions(0, '/'));
  res.clearCookie('refreshToken', getCookieOptions(0, '/api/v1/auth'));
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
