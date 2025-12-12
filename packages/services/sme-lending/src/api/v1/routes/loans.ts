import express, { Request, Response, NextFunction } from 'express';
import { LoanApplicationService } from '../services/loanApplicationService';
import { Loan } from '../models/Loan';
import { CreateLoanApplicationRequest, UpdateLoanApplicationRequest } from '../types/loanApplicationTypes';
import { validateCreateLoanApplicationRequest, validateUpdateLoanApplicationRequest } from '../middleware/validationMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { Role } from '../models/Role';
import { AuthorizationError, NotFoundError } from '../../../errors/customErrors';
import { UserService } from '../services/userService'; // Import UserService
import { User } from '../models/User';

const router = express.Router();

const loanApplicationService = new LoanApplicationService();
const userService = new UserService(); // Instantiate UserService

// Middleware to check if the user has a specific role
const roleCheckMiddleware = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as User; // Assuming req.user is populated by authMiddleware

        if (!user) {
            return next(new AuthorizationError('User not authenticated.'));
        }

        if (!roles.includes(user.role)) {
            return next(new AuthorizationError('Unauthorized access.'));
        }

        next();
    };
};


/**
 * @swagger
 * /api/v1/loans:
 *   post:
 *     summary: Create a new loan application
 *     description: Creates a new loan application. Requires authentication.
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLoanApplicationRequest'
 *     responses:
 *       201:
 *         description: Loan application created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware, validateCreateLoanApplicationRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const createLoanApplicationRequest: CreateLoanApplicationRequest = req.body;
        const userId = (req.user as User).id; // Assuming req.user is populated by authMiddleware
        const newLoan = await loanApplicationService.createLoanApplication(createLoanApplicationRequest, userId);
        res.status(201).json(newLoan);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/loans:
 *   get:
 *     summary: Get all loan applications
 *     description: Retrieves all loan applications. Requires authentication and Admin role.
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of loan applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Loan'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware, roleCheckMiddleware([Role.Admin]), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loans = await loanApplicationService.getAllLoanApplications();
        res.json(loans);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   get:
 *     summary: Get a loan application by ID
 *     description: Retrieves a loan application by its ID. Requires authentication.
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the loan application to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The loan application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Loan'
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Loan application not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loanId = req.params.id;
        const userId = (req.user as User).id;
        const loan = await loanApplicationService.getLoanApplicationById(loanId, userId);
        if (!loan) {
            return next(new NotFoundError('Loan application not found'));
        }
        res.json(loan);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   put:
 *     summary: Update a loan application
 *     description: Updates an existing loan application. Requires authentication.
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the loan application to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLoanApplicationRequest'
 *     responses:
 *       200:
 *         description: Loan application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Loan application not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware, validateUpdateLoanApplicationRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loanId = req.params.id;
        const userId = (req.user as User).id;
        const updateLoanApplicationRequest: UpdateLoanApplicationRequest = req.body;
        const updatedLoan = await loanApplicationService.updateLoanApplication(loanId, userId, updateLoanApplicationRequest);
        if (!updatedLoan) {
            return next(new NotFoundError('Loan application not found'));
        }
        res.json(updatedLoan);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   delete:
 *     summary: Delete a loan application
 *     description: Deletes a loan application by its ID. Requires authentication and Admin role.
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the loan application to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Loan application deleted successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Loan application not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, roleCheckMiddleware([Role.Admin]), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loanId = req.params.id;
        const deleted = await loanApplicationService.deleteLoanApplication(loanId);
        if (!deleted) {
            return next(new NotFoundError('Loan application not found'));
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/loans/user/{userId}:
 *   get:
 *     summary: Get all loan applications for a specific user
 *     description: Retrieves all loan applications associated with a given user ID. Requires authentication and Admin role.
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to retrieve loan applications for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of loan applications for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Loan'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', authMiddleware, roleCheckMiddleware([Role.Admin]), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;

        // Check if the user exists
        const userExists = await userService.getUserById(userId);
        if (!userExists) {
            return next(new NotFoundError('User not found'));
        }

        const loans = await loanApplicationService.getLoanApplicationsByUserId(userId);
        res.json(loans);
    } catch (error) {
        next(error);
    }
});

export default router;