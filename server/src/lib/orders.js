import crypto from 'node:crypto';
import { Order } from '../models/index.js';

export async function nextOrderNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const n = crypto.randomInt(10000, 99999);
    const candidate = `HH-${n}`;
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  return `HH-${Date.now().toString().slice(-6)}`;
}
