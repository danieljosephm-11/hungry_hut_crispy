import { Router } from 'express';
import { z } from 'zod';
import {
  AdminUser,
  ContactMessage,
  Customer,
  Order,
  Payment,
  Product,
  RestaurantSettings,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../models/index.js';
import { asyncHandler, httpError, round2 } from '../../lib/http.js';

const router = Router();

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      revenueAgg,
      todayRevenueAgg,
      popular,
      recentOrders,
      transactions,
      pendingPayments,
      unreadMessages,
      customers,
      products,
      unavailableProducts,
      admins,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] } }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ status: { $in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] } }),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
            image: { $first: '$items.image' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).select('orderNumber customer.name customer.phone pricing.total status paymentStatus createdAt fulfilment.type').lean(),
      Payment.find().sort({ createdAt: -1 }).limit(8).lean(),
      Payment.countDocuments({ status: 'pending' }),
      ContactMessage.countDocuments({ isRead: false }),
      Customer.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ isAvailable: false }),
      AdminUser.countDocuments({ isActive: true }),
    ]);

    const weekOrders = await Order.find({ createdAt: { $gte: weekStart } })
      .select('createdAt pricing.total paymentStatus status')
      .lean();
    const series = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const inDay = weekOrders.filter((order) => order.createdAt >= day && order.createdAt < next);
      series.push({
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
        orders: inDay.length,
        revenue: round2(
          inDay.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.pricing.total, 0),
        ),
      });
    }

    const revenue = revenueAgg[0]?.total || 0;
    const avgOrderValue = totalOrders ? round2(revenue / Math.max(1, totalOrders)) : 0;

    res.json({
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      revenue: round2(revenue),
      todayRevenue: round2(todayRevenueAgg[0]?.total || 0),
      avgOrderValue,
      popularProducts: popular,
      recentOrders,
      transactions,
      pendingPayments,
      unreadMessages,
      customers,
      products,
      unavailableProducts,
      admins,
      series,
    });
  }),
);

/* ───────────────────────────── Orders ───────────────────────────── */
function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const query = {};
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    if (req.query.paymentStatus && req.query.paymentStatus !== 'all') query.paymentStatus = req.query.paymentStatus;
    if (req.query.type && req.query.type !== 'all') query['fulfilment.type'] = req.query.type;
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
      query.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }];
    }
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    }

    const [items, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(query),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit });
  }),
);

router.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw httpError(404, 'Order not found.');
    const payment = await Payment.findOne({ order: order._id }).lean();
    res.json({ order, payment });
  }),
);

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});

router.patch(
  '/orders/:id/status',
  asyncHandler(async (req, res) => {
    const { status, note } = statusSchema.parse(req.body);
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found.');
    if (order.status === status && !note) throw httpError(400, 'That is already the current status.');
    order.status = status;
    order.timeline.push({
      status,
      at: new Date(),
      note: note || `Status updated by ${req.admin.name}`,
    });
    await order.save();
    res.json({ message: 'Order status updated.', order });
  }),
);

const paymentSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
});

router.patch(
  '/orders/:id/payment',
  asyncHandler(async (req, res) => {
    const { status, notes } = paymentSchema.parse(req.body);
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found.');
    if (order.paymentStatus === 'paid' && status === 'paid') {
      throw httpError(400, 'This payment is already verified.');
    }
    if (status === 'paid' && order.paymentMethod === 'upi' && !order.payment.utr) {
      throw httpError(400, 'No UPI reference has been submitted for this order.');
    }

    order.paymentStatus = status;
    order.payment.verifiedAt = status === 'paid' ? new Date() : order.payment.verifiedAt;
    order.payment.verifiedBy = status === 'paid' ? req.admin._id : order.payment.verifiedBy;
    order.timeline.push({
      status: order.status,
      at: new Date(),
      note:
        status === 'paid'
          ? `Payment verified by ${req.admin.name}${notes ? ` — ${notes}` : ''}`
          : `Payment marked ${status} by ${req.admin.name}${notes ? ` — ${notes}` : ''}`,
    });
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        $set: {
          status,
          method: order.paymentMethod,
          amount: order.pricing.total,
          utr: order.payment.utr,
          screenshotUrl: order.payment.screenshotUrl,
          verifiedAt: status === 'paid' ? new Date() : undefined,
          verifiedBy: status === 'paid' ? req.admin._id : undefined,
          notes: notes || '',
        },
        $setOnInsert: { orderNumber: order.orderNumber },
      },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ message: 'Payment status updated.', order });
  }),
);

const notesSchema = z.object({ notes: z.string().trim().max(500).optional().or(z.literal('')) });

router.patch(
  '/orders/:id/notes',
  asyncHandler(async (req, res) => {
    const { notes } = notesSchema.parse(req.body);
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: { notes } }, { new: true });
    if (!order) throw httpError(404, 'Order not found.');
    res.json({ message: 'Order notes saved.', order });
  }),
);

router.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    const items = await Payment.find(query).sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  }),
);

router.get(
  '/customers',
  asyncHandler(async (_req, res) => {
    const items = await Customer.find().sort({ lastOrderAt: -1 }).limit(200).lean();
    res.json(items);
  }),
);

router.get(
  '/activity',
  asyncHandler(async (_req, res) => {
    const [orders, pending, settings] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(6).lean(),
      Payment.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(6).populate('order').lean(),
      RestaurantSettings.findOne({ key: 'main' }).lean(),
    ]);
    res.json({ orders, pending, settings: { kitchenCapacity: settings?.kitchenCapacity, avgPrepMinutes: settings?.avgPrepMinutes } });
  }),
);

export default router;
