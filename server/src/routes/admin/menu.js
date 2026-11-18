import { Router } from 'express';
import { z } from 'zod';
import {
  BucketIngredient,
  Category,
  Coupon,
  Offer,
  Product,
  SecretItem,
} from '../../models/index.js';
import { asyncHandler, httpError, slugify } from '../../lib/http.js';

const router = Router();

async function uniqueSlug(Model, name, excludeId) {
  const base = slugify(name) || 'item';
  let candidate = base;
  let counter = 2;
  const filter = (slug) => ({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
  while (await Model.exists(filter(candidate))) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

/* ───────────────────────────── Products ───────────────────────────── */
const productInput = z.object({
  name: z.string().trim().min(2, 'Product name is required.').max(120),
  description: z.string().trim().max(600).optional().default(''),
  longDescription: z.string().trim().max(2000).optional().default(''),
  price: z.coerce.number().min(0).max(100000),
  compareAtPrice: z.coerce.number().min(0).max(100000).optional().default(0),
  image: z.string().trim().max(500).optional().default(''),
  category: z.string().min(1, 'Choose a category.'),
  foodType: z.enum(['veg', 'nonveg', 'egg']).optional().default('nonveg'),
  isAvailable: z.boolean().optional().default(true),
  isBestseller: z.boolean().optional().default(false),
  isPopular: z.boolean().optional().default(false),
  isSpicy: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  calories: z.coerce.number().min(0).max(5000).optional().default(0),
  prepTime: z.coerce.number().min(1).max(120).optional().default(12),
  rating: z.coerce.number().min(0).max(5).optional().default(4.8),
  ratingCount: z.coerce.number().min(0).optional().default(0),
  tags: z.array(z.string().trim().max(30)).max(12).optional().default([]),
  order: z.coerce.number().optional().default(0),
});

router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const products = await Product.find().populate('category', 'name slug').sort({ order: 1, createdAt: -1 });
    res.json(products);
  }),
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const body = productInput.parse(req.body);
    const category = await Category.findById(body.category);
    if (!category) throw httpError(400, 'That category does not exist.');
    const product = await Product.create({ ...body, slug: await uniqueSlug(Product, body.name) });
    await product.populate('category', 'name slug');
    res.status(201).json(product);
  }),
);

router.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const body = productInput.partial().parse(req.body);
    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');
    if (body.category) {
      const category = await Category.findById(body.category);
      if (!category) throw httpError(400, 'That category does not exist.');
    }
    if (body.name && body.name !== product.name) {
      product.slug = await uniqueSlug(Product, body.name, product.id);
    }
    Object.assign(product, body);
    await product.save();
    await product.populate('category', 'name slug');
    res.json(product);
  }),
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');
    await Offer.updateMany({ appliesToProduct: product._id }, { $unset: { appliesToProduct: 1 } });
    await Coupon.updateMany({ appliesToProduct: product._id }, { $unset: { appliesToProduct: 1 } });
    res.json({ message: `${product.name} deleted.` });
  }),
);

/* ───────────────────────────── Categories ───────────────────────────── */
const categoryInput = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(400).optional().default(''),
  image: z.string().trim().max(500).optional().default(''),
  order: z.coerce.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
    res.json(categories.map((category) => ({ ...category.toJSON(), productCount: countMap.get(category.id) || 0 })));
  }),
);

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const body = categoryInput.parse(req.body);
    const category = await Category.create({ ...body, slug: await uniqueSlug(Category, body.name) });
    res.status(201).json({ ...category.toJSON(), productCount: 0 });
  }),
);

router.put(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const body = categoryInput.partial().parse(req.body);
    const category = await Category.findById(req.params.id);
    if (!category) throw httpError(404, 'Category not found.');
    if (body.name && body.name !== category.name) {
      category.slug = await uniqueSlug(Category, body.name, category.id);
    }
    Object.assign(category, body);
    await category.save();
    res.json(category);
  }),
);

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const count = await Product.countDocuments({ category: req.params.id });
    if (count > 0) throw httpError(400, `Move or delete the ${count} product(s) in this category first.`);
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw httpError(404, 'Category not found.');
    res.json({ message: 'Category deleted.' });
  }),
);

/* ───────────────────────────── Bucket ingredients ───────────────────────────── */
const bucketInput = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().default(''),
  image: z.string().trim().max(500).optional().default(''),
  price: z.coerce.number().min(0).max(5000),
  maxQuantity: z.coerce.number().int().min(1).max(50).optional().default(12),
  unitLabel: z.string().trim().max(20).optional().default('piece'),
  isActive: z.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0),
});

router.get(
  '/bucket/ingredients',
  asyncHandler(async (_req, res) => {
    const items = await BucketIngredient.find().sort({ order: 1, name: 1 });
    res.json(items);
  }),
);

router.post(
  '/bucket/ingredients',
  asyncHandler(async (req, res) => {
    const body = bucketInput.parse(req.body);
    const item = await BucketIngredient.create({ ...body, slug: await uniqueSlug(BucketIngredient, body.name) });
    res.status(201).json(item);
  }),
);

router.put(
  '/bucket/ingredients/:id',
  asyncHandler(async (req, res) => {
    const body = bucketInput.partial().parse(req.body);
    const item = await BucketIngredient.findById(req.params.id);
    if (!item) throw httpError(404, 'Bucket ingredient not found.');
    if (body.name && body.name !== item.name) {
      item.slug = await uniqueSlug(BucketIngredient, body.name, item.id);
    }
    Object.assign(item, body);
    await item.save();
    res.json(item);
  }),
);

router.delete(
  '/bucket/ingredients/:id',
  asyncHandler(async (req, res) => {
    const item = await BucketIngredient.findByIdAndDelete(req.params.id);
    if (!item) throw httpError(404, 'Bucket ingredient not found.');
    res.json({ message: `${item.name} removed.` });
  }),
);

/* ───────────────────────────── Secret menu ───────────────────────────── */
const secretInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().default(''),
  price: z.coerce.number().min(0).max(100000),
  image: z.string().trim().max(500).optional().default(''),
  foodType: z.enum(['veg', 'nonveg', 'egg']).optional().default('nonveg'),
  badge: z.string().trim().max(40).optional().default('Secret drop'),
  isActive: z.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0),
});

router.get(
  '/secret',
  asyncHandler(async (_req, res) => {
    const items = await SecretItem.find().sort({ order: 1, createdAt: -1 });
    res.json(items);
  }),
);

router.post(
  '/secret',
  asyncHandler(async (req, res) => {
    const body = secretInput.parse(req.body);
    const item = await SecretItem.create({ ...body, slug: await uniqueSlug(SecretItem, body.name) });
    res.status(201).json(item);
  }),
);

router.put(
  '/secret/:id',
  asyncHandler(async (req, res) => {
    const body = secretInput.partial().parse(req.body);
    const item = await SecretItem.findById(req.params.id);
    if (!item) throw httpError(404, 'Secret item not found.');
    if (body.name && body.name !== item.name) {
      item.slug = await uniqueSlug(SecretItem, body.name, item.id);
    }
    Object.assign(item, body);
    await item.save();
    res.json(item);
  }),
);

router.delete(
  '/secret/:id',
  asyncHandler(async (req, res) => {
    const item = await SecretItem.findByIdAndDelete(req.params.id);
    if (!item) throw httpError(404, 'Secret item not found.');
    res.json({ message: `${item.name} removed.` });
  }),
);

export default router;
