const { env, validateEnv } = require('./config/env');
const {
  connectDatabase,
  disconnectDatabase,
  verifyDatabaseConnection,
} = require('./config/database');
const { seedRbac } = require('./seeders/seedRbac');
const app = require('./app');

let server = null;

async function startServer() {
  try {
    validateEnv();

    console.log('[Server] Connecting to MongoDB Atlas...');
    await connectDatabase();

    const pingOk = await verifyDatabaseConnection();
    if (!pingOk) {
      throw new Error('MongoDB Atlas ping verification failed');
    }

    await seedRbac();

    server = app.listen(env.port, () => {
      console.log(
        `[Server] Doctor Tracker API listening on port ${env.port} (${env.nodeEnv})`
      );
    });
  } catch (err) {
    console.error('[Server] Startup failed:', err.message);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDatabase();
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Server] Error during shutdown:', err.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

startServer();
