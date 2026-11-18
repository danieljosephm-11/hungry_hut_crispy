import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  AdminUser,
  BucketConfiguration,
  BucketIngredient,
  Category,
  ContactMessage,
  Coupon,
  Customer,
  GalleryItem,
  Offer,
  Order,
  Payment,
  Product,
  QRConfiguration,
  RestaurantSettings,
  SecretItem,
  Testimonial,
} from './models/index.js';
import { round2 } from './lib/http.js';

const img = (name) => `/images/${name}.jpg`;

const CATEGORIES = [
  { name: 'Fried Chicken', slug: 'chicken', description: 'Hand-breaded, fried to order.', image: img('fried-chicken'), order: 1 },
  { name: 'Burgers', slug: 'burgers', description: 'Stacked, smashed and saucy.', image: img('big-burger'), order: 2 },
  { name: 'Pizzas', slug: 'pizzas', description: 'Stone-baked with a crispy edge.', image: img('pizza-special'), order: 3 },
  { name: 'Sides', slug: 'sides', description: 'The supporting cast that steals the show.', image: img('fries'), order: 4 },
  { name: 'Beverages', slug: 'drinks', description: 'Cold, sweet and built for crunch.', image: img('cola'), order: 5 },
  { name: 'Combos', slug: 'combos', description: 'More food. Better value. Zero regrets.', image: img('bucket-feast'), order: 6 },
];

const PRODUCTS = [
  {
    name: 'The OG Crispy Bucket',
    category: 'chicken',
    description: 'Eight pieces of buttermilk-marinated chicken, double-dredged and fried to a shattering crunch.',
    longDescription: 'Our signature bucket. Eight bone-in pieces, rested for 24 hours in a spiced buttermilk marinade, hand-dredged twice and fried in small batches. Served with house pickles and two dips.',
    price: 749,
    compareAtPrice: 899,
    image: img('bucket-feast'),
    foodType: 'nonveg',
    isBestseller: true,
    isPopular: true,
    isSpicy: false,
    calories: 3200,
    rating: 4.9,
    ratingCount: 421,
    tags: ['bucket', 'sharing', 'signature'],
    order: 1,
  },
  {
    name: 'Hot Honey Wings',
    category: 'chicken',
    description: 'Eight crispy wings tossed in sticky hot honey, finished with toasted sesame.',
    longDescription: 'Double-fried wings, glossy with our house hot honey. Heat that builds, sweetness that stays. Eight pieces per order.',
    price: 349,
    compareAtPrice: 399,
    image: img('wings'),
    foodType: 'nonveg',
    isBestseller: true,
    isSpicy: true,
    calories: 980,
    rating: 4.9,
    ratingCount: 318,
    tags: ['wings', 'spicy', 'bogo'],
    order: 2,
  },
  {
    name: 'Golden Chicken Strips',
    category: 'chicken',
    description: 'Five hand-cut tenders in a craggy golden crust with a smoky honey-mustard dip.',
    price: 299,
    image: img('strips'),
    foodType: 'nonveg',
    isPopular: true,
    calories: 760,
    rating: 4.8,
    ratingCount: 204,
    tags: ['strips', 'tenders'],
    order: 3,
  },
  {
    name: 'Popcorn Chicken',
    category: 'chicken',
    description: 'Bite-sized crunchy chicken, dusted with our signature red spice. Dangerously snackable.',
    price: 199,
    image: img('popcorn-chicken'),
    foodType: 'nonveg',
    isPopular: true,
    isSpicy: true,
    calories: 520,
    rating: 4.7,
    ratingCount: 187,
    tags: ['snack', 'popcorn'],
    order: 4,
  },
  {
    name: 'Peri Peri Fried Chicken',
    category: 'chicken',
    description: 'Four pieces fire-dusted with peri peri, lime salt and a little smoky char.',
    price: 449,
    image: img('fried-chicken'),
    foodType: 'nonveg',
    isBestseller: true,
    isSpicy: true,
    calories: 1450,
    rating: 4.8,
    ratingCount: 266,
    tags: ['peri peri', 'spicy'],
    order: 5,
  },
  {
    name: 'Big Hut Double Smash',
    category: 'burgers',
    description: 'Two smashed chicken patties, double cheese, house pickles and secret Hut sauce.',
    longDescription: 'The one that started the queue. Two lace-edged smash patties, molten cheddar, pickles, onions and a sauce we will never fully explain.',
    price: 329,
    compareAtPrice: 379,
    image: img('big-burger'),
    foodType: 'nonveg',
    isBestseller: true,
    isPopular: true,
    calories: 890,
    rating: 4.9,
    ratingCount: 512,
    tags: ['burger', 'smash', 'cheese'],
    order: 6,
  },
  {
    name: 'Crispy Chicken Deluxe',
    category: 'burgers',
    description: 'Buttermilk-fried chicken, slaw, pickles and garlic aioli in a toasted brioche bun.',
    price: 279,
    image: img('chicken-sandwich'),
    foodType: 'nonveg',
    isPopular: true,
    calories: 720,
    rating: 4.8,
    ratingCount: 289,
    tags: ['burger', 'crispy chicken'],
    order: 7,
  },
  {
    name: 'Classic Chicken Burger',
    category: 'burgers',
    description: 'The no-nonsense original: crispy chicken, lettuce, tomato and mayo.',
    price: 229,
    image: img('chicken-burger'),
    foodType: 'nonveg',
    calories: 610,
    rating: 4.7,
    ratingCount: 158,
    tags: ['burger', 'classic'],
    order: 8,
  },
  {
    name: 'Paneer Crunch Burger',
    category: 'burgers',
    description: 'Panko-crusted paneer, mint mayo, crunchy slaw and pickled onions.',
    price: 239,
    image: img('veg-burger'),
    foodType: 'veg',
    isPopular: true,
    calories: 590,
    rating: 4.8,
    ratingCount: 176,
    tags: ['burger', 'veg', 'paneer'],
    order: 9,
  },
  {
    name: 'Cheese Melt Chicken Burger',
    category: 'burgers',
    description: 'Crispy chicken drowned in a triple-cheese sauce with jalapeños.',
    price: 259,
    image: img('cheese-burger'),
    foodType: 'nonveg',
    isNew: true,
    isSpicy: true,
    calories: 780,
    rating: 4.7,
    ratingCount: 94,
    tags: ['burger', 'cheese', 'spicy'],
    order: 10,
  },
  {
    name: 'Hut Special Chicken Pizza',
    category: 'pizzas',
    description: 'Tandoori chicken, red onion, mozzarella and a swirl of mint mayo on a hand-stretched base.',
    price: 549,
    compareAtPrice: 649,
    image: img('pizza-special'),
    foodType: 'nonveg',
    isBestseller: true,
    calories: 1180,
    rating: 4.9,
    ratingCount: 342,
    tags: ['pizza', 'chicken'],
    order: 11,
  },
  {
    name: 'Peri Peri Chicken Pizza',
    category: 'pizzas',
    description: 'Fiery peri peri chicken, roasted peppers, mozzarella and chilli oil.',
    price: 579,
    image: img('peri-pizza'),
    foodType: 'nonveg',
    isSpicy: true,
    isPopular: true,
    calories: 1240,
    rating: 4.8,
    ratingCount: 218,
    tags: ['pizza', 'spicy'],
    order: 12,
  },
  {
    name: 'Margherita',
    category: 'pizzas',
    description: 'San Marzano tomato, fresh mozzarella, basil and a crack of black pepper.',
    price: 329,
    image: img('margherita'),
    foodType: 'veg',
    isPopular: true,
    calories: 860,
    rating: 4.7,
    ratingCount: 201,
    tags: ['pizza', 'veg', 'classic'],
    order: 13,
  },
  {
    name: 'Garden Veggie Supreme',
    category: 'pizzas',
    description: 'Roasted corn, peppers, olives, mushrooms and cherry tomatoes over mozzarella.',
    price: 429,
    image: img('veg-pizza'),
    foodType: 'veg',
    calories: 980,
    rating: 4.6,
    ratingCount: 132,
    tags: ['pizza', 'veg'],
    order: 14,
  },
  {
    name: 'Loaded Cheese Fries',
    category: 'sides',
    description: 'Skin-on fries under a landslide of molten cheese, jalapeños and spring onion.',
    price: 199,
    image: img('fries'),
    foodType: 'veg',
    isBestseller: true,
    isPopular: true,
    calories: 540,
    rating: 4.9,
    ratingCount: 388,
    tags: ['fries', 'cheese', 'veg'],
    order: 15,
  },
  {
    name: 'Golden Onion Rings',
    category: 'sides',
    description: 'Thick-cut onions in a crunchy golden batter with chipotle dip.',
    price: 179,
    image: img('onion-rings'),
    foodType: 'veg',
    calories: 420,
    rating: 4.7,
    ratingCount: 149,
    tags: ['sides', 'veg'],
    order: 16,
  },
  {
    name: 'Garlic Breadsticks',
    category: 'sides',
    description: 'Warm, buttery, garlicky. Baked to order and impossible to share.',
    price: 149,
    image: img('garlic-bread'),
    foodType: 'veg',
    calories: 380,
    rating: 4.8,
    ratingCount: 163,
    tags: ['sides', 'garlic', 'veg'],
    order: 17,
  },
  {
    name: 'Hut Cola',
    category: 'drinks',
    description: 'Ice-cold classic cola. The crunch needs a co-pilot.',
    price: 99,
    image: img('cola'),
    foodType: 'veg',
    calories: 150,
    rating: 4.6,
    ratingCount: 82,
    tags: ['drink', 'cola'],
    order: 18,
  },
  {
    name: 'Cola on the Rocks',
    category: 'drinks',
    description: 'Extra ice, extra fizz, a wedge of lime. Built for fried chicken.',
    price: 129,
    image: img('iced-tea'),
    foodType: 'veg',
    calories: 120,
    rating: 4.7,
    ratingCount: 74,
    tags: ['drink', 'cola', 'iced'],
    order: 19,
  },
  {
    name: 'Chocolate Thick Shake',
    category: 'drinks',
    description: 'Hand-spun chocolate ice cream, cocoa and a crown of whipped cream.',
    price: 189,
    image: img('shake-chocolate'),
    foodType: 'veg',
    isPopular: true,
    calories: 510,
    rating: 4.9,
    ratingCount: 231,
    tags: ['shake', 'chocolate', 'veg'],
    order: 20,
  },
  {
    name: 'Strawberry Shake',
    category: 'drinks',
    description: 'Real strawberries blitzed with vanilla ice cream. Pink, thick, happy.',
    price: 179,
    image: img('shake-strawberry'),
    foodType: 'veg',
    calories: 430,
    rating: 4.8,
    ratingCount: 142,
    tags: ['shake', 'strawberry', 'veg'],
    order: 21,
  },
  {
    name: 'Virgin Mojito',
    category: 'drinks',
    description: 'Lime, mint, crushed ice and soda. A crisp reset button.',
    price: 149,
    image: img('mojito'),
    foodType: 'veg',
    calories: 90,
    rating: 4.7,
    ratingCount: 96,
    tags: ['drink', 'mint', 'veg'],
    order: 22,
  },
  {
    name: 'Family Feast Bucket',
    category: 'combos',
    description: '12 pieces, two large sides, four dips and four drinks. The full table, sorted.',
    longDescription: 'Our biggest spread: 12 pieces of mixed fried chicken, large loaded fries, large onion rings, four house dips and four cold drinks. Feeds 4–5 hungry people.',
    price: 1399,
    compareAtPrice: 1699,
    image: img('hero-chicken'),
    foodType: 'nonveg',
    isBestseller: true,
    isPopular: true,
    calories: 6100,
    rating: 4.9,
    ratingCount: 198,
    tags: ['combo', 'family', 'bucket'],
    order: 23,
  },
  {
    name: 'Solo Crunch Combo',
    category: 'combos',
    description: 'Crispy chicken burger, regular fries and a Hut Cola. Lunch, solved.',
    price: 349,
    image: img('chicken-sandwich'),
    foodType: 'nonveg',
    isPopular: true,
    calories: 1080,
    rating: 4.8,
    ratingCount: 243,
    tags: ['combo', 'solo'],
    order: 24,
  },
  {
    name: 'Date Night Combo',
    category: 'combos',
    description: 'Two burgers, eight wings, loaded fries and two thick shakes. Share the crunch.',
    price: 799,
    compareAtPrice: 899,
    image: img('big-burger'),
    foodType: 'nonveg',
    calories: 2200,
    rating: 4.9,
    ratingCount: 156,
    tags: ['combo', 'date night'],
    order: 25,
  },
];

const BUCKET_INGREDIENTS = [
  { name: 'Chicken Leg', slug: 'chicken-leg', description: 'Juicy bone-in leg, double dredged.', image: img('fried-chicken'), price: 149, maxQuantity: 12, order: 1 },
  { name: 'Chicken Wing', slug: 'chicken-wing', description: 'Crispy wing, perfect for sauce.', image: img('wings'), price: 99, maxQuantity: 16, order: 2 },
  { name: 'Chicken Strip', slug: 'chicken-strip', description: 'Boneless tender in a craggy crust.', image: img('strips'), price: 119, maxQuantity: 12, order: 3 },
  { name: 'Popcorn Chicken', slug: 'popcorn-chicken', description: 'Tiny, crunchy, addictive pieces.', image: img('popcorn-chicken'), price: 79, maxQuantity: 20, order: 4 },
];

const SECRET_ITEMS = [
  { name: 'Nashville Hot Tower', slug: 'nashville-hot-tower', description: 'Three dipped chicken thighs, cayenne butter, pickles and slaw. Off-menu heat.', price: 399, image: img('chicken-sandwich'), foodType: 'nonveg', badge: 'Off-menu', order: 1 },
  { name: 'Truffle Butter Wings', slug: 'truffle-butter-wings', description: 'Eight wings glossed in truffle butter and parmesan. Very quiet luxury.', price: 429, image: img('wings'), foodType: 'nonveg', badge: 'Chef’s drop', order: 2 },
  { name: 'Crunch Dust Chicken', slug: 'crunch-dust-chicken', description: 'Popcorn chicken tossed in our smoked chilli crunch dust. Ask for extra napkins.', price: 349, image: img('popcorn-chicken'), foodType: 'nonveg', badge: 'Secret spice', order: 3 },
  { name: 'Midnight Maple Bucket', slug: 'midnight-maple-bucket', description: 'Six pieces, maple butter glaze, candied bacon crumb. Only after 9pm.', price: 899, image: img('bucket-feast'), foodType: 'nonveg', badge: 'After 9pm', order: 4 },
];

const OFFERS = [
  {
    title: 'Buy 1 Get 1 Wings',
    subtitle: 'Double the crunch, same price',
    description: 'Order eight Hot Honey Wings and get another eight on us. Because one basket is never enough.',
    badge: 'BOGO',
    code: 'WINGBOGO',
    discountType: 'bogo',
    discountValue: 0,
    minOrder: 0,
    theme: 'red',
    image: img('wings'),
    isFeatured: true,
    terms: ['Add two or more Hot Honey Wings portions to your cart.', 'The cheapest qualifying portion is free.', 'Cannot be combined with other coupons.'],
    order: 1,
  },
  {
    title: '₹200 Off the Big Bucket',
    subtitle: 'Feed the whole table for less',
    description: 'Flat ₹200 off when your order crosses ₹899. The Family Feast is calling.',
    badge: 'Save ₹200',
    code: 'BUCKET200',
    discountType: 'fixed',
    discountValue: 200,
    minOrder: 899,
    theme: 'yellow',
    image: img('bucket-feast'),
    isFeatured: true,
    terms: ['Minimum order value ₹899.', 'One use per order.', 'Valid on the full menu.'],
    order: 2,
  },
  {
    title: 'Family Feast · 15% Off',
    subtitle: 'Sunday lunch, sorted',
    description: 'A generous 15% off orders above ₹1199. Add the Family Feast Bucket and let everyone fight over the last wing.',
    badge: '15% OFF',
    code: 'FAMILY15',
    discountType: 'percent',
    discountValue: 15,
    minOrder: 1199,
    maxDiscount: 250,
    theme: 'orange',
    image: img('hero-chicken'),
    isFeatured: true,
    terms: ['Minimum order value ₹1199.', 'Maximum discount ₹250.', 'Valid every day of the week.'],
    order: 3,
  },
  {
    title: 'Free Delivery',
    subtitle: 'We’ll bring the crunch',
    description: 'No delivery fee on orders above ₹499. Your sofa is the best table in the house.',
    badge: 'FREE DELIVERY',
    code: 'FREEDEL',
    discountType: 'free_delivery',
    discountValue: 0,
    minOrder: 499,
    theme: 'cream',
    image: img('interior'),
    terms: ['Minimum order value ₹499.', 'Delivery within our 7 km radius.', 'Subject to rider availability.'],
    order: 4,
  },
  {
    title: 'Weekend Wind-Down',
    subtitle: '10% off Saturdays & Sundays',
    description: 'Because weekends deserve extra cheese. Save 10% on orders above ₹499.',
    badge: 'WEEKEND',
    code: 'WEEKEND10',
    discountType: 'percent',
    discountValue: 10,
    minOrder: 499,
    maxDiscount: 120,
    theme: 'yellow',
    image: img('pizza-special'),
    terms: ['Valid Saturday and Sunday.', 'Maximum discount ₹120.', 'Cannot be combined with other offers.'],
    order: 5,
  },
  {
    title: 'First Order? 10% On Us',
    subtitle: 'Welcome to the Hut',
    description: 'Your first order gets 10% off. Consider it a very crispy handshake.',
    badge: 'NEW GUEST',
    code: 'HUT10',
    discountType: 'percent',
    discountValue: 10,
    minOrder: 299,
    maxDiscount: 100,
    theme: 'orange',
    image: img('big-burger'),
    terms: ['New customers only.', 'Minimum order value ₹299.', 'Maximum discount ₹100.'],
    order: 6,
  },
];

const TESTIMONIALS = [
  { name: 'Ananya Sharma', location: 'Hauz Khas, Delhi', avatar: img('avatar1'), rating: 5, review: 'The crunch is genuinely audible. I ordered the OG bucket for a movie night and my flatmates have not stopped talking about it. The hot honey wings are dangerous.', isFeatured: true, order: 1 },
  { name: 'Rohan Mehta', location: 'Saket, Delhi', avatar: img('avatar2'), rating: 5, review: 'Finally, a fast-food place that does not taste like it was made three hours ago. Everything arrived hot, the fries were still crispy, and the packaging is lovely.', isFeatured: true, order: 2 },
  { name: 'Sana Kapoor', location: 'Gurugram', avatar: img('avatar3'), rating: 4, review: 'The Build Your Bucket feature is such a good idea. We built a ridiculous 14-piece bucket with all four kinds of chicken. Zero regrets.', isFeatured: true, order: 3 },
  { name: 'Aditya Verma', location: 'Noida', avatar: img('avatar4'), rating: 5, review: 'The Big Hut Double Smash is the best chicken burger I have had in Delhi. Juicy, messy, perfectly seasoned. The ordering experience was smooth too.', isFeatured: true, order: 4 },
  { name: 'Mehak Bansal', location: 'Vasant Kunj, Delhi', avatar: '', rating: 5, review: 'Ordered the Family Feast for my parents’ anniversary. Everything arrived on time and still hot. The paneer burger surprised even the vegetarians at the table.', order: 5 },
  { name: 'Kabir Anand', location: 'CP, Delhi', avatar: '', rating: 4, review: 'Came for the secret menu, stayed for the truffle wings. The QR menu is so easy to use that we ordered a second round without waiting for a server.', order: 6 },
  { name: 'Unverified Guest', location: 'Pending moderation', avatar: '', rating: 5, review: 'This seeded review is awaiting admin approval so the moderation flow can be tested.', isApproved: false, order: 7 },
];

const GALLERY = [
  { title: 'The OG bucket', category: 'Buckets', image: img('bucket-feast'), alt: 'A wire basket filled with golden fried chicken' },
  { title: 'Hot honey wings', category: 'Food', image: img('wings'), alt: 'Glossy buffalo wings in a bowl' },
  { title: 'Double smash', category: 'Burgers', image: img('big-burger'), alt: 'A tall double cheeseburger' },
  { title: 'Straight from the oven', category: 'Pizza', image: img('pizza-special'), alt: 'A rustic pizza with fresh basil' },
  { title: 'Golden hour strips', category: 'Food', image: img('strips'), alt: 'Chicken tenders with dip' },
  { title: 'Our dining room', category: 'Interiors', image: img('interior'), alt: 'Warm restaurant dining room' },
  { title: 'The pass', category: 'Kitchen', image: img('kitchen'), alt: 'Chefs working in a busy kitchen' },
  { title: 'Plating up', category: 'Kitchen', image: img('chef'), alt: 'Chef plating a dish under warm lights' },
  { title: 'Table for two', category: 'Interiors', image: img('dining'), alt: 'Moody restaurant table setting' },
  { title: 'Loaded fries', category: 'Food', image: img('fries'), alt: 'Loaded fries in a paper cone' },
  { title: 'Onion rings', category: 'Food', image: img('onion-rings'), alt: 'Golden onion rings in a basket' },
  { title: 'Late night slice', category: 'Pizza', image: img('margherita'), alt: 'Margherita pizza on a plate' },
];

const FAQS = [
  { question: 'How long does delivery take?', answer: 'Most deliveries arrive in 25–35 minutes. The Live Crispy Meter on our homepage shows the current kitchen queue and a wait estimate built from live orders, not a marketing number.' },
  { question: 'Do you use real chicken?', answer: 'Always. We use fresh, never-frozen chicken, marinated in buttermilk for 24 hours and hand-breaded in our kitchen every morning.' },
  { question: 'What are your delivery charges?', answer: 'Delivery is ₹49 on orders below ₹799. Orders above ₹799 are delivered free within our 7 km radius. You can also collect your order from the restaurant with no fee.' },
  { question: 'How does the payment QR work?', answer: 'Choose UPI at checkout, scan the QR with any UPI app and pay the exact order amount. Submit the 12-digit UTR and a screenshot. A team member verifies it against our bank statement before the order is marked paid.' },
  { question: 'Is there a secret menu?', answer: 'There might be. If you know the word, the homepage will open a door. Ask the crew, check our socials, or listen for the kitchen whisper.' },
  { question: 'Can I customise a bucket?', answer: 'Yes — Build Your Bucket lets you mix legs, wings, strips and popcorn chicken. Every piece is priced individually and the total updates live.' },
  { question: 'Do you cater parties?', answer: 'We do. For orders above 50 pieces, call us directly and we will build a custom feast with a dedicated pickup time.' },
];

function deliveryFeeFor(subtotal) {
  return subtotal >= 799 ? 0 : 49;
}

function priceLines(items) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const deliveryFee = deliveryFeeFor(subtotal);
  const tax = round2((subtotal + deliveryFee) * 0.05);
  return {
    subtotal,
    discount: 0,
    deliveryFee,
    taxRate: 5,
    tax,
    total: round2(subtotal + deliveryFee + tax),
  };
}

function makeLine(product, quantity) {
  return {
    kind: 'product',
    product: product._id,
    name: product.name,
    image: product.image,
    description: product.description,
    unitPrice: product.price,
    quantity,
    lineTotal: product.price * quantity,
  };
}

async function seedOrders(productsBySlug, now) {
  if ((await Order.countDocuments()) > 0) return;
  const p = (slug) => productsBySlug.get(slug);
  const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000);
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const samples = [
    {
      orderNumber: 'HH-4781',
      createdAt: daysAgo(5),
      customer: { name: 'Rohan Mehta', phone: '9811122233', email: 'rohan@example.com' },
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      items: [makeLine(p('hot-honey-wings'), 2), makeLine(p('loaded-cheese-fries'), 1), makeLine(p('hut-cola'), 2)],
      utr: '402318765432',
    },
    {
      orderNumber: 'HH-4792',
      createdAt: daysAgo(4),
      customer: { name: 'Mehak Bansal', phone: '9899988877', email: 'mehak@example.com' },
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      items: [makeLine(p('the-og-crispy-bucket'), 1), makeLine(p('paneer-crunch-burger'), 2), makeLine(p('garlic-breadsticks'), 1)],
      utr: '402987654321',
    },
    {
      orderNumber: 'HH-4805',
      createdAt: daysAgo(2),
      customer: { name: 'Aditya Verma', phone: '9766655544', email: 'aditya@example.com' },
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'counter',
      items: [makeLine(p('big-hut-double-smash'), 2), makeLine(p('golden-onion-rings'), 1), makeLine(p('chocolate-thick-shake'), 2)],
    },
    {
      orderNumber: 'HH-4811',
      createdAt: daysAgo(1),
      customer: { name: 'Tara Singh', phone: '9955544433', email: 'tara@example.com' },
      status: 'cancelled',
      paymentStatus: 'refunded',
      paymentMethod: 'upi',
      items: [makeLine(p('garden-veggie-supreme'), 1)],
      utr: '402123456789',
      note: 'Customer cancelled before preparation began.',
    },
    {
      orderNumber: 'HH-4818',
      createdAt: hoursAgo(0.35),
      customer: { name: 'Ananya Sharma', phone: '9876543210', email: 'ananya@example.com' },
      status: 'preparing',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      items: [makeLine(p('hot-honey-wings'), 2), makeLine(p('loaded-cheese-fries'), 1), makeLine(p('strawberry-shake'), 2)],
      utr: '403112233445',
      note: 'Extra napkins, please.',
    },
    {
      orderNumber: 'HH-4819',
      createdAt: hoursAgo(0.12),
      customer: { name: 'Sana Kapoor', phone: '9812345678', email: 'sana@example.com' },
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      items: [makeLine(p('family-feast-bucket'), 1), makeLine(p('virgin-mojito'), 2)],
      utr: '403556677889',
      note: 'Payment submitted, awaiting verification.',
    },
    {
      orderNumber: 'HH-4820',
      createdAt: hoursAgo(0.5),
      customer: { name: 'Kabir Anand', phone: '9899112233', email: 'kabir@example.com' },
      status: 'ready',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      items: [],
      custom: [
        {
          kind: 'bucket',
          name: 'Build Your Bucket',
          description: '3× Chicken Leg · 4× Chicken Wing · 2× Popcorn Chicken',
          image: img('bucket-feast'),
          unitPrice: 3 * 149 + 4 * 99 + 2 * 79,
          quantity: 1,
          lineTotal: 3 * 149 + 4 * 99 + 2 * 79,
          pieces: [
            { ingredient: null, name: 'Chicken Leg', quantity: 3, unitPrice: 149 },
            { ingredient: null, name: 'Chicken Wing', quantity: 4, unitPrice: 99 },
            { ingredient: null, name: 'Popcorn Chicken', quantity: 2, unitPrice: 79 },
          ],
        },
        makeLine(p('cola-on-the-rocks'), 2),
      ],
      utr: '403998877665',
    },
    {
      orderNumber: 'HH-4821',
      createdAt: hoursAgo(0.7),
      customer: { name: 'Naina Gupta', phone: '9911223344', email: 'naina@example.com' },
      status: 'out_for_delivery',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      items: [makeLine(p('hut-special-chicken-pizza'), 1), makeLine(p('golden-chicken-strips'), 1), makeLine(p('chocolate-thick-shake'), 1)],
      utr: '403334455667',
    },
  ];

  for (const sample of samples) {
    const items = (sample.custom || sample.items).filter((item) => item.quantity > 0);
    const pricing = priceLines(items);
    if (sample.utr && sample.paymentStatus === 'paid') {
      pricing.discount = 0;
    }
    const date = sample.createdAt;
    const order = await Order.create({
      orderNumber: sample.orderNumber,
      customer: sample.customer,
      fulfilment: {
        type: sample.status === 'ready' ? 'pickup' : 'delivery',
        address:
          sample.status === 'ready'
            ? {}
            : { line1: 'B-14, Hauz Khas Enclave', line2: 'Near Deer Park', city: 'New Delhi', pincode: '110016', landmark: 'Opposite the market' },
      },
      items,
      pricing,
      status: sample.status,
      paymentMethod: sample.paymentMethod,
      paymentStatus: sample.paymentStatus,
      payment: {
        utr: sample.utr || '',
        submittedAt: sample.utr ? date : undefined,
        verifiedAt: sample.paymentStatus === 'paid' ? date : undefined,
      },
      notes: sample.note || '',
      timeline: [
        { status: 'placed', at: date, note: 'Order placed by customer' },
        ...(sample.status !== 'placed' && sample.status !== 'cancelled'
          ? [{ status: 'confirmed', at: new Date(date.getTime() + 3 * 60000), note: 'Order confirmed by restaurant' }]
          : []),
        ...(['preparing', 'ready', 'out_for_delivery', 'completed'].includes(sample.status)
          ? [{ status: 'preparing', at: new Date(date.getTime() + 8 * 60000), note: 'In the fryer' }]
          : []),
        ...(sample.status === 'cancelled'
          ? [{ status: 'cancelled', at: new Date(date.getTime() + 12 * 60000), note: sample.note }]
          : []),
      ],
    });
    await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt: date, updatedAt: date } });

    await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      amount: pricing.total,
      method: sample.paymentMethod,
      status: sample.paymentStatus,
      utr: sample.utr || '',
      submittedAt: sample.utr ? date : undefined,
      verifiedAt: sample.paymentStatus === 'paid' ? date : undefined,
      notes: 'Seeded demo order',
    });

    await Customer.findOneAndUpdate(
      { phone: sample.customer.phone },
      {
        $set: {
          name: sample.customer.name,
          email: sample.customer.email,
          lastOrderAt: date,
        },
        $inc: { orderCount: 1, totalSpent: pricing.total },
      },
      { upsert: true },
    );

    if (sample.custom) {
      await BucketConfiguration.create({
        pieces: sample.custom[0].pieces,
        price: sample.custom[0].unitPrice,
        createdBy: sample.customer.phone,
        order: order._id,
      });
    }
  }
}

export async function seedDatabase({ reset = false, auto = false } = {}) {
  const now = new Date();
  const existingProducts = await Product.countDocuments();
  const existingAdmin = await AdminUser.countDocuments();
  if (auto && existingProducts > 0 && existingAdmin > 0) {
    return { skipped: true, reason: 'Database already seeded' };
  }

  if (reset) {
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Offer.deleteMany({}),
      Coupon.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Customer.deleteMany({}),
      BucketIngredient.deleteMany({}),
      BucketConfiguration.deleteMany({}),
      SecretItem.deleteMany({}),
      Testimonial.deleteMany({}),
      GalleryItem.deleteMany({}),
      ContactMessage.deleteMany({}),
      QRConfiguration.deleteMany({}),
      RestaurantSettings.deleteMany({}),
      AdminUser.deleteMany({}),
    ]);
  }

  /* Categories */
  const categoryMap = new Map();
  for (const data of CATEGORIES) {
    const category = await Category.findOneAndUpdate(
      { slug: data.slug },
      { $set: { ...data, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoryMap.set(data.slug, category);
  }

  /* Products */
  const productsBySlug = new Map();
  for (const data of PRODUCTS) {
    const category = categoryMap.get(data.category);
    const slug = data.name
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const product = await Product.findOneAndUpdate(
      { slug },
      {
        $set: {
          ...data,
          slug,
          category: category._id,
          isAvailable: true,
          longDescription: data.longDescription || data.description,
          compareAtPrice: data.compareAtPrice || 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    productsBySlug.set(slug, product);
  }

  /* Bucket ingredients */
  const bucketBySlug = new Map();
  for (const data of BUCKET_INGREDIENTS) {
    const item = await BucketIngredient.findOneAndUpdate(
      { slug: data.slug },
      { $set: { ...data, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    bucketBySlug.set(data.slug, item);
  }

  /* Offers + coupons */
  for (const data of OFFERS) {
    const offer = await Offer.findOneAndUpdate(
      { title: data.title },
      {
        $set: {
          ...data,
          startsAt: now,
          endsAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
          appliesToProduct: data.code === 'WINGBOGO' ? productsBySlug.get('hot-honey-wings')?._id : null,
          terms: data.terms || [],
          usageLimit: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await Coupon.findOneAndUpdate(
      { code: data.code },
      {
        $set: {
          offer: offer._id,
          discountType: data.discountType,
          value: data.discountValue,
          minOrder: data.minOrder || 0,
          maxDiscount: data.maxDiscount || 0,
          appliesToProduct: data.code === 'WINGBOGO' ? productsBySlug.get('hot-honey-wings')?._id : null,
          startsAt: now,
          endsAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        $setOnInsert: { usedCount: 0 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /* Secret menu */
  for (const data of SECRET_ITEMS) {
    await SecretItem.findOneAndUpdate(
      { slug: data.slug },
      { $set: { ...data, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /* Testimonials */
  for (const data of TESTIMONIALS) {
    await Testimonial.findOneAndUpdate(
      { name: data.name },
      { $set: { ...data, isApproved: data.isApproved !== false } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /* Gallery */
  for (const [index, data] of GALLERY.entries()) {
    await GalleryItem.findOneAndUpdate(
      { title: data.title },
      { $set: { ...data, order: index + 1, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /* Settings — don't overwrite an existing customised settings document unless resetting */
  let settings = await RestaurantSettings.findOne({ key: 'main' });
  if (!settings || reset) {
    settings = await RestaurantSettings.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          name: 'Hungry Hut',
          tagline: 'The Ultimate Fast-Food Experience',
          secondaryTagline: 'Good Food, Good Mood',
          phone: '+91 98100 12345',
          email: 'hello@hungryhut.in',
          address: 'Shop 12, Hauz Khas Village, New Delhi 110016',
          mapQuery: 'Hauz Khas Village, New Delhi',
          openingHours: [
            { day: 'Monday – Thursday', hours: '11:00 – 23:00' },
            { day: 'Friday – Saturday', hours: '11:00 – 01:00' },
            { day: 'Sunday', hours: '11:00 – 23:00' },
          ],
          social: {
            instagram: 'https://instagram.com/hungryhut',
            facebook: 'https://facebook.com/hungryhut',
            x: 'https://x.com/hungryhut',
            youtube: 'https://youtube.com/@hungryhut',
            whatsapp: 'https://wa.me/919810012345',
          },
          delivery: { enabled: true, fee: 49, freeAbove: 799, minOrder: 199, etaMinutes: 30, radiusKm: 7 },
          pickup: { enabled: true, etaMinutes: 15 },
          taxRate: 5,
          avgPrepMinutes: 12,
          kitchenCapacity: 4,
          payment: {
            upiId: 'hungryhut@okhdfcbank',
            payeeName: 'Hungry Hut',
            qrImageUrl: '',
            acceptCod: true,
            instructions:
              'Scan this QR with GPay, PhonePe, Paytm or any UPI app. Pay the exact amount shown. Then enter your 12-digit UTR and upload a screenshot. Our team verifies every payment against the bank statement — your order is marked paid only after verification.',
          },
          secretMenu: {
            isEnabled: true,
            passphrase: 'HUTCRISPY',
            hint: 'Chef’s favourite two words: HUT + CRISPY. Type them together. Lower-case works.',
          },
          story: {
            heading: 'Small kitchen. Big crunch. Zero shortcuts.',
            body: 'Hungry Hut started in 2016 with one fryer, a hand-written menu and a stubborn belief that fast food can still be real food. Every piece is hand-breaded, rested for 24 hours in our buttermilk marinade and fried to order in small batches. No heat lamps. No shortcuts. Just the kind of crunch you can hear across the room.',
            image: img('restaurant'),
            image2: img('chef'),
            establishedYear: 2016,
          },
          stats: { happyCustomers: '48K+', ordersServed: '1.2M+', rating: '4.9' },
          announcement: 'Free delivery above ₹799 · Use HUT10 for 10% off your first order',
          hero: {
            eyebrow: 'The Ultimate Fast-Food Experience',
            image: img('hero-chicken'),
            liveNote: 'Hand-breaded & fried to order',
          },
          faqs: FAQS,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /* Admin */
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hungryhut.in').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'HungryHut@2026';
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD must be set in production before seeding an admin account.');
  }
  let admin = await AdminUser.findOne({ email: adminEmail });
  if (!admin) {
    admin = await AdminUser.create({
      name: process.env.ADMIN_NAME || 'Hungry Hut Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
    });
  } else if (reset) {
    admin.passwordHash = await bcrypt.hash(adminPassword, 12);
    admin.isActive = true;
    await admin.save();
  }

  /* QR configs */
  const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
  await QRConfiguration.findOneAndUpdate(
    { type: 'menu' },
    { $setOnInsert: { type: 'menu', label: 'Scan for the Hungry Hut menu', url: `${siteUrl}/menu`, isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await QRConfiguration.findOneAndUpdate(
    { type: 'payment' },
    {
      $setOnInsert: {
        type: 'payment',
        label: 'Scan to pay Hungry Hut',
        url: `upi://pay?pa=${encodeURIComponent('hungryhut@okhdfcbank')}&pn=Hungry%20Hut&cu=INR`,
        imageUrl: '',
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  /* Demo orders for dashboard + live crispy meter */
  await seedOrders(productsBySlug, now);

  /* Contact messages */
  if ((await ContactMessage.countDocuments()) === 0) {
    await ContactMessage.create([
      {
        name: 'Priya Malhotra',
        email: 'priya@example.com',
        phone: '9810012345',
        subject: 'Corporate catering',
        message: 'Hi! We are planning an office lunch for 45 people next Friday. Could you share a party bucket menu and delivery options?',
      },
      {
        name: 'Dev Patel',
        email: 'dev@example.com',
        phone: '9876501234',
        subject: 'Allergy question',
        message: 'Does the crispy coating contain nuts? My son has a severe peanut allergy and we would love to order this weekend.',
        isRead: true,
      },
    ]);
  }

  const counts = {
    categories: await Category.countDocuments(),
    products: await Product.countDocuments(),
    offers: await Offer.countDocuments(),
    orders: await Order.countDocuments(),
    bucketIngredients: await BucketIngredient.countDocuments(),
    secretItems: await SecretItem.countDocuments(),
    testimonials: await Testimonial.countDocuments(),
    gallery: await GalleryItem.countDocuments(),
  };
  return { skipped: false, counts, admin: adminEmail };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('/seed.js')) {
  const { connectDB, disconnectDB } = await import('./db.js');
  const reset = process.argv.includes('--force');
  try {
    await connectDB();
    const result = await seedDatabase({ reset });
    console.log('[seed]', result);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[seed failed]', error);
    await disconnectDB();
    process.exit(1);
  }
}
