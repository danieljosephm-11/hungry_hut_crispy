import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { QRConfiguration, RestaurantSettings } from '../../models/index.js';
import { requireRole } from '../../lib/auth.js';
import { asyncHandler, httpError } from '../../lib/http.js';
import { storeImage } from '../../lib/upload.js';
import { uploadLimiter } from '../../lib/limiters.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 1 } });

const socialSchema = z
  .object({
    instagram: z.string().trim().max(300),
    facebook: z.string().trim().max(300),
    x: z.string().trim().max(300),
    youtube: z.string().trim().max(300),
    whatsapp: z.string().trim().max(300),
  })
  .partial();

const settingsInput = z
  .object({
    name: z.string().trim().min(2).max(80),
    tagline: z.string().trim().max(160),
    secondaryTagline: z.string().trim().max(160),
    logoUrl: z.string().trim().max(500),
    phone: z.string().trim().max(30),
    email: z.string().trim().max(120),
    address: z.string().trim().max(300),
    mapQuery: z.string().trim().max(300),
    openingHours: z.array(z.object({ day: z.string().trim().max(20), hours: z.string().trim().max(40) })).max(7),
    social: socialSchema,
    delivery: z
      .object({
        enabled: z.boolean(),
        fee: z.coerce.number().min(0).max(5000),
        freeAbove: z.coerce.number().min(0).max(100000),
        minOrder: z.coerce.number().min(0).max(100000),
        etaMinutes: z.coerce.number().min(1).max(240),
        radiusKm: z.coerce.number().min(0).max(100),
      })
      .partial(),
    pickup: z.object({ enabled: z.boolean(), etaMinutes: z.coerce.number().min(1).max(240) }).partial(),
    taxRate: z.coerce.number().min(0).max(28),
    avgPrepMinutes: z.coerce.number().min(1).max(120),
    kitchenCapacity: z.coerce.number().min(1).max(100),
    payment: z
      .object({
        upiId: z.string().trim().max(120),
        payeeName: z.string().trim().max(120),
        qrImageUrl: z.string().trim().max(500),
        instructions: z.string().trim().max(1000),
        acceptCod: z.boolean(),
      })
      .partial(),
    secretMenu: z
      .object({
        isEnabled: z.boolean(),
        passphrase: z.string().trim().min(3, 'Secret word must be at least 3 characters.').max(60),
        hint: z.string().trim().max(300),
      })
      .partial(),
    story: z
      .object({
        heading: z.string().trim().max(200),
        body: z.string().trim().max(4000),
        image: z.string().trim().max(500),
        image2: z.string().trim().max(500),
        establishedYear: z.coerce.number().min(1900).max(2100),
      })
      .partial(),
    stats: z
      .object({
        happyCustomers: z.string().trim().max(20),
        ordersServed: z.string().trim().max(20),
        rating: z.string().trim().max(10),
      })
      .partial(),
    announcement: z.string().trim().max(300),
    hero: z
      .object({
        eyebrow: z.string().trim().max(160),
        image: z.string().trim().max(500),
        liveNote: z.string().trim().max(160),
      })
      .partial(),
    faqs: z.array(z.object({ question: z.string().trim().max(300), answer: z.string().trim().max(2000) })).max(20),
  })
  .partial();

const nestedSections = ['social', 'delivery', 'pickup', 'payment', 'secretMenu', 'story', 'stats', 'hero'];

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    let settings = await RestaurantSettings.findOne({ key: 'main' });
    if (!settings) settings = await RestaurantSettings.create({ key: 'main' });
    res.json(settings);
  }),
);

router.put(
  '/settings',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const body = settingsInput.parse(req.body);
    let settings = await RestaurantSettings.findOne({ key: 'main' });
    if (!settings) settings = new RestaurantSettings({ key: 'main' });

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;
      if (nestedSections.includes(key)) {
        const current = settings[key]?.toObject ? settings[key].toObject() : settings[key] || {};
        settings[key] = { ...current, ...value };
      } else {
        settings[key] = value;
      }
    }
    await settings.save();
    res.json({ message: 'Restaurant settings saved.', settings });
  }),
);

function siteUrl() {
  return (process.env.PUBLIC_SITE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
}

function upiUri(settings) {
  const params = new URLSearchParams({
    pa: settings.payment.upiId || '',
    pn: settings.payment.payeeName || settings.name,
    cu: 'INR',
  });
  return `upi://pay?${params.toString()}`;
}

async function ensureQr(settings) {
  const menuUrl = `${siteUrl()}/menu`;
  const [menu, payment] = await Promise.all([
    QRConfiguration.findOneAndUpdate(
      { type: 'menu' },
      { $setOnInsert: { type: 'menu', label: 'Scan for the Hungry Hut menu', url: menuUrl, isActive: true } },
      { upsert: true, new: true },
    ),
    QRConfiguration.findOneAndUpdate(
      { type: 'payment' },
      {
        $setOnInsert: {
          type: 'payment',
          label: 'Scan to pay Hungry Hut',
          url: upiUri(settings),
          imageUrl: settings.payment.qrImageUrl || '',
          isActive: true,
        },
      },
      { upsert: true, new: true },
    ),
  ]);
  return { menu, payment, menuUrl, upiUri: upiUri(settings) };
}

router.get(
  '/qr',
  asyncHandler(async (_req, res) => {
    const settings = await RestaurantSettings.findOne({ key: 'main' });
    const qr = await ensureQr(settings || { name: 'Hungry Hut', payment: {} });
    res.json(qr);
  }),
);

const qrInput = z.object({
  label: z.string().trim().max(120).optional().default(''),
  url: z.string().trim().max(1000).optional().default(''),
  imageUrl: z.string().trim().max(500).optional().default(''),
  isActive: z.boolean().optional().default(true),
  notes: z.string().trim().max(300).optional().default(''),
});

router.put(
  '/qr/:type',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    if (!['menu', 'payment'].includes(req.params.type)) throw httpError(400, 'Unknown QR type.');
    const body = qrInput.parse(req.body);
    const config = await QRConfiguration.findOneAndUpdate(
      { type: req.params.type },
      { $set: body },
      { new: true, upsert: true, runValidators: true },
    );
    if (req.params.type === 'payment' && body.imageUrl) {
      await RestaurantSettings.findOneAndUpdate(
        { key: 'main' },
        { $set: { 'payment.qrImageUrl': body.imageUrl } },
        { upsert: true },
      );
    }
    res.json(config);
  }),
);

router.post(
  '/upload',
  uploadLimiter,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, 'Choose an image to upload.');
    const url = await storeImage(req.file);
    res.status(201).json({ url });
  }),
);

export default router;
