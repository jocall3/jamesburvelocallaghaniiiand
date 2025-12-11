import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as simulationController from '../controllers/simulationController';
import { authMiddleware } from '../middleware/authMiddleware'; // Assuming an auth middleware exists

const router = Router();

// Middleware to protect simulation routes (e.g., only authorized users can trigger simulations)
// router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Simulations
 *   description: Endpoints for triggering macro simulations affecting bond prices
 */

/**
 * @swagger
 * /api/simulations/interest-rate:
 *   post:
 *     summary: Triggers an interest rate change simulation.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               changeBasisPoints:
 *                 type: number
 *                 description: Change in interest rate in basis points (e.g., 25 for +0.25%, -50 for -0.50%).
 *                 example: 25
 *               simulationDate:
 *                 type: string
 *                 format: date
 *                 description: Optional date from which the simulation effect applies (YYYY-MM-DD). Defaults to current date.
 *                 example: "2023-12-31"
 *             required:
 *               - changeBasisPoints
 *     responses:
 *       200:
 *         description: Interest rate simulation initiated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Interest rate simulation triggered."
 *                 simulationId:
 *                   type: string
 *                   example: "sim_ir_12345"
 *       400:
 *         description: Invalid input for simulation.
 *       500:
 *         description: Server error initiating simulation.
 */
router.post('/interest-rate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { changeBasisPoints, simulationDate } = req.body;
        if (typeof changeBasisPoints !== 'number') {
            return res.status(400).json({ message: "Invalid 'changeBasisPoints' provided. Must be a number." });
        }
        const result = await simulationController.triggerInterestRateSimulation(changeBasisPoints, simulationDate);
        res.status(200).json({ message: "Interest rate simulation triggered.", simulationId: result.simulationId });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/simulations/inflation-shock:
 *   post:
 *     summary: Triggers an inflation shock simulation.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inflationChangePercentage:
 *                 type: number
 *                 description: Change in inflation rate as a percentage (e.g., 0.5 for +0.5%).
 *                 example: 0.5
 *               durationMonths:
 *                 type: number
 *                 description: The number of months the inflation shock is expected to last.
 *                 example: 12
 *             required:
 *               - inflationChangePercentage
 *               - durationMonths
 *     responses:
 *       200:
 *         description: Inflation shock simulation initiated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inflation shock simulation triggered."
 *                 simulationId:
 *                   type: string
 *                   example: "sim_inf_67890"
 *       400:
 *         description: Invalid input for simulation.
 *       500:
 *         description: Server error initiating simulation.
 */
router.post('/inflation-shock', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { inflationChangePercentage, durationMonths } = req.body;
        if (typeof inflationChangePercentage !== 'number' || typeof durationMonths !== 'number') {
            return res.status(400).json({ message: "Invalid 'inflationChangePercentage' or 'durationMonths' provided. Both must be numbers." });
        }
        const result = await simulationController.triggerInflationShockSimulation(inflationChangePercentage, durationMonths);
        res.status(200).json({ message: "Inflation shock simulation triggered.", simulationId: result.simulationId });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/simulations/credit-rating:
 *   post:
 *     summary: Triggers a credit rating change simulation for a specific issuer.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               issuerId:
 *                 type: string
 *                 description: The ID of the issuer whose credit rating is changing.
 *                 example: "USA"
 *               newRating:
 *                 type: string
 *                 description: The new credit rating (e.g., "AAA", "AA+", "BB-").
 *                 example: "AA+"
 *               affectAllBonds:
 *                 type: boolean
 *                 description: Whether this rating change affects all bonds of the issuer.
 *                 default: true
 *             required:
 *               - issuerId
 *               - newRating
 *     responses:
 *       200:
 *         description: Credit rating change simulation initiated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Credit rating simulation triggered for issuer USA."
 *                 simulationId:
 *                   type: string
 *                   example: "sim_cr_abcde"
 *       400:
 *         description: Invalid input for simulation.
 *       500:
 *         description: Server error initiating simulation.
 */
router.post('/credit-rating', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { issuerId, newRating, affectAllBonds = true } = req.body;
        if (typeof issuerId !== 'string' || typeof newRating !== 'string') {
            return res.status(400).json({ message: "Invalid 'issuerId' or 'newRating' provided. Both must be strings." });
        }
        const result = await simulationController.triggerCreditRatingSimulation(issuerId, newRating, affectAllBonds);
        res.status(200).json({ message: `Credit rating simulation triggered for issuer ${issuerId}.`, simulationId: result.simulationId });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/simulations/supply-demand:
 *   post:
 *     summary: Triggers a supply/demand shock simulation for specific bond types or markets.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shockType:
 *                 type: string
 *                 description: Type of shock ('supply' or 'demand').
 *                 enum: [supply, demand]
 *                 example: "demand"
 *               magnitudePercentage:
 *                 type: number
 *                 description: Magnitude of the shock as a percentage change (e.g., 5 for +5% demand, -3 for -3% supply).
 *                 example: 5
 *               bondTypeFilter:
 *                 type: string
 *                 description: Optional filter for bond types (e.g., "zero-coupon", "corporate", "government").
 *                 example: "government"
 *             required:
 *               - shockType
 *               - magnitudePercentage
 *     responses:
 *       200:
 *         description: Supply/demand shock simulation initiated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Demand shock simulation triggered."
 *                 simulationId:
 *                   type: string
 *                   example: "sim_sd_fghij"
 *       400:
 *         description: Invalid input for simulation.
 *       500:
 *         description: Server error initiating simulation.
 */
router.post('/supply-demand', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shockType, magnitudePercentage, bondTypeFilter } = req.body;
        if (typeof shockType !== 'string' || !['supply', 'demand'].includes(shockType) || typeof magnitudePercentage !== 'number') {
            return res.status(400).json({ message: "Invalid 'shockType' or 'magnitudePercentage' provided." });
        }
        const result = await simulationController.triggerSupplyDemandSimulation(shockType, magnitudePercentage, bondTypeFilter);
        res.status(200).json({ message: `${shockType} shock simulation triggered.`, simulationId: result.simulationId });
    } catch (error) {
        next(error);
    }
});

export default router;