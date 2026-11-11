const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET'];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key] || String(process.env[key]).trim() === ''
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}`
    );
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME || 'doctor_tracker',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  superAdminName: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || '',
};

module.exports = {
  env,
  validateEnv,
};
