import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AdminUser } from '../models/index.js';
import { clearSessionCookie, requireAdmin, setSessionCookie, signSession } from '../lib/auth.js';
import { asyncHandler, httpError } from '../lib/http.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await AdminUser.findOne({ email });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) throw httpError(401, 'Email or password is incorrect.');
    if (!user.isActive) throw httpError(403, 'This admin account has been disabled.');
    user.lastLoginAt = new Date();
    await user.save();
    setSessionCookie(res, signSession(user));
    res.json({ user: user.toJSON() });
  }),
);

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Signed out.' });
});

router.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ user: req.admin.toJSON() });
  }),
);

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .regex(/[A-Z]/, 'Include an uppercase letter.')
    .regex(/[a-z]/, 'Include a lowercase letter.')
    .regex(/[0-9]/, 'Include a number.'),
});

router.post(
  '/password',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    const user = await AdminUser.findById(req.admin.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw httpError(400, 'Your current password is incorrect.');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password updated.' });
  }),
);

export default router;
