import express, { Request, Response } from 'express';
import { ConnectionService } from '../services/connection.service';
import { IConnection } from '../models/connection.model';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateCreateConnection, validateUpdateConnection } from '../middleware/validation.middleware';
import { InstitutionService } from '../services/institution.service'; // Import InstitutionService
import { IInstitution } from '../models/institution.model'; // Import Institution model

const router = express.Router();
const connectionService = new ConnectionService();
const institutionService = new InstitutionService(); // Instantiate InstitutionService

/**
 * @swagger
 * /api/v1/connections:
 *   post:
 *     summary: Create a new connection
 *     description: Creates a new connection to a financial institution.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user.
 *               institutionId:
 *                 type: string
 *                 description: The ID of the financial institution.
 *               accessToken:
 *                 type: string
 *                 description: The access token for the connection.
 *               name:
 *                 type: string
 *                 description: A descriptive name for the connection.
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending, error]
 *                 description: The status of the connection.
 *     responses:
 *       201:
 *         description: Connection created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Connection'
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Internal server error.
 */
router.post('/', authMiddleware, validateCreateConnection, async (req: Request, res: Response) => {
    try {
        const connectionData: IConnection = req.body;
        const newConnection = await connectionService.createConnection(connectionData);
        res.status(201).json(newConnection);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/connections:
 *   get:
 *     summary: Get all connections
 *     description: Retrieves all connections.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of connections.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Connection'
 *       500:
 *         description: Internal server error.
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const connections = await connectionService.getAllConnections();
        res.status(200).json(connections);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/connections/{id}:
 *   get:
 *     summary: Get a connection by ID
 *     description: Retrieves a connection by its ID.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the connection to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The connection object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Connection'
 *       404:
 *         description: Connection not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const connection = await connectionService.getConnectionById(id);
        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }
        res.status(200).json(connection);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/connections/{id}:
 *   put:
 *     summary: Update a connection
 *     description: Updates an existing connection.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the connection to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user.
 *               institutionId:
 *                 type: string
 *                 description: The ID of the financial institution.
 *               accessToken:
 *                 type: string
 *                 description: The access token for the connection.
 *               name:
 *                 type: string
 *                 description: A descriptive name for the connection.
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending, error]
 *                 description: The status of the connection.
 *     responses:
 *       200:
 *         description: Connection updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Connection'
 *       404:
 *         description: Connection not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/:id', authMiddleware, validateUpdateConnection, async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const connectionData: IConnection = req.body;
        const updatedConnection = await connectionService.updateConnection(id, connectionData);
        if (!updatedConnection) {
            return res.status(404).json({ message: 'Connection not found' });
        }
        res.status(200).json(updatedConnection);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/connections/{id}:
 *   delete:
 *     summary: Delete a connection
 *     description: Deletes a connection by its ID.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the connection to delete.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Connection deleted successfully.
 *       404:
 *         description: Connection not found.
 *       500:
 *         description: Internal server error.
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const deleted = await connectionService.deleteConnection(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Connection not found' });
        }
        res.status(204).send();
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/connections/user/{userId}:
 *   get:
 *     summary: Get connections by User ID
 *     description: Retrieves all connections associated with a specific user ID.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user to retrieve connections for.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of connections for the specified user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Connection'
 *       404:
 *         description: No connections found for the user.
 *       500:
 *         description: Internal server error.
 */
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const connections = await connectionService.getConnectionsByUserId(userId);
        if (!connections || connections.length === 0) {
            return res.status(404).json({ message: 'No connections found for this user' });
        }
        res.status(200).json(connections);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/connections/{connectionId}/institution:
 *   get:
 *     summary: Get the institution associated with a connection
 *     description: Retrieves the institution details associated with a specific connection ID.
 *     tags: [Connections, Institutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         description: The ID of the connection.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The institution associated with the connection.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 *       404:
 *         description: Connection or Institution not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:connectionId/institution', authMiddleware, async (req: Request, res: Response) => {
    try {
        const connectionId = req.params.connectionId;
        const connection = await connectionService.getConnectionById(connectionId);

        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }

        const institutionId = connection.institutionId;
        const institution: IInstitution | null = await institutionService.getInstitutionById(institutionId);

        if (!institution) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        res.status(200).json(institution);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

export default router;