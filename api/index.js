import app from '../server/src/index.js';
import { connectDB } from '../server/src/db.js';
import { seedDatabase } from '../server/src/seed.js';

let initPromise = null;

async function initialize() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDB();
      if (process.env.AUTO_SEED !== 'false') {
        const result = await seedDatabase({ auto: true });
        if (result.skipped) {
          console.log('[seed] existing data found — skipping automatic seed');
        } else {
          console.log('[seed] seeded database', result.counts);
        }
      }
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

export default async function handler(req, res) {
  try {
    await initialize();
    return app(req, res);
  } catch (error) {
    console.error('[vercel] initialization failed', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Server initialization failed', error: error.message }));
    }
    return undefined;
  }
}
