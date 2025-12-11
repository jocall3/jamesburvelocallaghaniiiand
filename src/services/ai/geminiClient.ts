import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-pro";

if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

/**
 * A client wrapper for the Google Gemini API, specialized for handling
 * context-aware financial queries.
 */
class GeminiClient {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(API_KEY);
    }

    /**
     * Sends a query to the Gemini API with a provided context string.
     * The context should contain relevant financial data, such as OpenAPI specs
     * or SAML metadata, to inform the model's response.
     *
     * @param {string} context - The financial context (e.g., combined API specs).
     * @param {string} query - The user's question related to the context.
     * @returns {Promise<string>} - The generated response from the Gemini API.
     */
    public async queryWithContext(context: string, query: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: MODEL_NAME });

            const generationConfig = {
                temperature: 0.2,
                topK: 1,
                topP: 1,
                maxOutputTokens: 4096,
            };

            // Basic safety settings to prevent blocking of legitimate financial terms
            const safetySettings = [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ];

            const prompt = this.buildPrompt(context, query);

            const parts = [{ text: prompt }];

            const result = await model.generateContent({
                contents: [{ role: "user", parts }],
                generationConfig,
                safetySettings,
            });

            const response = result.response;

            if (!response || !response.text) {
                console.error("Received an invalid or empty response from Gemini API:", response);
                throw new Error("No valid response received from the AI service.");
            }

            return response.text();

        } catch (error) {
            console.error("Error querying Gemini API:", error);
            if (error instanceof Error) {
                return `An error occurred while communicating with the AI service: ${error.message}`;
            }
            return "An unknown error occurred while communicating with the AI service.";
        }
    }

    /**
     * Constructs the full prompt to be sent to the Gemini API.
     * @param {string} context - The contextual information.
     * @param {string} query - The user's query.
     * @returns {string} The formatted prompt.
     */
    private buildPrompt(context: string, query: string): string {
        return `
You are an expert programmer and a specialist in financial APIs. Your task is to analyze the provided context, which includes SAML metadata and several OpenAPI specifications, to answer the user's question accurately.

**Instructions:**
1. Base your answer STRICTLY on the information found in the provided context documents.
2. Do not invent or infer information that is not explicitly stated in the documents.
3. If the answer cannot be found within the provided context, clearly state that the information is not available in the documents.
4. Be concise, precise, and professional in your response.
5. If the question involves creating a sequence of API calls, list the steps clearly.

---
**CONTEXT:**

${context}

---

**QUESTION:**

${query}

---

**ANSWER:**
`;
    }
}

// Export a singleton instance of the client for use throughout the application.
export const geminiClient = new GeminiClient();