import { Order, RestaurantSettings } from '../models/index.js';

const ACTIVE = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];

export async function crispyMeter() {
  const settings = await RestaurantSettings.findOne({ key: 'main' });
  const capacity = Math.max(1, Number(settings?.kitchenCapacity) || 4);
  const prep = Math.max(1, Number(settings?.avgPrepMinutes) || 12);

  const [active, lastCompleted, preparing, ready] = await Promise.all([
    Order.find({ status: { $in: ACTIVE } }).sort({ createdAt: 1 }).select('orderNumber status createdAt fulfilment.type').lean(),
    Order.findOne({ status: 'completed' }).sort({ updatedAt: -1 }).select('updatedAt orderNumber').lean(),
    Order.countDocuments({ status: 'preparing' }),
    Order.countDocuments({ status: { $in: ['ready', 'out_for_delivery'] } }),
  ]);

  const queue = active.filter((order) => ['confirmed', 'preparing'].includes(order.status)).length;
  const waiting = active.filter((order) => order.status === 'placed').length;
  const inKitchen = Math.max(0, queue + waiting);
  const load = Math.min(100, Math.round((inKitchen / (capacity * 2)) * 100));

  let status = 'SUPER CRISPY';
  let tone = 'ready';
  if (inKitchen >= capacity * 2) {
    status = 'FRYER FRENZY';
    tone = 'hot';
  } else if (inKitchen >= capacity) {
    status = 'CRISPY RUSH';
    tone = 'busy';
  } else if (inKitchen > 0) {
    status = 'EXTRA CRISPY';
    tone = 'warming';
  }

  // Wait time is derived from the real queue and the configured batch time.
  const batches = Math.max(1, Math.ceil(Math.max(1, inKitchen) / capacity));
  const avgWait = Math.max(prep, batches * prep);

  const now = Date.now();
  return {
    status,
    tone,
    queue: inKitchen,
    activeOrders: active.length,
    preparing,
    ready,
    capacity,
    avgWait,
    load,
    source: 'live-orders',
    kitchenOpen: true,
    lastCompletedAt: lastCompleted?.updatedAt || null,
    lastCompletedOrder: lastCompleted?.orderNumber || null,
    updatedAt: new Date().toISOString(),
    orders: active.slice(-6).map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      minutesAgo: Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 60000)),
      fulfilment: order.fulfilment?.type || 'delivery',
    })),
  };
}
