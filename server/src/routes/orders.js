import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  BucketConfiguration,
  Coupon,
  Customer,
  Offer,
  Order,
  Payment,
} from '../models/index.js';
import { asyncHandler, httpError, isValidPhone, normalizePhone } from '../lib/http.js';
import { buildQuote, getSettings, paySettingsPublic } from '../lib/pricing.js';
import { nextOrderNumber } from '../lib/orders.js';
import { orderLimiter, uploadLimiter } from '../lib/limiters.js';
import { storeImage } from '../lib/upload.js';

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 1 } });

const itemSchema = z.object({
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
});

const orderSchema = z
  .object({
    items: z.array(itemSchema).min(1, 'Your cart is empty.').max(40),
    customer: z.object({
      name: z.string().trim().min(2, 'Enter your name.').max(80),
      phone: z.string().trim().refine(isValidPhone, 'Enter a valid 10-digit Indian mobile number.'),
      email: z.string().trim().email('Enter a valid email.').max(120).optional().or(z.literal('')),
    }),
    fulfilmentType: z.enum(['delivery', 'pickup']).default('delivery'),
    address: z
      .object({
        line1: z.string().trim().max(160).optional(),
        line2: z.string().trim().max(160).optional(),
        city: z.string().trim().max(80).optional(),
        pincode: z.string().trim().max(10).optional(),
        landmark: z.string().trim().max(120).optional(),
      })
      .optional(),
    paymentMethod: z.enum(['upi', 'razorpay', 'cod', 'counter']).default('upi'),
    notes: z.string().trim().max(500).optional().or(z.literal('')),
    couponCode: z.string().trim().max(30).optional().or(z.literal('')),
  })
  .superRefine((value, ctx) => {
    if (value.fulfilmentType === 'delivery') {
      if (!value.address?.line1 || value.address.line1.length < 4) {
        ctx.addIssue({ code: 'custom', path: ['address', 'line1'], message: 'Enter your delivery address.' });
      }
      if (!value.address?.city) {
        ctx.addIssue({ code: 'custom', path: ['address', 'city'], message: 'Enter your city.' });
      }
      if (!/^\d{6}$/.test(value.address?.pincode || '')) {
        ctx.addIssue({ code: 'custom', path: ['address', 'pincode'], message: 'Enter a valid 6-digit pincode.' });
      }
    }
    if (value.paymentMethod === 'counter' && value.fulfilmentType !== 'pickup') {
      ctx.addIssue({ code: 'custom', path: ['paymentMethod'], message: 'Pay at counter is only for pickup.' });
    }
  });

async function findOrderForCustomer(orderNumber, phone) {
  if (!isValidPhone(phone)) throw httpError(400, 'Enter the mobile number used for this order.');
  const order = await Order.findOne({ orderNumber: String(orderNumber).toUpperCase().trim() });
  if (!order || normalizePhone(order.customer.phone) !== normalizePhone(phone)) {
    throw httpError(404, 'We could not find an order with those details.');
  }
  return order;
}

router.post(
  '/',
  orderLimiter,
  asyncHandler(async (req, res) => {
    const payload = orderSchema.parse(req.body);
    const settings = await getSettings();

    if (payload.paymentMethod === 'razorpay' && !(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
      throw httpError(400, 'Card / Razorpay checkout is not configured. Please use UPI or pay on delivery.');
    }
    if (payload.paymentMethod === 'upi' && !settings.payment.upiId) {
      throw httpError(400, 'UPI payment is not configured. Please choose another payment method.');
    }
    if ((payload.paymentMethod === 'cod' || payload.paymentMethod === 'counter') && !settings.payment.acceptCod) {
      throw httpError(400, 'Cash payments are currently unavailable.');
    }

    const quote = await buildQuote({
      items: payload.items,
      couponCode: payload.couponCode,
      fulfilmentType: payload.fulfilmentType,
    });

    if (payload.fulfilmentType === 'delivery' && quote.minimumShortfall > 0) {
      throw httpError(
        400,
        `Delivery orders start at ₹${settings.delivery.minOrder}. Add ₹${Math.ceil(quote.minimumShortfall)} more or choose pickup.`,
      );
    }

    const orderNumber = await nextOrderNumber();
    const address =
      payload.fulfilmentType === 'delivery'
        ? {
            line1: payload.address?.line1 || '',
            line2: payload.address?.line2 || '',
            city: payload.address?.city || '',
            pincode: payload.address?.pincode || '',
            landmark: payload.address?.landmark || '',
          }
        : {};

    const order = await Order.create({
      orderNumber,
      customer: {
        name: payload.customer.name,
        phone: normalizePhone(payload.customer.phone),
        email: payload.customer.email || '',
      },
      fulfilment: { type: payload.fulfilmentType, address },
      items: quote.lines.map((line) => ({
        kind: line.kind,
        product: line.product,
        secretItem: line.secretItem,
        name: line.name,
        description: line.description,
        image: line.image,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
        pieces: line.pieces,
      })),
      pricing: quote.pricing,
      couponCode: quote.coupon?.code || '',
      status: 'placed',
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'unpaid',
      notes: payload.notes || '',
      timeline: [{ status: 'placed', at: new Date(), note: 'Order placed by customer' }],
    });

    const phone = normalizePhone(payload.customer.phone);
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      existingCustomer.name = payload.customer.name;
      existingCustomer.email = payload.customer.email || existingCustomer.email;
      existingCustomer.orderCount += 1;
      existingCustomer.totalSpent += quote.pricing.total;
      existingCustomer.lastOrderAt = new Date();
      if (
        payload.fulfilmentType === 'delivery' &&
        address.line1 &&
        !existingCustomer.addresses.some((entry) => entry.line1 === address.line1 && entry.pincode === address.pincode)
      ) {
        existingCustomer.addresses.push(address);
      }
      await existingCustomer.save();
    } else {
      await Customer.create({
        phone,
        name: payload.customer.name,
        email: payload.customer.email || '',
        orderCount: 1,
        totalSpent: quote.pricing.total,
        lastOrderAt: new Date(),
        addresses: payload.fulfilmentType === 'delivery' && address.line1 ? [address] : [],
      });
    }

    for (const line of quote.lines.filter((entry) => entry.kind === 'bucket')) {
      await BucketConfiguration.create({
        pieces: line.pieces,
        price: line.unitPrice,
        createdBy: phone,
        order: order._id,
      });
    }

    await Payment.create({
      order: order._id,
      orderNumber,
      amount: quote.pricing.total,
      method: payload.paymentMethod,
      status: 'unpaid',
    });

    if (quote.coupon) {
      await Coupon.updateOne({ code: quote.coupon.code }, { $inc: { usedCount: 1 } });
      if (quote.coupon.id) {
        await Offer.updateOne({ _id: quote.coupon.id }, { $inc: { usedCount: 1 } });
      }
    }

    res.status(201).json({
      order,
      paymentSettings: await paySettingsPublic(),
      message: 'Order placed. Let’s get frying.',
    });
  }),
);

router.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await findOrderForCustomer(req.params.orderNumber, req.query.phone);
    res.json({ order, paymentSettings: await paySettingsPublic() });
  }),
);

const paymentConfirmSchema = z.object({
  phone: z.string().trim().refine(isValidPhone, 'Enter the mobile number used for this order.'),
  utr: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9\s-]{5,29}$/, 'Enter the UPI reference / UTR (6–30 characters).'),
  screenshotUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => !value || value.startsWith('/uploads/') || /^https?:\/\//.test(value), 'Invalid screenshot URL.')
    .optional()
    .or(z.literal('')),
});

router.post(
  '/:orderNumber/payment',
  orderLimiter,
  asyncHandler(async (req, res) => {
    const payload = paymentConfirmSchema.parse(req.body);
    const order = await findOrderForCustomer(req.params.orderNumber, payload.phone);
    if (order.status === 'cancelled') throw httpError(400, 'This order has been cancelled.');
    if (order.paymentStatus === 'paid') throw httpError(409, 'This order is already marked as paid.');
    if (order.paymentMethod !== 'upi') {
      throw httpError(400, 'This order does not use manual UPI verification. Please pay using the selected method.');
    }

    order.paymentStatus = 'pending';
    order.payment.utr = payload.utr.toUpperCase();
    order.payment.screenshotUrl = payload.screenshotUrl || '';
    order.payment.submittedAt = new Date();
    order.timeline.push({
      status: order.status,
      at: new Date(),
      note: `UPI payment submitted (UTR ${payload.utr.toUpperCase()}) — awaiting restaurant verification`,
    });
    await order.save();

    await Payment.updateOne(
      { order: order._id },
      {
        $set: {
          status: 'pending',
          utr: payload.utr.toUpperCase(),
          screenshotUrl: payload.screenshotUrl || '',
        },
      },
    );

    res.json({
      message: 'Payment submitted. We will verify it against our bank statement — this is not marked paid yet.',
      order,
    });
  }),
);

router.post(
  '/:orderNumber/payment-proof',
  uploadLimiter,
  upload.single('screenshot'),
  asyncHandler(async (req, res) => {
    const order = await findOrderForCustomer(req.params.orderNumber, req.body.phone);
    if (order.paymentStatus === 'paid') throw httpError(409, 'This order is already paid.');
    if (!req.file) throw httpError(400, 'Choose a payment screenshot to upload.');
    const url = await storeImage(req.file);
    res.status(201).json({ url });
  }),
);

export default router;
