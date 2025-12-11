import express from 'express';
import {
  getBonds,
  getBondDetails,
  getBondHistoricalData,
} from '../controllers/bondController';

const router = express.Router();

// @route   GET /api/bonds
// @desc    Get a list of all bonds (with optional filtering/pagination)
// @access  Public
router.get('/', getBonds);

// @route   GET /api/bonds/:isin
// @desc    Get details for a specific bond by ISIN
// @access  Public
router.get('/:isin', getBondDetails);

// @route   GET /api/bonds/:isin/history
// @desc    Get historical trading/price data for a specific bond by ISIN
// @access  Public
router.get('/:isin/history', getBondHistoricalData);

export default router;