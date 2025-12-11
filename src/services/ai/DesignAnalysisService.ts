```typescript
import { FigmaService } from './FigmaService';
import { ConfigurationService } from './ConfigurationService';
import { ApiError } from '../../utils/ApiError';

export class DesignAnalysisService {
    private figmaService: FigmaService;
    private configService: ConfigurationService;
    private readonly AI_ENDPOINT_KEY = 'ai_endpoint';

    constructor(figmaService: FigmaService, configService: ConfigurationService) {
        this.figmaService = figmaService;
        this.configService = configService;
    }

    async analyzeDesign(fileKey: string, nodeIds?: string, analysisType: string = 'structure'): Promise<any> {
        try {
            const aiEndpoint = await this.configService.getConfigValue(this.AI_ENDPOINT_KEY);
            if (!aiEndpoint) {
                throw new ApiError(500, 'AI endpoint not configured.');
            }

            const fileJson = await this.figmaService.getFile(fileKey, nodeIds);

            const requestBody = {
                fileJson: fileJson,
                analysisType: analysisType,
            };

            const response = await fetch(aiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new ApiError(response.status, errorData?.message || `AI analysis failed with status ${response.status}`);
            }

            const analysisResult = await response.json();
            return analysisResult;

        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, `Failed to analyze design: ${error.message}`);
        }
    }
}
```