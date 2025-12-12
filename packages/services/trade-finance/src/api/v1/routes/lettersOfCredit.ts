import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import {
  createLetterOfCredit,
  getLetterOfCredit,
  updateLetterOfCredit,
  deleteLetterOfCredit,
  listLettersOfCredit,
  simulateLetterOfCreditApproval,
  addLetterOfCreditComment,
  getLetterOfCreditComments,
} from '../controllers/lettersOfCreditController';
import { authenticate } from '../../../middleware/authentication';
import { authorize } from '../../../middleware/authorization';
import { UserRole } from '../../../models/user';

const router = Router();

// Route to create a new letter of credit
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ISSUER]),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      applicant: Joi.string().required(),
      beneficiary: Joi.string().required(),
      amount: Joi.number().required(),
      currency: Joi.string().required(),
      expiryDate: Joi.date().iso().required(),
      termsAndConditions: Joi.string().optional(),
      issuingBank: Joi.string().required(),
      advisingBank: Joi.string().optional(),
      goodsDescription: Joi.string().required(),
      documentsRequired: Joi.array().items(Joi.string()).required(),
      shipmentDetails: Joi.object().keys({
        portOfLoading: Joi.string().required(),
        portOfDischarge: Joi.string().required(),
        latestShipmentDate: Joi.date().iso().required(),
      }).required(),
    }),
  }),
  createLetterOfCredit
);

// Route to get a specific letter of credit by ID
router.get(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ISSUER, UserRole.BENEFICIARY]),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required(),
    }),
  }),
  getLetterOfCredit
);

// Route to update a letter of credit
router.put(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ISSUER]),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required(),
    }),
    [Segments.BODY]: Joi.object().keys({
      applicant: Joi.string().optional(),
      beneficiary: Joi.string().optional(),
      amount: Joi.number().optional(),
      currency: Joi.string().optional(),
      expiryDate: Joi.date().iso().optional(),
      termsAndConditions: Joi.string().optional(),
      issuingBank: Joi.string().optional(),
      advisingBank: Joi.string().optional(),
      goodsDescription: Joi.string().optional(),
      documentsRequired: Joi.array().items(Joi.string()).optional(),
      shipmentDetails: Joi.object().keys({
        portOfLoading: Joi.string().optional(),
        portOfDischarge: Joi.string().optional(),
        latestShipmentDate: Joi.date().iso().optional(),
      }).optional(),
      status: Joi.string().optional(), // e.g., "ISSUED", "AMENDED", "CANCELLED"
    }).min(1), // At least one field must be provided for update
  }),
  updateLetterOfCredit
);

// Route to delete a letter of credit
router.delete(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN]),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required(),
    }),
  }),
  deleteLetterOfCredit
);

// Route to list letters of credit with optional filters and pagination
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ISSUER, UserRole.BENEFICIARY]),
  celebrate({
    [Segments.QUERY]: Joi.object().keys({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      applicant: Joi.string().optional(),
      beneficiary: Joi.string().optional(),
      status: Joi.string().optional(),
      issuingBank: Joi.string().optional(),
    }),
  }),
  listLettersOfCredit
);

// Route to simulate letter of credit approval (for testing/demo purposes)
router.post(
  '/:id/simulate-approval',
  authenticate,
  authorize([UserRole.ADMIN]),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required(),
    }),
  }),
  simulateLetterOfCreditApproval
);

// Route to add a comment to a letter of credit
router.post(
  '/:id/comments',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ISSUER, UserRole.BENEFICIARY]),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required(),
    }),
    [Segments.BODY]: Joi.object().keys({
      text: Joi.string().required(),
    }),
  }),
  addLetterOfCreditComment
);

// Route to get comments for a letter of credit
router.get(
  '/:id/comments',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ISSUER, UserRole.BENEFICIARY]),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required(),
    }),
    [Segments.QUERY]: Joi.object().keys({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  }),
  getLetterOfCreditComments
);

export default router;