import { AxiosInstance, AxiosResponse } from 'axios';

export interface LegalDataClientOptions {
  axiosInstance?: AxiosInstance;
}

export class LegalDataClient {
  private readonly axios: AxiosInstance;
  private readonly baseEndpoint: string;

  constructor(options: LegalDataClientOptions) {
    this.axios = options.axiosInstance || axios;
    this.baseEndpoint = '/legal-data'; // Adjust based on actual API endpoint
  }

  /**
   * Retrieves a list of legal documents based on a search query.
   * @param query The search query.
   * @returns A promise that resolves to an array of legal documents.
   */
  async searchDocuments(query: string): Promise<LegalDocument[]> {
    const response = await this.axios.get(`${this.baseEndpoint}/search`, {
      params: { query },
    });
    return response.data as LegalDocument[];
  }

  /**
   * Retrieves a specific legal document by its ID.
   * @param documentId The ID of the legal document.
   * @returns A promise that resolves to the legal document.
   */
  async getDocumentById(documentId: string): Promise<LegalDocument> {
    const response = await this.axios.get(`${this.baseEndpoint}/${documentId}`);
    return response.data as LegalDocument;
  }

  /**
   * Retrieves legal research results based on a query.
   * @param query The research query.
   * @returns A promise that resolves to an array of legal research results.
   */
  async getResearchResults(query: string): Promise<LegalResearchResult[]> {
    const response = await this.axios.get(`${this.baseEndpoint}/research`, {
      params: { query },
    });
    return response.data as LegalResearchResult[];
  }

  /**
   *  Example of a hypothetical method to retrieve case law.
   * @param jurisdiction The jurisdiction for the case law.
   * @returns A promise that resolves to an array of case law results.
   */
  async getCaseLaw(jurisdiction: string): Promise<CaseLawResult[]> {
    const response = await this.axios.get(`${this.baseEndpoint}/caseLaw/${jurisdiction}`);
    return response.data as CaseLawResult[];
  }
}

export interface LegalDocument {
  id: string;
  title: string;
  description: string;
  url: string;
  publicationDate: string;
  source: string;
}

export interface LegalResearchResult {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
}

export interface CaseLawResult {
  caseNumber: string;
  court: string;
  dateDecided: string;
  judgment: string;
  url: string;
}