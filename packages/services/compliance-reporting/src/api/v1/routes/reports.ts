import express, { Request, Response } from 'express';
import { ReportService } from '../services/report-service';
import { ReportGenerationParams } from '../types/report-generation';
import { validateReportGenerationParams } from '../middleware/validation';
import { authMiddleware } from '@core/middleware/auth';
import { Roles } from '@core/enums/roles';
import { AuditService } from '@core/services/audit';
import { AuditAction } from '@core/enums/audit-action';

const router = express.Router();

/**
 * @swagger
 * /api/v1/reports/generate:
 *   post:
 *     summary: Generate a compliance report.
 *     description: Generates a compliance report based on the provided parameters.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date for the report.
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: The end date for the report.
 *               reportType:
 *                 type: string
 *                 description: The type of report to generate.
 *               filters:
 *                 type: object
 *                 description: Optional filters to apply to the report.
 *     responses:
 *       200:
 *         description: Report generated successfully. Returns the report data.
 *       400:
 *         description: Bad request. Invalid parameters provided.
 *       500:
 *         description: Internal server error.
 */
router.post('/generate', authMiddleware([Roles.ADMIN, Roles.AUDITOR, Roles.REPORT_VIEWER]), validateReportGenerationParams, async (req: Request, res: Response) => {
  try {
    const params: ReportGenerationParams = req.body;
    const reportService = new ReportService();
    const reportData = await reportService.generateReport(params);

    await AuditService.audit(
      req.user?.id || 'system',
      AuditAction.GENERATE_REPORT,
      'Compliance Report',
      { reportType: params.reportType, startDate: params.startDate, endDate: params.endDate }
    );

    res.status(200).json(reportData);
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/reports/{reportId}:
 *   get:
 *     summary: Retrieve a compliance report by ID.
 *     description: Retrieves a specific compliance report based on its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         description: The ID of the report to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report retrieved successfully. Returns the report data.
 *       404:
 *         description: Report not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:reportId', authMiddleware([Roles.ADMIN, Roles.AUDITOR, Roles.REPORT_VIEWER]), async (req: Request, res: Response) => {
  try {
    const reportId = req.params.reportId;
    const reportService = new ReportService();
    const reportData = await reportService.getReportById(reportId);

    if (!reportData) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await AuditService.audit(
      req.user?.id || 'system',
      AuditAction.VIEW_REPORT,
      'Compliance Report',
      { reportId }
    );

    res.status(200).json(reportData);
  } catch (error: any) {
    console.error('Error retrieving report:', error);
    res.status(500).json({ error: 'Failed to retrieve report', message: error.message });
  }
});

export default router;