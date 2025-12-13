import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { I5_API_ENDPOINT_14 } from '@/lib/constants';

/**
 * @swagger
 * /api/protocol/transition/finalize-settlement:
 *   post:
 *     summary: Finalizes the settlement phase of the transition protocol.
 *     description: This endpoint is responsible for marking the settlement phase as complete for a given transition. It updates the status of the transition and potentially triggers further actions.
 *     operationId: finalizeSettlementTransition
 *     tags:
 *       - Protocol
 *       - Transition
 *       - Settlement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transitionId:
 *                 type: string
 *                 description: The unique identifier of the transition to finalize settlement for.
 *             required:
 *               - transitionId
 *     responses:
 *       200:
 *         description: Settlement phase finalized successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Settlement phase finalized successfully for transition [transitionId]."
 *                 transition:
 *                   $ref: '#/components/schemas/Transition'
 *       400:
 *         description: Bad request. Invalid input or missing parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid input: transitionId is required."
 *       404:
 *         description: Transition not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Transition with ID [transitionId] not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred while finalizing settlement."
 */
export async function POST(request: Request): Promise<NextResponse> {
  const endpointName = I5_API_ENDPOINT_14;
  const startTime = Date.now();
  logger.info(`[${endpointName}] Received request to finalize settlement.`);

  try {
    const body = await request.json();
    const { transitionId } = body;

    if (!transitionId || typeof transitionId !== 'string') {
      logger.warn(`[${endpointName}] Bad request: Missing or invalid transitionId.`);
      return NextResponse.json(
        { error: 'Invalid input: transitionId is required and must be a string.' },
        { status: 400 }
      );
    }

    logger.info(`[${endpointName}] Attempting to finalize settlement for transition ID: ${transitionId}`);

    // 1. Find the transition
    const transition = await prisma.transition.findUnique({
      where: { id: transitionId },
      include: {
        settlement: true, // Assuming settlement details are linked
        // Add other relevant includes if needed for status updates
      },
    });

    if (!transition) {
      logger.warn(`[${endpointName}] Transition not found: ${transitionId}`);
      return NextResponse.json(
        { error: `Transition with ID ${transitionId} not found.` },
        { status: 404 }
      );
    }

    // 2. Validate current state (optional but recommended)
    // For example, ensure settlement phase is not already finalized
    if (transition.status === 'SETTLEMENT_FINALIZED') {
      logger.info(`[${endpointName}] Settlement already finalized for transition ID: ${transitionId}`);
      return NextResponse.json(
        {
          message: `Settlement phase is already finalized for transition ${transitionId}.`,
          transition,
        },
        { status: 200 }
      );
    }

    // 3. Update the transition status to indicate settlement finalization
    const updatedTransition = await prisma.transition.update({
      where: { id: transitionId },
      data: {
        status: 'SETTLEMENT_FINALIZED',
        // Potentially update settlement-specific fields if they exist and are managed here
        // e.g., settlement: { update: { finalizedAt: new Date() } }
      },
      include: {
        settlement: true, // Re-fetch to include updated settlement info if applicable
      },
    });

    logger.info(`[${endpointName}] Successfully finalized settlement for transition ID: ${transitionId}`);
    const responseTime = Date.now() - startTime;
    logger.info(`[${endpointName}] Request processed in ${responseTime}ms.`);

    return NextResponse.json(
      {
        message: `Settlement phase finalized successfully for transition ${transitionId}.`,
        transition: updatedTransition,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error(`[${endpointName}] An unexpected error occurred:`, error);
    const responseTime = Date.now() - startTime;
    logger.error(`[${endpointName}] Request failed in ${responseTime}ms.`);
    return NextResponse.json(
      { error: 'An unexpected error occurred while finalizing settlement.' },
      { status: 500 }
    );
  }
}