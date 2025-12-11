import { Router } from 'express';
import { SimulationService } from '../services/SimulationService';

const router = Router();
const simulationService = new SimulationService();

/**
 * @swagger
 * /simulation/start:
 *   post:
 *     summary: Start a new simulation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *                 description: Simulation configuration parameters
 *             required:
 *               - config
 *     responses:
 *       200:
 *         description: Simulation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 simulationId:
 *                   type: string
 *                   description: The ID of the newly started simulation
 *       400:
 *         description: Invalid input
 */
router.post('/start', async (req, res) => {
    try {
        const { config } = req.body;
        if (!config) {
            return res.status(400).json({ error: 'Simulation configuration is required.' });
        }

        const simulationId = await simulationService.startSimulation(config);
        res.status(200).json({ simulationId });
    } catch (error) {
        console.error('Error starting simulation:', error);
        res.status(500).json({ error: 'Failed to start simulation' });
    }
});

/**
 * @swagger
 * /simulation/status/{simulationId}:
 *   get:
 *     summary: Get the status of a simulation
 *     parameters:
 *       - in: path
 *         name: simulationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the simulation
 *     responses:
 *       200:
 *         description: Simulation status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [PENDING, RUNNING, COMPLETED, FAILED]
 *                 progress:
 *                   type: number
 *                   description: Progress percentage (0-100) if available
 *       404:
 *         description: Simulation ID not found
 */
router.get('/status/:simulationId', async (req, res) => {
    const { simulationId } = req.params;
    try {
        const statusData = await simulationService.getSimulationStatus(simulationId);
        if (!statusData) {
            return res.status(404).json({ error: `Simulation with ID ${simulationId} not found.` });
        }
        res.status(200).json(statusData);
    } catch (error) {
        console.error(`Error fetching status for simulation ${simulationId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve simulation status' });
    }
});

/**
 * @swagger
 * /simulation/results/{simulationId}:
 *   get:
 *     summary: Retrieve the results of a completed simulation
 *     parameters:
 *       - in: path
 *         name: simulationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the simulation
 *     responses:
 *       200:
 *         description: Simulation results retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: any
 *                   description: The simulation output data
 *       404:
 *         description: Simulation ID not found
 *       409:
 *         description: Simulation is not yet completed
 */
router.get('/results/:simulationId', async (req, res) => {
    const { simulationId } = req.params;
    try {
        const results = await simulationService.getSimulationResults(simulationId);
        if (results === null) {
            return res.status(404).json({ error: `Simulation with ID ${simulationId} not found.` });
        }
        if (results === undefined) {
            return res.status(409).json({ error: `Simulation ${simulationId} is not yet completed.` });
        }
        res.status(200).json({ results });
    } catch (error) {
        console.error(`Error fetching results for simulation ${simulationId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve simulation results' });
    }
});

/**
 * @swagger
 * /simulation/list:
 *   get:
 *     summary: List all recent simulations
 *     responses:
 *       200:
 *         description: List of simulations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   simulationId:
 *                     type: string
 *                   status:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get('/list', async (req, res) => {
    try {
        const simulations = await simulationService.listSimulations();
        res.status(200).json(simulations);
    } catch (error) {
        console.error('Error listing simulations:', error);
        res.status(500).json({ error: 'Failed to list simulations' });
    }
});

export default router;
