import { Router } from 'express';
import { z } from 'zod';
import {
  ContactMessage,
  Coupon,
  GalleryItem,
  Offer,
  Testimonial,
} from '../../models/index.js';
import { asyncHandler, httpError } from '../../lib/http.js';

const router = Router();

const optionalDate = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : value),
  z.coerce.date().nullable(),
);

/* ───────────────────────────── Offers ───────────────────────────── */
const offerInput = z.object({
  title: z.string().trim().min(2, 'Offer title is required.').max(120),
  subtitle: z.string().trim().max(200).optional().default(''),
  description: z.string().trim().max(600).optional().default(''),
  badge: z.string().trim().max(40).optional().default(''),
  code: z
    .string()
    .trim()
    .max(30)
    .optional()
    .default('')
    .transform((value) => value.toUpperCase()),
  discountType: z.enum(['percent', 'fixed', 'bogo', 'free_delivery']).optional().default('percent'),
  discountValue: z.coerce.number().min(0).max(100000).optional().default(0),
  minOrder: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).optional().default(0),
  appliesToProduct: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value || null),
  startsAt: optionalDate.optional(),
  endsAt: optionalDate.optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  theme: z.enum(['yellow', 'orange', 'red', 'cream']).optional().default('yellow'),
  image: z.string().trim().max(500).optional().default(''),
  terms: z.array(z.string().trim().max(200)).max(10).optional().default([]),
  usageLimit: z.coerce.number().min(0).optional().default(0),
  order: z.coerce.number().optional().default(0),
});

async function syncCoupon(offer) {
  if (!offer.code) {
    await Coupon.deleteMany({ offer: offer._id });
    return null;
  }
  return Coupon.findOneAndUpdate(
    { offer: offer._id },
    {
      $set: {
        code: offer.code,
        discountType: offer.discountType,
        value: offer.discountValue,
        minOrder: offer.minOrder,
        maxDiscount: offer.maxDiscount,
        appliesToProduct: offer.appliesToProduct || null,
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
        isActive: offer.isActive,
        usageLimit: offer.usageLimit,
      },
      $setOnInsert: { usedCount: 0 },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

router.get(
  '/offers',
  asyncHandler(async (_req, res) => {
    const offers = await Offer.find()
      .populate('appliesToProduct', 'name slug price')
      .sort({ order: 1, createdAt: -1 });
    res.json(offers);
  }),
);

router.post(
  '/offers',
  asyncHandler(async (req, res) => {
    const body = offerInput.parse(req.body);
    if (body.startsAt && body.endsAt && body.startsAt >= body.endsAt) {
      throw httpError(400, 'The end date must be after the start date.');
    }
    const offer = await Offer.create(body);
    await syncCoupon(offer);
    await offer.populate('appliesToProduct', 'name slug price');
    res.status(201).json(offer);
  }),
);

router.put(
  '/offers/:id',
  asyncHandler(async (req, res) => {
    const body = offerInput.partial().parse(req.body);
    const offer = await Offer.findById(req.params.id);
    if (!offer) throw httpError(404, 'Offer not found.');
    const previousCode = offer.code;
    const nextStart = body.startsAt !== undefined ? body.startsAt : offer.startsAt;
    const nextEnd = body.endsAt !== undefined ? body.endsAt : offer.endsAt;
    if (nextStart && nextEnd && nextStart >= nextEnd) throw httpError(400, 'The end date must be after the start date.');
    Object.assign(offer, body);
    await offer.save();
    if (previousCode && previousCode !== offer.code) {
      await Coupon.deleteMany({ offer: offer._id, code: previousCode });
    }
    await syncCoupon(offer);
    await offer.populate('appliesToProduct', 'name slug price');
    res.json(offer);
  }),
);

router.delete(
  '/offers/:id',
  asyncHandler(async (req, res) => {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) throw httpError(404, 'Offer not found.');
    await Coupon.deleteMany({ offer: offer._id });
    res.json({ message: `${offer.title} deleted.` });
  }),
);

router.get(
  '/coupons',
  asyncHandler(async (_req, res) => {
    const coupons = await Coupon.find().populate('offer', 'title isActive').sort({ createdAt: -1 });
    res.json(coupons);
  }),
);

const couponPatch = z.object({
  isActive: z.boolean().optional(),
  usageLimit: z.coerce.number().min(0).optional(),
});

router.patch(
  '/coupons/:id',
  asyncHandler(async (req, res) => {
    const body = couponPatch.parse(req.body);
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: body }, { new: true });
    if (!coupon) throw httpError(404, 'Coupon not found.');
    res.json(coupon);
  }),
);

/* ───────────────────────────── Testimonials ───────────────────────────── */
const testimonialInput = z.object({
  name: z.string().trim().min(2).max(60),
  location: z.string().trim().max(80).optional().default(''),
  avatar: z.string().trim().max(500).optional().default(''),
  rating: z.coerce.number().min(1).max(5).optional().default(5),
  review: z.string().trim().min(5).max(1000),
  isApproved: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  order: z.coerce.number().optional().default(0),
});

router.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const items = await Testimonial.find().sort({ isFeatured: -1, order: 1, createdAt: -1 });
    res.json(items);
  }),
);

router.post(
  '/testimonials',
  asyncHandler(async (req, res) => {
    const body = testimonialInput.parse(req.body);
    const item = await Testimonial.create(body);
    res.status(201).json(item);
  }),
);

router.put(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    const body = testimonialInput.partial().parse(req.body);
    const item = await Testimonial.findByIdAndUpdate(req.params.id, { $set: body }, { new: true, runValidators: true });
    if (!item) throw httpError(404, 'Testimonial not found.');
    res.json(item);
  }),
);

router.delete(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    const item = await Testimonial.findByIdAndDelete(req.params.id);
    if (!item) throw httpError(404, 'Testimonial not found.');
    res.json({ message: 'Testimonial deleted.' });
  }),
);

/* ───────────────────────────── Gallery ───────────────────────────── */
const galleryInput = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.enum(['Food', 'Buckets', 'Burgers', 'Pizza', 'Interiors', 'Kitchen', 'Moments']).optional().default('Food'),
  image: z.string().trim().min(1, 'An image is required.').max(500),
  alt: z.string().trim().max(200).optional().default(''),
  isActive: z.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0),
});

router.get(
  '/gallery',
  asyncHandler(async (_req, res) => {
    const items = await GalleryItem.find().sort({ order: 1, createdAt: -1 });
    res.json(items);
  }),
);

router.post(
  '/gallery',
  asyncHandler(async (req, res) => {
    const body = galleryInput.parse(req.body);
    const item = await GalleryItem.create(body);
    res.status(201).json(item);
  }),
);

router.put(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    const body = galleryInput.partial().parse(req.body);
    const item = await GalleryItem.findByIdAndUpdate(req.params.id, { $set: body }, { new: true, runValidators: true });
    if (!item) throw httpError(404, 'Gallery image not found.');
    res.json(item);
  }),
);

router.delete(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) throw httpError(404, 'Gallery image not found.');
    res.json({ message: 'Gallery image deleted.' });
  }),
);

/* ───────────────────────────── Messages ───────────────────────────── */
router.get(
  '/messages',
  asyncHandler(async (_req, res) => {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200);
    res.json(messages);
  }),
);

router.patch(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const body = z.object({ isRead: z.boolean() }).parse(req.body);
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: body }, { new: true });
    if (!message) throw httpError(404, 'Message not found.');
    res.json(message);
  }),
);

router.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) throw httpError(404, 'Message not found.');
    res.json({ message: 'Message deleted.' });
  }),
);

export default router;
