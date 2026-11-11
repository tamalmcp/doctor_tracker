const { validateEnv } = require('../config/env');
const {
  connectDatabase,
  disconnectDatabase,
} = require('../config/database');
const { seedRbac } = require('./seedRbac');
const { seedDemoData } = require('./seedDemoData');

async function runSeed() {
  const includeDemo = process.argv.includes('--demo');

  try {
    validateEnv();
    await connectDatabase();
    await seedRbac();

    if (includeDemo) {
      await seedDemoData();
    }

    await disconnectDatabase();
    console.log('[Seed] Completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Failed:', err.message);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

runSeed();
