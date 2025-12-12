import { CosmosClient } from "@azure/cosmos";
import { QueueServiceClient } from "@azure/storage-queue";
import { v4 as uuidv4 } from "uuid";

// Interfaces
interface VisualData {
    image: string;
    metadata?: Record<string, any>;
}

interface ExtractionResult {
    id: string;
    timestamp: Date;
    data: Record<string, any>;
}

export class AIVisionService {
    private cosmosClient: CosmosClient;
    private queueServiceClient: QueueServiceClient;
    private cosmosContainerId: string;
    private queueName: string;

    constructor(
        cosmosEndpoint: string,
        cosmosKey: string,
        cosmosDatabaseId: string,
        cosmosContainerId: string,
        queueConnectionString: string,
        queueName: string
    ) {
        this.cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
        this.queueServiceClient = QueueServiceClient.fromConnectionString(queueConnectionString);
        this.cosmosContainerId = cosmosContainerId;
        this.queueName = queueName;
    }

    async processVisualData(data: VisualData): Promise<ExtractionResult> {
        // 1. Send data to queue
        await this.sendToQueue(data);

        // 2. Simulate AI processing (replace with actual AI Vision call)
        const extractedData = await this.simulateAIVision(data);

        // 3. Persist extracted data to Cosmos DB
        const result = await this.persistData(extractedData);

        return result;
    }

    private async sendToQueue(data: VisualData): Promise<void> {
        const queueClient = this.queueServiceClient.getQueueClient(this.queueName);
        await queueClient.createIfNotExists();

        const message = Buffer.from(JSON.stringify(data)).toString('base64');

        await queueClient.sendMessage(message);
        console.log(`Message sent to queue: ${this.queueName}`);
    }


    private async simulateAIVision(data: VisualData): Promise<Record<string, any>> {
        // Simulate AI vision processing to extract structured data
        // Replace this with a real call to Azure AI Vision or similar service
        console.log("Simulating AI Vision processing...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time

        // Dummy extraction logic
        const extractedInfo: Record<string, any> = {
            detectedObjects: ["object1", "object2"],
            confidenceLevels: [0.8, 0.9],
            textInImage: "Sample text in image"
        };

        if (data.metadata && data.metadata.location) {
            extractedInfo.location = data.metadata.location;
        }

        return extractedInfo;
    }

    private async persistData(data: Record<string, any>): Promise<ExtractionResult> {
        const database = this.cosmosClient.database();
        const container = database.container(this.cosmosContainerId);

        const extractionResult: ExtractionResult = {
            id: uuidv4(),
            timestamp: new Date(),
            data: data
        };

        await container.items.create(extractionResult);
        console.log(`Data persisted to Cosmos DB container: ${this.cosmosContainerId}`);

        return extractionResult;
    }
}