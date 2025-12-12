import { Request, Response } from 'express';
import { FraudAnalysisService } from '../../../services/fraudAnalysisService';
import { AnalysisRequest } from '../../../models/analysisRequest';
import { validateAnalysisRequest } from '../validators/analysisRequestValidator';
import { logger } from '../../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class AnalysisController {
    private fraudAnalysisService: FraudAnalysisService;

    constructor(fraudAnalysisService: FraudAnalysisService) {
        this.fraudAnalysisService = fraudAnalysisService;
    }

    async analyze(req: Request, res: Response): Promise<void> {
        const requestId = uuidv4();
        try {
            logger.info(`[${requestId}] Received analysis request: ${JSON.stringify(req.body)}`);

            const { error, value: analysisRequest } = validateAnalysisRequest(req.body);

            if (error) {
                logger.warn(`[${requestId}] Validation error: ${error.details.map(x => x.message).join(', ')}`);
                res.status(400).json({ errors: error.details.map(x => ({ field: x.context?.key, message: x.message })) });
                return;
            }

            const analysisResult = await this.fraudAnalysisService.analyze(analysisRequest as AnalysisRequest, requestId);

            logger.info(`[${requestId}] Analysis completed successfully. Result: ${JSON.stringify(analysisResult)}`);
            res.status(200).json(analysisResult);

        } catch (error: any) {
            logger.error(`[${requestId}] Analysis failed: ${error.message}`, error);
            res.status(500).json({ error: 'Analysis failed', details: error.message });
        }
    }

    async getAnalysisById(req: Request, res: Response): Promise<void> {
        const analysisId = req.params.id;
        try {
            logger.info(`Attempting to retrieve analysis with ID: ${analysisId}`);
            const analysisResult = await this.fraudAnalysisService.getAnalysisById(analysisId);

            if (!analysisResult) {
                logger.warn(`Analysis with ID ${analysisId} not found.`);
                res.status(404).json({ error: 'Analysis not found' });
                return;
            }

            logger.info(`Analysis with ID ${analysisId} retrieved successfully.`);
            res.status(200).json(analysisResult);
        } catch (error: any) {
            logger.error(`Error retrieving analysis with ID ${analysisId}: ${error.message}`, error);
            res.status(500).json({ error: 'Failed to retrieve analysis', details: error.message });
        }
    }

    // Add more controller methods as needed (e.g., for listing analyses, updating analyses, etc.)
    async listAnalyses(req: Request, res: Response): Promise<void> {
        try {
            const analyses = await this.fraudAnalysisService.listAnalyses();
            res.status(200).json(analyses);
        } catch (error: any) {
            logger.error(`Error listing analyses: ${error.message}`, error);
            res.status(500).json({ error: 'Failed to list analyses', details: error.message });
        }
    }

    async updateAnalysis(req: Request, res: Response): Promise<void> {
        const analysisId = req.params.id;
        try {
            const { error, value: analysisRequest } = validateAnalysisRequest(req.body);

            if (error) {
                logger.warn(`Validation error: ${error.details.map(x => x.message).join(', ')}`);
                res.status(400).json({ errors: error.details.map(x => ({ field: x.context?.key, message: x.message })) });
                return;
            }

            const updatedAnalysis = await this.fraudAnalysisService.updateAnalysis(analysisId, analysisRequest as AnalysisRequest);

            if (!updatedAnalysis) {
                res.status(404).json({ error: 'Analysis not found' });
                return;
            }

            res.status(200).json(updatedAnalysis);

        } catch (error: any) {
            logger.error(`Error updating analysis with ID ${analysisId}: ${error.message}`, error);
            res.status(500).json({ error: 'Failed to update analysis', details: error.message });
        }
    }

    async deleteAnalysis(req: Request, res: Response): Promise<void> {
        const analysisId = req.params.id;
        try {
            const deleted = await this.fraudAnalysisService.deleteAnalysis(analysisId);

            if (!deleted) {
                res.status(404).json({ error: 'Analysis not found' });
                return;
            }

            res.status(204).send(); // No content
        } catch (error: any) {
            logger.error(`Error deleting analysis with ID ${analysisId}: ${error.message}`, error);
            res.status(500).json({ error: 'Failed to delete analysis', details: error.message });
        }
    }
}