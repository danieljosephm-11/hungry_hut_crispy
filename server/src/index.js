import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './db.js';
import { seedDatabase } from './seed.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin/index.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import publicRoutes from './routes/public.js';
import { errorHandler } from './middleware.js';
import { uploadDir } from './lib/upload.js';
import { authLimiter, contactLimiter, publicLimiter, secretLimiter } from './lib/limiters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const clientDist = path.resolve(rootDir, 'client/dist');
const port = Number(process.env.PORT) || 4000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production (minimum 24 characters).');
  }
  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('[auth] JWT_SECRET was not set. Using an ephemeral development secret.');
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const sameOriginDev =
  process.env.NODE_ENV === 'production'
    ? []
    : [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
const origins = [...new Set([...configuredOrigins, ...sameOriginDev])];

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: '1mb',
    verify(req, _res, buffer) {
      req.rawBody = buffer;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(uploadDir, { maxAge: '7d', fallthrough: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'hungry-hut-api',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/secret', secretLimiter);
app.use('/api/contact', contactLimiter);
app.use('/api', publicLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', publicRoutes);

const serveClient = process.env.SERVE_CLIENT !== 'false' && fs.existsSync(path.join(clientDist, 'index.html'));
if (serveClient) {
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      service: 'Hungry Hut API',
      message: 'The customer app runs on Vite in development: http://localhost:5173',
    });
  });
}

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});
app.use(errorHandler);

async function start() {
  await connectDB();
  if (process.env.AUTO_SEED !== 'false') {
    const result = await seedDatabase({ auto: true });
    if (result.skipped) {
      console.log('[seed] existing data found — skipping automatic seed');
    } else {
      console.log('[seed] seeded database', result.counts);
    }
  }
  app.listen(port, () => {
    console.log(`[api] Hungry Hut running at http://localhost:${port}`);
    console.log(`[api] customer app expected at ${origins[0]}`);
  });
}

start().catch(async (error) => {
  console.error('[startup failed]', error);
  await disconnectDB();
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`\n[api] ${signal} received — closing down`);
  await disconnectDB();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
