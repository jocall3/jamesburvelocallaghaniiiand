import express from 'express';
import { authRoutes } from './auth';
import { userRoutes } from './user';
import { productRoutes } from './product';
import { orderRoutes } from './order';
import { paymentRoutes } from './payment';
import { notificationRoutes } from './notification';
import { analyticsRoutes } from './analytics';
import { supportRoutes } from './support';
import { inventoryRoutes } from './inventory';
import { marketingRoutes } from './marketing';
import { cmsRoutes } from './cms';
import { searchRoutes } from './search';
import { reviewRoutes } from './review';
import { chatRoutes } from './chat';
import { fileRoutes } from './file';
import { settingsRoutes } from './settings';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/support', supportRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/marketing', marketingRoutes);
router.use('/cms', cmsRoutes);
router.use('/search', searchRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chat', chatRoutes);
router.use('/files', fileRoutes);
router.use('/settings', settingsRoutes);

export { router };