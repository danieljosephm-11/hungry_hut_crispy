import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/index.js';
import { httpError } from './http.js';

const COOKIE = 'hh_session';
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 24) {
    throw new Error('JWT_SECRET must be set to a random string of at least 24 characters.');
  }
  return value;
};

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    secret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

export async function requireAdmin(req, _res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.[COOKIE] || bearer;
    if (!token) throw httpError(401, 'Please sign in to continue.');
    let payload;
    try {
      payload = jwt.verify(token, secret());
    } catch {
      throw httpError(401, 'Your session has expired. Please sign in again.');
    }
    const user = await AdminUser.findById(payload.sub);
    if (!user || !user.isActive) throw httpError(401, 'This admin account is unavailable.');
    req.admin = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return next(httpError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
}
