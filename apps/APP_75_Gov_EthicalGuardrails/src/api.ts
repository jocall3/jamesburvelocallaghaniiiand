/**
 * @file apps/APP_75_Gov_EthicalGuardrails/src/api.ts
 * @license Apache-2.0
 * @copyright 2024.
 *
 * @description
 * This file defines the RESTful API endpoints for the Ethical Guardrails service.
 * It handles routing for policy management, content evaluation, audit logging,
 * and system introspection. The API is designed to be the primary interface
 * for integrating ethical AI checks into other applications within the ecosystem.
 *
 * The core architectural tension of this service is Speed vs. Safety. This is
 * exposed through evaluation modes (e.g., 'realtime' vs. 'comprehensive')
 * which allow consumers to make explicit trade-offs based on their use case.
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
    policyController,
    evaluationController,
    auditController,
    evaluatorController,
    systemController,
} from './controllers';
import {
    authMiddleware,
    rateLimiter,
    jurisdictionCheck,
    handleError,
    logger,
    // Assuming these types are defined in the shared SDK or local types file
    // For example: import { Policy, EvaluationRequest, AuditLog } from './types';
} from '@ecosystem/core-sdk';

const router: Router = express.Router();

// Apply common middleware to all routes in this router
router.use(express.json({ limit: '10mb' })); // Support larger payloads for multimodal content
router.use(authMiddleware); // Enforce authentication for all endpoints
router.use(rateLimiter); // Apply rate limiting to prevent abuse

// Custom middleware to handle validation errors
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- Policy Management Endpoints ---
// Manages the lifecycle of ethical policies.
router.post(
    '/policies',
    [
        body('name').isString().notEmpty().withMessage('Policy name is required.'),
        body('description').isString().notEmpty(),
        body('category').isIn(['FAIRNESS', 'BIAS', 'TOXICITY', 'PRIVACY', 'SAFETY', 'CUSTOM']),
        body('rules').isArray({ min: 1 }).withMessage('At least one rule is required.'),
        body('rules.*.evaluatorId').isUUID().withMessage('Each rule must have a valid evaluator ID.'),
        body('rules.*.threshold').isFloat({ min: 0, max: 1 }).withMessage('Threshold must be between 0 and 1.'),
        body('rules.*.parameters').isObject().optional(),
        body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        body('jurisdictions').isArray().optional().withMessage('Jurisdictions must be an array of strings.'),
        body('status').isIn(['ACTIVE', 'INACTIVE', 'DRAFT']).withMessage('Invalid status.'),
    ],
    validateRequest,
    jurisdictionCheck('policy'), // Feature flag check for policy management by region
    policyController.createPolicy
);

router.get(
    '/policies',
    [
        query('page').isInt({ min: 1 }).optional().toInt(),
        query('limit').isInt({ min: 1, max: 100 }).optional().toInt(),
        query('status').isIn(['ACTIVE', 'INACTIVE', 'DRAFT']).optional(),
        query('category').isIn(['FAIRNESS', 'BIAS', 'TOXICITY', 'PRIVACY', 'SAFETY', 'CUSTOM']).optional(),
    ],
    validateRequest,
    policyController.listPolicies
);

router.get(
    '/policies/:policyId',
    [param('policyId').isUUID()],
    validateRequest,
    policyController.getPolicyById
);

router.put(
    '/policies/:policyId',
    [
        param('policyId').isUUID(),
        body('name').isString().optional(),
        body('description').isString().optional(),
        body('rules').isArray().optional(),
        body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        body('status').isIn(['ACTIVE', 'INACTIVE', 'DRAFT']).optional(),
        body('jurisdictions').isArray().optional(),
    ],
    validateRequest,
    jurisdictionCheck('policy'),
    policyController.updatePolicy
);

router.delete(
    '/policies/:policyId',
    [param('policyId').isUUID()],
    validateRequest,
    jurisdictionCheck('policy'),
    policyController.deletePolicy
);


// --- Content Evaluation Endpoints ---
// The core functionality for screening content against policies.
router.post(
    '/evaluate',
    [
        body('content').isObject().notEmpty().withMessage('Content payload is required.'),
        body('content.type').isIn(['TEXT', 'IMAGE_URL', 'AUDIO_URL', 'JSON_DATA']).withMessage('Invalid content type.'),
        body('content.data').isString().notEmpty().withMessage('Content data cannot be empty.'),
        body('policyIds').isArray({ min: 1 }).withMessage('At least one policy ID is required.'),
        body('policyIds.*').isUUID(),
        body('mode').isIn(['REALTIME', 'COMPREHENSIVE']).default('REALTIME').withMessage('Invalid evaluation mode.'),
        body('context').isObject().optional(),
        body('context.userId').isString().optional(),
        body('context.sessionId').isString().optional(),
        body('isAsync').isBoolean().default(false),
    ],
    validateRequest,
    evaluationController.evaluateContent
);

router.get(
    '/evaluate/results/:jobId',
    [param('jobId').isUUID()],
    validateRequest,
    evaluationController.getEvaluationResult
);


// --- Audit & Reporting Endpoints ---
// Provides access to the immutable log of all evaluations.
router.get(
    '/audits',
    [
        query('page').isInt({ min: 1 }).optional().toInt(),
        query('limit').isInt({ min: 1, max: 100 }).optional().toInt(),
        query('policyId').isUUID().optional(),
        query('verdict').isIn(['PASS', 'FAIL', 'REVIEW']).optional(),
        query('startDate').isISO8601().optional(),
        query('endDate').isISO8601().optional(),
    ],
    validateRequest,
    auditController.getAuditLogs
);

router.get(
    '/audits/:eventId',
    [param('eventId').isUUID()],
    validateRequest,
    auditController.getAuditLogById
);

router.get(
    '/reports/summary',
    [
        query('period').isIn(['24h', '7d', '30d']).default('7d'),
        query('groupBy').isIn(['policy', 'category', 'verdict']).default('policy'),
    ],
    validateRequest,
    auditController.getReportSummary
);


// --- Evaluator Configuration Endpoints ---
// Manages the underlying AI models/services used for evaluation.
router.get(
    '/evaluators',
    evaluatorController.listAvailableEvaluators
);

router.get(
    '/evaluators/:evaluatorId',
    [param('evaluatorId').isUUID()],
    validateRequest,
    evaluatorController.getEvaluatorDetails
);

// Note: Adding/updating evaluators might be a more restricted operation,
// potentially requiring higher privileges handled within the controller.
router.post(
    '/evaluators/register',
    [
        body('name').isString().notEmpty(),
        body('provider').isIn(['OpenAI', 'Google', 'Anthropic', 'HuggingFace', 'Custom']),
        body('adapterType').isString().notEmpty(),
        body('capabilities').isArray({ min: 1 }),
        body('configSchema').isObject(),
    ],
    validateRequest,
    // This would require a special permission, e.g., 'system_admin'
    // authMiddleware.requirePermission('manage_evaluators'),
    evaluatorController.registerEvaluator
);


// --- System Introspection & Self-Querying Endpoints ---
// Mandatory endpoints for ecosystem self-awareness.
router.get('/introspect', systemController.getIntrospection);
router.get('/assumptions', systemController.getAssumptions);
router.get('/failure-modes', systemController.getFailureModes);
router.get('/update-triggers', systemController.getUpdateTriggers);


// --- Global Error Handler for this Router ---
// Catches any unhandled errors from the controllers.
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        message: `API Error: ${err.message}`,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    handleError(err, res);
});

export default router;