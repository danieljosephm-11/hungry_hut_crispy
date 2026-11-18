import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let memoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hungry-hut';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3500 });
    console.log('[db] connected to MongoDB');
    return { embedded: false };
  } catch (error) {
    if (process.env.NODE_ENV === 'production' || process.env.DEV_EMBEDDED_DB === 'false') {
      console.error('[db] Could not connect to MongoDB:', error.message);
      throw error;
    }
    console.warn('[db] Local MongoDB unavailable — starting a development embedded MongoDB.');
    console.warn('[db] Set MONGODB_URI in server/.env for persistent data.');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(__dirname, '../../.mongo-data');
    await fs.mkdir(dbPath, { recursive: true });
    try {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: 'wiredTiger' },
      });
    } catch (innerError) {
      console.warn('[db] Persistent embedded MongoDB failed:', innerError.message);
      memoryServer = await MongoMemoryServer.create();
    }
    await mongoose.connect(memoryServer.getUri('hungry-hut'));
    console.log('[db] connected to development embedded MongoDB');
    return { embedded: true, uri: memoryServer.getUri() };
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
