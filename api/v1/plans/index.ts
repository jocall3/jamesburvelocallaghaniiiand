import { Request, Response } from 'express';
import { Plan } from '../../../models/Plan';
import { getPlans } from '../../../services/planService';
import { ApiResponse } from '../../../types/ApiResponse';

/**
 * @route GET /api/v1/plans
 * @desc Get all subscription plans
 * @access Public
 */
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await getPlans();

    const response: ApiResponse<Plan[]> = {
      success: true,
      data: plans,
      message: 'Successfully retrieved all subscription plans.',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching plans:', error);

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to retrieve subscription plans.',
      error: error.message || 'An unexpected error occurred.',
    };

    res.status(500).json(response);
  }
};