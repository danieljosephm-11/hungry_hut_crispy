import { Router } from 'express';
import { z } from 'zod';
import {
  Category,
  ContactMessage,
  GalleryItem,
  Offer,
  Product,
  SecretItem,
  Testimonial,
} from '../models/index.js';
import { asyncHandler, httpError } from '../lib/http.js';
import { buildQuote, getSettings, publicSettings } from '../lib/pricing.js';
import { crispyMeter } from '../lib/crispy.js';

const router = Router();

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function activeOffers(limit = 0) {
  const now = new Date();
  let query = Offer.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .sort({ isFeatured: -1, order: 1, createdAt: -1 })
    .populate('appliesToProduct', 'name slug price');
  if (limit) query = query.limit(limit);
  return query;
}

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    res.json(publicSettings(settings));
  }),
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(categories);
  }),
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { category, q, diet, sort, limit } = req.query;
    const query = { isAvailable: true };

    if (category && category !== 'all') {
      const cat = await Category.findOne({ slug: String(category).toLowerCase() });
      if (!cat) return res.json([]);
      query.category = cat._id;
    }
    if (diet === 'veg') query.foodType = 'veg';
    if (diet === 'nonveg') query.foodType = { $in: ['nonveg', 'egg'] };
    if (q) {
      const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
      query.$or = [{ name: rx }, { description: rx }, { tags: rx }];
    }

    let sortSpec = { order: 1, name: 1 };
    if (sort === 'price-asc') sortSpec = { price: 1 };
    if (sort === 'price-desc') sortSpec = { price: -1 };
    if (sort === 'popular') sortSpec = { isBestseller: -1, isPopular: -1, order: 1 };
    if (sort === 'rating') sortSpec = { rating: -1, ratingCount: -1 };

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortSpec)
      .limit(Math.min(200, Number(limit) || 100));
    res.json(products);
  }),
);

router.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product || !product.isAvailable) throw httpError(404, 'That dish could not be found.');
    res.json(product);
  }),
);

router.get(
  '/offers',
  asyncHandler(async (req, res) => {
    const offers = await activeOffers(Math.min(50, Number(req.query.limit) || 0));
    res.json(offers);
  }),
);

router.get(
  '/bucket/ingredients',
  asyncHandler(async (_req, res) => {
    const { BucketIngredient } = await import('../models/index.js');
    const items = await BucketIngredient.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(items);
  }),
);

router.post(
  '/secret/unlock',
  asyncHandler(async (req, res) => {
    const { code } = z.object({ code: z.string().trim().min(1, 'Enter the secret word.') }).parse(req.body);
    const settings = await getSettings();
    if (!settings.secretMenu.isEnabled) throw httpError(403, 'The secret menu is resting right now.');
    const stored = String(settings.secretMenu.passphrase || '').trim().toLowerCase();
    if (code.toLowerCase() !== stored) {
      throw httpError(401, 'That is not the secret word. Listen for the kitchen whisper.');
    }
    const items = await SecretItem.find({ isActive: true }).sort({ order: 1 });
    res.json({ unlocked: true, items });
  }),
);

router.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const items = await Testimonial.find({ isApproved: true }).sort({ isFeatured: -1, order: 1 });
    res.json(items);
  }),
);

router.get(
  '/gallery',
  asyncHandler(async (_req, res) => {
    const items = await GalleryItem.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(items);
  }),
);

router.get(
  '/crispy-meter',
  asyncHandler(async (_req, res) => {
    res.json(await crispyMeter());
  }),
);

router.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    const [categories, featured, offers, testimonials, gallery, crispy] = await Promise.all([
      Category.find({ isActive: true }).sort({ order: 1 }),
      Product.find({ isAvailable: true })
        .populate('category', 'name slug')
        .sort({ isBestseller: -1, isPopular: -1, order: 1 })
        .limit(8),
      activeOffers(4),
      Testimonial.find({ isApproved: true }).sort({ isFeatured: -1, order: 1 }).limit(6),
      GalleryItem.find({ isActive: true }).sort({ order: 1 }).limit(8),
      crispyMeter(),
    ]);
    res.json({
      settings: publicSettings(settings),
      categories,
      featured,
      offers,
      testimonials,
      gallery,
      crispy,
      faqs: settings.faqs,
    });
  }),
);

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(['product', 'secret', 'bucket']),
        productId: z.string().optional(),
        secretId: z.string().optional(),
        quantity: z.coerce.number().int().min(1).max(20),
        pieces: z
          .array(
            z.object({
              ingredientId: z.string(),
              quantity: z.coerce.number().int().min(0).max(50),
            }),
          )
          .optional(),
      }),
    )
    .min(1, 'Your cart is empty.'),
  couponCode: z.string().trim().max(30).optional().or(z.literal('')),
  fulfilmentType: z.enum(['delivery', 'pickup']).default('delivery'),
});

router.post(
  '/quote',
  asyncHandler(async (req, res) => {
    const payload = quoteSchema.parse(req.body);
    const quote = await buildQuote(payload);
    res.json({
      pricing: quote.pricing,
      coupon: quote.coupon,
      lines: quote.lines,
      minimumShortfall: quote.minimumShortfall,
      fulfilmentType: quote.fulfilmentType,
    });
  }),
);

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name.').max(80),
  email: z.string().trim().email('Enter a valid email.').max(120).optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().max(100).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Your message is a little short.').max(2000),
});

router.post(
  '/contact',
  asyncHandler(async (req, res) => {
    const payload = contactSchema.parse(req.body);
    const message = await ContactMessage.create({
      name: payload.name,
      email: payload.email || '',
      phone: payload.phone || '',
      subject: payload.subject || 'General enquiry',
      message: payload.message,
    });
    res.status(201).json({ message: 'Message received. We’ll get back to you shortly.', id: message.id });
  }),
);

export default router;
