export type ID = string;

export interface Category {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
  productCount?: number;
}

export interface Product {
  id: ID;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category?: Category | ID;
  foodType: 'veg' | 'nonveg' | 'egg';
  isAvailable: boolean;
  isBestseller?: boolean;
  isPopular?: boolean;
  isSpicy?: boolean;
  isNew?: boolean;
  calories?: number;
  prepTime?: number;
  rating?: number;
  ratingCount?: number;
  tags?: string[];
  order?: number;
}

export interface Offer {
  id: ID;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  code?: string;
  discountType: 'percent' | 'fixed' | 'bogo' | 'free_delivery';
  discountValue?: number;
  minOrder?: number;
  maxDiscount?: number;
  appliesToProduct?: Product | ID | null;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  isFeatured?: boolean;
  theme?: 'yellow' | 'orange' | 'red' | 'cream';
  image?: string;
  terms?: string[];
  usageLimit?: number;
  usedCount?: number;
  order?: number;
}

export interface Coupon {
  id: ID;
  code: string;
  offer?: Offer | ID | null;
  discountType: Offer['discountType'];
  value: number;
  minOrder: number;
  maxDiscount: number;
  appliesToProduct?: Product | ID | null;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
}

export interface BucketIngredient {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  image: string;
  price: number;
  maxQuantity: number;
  unitLabel: string;
  isActive: boolean;
  order?: number;
}

export interface SecretItem {
  id: ID;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  foodType: 'veg' | 'nonveg' | 'egg';
  badge?: string;
  isActive: boolean;
  order?: number;
}

export interface Testimonial {
  id: ID;
  name: string;
  location?: string;
  avatar?: string;
  rating: number;
  review: string;
  isApproved?: boolean;
  isFeatured?: boolean;
  order?: number;
}

export interface GalleryItem {
  id: ID;
  title: string;
  category: string;
  image: string;
  alt?: string;
  isActive?: boolean;
  order?: number;
}

export interface Settings {
  id?: ID;
  name: string;
  tagline: string;
  secondaryTagline?: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  mapQuery?: string;
  openingHours?: Array<{ day: string; hours: string }>;
  social?: Record<string, string>;
  delivery: {
    enabled: boolean;
    fee: number;
    freeAbove: number;
    minOrder: number;
    etaMinutes: number;
    radiusKm: number;
  };
  pickup: { enabled: boolean; etaMinutes: number };
  taxRate: number;
  avgPrepMinutes?: number;
  kitchenCapacity?: number;
  payment: {
    upiId: string;
    payeeName: string;
    qrImageUrl?: string;
    instructions?: string;
    acceptCod?: boolean;
    razorpayEnabled?: boolean;
  };
  secretMenu?: {
    isEnabled?: boolean;
    hint?: string;
    passphrase?: string;
  };
  story?: {
    heading?: string;
    body?: string;
    image?: string;
    image2?: string;
    establishedYear?: number;
  };
  stats?: { happyCustomers?: string; ordersServed?: string; rating?: string };
  announcement?: string;
  hero?: { eyebrow?: string; image?: string; liveNote?: string };
  faqs?: Array<{ question: string; answer: string }>;
}

export interface CrispyOrder {
  orderNumber: string;
  status: string;
  minutesAgo: number;
  fulfilment: string;
}

export interface Crispy {
  status: string;
  tone: 'ready' | 'warming' | 'busy' | 'hot';
  queue: number;
  activeOrders: number;
  preparing: number;
  ready: number;
  capacity: number;
  avgWait: number;
  load: number;
  source: string;
  kitchenOpen: boolean;
  lastCompletedAt?: string | null;
  lastCompletedOrder?: string | null;
  updatedAt: string;
  orders: CrispyOrder[];
}

export interface HomeData {
  settings: Settings;
  categories: Category[];
  featured: Product[];
  offers: Offer[];
  testimonials: Testimonial[];
  gallery: GalleryItem[];
  crispy: Crispy;
  faqs: Array<{ question: string; answer: string }>;
}

export type CartKind = 'product' | 'secret' | 'bucket';

export interface BucketPiece {
  ingredientId: ID;
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface CartItem {
  key: string;
  kind: CartKind;
  id?: ID;
  productId?: ID;
  secretId?: ID;
  name: string;
  image: string;
  description?: string;
  price: number;
  quantity: number;
  pieces?: BucketPiece[];
}

export interface QuoteLine {
  kind: CartKind;
  name: string;
  image?: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  pieces?: Array<{ ingredient?: ID; name: string; quantity: number; unitPrice: number }>;
}

export interface Pricing {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  taxRate: number;
  tax: number;
  total: number;
}

export interface Quote {
  pricing: Pricing;
  coupon: { id: ID; code: string; discountType: Offer['discountType']; value: number; freeDelivery: boolean } | null;
  lines: QuoteLine[];
  minimumShortfall: number;
  fulfilmentType: 'delivery' | 'pickup';
}

export interface OrderItem {
  kind: CartKind;
  name: string;
  image?: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  pieces?: Array<{ name: string; quantity: number; unitPrice: number }>;
}

export interface Order {
  id: ID;
  orderNumber: string;
  customer: { name: string; phone: string; email?: string };
  fulfilment: {
    type: 'delivery' | 'pickup';
    address?: { line1?: string; line2?: string; city?: string; pincode?: string; landmark?: string };
    scheduledFor?: string;
  };
  items: OrderItem[];
  pricing: Pricing;
  couponCode?: string;
  status:
    | 'placed'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'completed'
    | 'cancelled';
  paymentMethod: 'upi' | 'razorpay' | 'cod' | 'counter';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  payment?: {
    utr?: string;
    screenshotUrl?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    submittedAt?: string;
    verifiedAt?: string;
  };
  notes?: string;
  timeline?: Array<{ status: string; at: string; note?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSettings {
  restaurantName: string;
  upiId: string;
  payeeName: string;
  qrImageUrl?: string;
  instructions?: string;
  acceptCod?: boolean;
  razorpayEnabled?: boolean;
}

export interface AdminUser {
  id: ID;
  name: string;
  email: string;
  role: 'admin' | 'manager';
  isActive: boolean;
  lastLoginAt?: string;
}

export interface AdminStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  revenue: number;
  todayRevenue: number;
  avgOrderValue: number;
  popularProducts: Array<{ _id: string; quantity: number; revenue: number; image?: string }>;
  recentOrders: Order[];
  transactions: any[];
  pendingPayments: number;
  unreadMessages: number;
  customers: number;
  products: number;
  unavailableProducts: number;
  admins: number;
  series: Array<{ date: string; label: string; orders: number; revenue: number }>;
}

export interface QRConfig {
  type: 'menu' | 'payment';
  label: string;
  url: string;
  imageUrl?: string;
  isActive: boolean;
  notes?: string;
  menuUrl?: string;
  upiUri?: string;
}

export interface ContactMessage {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiErrorShape {
  message: string;
  errors?: Array<{ path: string; message: string }>;
}
