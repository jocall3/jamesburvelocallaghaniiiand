import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import {
  createWallet,
  getWalletById,
  getWalletsByUserId,
  updateWallet,
  deleteWallet,
  generateWalletAddress,
  getAllWallets, // Added to support "expand it every way possible"
  getWalletBalance, // Added to support "expand it every way possible"
} from '../controllers/wallets';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization'; // Ensure authorization middleware exists

const router = Router();

// Route to create a new wallet
router.post(
  '/',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      userId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      currency: Joi.string().required(),
      description: Joi.string().optional(),
    }),
  }),
  createWallet
);

// Route to get a wallet by ID
router.get(
  '/:walletId',
  authenticate,
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      walletId: Joi.string().uuid().required(),
    }),
  }),
  getWalletById
);

// Route to get all wallets for a user
router.get(
  '/user/:userId',
  authenticate,
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      userId: Joi.string().uuid().required(),
    }),
  }),
  getWalletsByUserId
);

// Route to update a wallet
router.put(
  '/:walletId',
  authenticate,
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      walletId: Joi.string().uuid().required(),
    }),
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().optional(),
      description: Joi.string().optional(),
      status: Joi.string().optional().valid('active', 'inactive', 'frozen'), // Example status values
    }),
  }),
  updateWallet
);

// Route to delete a wallet
router.delete(
  '/:walletId',
  authenticate,
  authorize(['admin']), // Example: Only admins can delete wallets
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      walletId: Joi.string().uuid().required(),
    }),
  }),
  deleteWallet
);

// Route to generate a new wallet address
router.post(
  '/:walletId/address',
  authenticate,
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      walletId: Joi.string().uuid().required(),
    }),
  }),
  generateWalletAddress
);

// Route to get all wallets (admin only - for expansion)
router.get(
  '/all',
  authenticate,
  authorize(['admin']),
  getAllWallets
);

// Route to get wallet balance (for expansion)
router.get(
  '/:walletId/balance',
  authenticate,
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      walletId: Joi.string().uuid().required(),
    }),
  }),
  getWalletBalance
);

export default router;