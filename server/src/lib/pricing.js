import { Coupon, Offer, RestaurantSettings } from '../models/index.js';
import { httpError, round2 } from './http.js';

export async function getSettings() {
  let settings = await RestaurantSettings.findOne({ key: 'main' });
  if (!settings) settings = await RestaurantSettings.create({ key: 'main' });
  return settings;
}

export function publicSettings(settings) {
  const raw = settings.toObject();
  delete raw.secretMenu?.passphrase;
  return {
    ...raw,
    payment: {
      ...raw.payment,
      razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
  };
}

async function resolveCoupon(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  const coupon = await Coupon.findOne({ code: normalized }).populate('offer');
  if (!coupon || !coupon.isActive) throw httpError(400, 'That coupon code is not valid.');
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw httpError(400, 'This coupon is not active yet.');
  if (coupon.endsAt && coupon.endsAt < now) throw httpError(400, 'This coupon has expired.');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw httpError(400, 'This coupon has reached its usage limit.');
  }
  if (coupon.offer) {
    if (!coupon.offer.isActive) throw httpError(400, 'This offer is no longer active.');
    if (coupon.offer.endsAt && coupon.offer.endsAt < now) throw httpError(400, 'This offer has expired.');
  }
  return coupon;
}

async function loadLine(raw, settings) {
  const quantity = Math.max(1, Math.min(20, Number.parseInt(raw.quantity, 10) || 1));

  if (raw.kind === 'bucket') {
    const pieces = Array.isArray(raw.pieces) ? raw.pieces : [];
    const cleaned = pieces
      .map((piece) => ({
        ingredientId: piece.ingredientId,
        quantity: Math.max(0, Math.min(50, Number.parseInt(piece.quantity, 10) || 0)),
      }))
      .filter((piece) => piece.quantity > 0);
    if (!cleaned.length) throw httpError(400, 'Your custom bucket needs at least one piece.');

    const ingredientIds = cleaned.map((piece) => piece.ingredientId);
    const ingredients = await (await import('../models/index.js')).BucketIngredient.find({
      _id: { $in: ingredientIds },
      isActive: true,
    });
    const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    const snapshot = cleaned.map((piece) => {
      const ingredient = byId.get(String(piece.ingredientId));
      if (!ingredient) throw httpError(400, 'One of your bucket pieces is no longer available.');
      if (piece.quantity > ingredient.maxQuantity) {
        throw httpError(400, `Maximum ${ingredient.maxQuantity} × ${ingredient.name} per bucket.`);
      }
      return {
        ingredient: ingredient.id,
        name: ingredient.name,
        quantity: piece.quantity,
        unitPrice: ingredient.price,
      };
    });
    const unitPrice = round2(snapshot.reduce((sum, piece) => sum + piece.unitPrice * piece.quantity, 0));
    const pieceCount = snapshot.reduce((sum, piece) => sum + piece.quantity, 0);
    return {
      kind: 'bucket',
      name: 'Build Your Bucket',
      description: snapshot.map((piece) => `${piece.quantity}× ${piece.name}`).join(' · '),
      image: settings?.hero?.image || '/images/bucket-feast.jpg',
      unitPrice,
      quantity,
      lineTotal: round2(unitPrice * quantity),
      pieces: snapshot,
      pieceCount,
    };
  }

  if (raw.kind === 'secret') {
    const { SecretItem } = await import('../models/index.js');
    const item = await SecretItem.findById(raw.secretId);
    if (!item || !item.isActive) throw httpError(400, 'A secret item in your cart is no longer available.');
    return {
      kind: 'secret',
      secretItem: item.id,
      name: item.name,
      description: item.description,
      image: item.image,
      unitPrice: item.price,
      quantity,
      lineTotal: round2(item.price * quantity),
    };
  }

  const { Product } = await import('../models/index.js');
  const product = await Product.findById(raw.productId);
  if (!product || !product.isAvailable) {
    throw httpError(400, 'An item in your cart is no longer available. Please refresh your menu.');
  }
  return {
    kind: 'product',
    product: product.id,
    name: product.name,
    description: product.description,
    image: product.image,
    unitPrice: product.price,
    quantity,
    lineTotal: round2(product.price * quantity),
  };
}

export async function buildQuote({ items, couponCode, fulfilmentType = 'delivery' }) {
  const settings = await getSettings();
  if (!Array.isArray(items) || !items.length) throw httpError(400, 'Your cart is empty.');
  if (items.length > 40) throw httpError(400, 'Please split this order into smaller orders.');

  const subtotalCheck = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  if (subtotalCheck > 60) throw httpError(400, 'Maximum 60 items per order.');

  const lines = [];
  for (const item of items) lines.push(await loadLine(item, settings));

  const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  let coupon = null;
  if (couponCode) coupon = await resolveCoupon(couponCode);
  if (coupon && coupon.minOrder > 0 && subtotal < coupon.minOrder) {
    throw httpError(400, `Add ₹${Math.ceil(coupon.minOrder - subtotal)} more to use ${coupon.code}.`);
  }

  let discount = 0;
  let freeDelivery = false;
  if (coupon) {
    if (coupon.discountType === 'percent') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.discountType === 'fixed') {
      discount = coupon.value;
    } else if (coupon.discountType === 'free_delivery') {
      freeDelivery = true;
    } else if (coupon.discountType === 'bogo') {
      const targetId = coupon.appliesToProduct ? String(coupon.appliesToProduct) : '';
      const match = lines.find(
        (line) => line.kind === 'product' && (!targetId || String(line.product) === targetId) && line.quantity >= 2,
      );
      if (!match) {
        throw httpError(400, 'This BOGO coupon needs two qualifying items in your cart.');
      }
      discount = Math.floor(match.quantity / 2) * match.unitPrice;
    }
  }
  discount = round2(Math.min(discount, subtotal));

  const isDelivery = fulfilmentType === 'delivery';
  if (isDelivery && !settings.delivery.enabled) throw httpError(400, 'Delivery is currently paused. Please choose pickup.');
  if (!isDelivery && !settings.pickup.enabled) throw httpError(400, 'Pickup is currently unavailable.');

  let deliveryFee = 0;
  if (isDelivery && subtotal - discount < settings.delivery.freeAbove) {
    deliveryFee = settings.delivery.fee;
  }
  if (coupon?.discountType === 'free_delivery') deliveryFee = 0;
  deliveryFee = round2(deliveryFee);

  const taxRate = Number(settings.taxRate) || 0;
  const taxable = round2(Math.max(0, subtotal - discount + deliveryFee));
  const tax = round2((taxable * taxRate) / 100);
  const total = round2(taxable + tax);

  const minOrder = Number(settings.delivery.minOrder) || 0;
  const minimumShortfall = isDelivery ? round2(Math.max(0, minOrder - subtotal)) : 0;

  return {
    lines,
    pricing: { subtotal, discount, deliveryFee, taxRate, tax, total },
    coupon: coupon
      ? {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          value: coupon.value,
          freeDelivery,
        }
      : null,
    fulfilmentType,
    minimumShortfall,
    settings: {
      delivery: settings.delivery,
      pickup: settings.pickup,
      taxRate: settings.taxRate,
    },
  };
}

export async function paySettingsPublic() {
  const settings = await getSettings();
  return {
    restaurantName: settings.name,
    upiId: settings.payment.upiId,
    payeeName: settings.payment.payeeName,
    qrImageUrl: settings.payment.qrImageUrl,
    instructions: settings.payment.instructions,
    acceptCod: settings.payment.acceptCod,
    razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  };
}

export { resolveCoupon };
