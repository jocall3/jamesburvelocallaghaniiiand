```typescript
import { ParserOrchestrator } from "../parser/ParserOrchestrator";

export class DocumentIngestionService {
    private parserOrchestrator: ParserOrchestrator;

    constructor(parserOrchestrator: ParserOrchestrator) {
        this.parserOrchestrator = parserOrchestrator;
    }

    async ingestDocument(documentContent: string): Promise<any> {
        try {
            // Basic input validation
            if (!documentContent || documentContent.trim() === "") {
                throw new Error("Document content is empty.");
            }

            // Delegate parsing to the ParserOrchestrator
            const parsedData = await this.parserOrchestrator.parse(documentContent);
            return parsedData;

        } catch (error: any) {
            console.error("Error ingesting document:", error);
            throw new Error(`Document ingestion failed: ${error.message}`);
        }
    }
}
```