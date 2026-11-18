import mongoose from 'mongoose';
import app from '../server/src/index.js';
import { connectDB } from '../server/src/db.js';
import { seedDatabase } from '../server/src/seed.js';

let initialization;

async function initialize() {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  if (process.env.AUTO_SEED !== 'false') {
    await seedDatabase({ auto: true });
  }
}

export default async function handler(req, res) {
  initialization ||= initialize();
  await initialization;
  return app(req, res);
}
