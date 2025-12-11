import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClientOptions } from "@google/generative-ai/dist/types/client-options";

export class GeminiClient {
  private readonly googleGenAI: GoogleGenerativeAI;

  constructor(apiKey: string, options?: ClientOptions) {
    this.googleGenAI = new GoogleGenerativeAI(apiKey, options);
  }

  async generateContent(prompt: string, modelName: string = "gemini-pro"): Promise<string> {
    try {
      const model = this.googleGenAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating content from Gemini:", error);
      throw new Error("Failed to generate content from Gemini API.");
    }
  }

  async generateContentStream(prompt: string, modelName: string = "gemini-pro"): Promise<AsyncIterable<string>> {
    try {
      const model = this.googleGenAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContentStream(prompt);
      const stream = result.stream;
      return (async function* () {
        for await (const chunk of stream) {
          const chunkText = chunk.text();
          yield chunkText;
        }
      })();
    } catch (error) {
      console.error("Error generating content stream from Gemini:", error);
      throw new Error("Failed to generate content stream from Gemini API.");
    }
  }

  async embedContent(content: string, modelName: string = "models/embedding-001"): Promise<number[]> {
    try {
      const model = this.googleGenAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(content);
      return result.embedding.values;
    } catch (error) {
      console.error("Error embedding content with Gemini:", error);
      throw new Error("Failed to embed content with Gemini API.");
    }
  }
}
