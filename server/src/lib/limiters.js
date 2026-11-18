import rateLimit from 'express-rate-limit';

const handler = (message) => (_req, res) => res.status(429).json({ message });

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('Too many sign-in attempts. Please wait 15 minutes and try again.'),
});

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('Too many requests. Please slow down a little.'),
});

export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('Too many orders from this device. Please contact the restaurant if this is a mistake.'),
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('You have sent a few messages already. Please give us a moment to reply.'),
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('Too many uploads. Please try again later.'),
});

export const secretLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('Too many secret attempts. The kitchen is watching. Try again in 15 minutes.'),
});
