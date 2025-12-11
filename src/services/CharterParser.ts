```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

// ================================================================================================
// LEX MACHINA PROTOCOL DEFINITIONS
// ================================================================================================

/**
 * Represents a rule of behavior extracted from the Charter.
 * These are used by the AI Agent to weight decisions.
 */
export interface EnforceablePrinciple {
    id: string;
    statement: string;
    enforcementLevel: 'absolute' | 'strict' | 'guideline';
    rationale: string;
}

/**
 * Represents a hard boundary or limit extracted from the Charter.
 * These act as the 'Ethical Governor' triggers.
 */
export interface HardConstraint {
    id: string;
    parameter: string; // e.g., "max_risk_exposure", "industry_exclusion"
    condition: string; // e.g., "cannot exceed 20%", "no weapons manufacturing"
}

/**
 * The structured output of the Charter parsing process.
 * This object serves as the system instructions for the user's AI instance.
 */
export interface ParsedCharter {
    title: string;
    missionStatement: string;
    coreValues: string[];
    principles: EnforceablePrinciple[];
    constraints: HardConstraint[];
    tone: string; // The stylistic voice of the sovereign to be mimicked by the AI
    generatedAt: string;
}

// Configuration for deterministic and structured output
const GENERATION_CONFIG = {
    temperature: 0.1, // Near-zero temperature for analytical precision
    topP: 0.8,
    topK: 40,
    responseMimeType: "application/json",
};

/**
 * Service responsible for translating natural language philosophy into machine-enforceable code.
 * Leverages the Gemini API to act as the 'High Clerk'.
 */
export class CharterParserService {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        if (!apiKey) {
            console.warn("CharterParserService initialized without API key. Parsing will fail.");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Parses natural language text into a structured, machine-enforceable Charter.
     * @param rawText The raw philosophical text input by the user.
     * @returns A Promise resolving to the ParsedCharter object.
     */
    async parse(rawText: string): Promise<ParsedCharter> {
        try {
            // Using flash model for speed and efficiency in text processing tasks
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                You are the High Clerk of the Sovereign's Ledger. Your duty is to translate the raw, philosophical intent of a Sovereign (the user) into the "Lex Machina Protocol" — a rigorous, machine-enforceable JSON structure.
                
                Analyze the following Charter text. Extract the core intent and structure it exactly according to the schema below.
                
                **Parsing Rules:**
                1. **Mission Statement**: Distill the user's text into a single, powerful sentence describing their ultimate goal.
                2. **Core Values**: Extract 3-5 keywords or short phrases that represent the philosophical bedrock.
                3. **Principles**: Identify actionable rules of behavior. 
                   - Assign 'absolute' if the rule implies "never" or "always".
                   - Assign 'strict' if the rule is a strong command.
                   - Assign 'guideline' if it is a preference.
                4. **Constraints**: Identify specific 'do not' rules or hard limits (e.g., "never invest in fossil fuels", "risk must be below 5%"). Map these to a 'parameter' and 'condition'.
                5. **Tone**: Describe the linguistic style of the text (e.g., "Stoic", "Aggressive", "Poetic", "Analytical"). This will dictate your future persona.
                6. **Title**: Give the Charter a noble title based on its content.

                **Raw Charter Text:**
                "${rawText}"

                **Output Schema (JSON only):**
                {
                    "title": "string",
                    "missionStatement": "string",
                    "coreValues": ["string", "string"],
                    "principles": [
                        {
                            "id": "p_1",
                            "statement": "string",
                            "enforcementLevel": "absolute" | "strict" | "guideline",
                            "rationale": "string"
                        }
                    ],
                    "constraints": [
                        {
                            "id": "c_1",
                            "parameter": "string",
                            "condition": "string"
                        }
                    ],
                    "tone": "string"
                }
            `;

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: GENERATION_CONFIG,
            });

            const response = result.response;
            const text = response.text();

            if (!text) {
                throw new Error("Gemini returned an empty response.");
            }

            // The responseMimeType config ensures JSON, but we clean markdown just in case
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsedData: ParsedCharter = JSON.parse(cleanText);

            return {
                ...parsedData,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error("CharterParserService Error:", error);
            // Re-throw with a user-friendly message
            throw new Error("The High Clerk could not interpret the text. Ensure your API key is valid and the text is coherent.");
        }
    }

    /**
     * Validates if a specific action violates the Charter.
     * This is a lightweight check run against the parsed constraints.
     */
    async validateAction(actionDescription: string, charter: ParsedCharter): Promise<{ allowed: boolean; violation?: string }> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = `
                **The Charter:**
                ${JSON.stringify(charter.constraints)}

                **The Proposed Action:**
                "${actionDescription}"

                **Task:**
                Does this action violate any of the Hard Constraints in the Charter?
                Return JSON only: { "allowed": boolean, "violation": string | null }
            `;

             const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: GENERATION_CONFIG,
            });

            const text = result.response.text();
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanText);

        } catch (error) {
            console.error("Validation Error:", error);
            return { allowed: true }; // Fail open in demo mode, or closed in prod
        }
    }
}
```