import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { Order, Payment } from '../models/index.js';
import { asyncHandler, httpError, isValidPhone, normalizePhone } from '../lib/http.js';
import { orderLimiter } from '../lib/limiters.js';

const router = Router();

function razorpayAuth() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw httpError(503, 'Razorpay is not configured.');
  return { key, secret, header: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` };
}

async function orderForCustomer(orderNumber, phone) {
  if (!isValidPhone(phone)) throw httpError(400, 'Enter the mobile number used for this order.');
  const order = await Order.findOne({ orderNumber: String(orderNumber).toUpperCase().trim() });
  if (!order || normalizePhone(order.customer.phone) !== normalizePhone(phone)) {
    throw httpError(404, 'We could not find an order with those details.');
  }
  return order;
}

router.post(
  '/razorpay/create',
  orderLimiter,
  asyncHandler(async (req, res) => {
    const { orderNumber, phone } = z
      .object({ orderNumber: z.string().min(3), phone: z.string().min(10) })
      .parse(req.body);
    const { key, header } = razorpayAuth();
    const order = await orderForCustomer(orderNumber, phone);
    if (order.status === 'cancelled') throw httpError(400, 'This order has been cancelled.');
    if (order.paymentStatus === 'paid') throw httpError(409, 'This order is already paid.');
    if (order.paymentMethod !== 'razorpay') throw httpError(400, 'This order does not use Razorpay.');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: header, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(order.pricing.total * 100),
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderNumber: order.orderNumber, customer: order.customer.name },
      }),
    });
    const gateway = await response.json();
    if (!response.ok) throw httpError(502, gateway?.error?.description || 'Razorpay could not start this payment.');

    order.payment.razorpayOrderId = gateway.id;
    await order.save();
    await Payment.updateOne(
      { order: order._id },
      { $set: { razorpayOrderId: gateway.id } },
    );

    res.json({
      keyId: key,
      gatewayOrderId: gateway.id,
      amount: gateway.amount,
      currency: gateway.currency,
      orderNumber: order.orderNumber,
      name: 'Hungry Hut',
      description: `Order ${order.orderNumber}`,
      prefill: {
        name: order.customer.name,
        email: order.customer.email || '',
        contact: order.customer.phone,
      },
    });
  }),
);

router.post(
  '/razorpay/verify',
  asyncHandler(async (req, res) => {
    const { key, secret, header } = razorpayAuth();
    void key;
    const payload = z
      .object({
        orderNumber: z.string().min(3),
        phone: z.string().min(10),
        razorpay_order_id: z.string().min(3),
        razorpay_payment_id: z.string().min(3),
        razorpay_signature: z.string().min(10),
      })
      .parse(req.body);

    const order = await orderForCustomer(payload.orderNumber, payload.phone);
    if (order.payment.razorpayOrderId && order.payment.razorpayOrderId !== payload.razorpay_order_id) {
      throw httpError(400, 'This payment does not belong to your order.');
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(payload.razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw httpError(400, 'Payment signature verification failed.');
    }

    // Independently confirm with Razorpay: never trust the browser alone.
    const gatewayResponse = await fetch(`https://api.razorpay.com/v1/payments/${payload.razorpay_payment_id}`, {
      headers: { Authorization: header },
    });
    const payment = await gatewayResponse.json();
    if (!gatewayResponse.ok) throw httpError(502, 'Could not confirm the payment with Razorpay.');
    if (payment.order_id !== payload.razorpay_order_id) throw httpError(400, 'Payment order mismatch.');
    if (Number(payment.amount) !== Math.round(order.pricing.total * 100)) {
      throw httpError(400, 'The paid amount does not match this order.');
    }
    if (!['captured', 'authorized'].includes(payment.status)) {
      throw httpError(400, `Payment is not successful yet (status: ${payment.status}).`);
    }

    if (payment.status === 'authorized') {
      const capture = await fetch(`https://api.razorpay.com/v1/payments/${payload.razorpay_payment_id}/capture`, {
        method: 'POST',
        headers: { Authorization: header, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(order.pricing.total * 100), currency: 'INR' }),
      });
      const captured = await capture.json();
      if (!capture.ok || !['captured', 'authorized'].includes(captured.status)) {
        throw httpError(502, 'Payment could not be captured. Please contact the restaurant.');
      }
    }

    order.paymentStatus = 'paid';
    order.payment.razorpayPaymentId = payload.razorpay_payment_id;
    order.payment.transactionRef = payload.razorpay_payment_id;
    order.payment.verifiedAt = new Date();
    order.timeline.push({
      status: order.status,
      at: new Date(),
      note: `Payment verified via Razorpay (${payload.razorpay_payment_id})`,
    });
    await order.save();

    await Payment.updateOne(
      { order: order._id },
      {
        $set: {
          status: 'paid',
          method: 'razorpay',
          razorpayOrderId: payload.razorpay_order_id,
          razorpayPaymentId: payload.razorpay_payment_id,
          transactionRef: payload.razorpay_payment_id,
          verifiedAt: new Date(),
        },
      },
    );

    res.json({ message: 'Payment verified.', order });
  }),
);

router.post(
  '/razorpay/webhook',
  asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(200).json({ received: true, ignored: 'webhook not configured' });
    const signature = req.get('x-razorpay-signature');
    if (!signature) throw httpError(400, 'Missing webhook signature.');
    const digest = crypto.createHmac('sha256', secret).update(req.rawBody || Buffer.from('')).digest('hex');
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw httpError(400, 'Invalid webhook signature.');

    const event = req.body?.event;
    const entity = req.body?.payload?.payment?.entity;
    if (event === 'payment.captured' && entity?.order_id) {
      const order = await Order.findOne({ 'payment.razorpayOrderId': entity.order_id });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.payment.razorpayPaymentId = entity.id;
        order.timeline.push({ status: order.status, at: new Date(), note: 'Payment captured (Razorpay webhook)' });
        await order.save();
        await Payment.updateOne(
          { order: order._id },
          { $set: { status: 'paid', razorpayPaymentId: entity.id, verifiedAt: new Date() } },
        );
      }
    }
    res.json({ received: true });
  }),
);

export default router;
