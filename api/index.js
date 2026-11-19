let initPromise = null;

function missingConfig() {
  const missing = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
    missing.push('JWT_SECRET (random string, at least 24 characters)');
  }
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI (MongoDB Atlas connection string)');
  if (!process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD (used when the database is first seeded)');
  return missing;
}

async function initialize() {
  if (!initPromise) {
    initPromise = (async () => {
      const missing = missingConfig();
      if (missing.length) {
        throw new Error(`Missing Vercel environment variables: ${missing.join(', ')}`);
      }

      // Imported lazily so a bad environment produces a readable JSON error
      // instead of crashing the function before the handler can respond.
      const [{ default: app }, { connectDB }, { seedDatabase }] = await Promise.all([
        import('../server/src/index.js'),
        import('../server/src/db.js'),
        import('../server/src/seed.js'),
      ]);

      await connectDB();
      if (process.env.AUTO_SEED !== 'false') {
        const result = await seedDatabase({ auto: true });
        console.log(
          result.skipped
            ? '[seed] existing data found — skipping automatic seed'
            : `[seed] seeded database ${JSON.stringify(result.counts)}`,
        );
      }
      return app;
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

export default async function handler(req, res) {
  try {
    const app = await initialize();
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
