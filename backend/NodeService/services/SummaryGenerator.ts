import { SummarizeClient } from "@azure/ai-text-analytics";
import { AzureKeyCredential } from "@azure/core-auth";

export class SummaryGenerator {
  private apiKey: string;
  private endpoint: string;
  private summarizeClient: SummarizeClient;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.summarizeClient = new SummarizeClient(endpoint, new AzureKeyCredential(apiKey));
  }

  async generateSummary(text: string, sentenceCount: number = 3): Promise<string | null> {
    try {
      const actions = [{ kind: "AbstractiveSummarize", sentenceCount: sentenceCount }];
      const poller = await this.summarizeClient.beginAnalyzeActions([text], actions, "en", {
        includeInputText: false
      });

      await poller.pollUntilDone();

      const documents = poller.getResult();

      if (!documents || documents.length === 0) {
        console.warn("No documents were analyzed.");
        return null;
      }

      const documentResults = documents[0];

      if (documentResults.kind === "AnalyzeDocumentActionResult" && documentResults.results && documentResults.results.length > 0) {
        const summarizeResults = documentResults.results[0];
        if (summarizeResults.kind === "AbstractiveSummarizeResult" && !summarizeResults.error) {
          return summarizeResults.summaries[0]?.text || null;
        } else if (summarizeResults.error) {
          console.error("Summarization error:", summarizeResults.error);
          return null;
        }
      } else if (documentResults.error) {
        console.error("Document analysis error:", documentResults.error);
        return null;
      }

      return null;

    } catch (error) {
      console.error("Error during summarization:", error);
      return null;
    }
  }

  // Optional: Method to estimate the token count (crude approximation)
  estimateTokenCount(text: string): number {
    // Very basic token estimation: split by spaces and assume an average token length
    return text.split(/\s+/).length;
  }

  //Optional: Method to truncate a text to fit within a certain token limit (before summarizing)
  truncateText(text: string, maxTokens: number): string {
    const words = text.split(/\s+/);
    if (words.length <= maxTokens) {
      return text;
    }
    return words.slice(0, maxTokens).join(" ") + "...";
  }
}