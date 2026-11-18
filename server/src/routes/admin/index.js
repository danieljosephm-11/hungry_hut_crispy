import { Router } from 'express';
import { requireAdmin } from '../../lib/auth.js';
import statsRouter from './orders.js';
import menuRouter from './menu.js';
import marketingRouter from './marketing.js';
import systemRouter from './system.js';

const router = Router();

router.use(requireAdmin);
router.use(statsRouter);
router.use(menuRouter);
router.use(marketingRouter);
router.use(systemRouter);

export default router;
