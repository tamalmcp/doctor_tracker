const dns = require('dns');
const mongoose = require('mongoose');
const { env } = require('./env');

let connectionPromise = null;
let listenersRegistered = false;

function ensureSrvDnsResolution() {
  if (!env.mongodbUri || !env.mongodbUri.startsWith('mongodb+srv://')) {
    return;
  }
  const currentServers = dns.getServers();
  const isLoopbackOnly =
    currentServers.length === 0 ||
    currentServers.every((s) => s === '127.0.0.1' || s === '::1');

  if (isLoopbackOnly) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}

const READY_STATE_MAP = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

function registerConnectionListeners() {
  if (listenersRegistered) {
    return;
  }
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    console.log(
      `[DB] Connected to MongoDB Atlas database "${mongoose.connection.name}"`
    );
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] MongoDB reconnected');
  });
}

async function connectDatabase(retries = 3) {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI environment variable is not configured.');
  }

  // Reuse existing active connection to avoid creating multiple connections
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  registerConnectionListeners();
  ensureSrvDnsResolution();

  const attemptConnect = async (attempt) => {
    try {
      const mongooseInstance = await mongoose.connect(env.mongodbUri, {
        dbName: env.dbName,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 45000,
      });
      return mongooseInstance.connection;
    } catch (err) {
      if (attempt < retries) {
        const delayMs = attempt * 1500;
        console.warn(
          `[DB] Connection attempt ${attempt} failed (${err.message}). Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return attemptConnect(attempt + 1);
      }
      throw err;
    }
  };

  connectionPromise = attemptConnect(1).catch((err) => {
    connectionPromise = null;
    throw err;
  });

  return connectionPromise;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  connectionPromise = null;
}

async function verifyDatabaseConnection() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return false;
  }
  await mongoose.connection.db.admin().ping();
  return true;
}

function getDatabaseHealth() {
  const readyState = mongoose.connection.readyState;
  return {
    status: READY_STATE_MAP[readyState] || 'unknown',
    readyState,
    database: mongoose.connection.name || env.dbName,
    host: mongoose.connection.host || null,
  };
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  verifyDatabaseConnection,
  getDatabaseHealth,
};
