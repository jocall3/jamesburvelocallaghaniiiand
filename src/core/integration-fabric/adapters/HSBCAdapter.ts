// src/core/integration-fabric/adapters/HSBCAdapter.ts

import { IIntegrationAdapter } from "../IIntegrationAdapter";
import { FinancialData } from "../../models/FinancialData";

export class HSBCAdapter implements IIntegrationAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async fetchData(): Promise<FinancialData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/data`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HSBC API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.transformData(data);

    } catch (error: any) {
      console.error("Error fetching or transforming HSBC data:", error);
      throw new Error(`Failed to fetch HSBC data: ${error.message}`);
    }
  }


  private transformData(rawData: any): FinancialData[] {
    // Implement data transformation logic here to map HSBC's data structure
    // to the FinancialData model.  Example:

    if (!Array.isArray(rawData?.transactions)) {
        console.warn("HSBC data does not contain transactions in expected format. Returning empty array.");
        return [];
    }


    return rawData.transactions.map((transaction: any) => ({
      accountId: transaction.accountId || 'unknown',
      transactionId: transaction.transactionId || 'unknown',
      amount: parseFloat(transaction.amount) || 0,
      currency: transaction.currency || 'USD',
      transactionDate: new Date(transaction.transactionDate),
      description: transaction.description || 'No description',
      // Add other relevant fields here, mapping them from the raw data
    }));
  }
}