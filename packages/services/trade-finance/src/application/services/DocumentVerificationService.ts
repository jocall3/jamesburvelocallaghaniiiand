import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../../infrastructure/services/OpenAIService';
import { DocumentAnalysisResult } from '../dtos/DocumentAnalysisResult';
import { DocumentType } from '../enums/DocumentType';
import { Readable } from 'stream';

@Injectable()
export class DocumentVerificationService {
  constructor(private readonly openAIService: OpenAIService) {}

  async verifyDocument(
    document: Readable,
    documentType: DocumentType,
    filename: string,
  ): Promise<DocumentAnalysisResult> {
    // 1. Extract text from the document (using OCR or other methods)
    const extractedText = await this.extractTextFromDocument(document, filename);

    // 2. Analyze the extracted text using OpenAI
    const analysisResult = await this.analyzeTextWithAI(extractedText, documentType);

    return analysisResult;
  }

  private async extractTextFromDocument(document: Readable, filename: string): Promise<string> {
    // TODO: Implement OCR or other text extraction methods based on file type
    // For now, we'll just return a placeholder
    console.warn(`Text extraction not fully implemented. Returning placeholder for ${filename}`);
    return `Placeholder text from document: ${filename}.  This is a mock extraction.`;
  }

  private async analyzeTextWithAI(text: string, documentType: DocumentType): Promise<DocumentAnalysisResult> {
    const prompt = this.constructPrompt(text, documentType);
    const aiResponse = await this.openAIService.generateText(prompt);

    // Parse the AI response and create a DocumentAnalysisResult
    return this.parseAIResponse(aiResponse, documentType);
  }

  private constructPrompt(text: string, documentType: DocumentType): string {
    let prompt = `Analyze the following ${documentType} document text for authenticity and completeness:\n\n${text}\n\n`;
    prompt += 'Provide a JSON object with the following keys:\n';
    prompt += '- isAuthentic: (boolean) - Is the document likely to be authentic?\n';
    prompt += '- completenessScore: (number, 0-100) - A score indicating the completeness of the document.\n';
    prompt += '- keyFindings: (array of strings) - A list of key findings or potential issues.\n';
    prompt += '- confidenceLevel: (string) - A confidence level (High, Medium, Low) for the analysis.\n';
    prompt += '- summary: (string) - A brief summary of the document and its validity.\n';
    prompt += 'Ensure the JSON is valid and parsable.';

    return prompt;
  }

  private parseAIResponse(aiResponse: string, documentType: DocumentType): DocumentAnalysisResult {
    try {
      const parsedResponse = JSON.parse(aiResponse);

      // Validate the parsed response
      if (
        typeof parsedResponse.isAuthentic !== 'boolean' ||
        typeof parsedResponse.completenessScore !== 'number' ||
        !Array.isArray(parsedResponse.keyFindings) ||
        typeof parsedResponse.confidenceLevel !== 'string' ||
        typeof parsedResponse.summary !== 'string'
      ) {
        console.error('Invalid AI response format:', parsedResponse);
        return {
          isAuthentic: false,
          completenessScore: 0,
          keyFindings: ['Invalid AI response format'],
          confidenceLevel: 'Low',
          summary: 'AI response was in an unexpected format.',
          documentType,
        };
      }

      return {
        isAuthentic: parsedResponse.isAuthentic,
        completenessScore: parsedResponse.completenessScore,
        keyFindings: parsedResponse.keyFindings,
        confidenceLevel: parsedResponse.confidenceLevel,
        summary: parsedResponse.summary,
        documentType,
      };
    } catch (error) {
      console.error('Error parsing AI response:', error, aiResponse);
      return {
        isAuthentic: false,
        completenessScore: 0,
        keyFindings: ['Error parsing AI response'],
        confidenceLevel: 'Low',
        summary: 'Failed to parse AI response.',
        documentType,
      };
    }
  }
}