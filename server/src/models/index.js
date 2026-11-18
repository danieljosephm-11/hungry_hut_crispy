import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const sanitizeOutput = (_doc, ret) => {
  ret.id = ret._id?.toString ? ret._id.toString() : ret._id;
  delete ret._id;
  delete ret.__v;
  delete ret.passwordHash;
  return ret;
};

mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: sanitizeOutput,
});

const options = { timestamps: true };

/* ───────────────────────────── Admin users ───────────────────────────── */
const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  options,
);

/* ───────────────────────────── Categories ───────────────────────────── */
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  options,
);

/* ───────────────────────────── Products ───────────────────────────── */
const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    image: { type: String, default: '' },
    category: { type: Types.ObjectId, ref: 'Category', required: true, index: true },
    foodType: { type: String, enum: ['veg', 'nonveg', 'egg'], default: 'nonveg' },
    isAvailable: { type: Boolean, default: true, index: true },
    isBestseller: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isSpicy: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    calories: { type: Number, default: 0 },
    prepTime: { type: Number, default: 12 },
    rating: { type: Number, default: 4.8, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  options,
);
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, order: 1 });

/* ───────────────────────────── Offers & coupons ───────────────────────────── */
const offerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    badge: { type: String, default: '' },
    code: { type: String, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percent', 'fixed', 'bogo', 'free_delivery'], default: 'percent' },
    discountValue: { type: Number, default: 0, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    appliesToProduct: { type: Types.ObjectId, ref: 'Product' },
    startsAt: { type: Date, default: Date.now },
    endsAt: Date,
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    theme: { type: String, enum: ['yellow', 'orange', 'red', 'cream'], default: 'yellow' },
    image: { type: String, default: '' },
    terms: [{ type: String }],
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  options,
);

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    offer: { type: Types.ObjectId, ref: 'Offer' },
    discountType: { type: String, enum: ['percent', 'fixed', 'bogo', 'free_delivery'], default: 'percent' },
    value: { type: Number, default: 0, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    appliesToProduct: { type: Types.ObjectId, ref: 'Product' },
    startsAt: { type: Date, default: Date.now },
    endsAt: Date,
    isActive: { type: Boolean, default: true, index: true },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
  },
  options,
);

/* ───────────────────────────── Orders ───────────────────────────── */
const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
];
const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];

const orderItemSchema = new Schema(
  {
    kind: { type: String, enum: ['product', 'bucket', 'secret'], default: 'product' },
    product: { type: Types.ObjectId, ref: 'Product' },
    secretItem: { type: Types.ObjectId, ref: 'SecretItem' },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 50 },
    lineTotal: { type: Number, required: true, min: 0 },
    pieces: [
      {
        ingredient: { type: Types.ObjectId, ref: 'BucketIngredient' },
        name: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
  },
  { _id: true, versionKey: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      email: { type: String, default: '' },
    },
    fulfilment: {
      type: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
      address: {
        line1: { type: String, default: '' },
        line2: { type: String, default: '' },
        city: { type: String, default: '' },
        pincode: { type: String, default: '' },
        landmark: { type: String, default: '' },
      },
      scheduledFor: Date,
    },
    items: [orderItemSchema],
    pricing: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      taxRate: { type: Number, default: 5 },
      tax: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    couponCode: { type: String, default: '' },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    paymentMethod: { type: String, enum: ['upi', 'razorpay', 'cod', 'counter'], default: 'upi' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid', index: true },
    payment: {
      utr: { type: String, default: '' },
      screenshotUrl: { type: String, default: '' },
      razorpayOrderId: { type: String, default: '' },
      razorpayPaymentId: { type: String, default: '' },
      submittedAt: Date,
      verifiedAt: Date,
      verifiedBy: { type: Types.ObjectId, ref: 'AdminUser' },
    },
    notes: { type: String, default: '' },
    timeline: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  options,
);
orderSchema.index({ createdAt: -1 });

/* ───────────────────────────── Customers ───────────────────────────── */
const customerSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: Date,
    addresses: [
      {
        line1: String,
        line2: String,
        city: String,
        pincode: String,
        landmark: String,
      },
    ],
  },
  options,
);

/* ───────────────────────────── Payments ───────────────────────────── */
const paymentSchema = new Schema(
  {
    order: { type: Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['upi', 'razorpay', 'cod', 'counter'], default: 'upi' },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid', index: true },
    utr: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    transactionRef: { type: String, default: '' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    verifiedBy: { type: Types.ObjectId, ref: 'AdminUser' },
    verifiedAt: Date,
    notes: { type: String, default: '' },
  },
  options,
);

/* ───────────────────────────── Bucket builder ───────────────────────────── */
const bucketIngredientSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    maxQuantity: { type: Number, default: 12, min: 1, max: 50 },
    unitLabel: { type: String, default: 'piece' },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  options,
);

const bucketConfigurationSchema = new Schema(
  {
    name: { type: String, default: 'Custom Hungry Hut Bucket' },
    pieces: [
      {
        ingredient: { type: Types.ObjectId, ref: 'BucketIngredient' },
        name: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    price: { type: Number, required: true },
    createdBy: { type: String, default: '' },
    order: { type: Types.ObjectId, ref: 'Order' },
  },
  options,
);

/* ───────────────────────────── Secret menu ───────────────────────────── */
const secretItemSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    foodType: { type: String, enum: ['veg', 'nonveg', 'egg'], default: 'nonveg' },
    badge: { type: String, default: 'Secret drop' },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  options,
);

/* ───────────────────────────── Testimonials ───────────────────────────── */
const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, default: '' },
    avatar: { type: String, default: '' },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    review: { type: String, required: true },
    isApproved: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  options,
);

/* ───────────────────────────── Gallery ───────────────────────────── */
const galleryItemSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Food', 'Buckets', 'Burgers', 'Pizza', 'Interiors', 'Kitchen', 'Moments'],
      default: 'Food',
      index: true,
    },
    image: { type: String, required: true },
    alt: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  options,
);

/* ───────────────────────────── Settings ───────────────────────────── */
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    name: { type: String, default: 'Hungry Hut' },
    tagline: { type: String, default: 'The Ultimate Fast-Food Experience' },
    secondaryTagline: { type: String, default: 'Good Food, Good Mood' },
    logoUrl: { type: String, default: '' },
    phone: { type: String, default: '+91 98100 12345' },
    email: { type: String, default: 'hello@hungryhut.in' },
    address: { type: String, default: 'Shop 12, Hauz Khas Village, New Delhi 110016' },
    mapQuery: { type: String, default: 'Hauz Khas Village, New Delhi' },
    openingHours: [{ day: String, hours: String }],
    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      x: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    delivery: {
      enabled: { type: Boolean, default: true },
      fee: { type: Number, default: 49 },
      freeAbove: { type: Number, default: 799 },
      minOrder: { type: Number, default: 199 },
      etaMinutes: { type: Number, default: 30 },
      radiusKm: { type: Number, default: 7 },
    },
    pickup: {
      enabled: { type: Boolean, default: true },
      etaMinutes: { type: Number, default: 15 },
    },
    taxRate: { type: Number, default: 5 },
    avgPrepMinutes: { type: Number, default: 12 },
    kitchenCapacity: { type: Number, default: 4 },
    payment: {
      upiId: { type: String, default: 'hungryhut@upi' },
      payeeName: { type: String, default: 'Hungry Hut' },
      qrImageUrl: { type: String, default: '' },
      instructions: {
        type: String,
        default: 'Scan the QR with any UPI app and pay the exact amount. Submit the 12-digit UTR and a screenshot. Our team verifies every payment manually.',
      },
      acceptCod: { type: Boolean, default: true },
    },
    secretMenu: {
      isEnabled: { type: Boolean, default: true },
      passphrase: { type: String, default: 'HUTCRISPY' },
      hint: { type: String, default: 'Chef’s favourite two words: HUT + CRISPY. Lower-case it and you’re in.' },
    },
    story: {
      heading: { type: String, default: 'Small kitchen. Big crunch. Zero shortcuts.' },
      body: {
        type: String,
        default:
          'Hungry Hut started in 2016 with one fryer, a hand-written menu and a stubborn belief that fast food can still be real food. Every piece is hand-breaded, rested for 24 hours in our buttermilk marinade and fried to order in small batches. No heat lamps. No shortcuts. Just the kind of crunch you can hear across the room.',
      },
      image: { type: String, default: '/images/restaurant.jpg' },
      image2: { type: String, default: '/images/chef.jpg' },
      establishedYear: { type: Number, default: 2016 },
    },
    stats: {
      happyCustomers: { type: String, default: '48K+' },
      ordersServed: { type: String, default: '1.2M+' },
      rating: { type: String, default: '4.9' },
    },
    announcement: {
      type: String,
      default: 'Free delivery on orders above ₹799 · Use code HUT10 for 10% off your first order',
    },
    hero: {
      eyebrow: { type: String, default: 'The Ultimate Fast-Food Experience' },
      image: { type: String, default: '/images/hero-chicken.jpg' },
      liveNote: { type: String, default: 'Hand-breaded & fried to order' },
    },
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
  },
  options,
);

/* ───────────────────────────── QR configs ───────────────────────────── */
const qrConfigurationSchema = new Schema(
  {
    type: { type: String, enum: ['menu', 'payment'], required: true, unique: true, index: true },
    label: { type: String, default: '' },
    url: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  options,
);

/* ───────────────────────────── Contact messages ───────────────────────────── */
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    subject: { type: String, default: 'General enquiry' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  options,
);

export const AdminUser = model('AdminUser', adminUserSchema);
export const Category = model('Category', categorySchema);
export const Product = model('Product', productSchema);
export const Offer = model('Offer', offerSchema);
export const Coupon = model('Coupon', couponSchema);
export const Order = model('Order', orderSchema);
export const Customer = model('Customer', customerSchema);
export const Payment = model('Payment', paymentSchema);
export const BucketIngredient = model('BucketIngredient', bucketIngredientSchema);
export const BucketConfiguration = model('BucketConfiguration', bucketConfigurationSchema);
export const SecretItem = model('SecretItem', secretItemSchema);
export const Testimonial = model('Testimonial', testimonialSchema);
export const GalleryItem = model('GalleryItem', galleryItemSchema);
export const RestaurantSettings = model('RestaurantSettings', settingsSchema);
export const QRConfiguration = model('QRConfiguration', qrConfigurationSchema);
export const ContactMessage = model('ContactMessage', contactMessageSchema);

export { ORDER_STATUSES, PAYMENT_STATUSES };
