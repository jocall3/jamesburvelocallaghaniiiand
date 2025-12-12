import express, { Request, Response, Router } from 'express';
import { PartnerService } from '../services/partner-service';
import { CreatePartnerRequest, UpdatePartnerRequest } from '../types/partner-types';
import { validateCreatePartnerRequest, validateUpdatePartnerRequest } from '../middleware/validation-middleware';
import { authenticate } from '../middleware/auth-middleware';
import { AuthorizationService } from '../services/authorization-service';

const router: Router = express.Router();

export function partnersRoute(partnerService: PartnerService, authorizationService: AuthorizationService): Router {

  /**
   * @openapi
   * /api/v1/partners:
   *   post:
   *     summary: Create a new partner.
   *     description: Creates a new partner integration. Requires authentication and authorization.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePartnerRequest'
   *     responses:
   *       201:
   *         description: Partner created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Partner'
   *       400:
   *         description: Bad Request - Invalid input.
   *       401:
   *         description: Unauthorized - Missing or invalid token.
   *       403:
   *         description: Forbidden - Insufficient permissions.
   *       500:
   *         description: Internal Server Error.
   */
  router.post('/', authenticate, authorizationService.requireRole(['admin', 'partner_manager']), validateCreatePartnerRequest, async (req: Request, res: Response) => {
    try {
      const createPartnerRequest: CreatePartnerRequest = req.body;
      const newPartner = await partnerService.createPartner(createPartnerRequest);
      res.status(201).json(newPartner);
    } catch (error: any) {
      console.error('Error creating partner:', error);
      res.status(500).json({ error: error.message || 'Failed to create partner' });
    }
  });

  /**
   * @openapi
   * /api/v1/partners:
   *   get:
   *     summary: Get all partners.
   *     description: Retrieves a list of all partner integrations. Requires authentication and authorization.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: A list of partners.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Partner'
   *       401:
   *         description: Unauthorized - Missing or invalid token.
   *       403:
   *         description: Forbidden - Insufficient permissions.
   *       500:
   *         description: Internal Server Error.
   */
  router.get('/', authenticate, authorizationService.requireRole(['admin', 'partner_manager', 'partner_viewer']), async (req: Request, res: Response) => {
    try {
      const partners = await partnerService.getAllPartners();
      res.json(partners);
    } catch (error: any) {
      console.error('Error getting partners:', error);
      res.status(500).json({ error: error.message || 'Failed to get partners' });
    }
  });

  /**
   * @openapi
   * /api/v1/partners/{id}:
   *   get:
   *     summary: Get a partner by ID.
   *     description: Retrieves a specific partner integration by its ID. Requires authentication and authorization.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The partner ID.
   *     responses:
   *       200:
   *         description: The partner object.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Partner'
   *       401:
   *         description: Unauthorized - Missing or invalid token.
   *       403:
   *         description: Forbidden - Insufficient permissions.
   *       404:
   *         description: Not Found - Partner not found.
   *       500:
   *         description: Internal Server Error.
   */
  router.get('/:id', authenticate, authorizationService.requireRole(['admin', 'partner_manager', 'partner_viewer']), async (req: Request, res: Response) => {
    try {
      const partnerId: string = req.params.id;
      const partner = await partnerService.getPartnerById(partnerId);

      if (!partner) {
        return res.status(404).json({ message: 'Partner not found' });
      }

      res.json(partner);
    } catch (error: any) {
      console.error('Error getting partner by ID:', error);
      res.status(500).json({ error: error.message || 'Failed to get partner' });
    }
  });

  /**
   * @openapi
   * /api/v1/partners/{id}:
   *   put:
   *     summary: Update a partner.
   *     description: Updates an existing partner integration. Requires authentication and authorization.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The partner ID.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePartnerRequest'
   *     responses:
   *       200:
   *         description: Partner updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Partner'
   *       400:
   *         description: Bad Request - Invalid input.
   *       401:
   *         description: Unauthorized - Missing or invalid token.
   *       403:
   *         description: Forbidden - Insufficient permissions.
   *       404:
   *         description: Not Found - Partner not found.
   *       500:
   *         description: Internal Server Error.
   */
  router.put('/:id', authenticate, authorizationService.requireRole(['admin', 'partner_manager']), validateUpdatePartnerRequest, async (req: Request, res: Response) => {
    try {
      const partnerId: string = req.params.id;
      const updatePartnerRequest: UpdatePartnerRequest = req.body;

      const updatedPartner = await partnerService.updatePartner(partnerId, updatePartnerRequest);

      if (!updatedPartner) {
        return res.status(404).json({ message: 'Partner not found' });
      }

      res.json(updatedPartner);
    } catch (error: any) {
      console.error('Error updating partner:', error);
      res.status(500).json({ error: error.message || 'Failed to update partner' });
    }
  });

  /**
   * @openapi
   * /api/v1/partners/{id}:
   *   delete:
   *     summary: Delete a partner.
   *     description: Deletes a partner integration. Requires authentication and authorization.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The partner ID.
   *     responses:
   *       204:
   *         description: Partner deleted successfully.
   *       401:
   *         description: Unauthorized - Missing or invalid token.
   *       403:
   *         description: Forbidden - Insufficient permissions.
   *       404:
   *         description: Not Found - Partner not found.
   *       500:
   *         description: Internal Server Error.
   */
  router.delete('/:id', authenticate, authorizationService.requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const partnerId: string = req.params.id;
      const deleted = await partnerService.deletePartner(partnerId);

      if (!deleted) {
        return res.status(404).json({ message: 'Partner not found' });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting partner:', error);
      res.status(500).json({ error: error.message || 'Failed to delete partner' });
    }
  });

  return router;
}