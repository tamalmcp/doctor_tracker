const {
  getDatabaseHealth,
  verifyDatabaseConnection,
} = require('../config/database');

async function getHealth(_req, res) {
  let dbPing = false;
  try {
    dbPing = await verifyDatabaseConnection();
  } catch (_err) {
    dbPing = false;
  }

  const dbHealth = getDatabaseHealth();
  const isHealthy = dbPing && dbHealth.readyState === 1;

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy
      ? 'Application and MongoDB Atlas connection are healthy'
      : 'Database connection is unavailable',
    data: {
      service: 'doctor-tracker-api',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        ...dbHealth,
        pingOk: dbPing,
      },
    },
  });
}

module.exports = {
  getHealth,
};
