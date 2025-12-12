import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * Enum for Account Status
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE'
}

/**
 * Enum for Account Type
 */
export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD'
}

/**
 * Interface representing a single Product from the Citi Products API.
 */
export interface Product {
  /** Long-term persistent identity of the account. Not an account number. */
  accountId: string;
  /** The status of the account. Currently this API returns ACTIVE products only. */
  status: ProductStatus | string;
  /** Citiâs product name. */
  productName: string;
  /** Account Type classification */
  accountType: AccountType | string;
  /** A masked account number that can be displayed to the end customer */
  accountNumberDisplay: string;
}

/**
 * Interface representing the response for the Retrieve Customer Products endpoint.
 */
export interface ProductsResponse {
  /** Unique Id for a customer */
  customerId: string;
  /** List of all products a Citi customer holds */
  products: Product[];
}

/**
 * Interface representing the error response structure from the API.
 */
export interface ApiErrorResponse {
  type?: string;
  code?: string;
  details?: string;
  error_description?: string;
  error?: string;
  location?: string;
  moreInfo?: string;
}

/**
 * Service to interact with the Citi Products API.
 * Corresponds to the Products_Partner_View OpenAPI specification.
 */
export class ProductCatalogService {
  private readonly client: AxiosInstance;

  /**
   * @param baseUrl - The base URL for the product directory API (default: https://localhost/api/productDirectory/v1)
   */
  constructor(baseUrl: string = 'https://localhost/api/productDirectory/v1') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Retrieves all active products held by a Citi customer.
   * 
   * @param accessToken - The OAuth2 access token (Bearer token)
   * @param clientId - The Client ID generated during application registration
   * @returns A promise that resolves to the customer's products list
   * @throws Error if the API request fails or returns an error response
   */
  public async getCustomerProducts(accessToken: string, clientId: string): Promise<ProductsResponse> {
    try {
      const response: AxiosResponse<ProductsResponse> = await this.client.get('/products', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'client_id': clientId,
          'Accept': 'application/json'
        },
      });

      // Handle 204 No Content (Products Not Found) - spec suggests this is a valid state
      if (response.status === 204) {
        return {
          customerId: '',
          products: []
        };
      }

      return response.data;
    } catch (error: any) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Helper to handle API errors consistently.
   */
  private handleApiError(error: any): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data as ApiErrorResponse | undefined;

      let message = 'An unexpected error occurred while retrieving customer products.';

      if (errorData) {
        // Map various error fields defined in the schema (BadResponse, ErrorResponse, etc.)
        message = errorData.details || errorData.error_description || errorData.error || message;
      } else if (error.message) {
        message = error.message;
      }

      console.error(`ProductCatalogService Error [${status}]: ${message}`, {
        type: errorData?.type,
        code: errorData?.code
      });

      throw new Error(message);
    }

    console.error('ProductCatalogService Unexpected Error:', error);
    throw new Error('An internal server error occurred while contacting the product catalog.');
  }
}

// Namespace for Citibankdemobusinessinc
namespace Citibankdemobusinessinc {

  // --- Shared Kernel ---
  class Kernel {
    static generateId(): string {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    static generateRandomNumber(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static generateRandomDate(start: Date, end: Date): Date {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    static encrypt(data: string): string {
      // Simplified encryption (replace with a real algorithm in production)
      return btoa(data);
    }

    static decrypt(encryptedData: string): string {
      // Simplified decryption (replace with a real algorithm in production)
      return atob(encryptedData);
    }
  }

  // --- Utility Functions ---
  class Utils {
    static generateMissionStatement(companyName: string, purpose: string): string {
      return `Our mission at ${companyName} is to ${purpose}.`;
    }

    static generateRandomName(prefix: string): string {
      const adjectives = ['Innovative', 'Reliable', 'Efficient', 'Secure', 'Advanced'];
      const nouns = ['Solution', 'Platform', 'System', 'Service', 'Network'];
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      return `${prefix}${randomAdjective}${randomNoun}`;
    }

    static generatePricingModel(): { type: string; price: number } {
      const types = ['Subscription', 'Pay-per-use', 'Freemium'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomPrice = Kernel.generateRandomNumber(1, 100);
      return { type: randomType, price: randomPrice };
    }
  }

  // --- Data Generators ---
  class DataGenerator {
    static generateCustomerPersona(): { id: string; name: string; age: number; occupation: string } {
      return {
        id: Kernel.generateId(),
        name: Utils.generateRandomName('Customer'),
        age: Kernel.generateRandomNumber(18, 65),
        occupation: 'Engineer'
      };
    }

    static generateFinancialStatement(): { revenue: number; expenses: number; profit: number } {
      const revenue = Kernel.generateRandomNumber(1000000, 10000000);
      const expenses = revenue * (Kernel.generateRandomNumber(50, 90) / 100);
      const profit = revenue - expenses;
      return { revenue, expenses, profit };
    }
  }

  // --- Risk Management ---
  class RiskManager {
    static detectRisk(): { level: string; description: string } {
      const levels = ['Low', 'Medium', 'High'];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      return {
        level: randomLevel,
        description: `Detected a ${randomLevel} level risk related to market volatility.`
      };
    }
  }

  // --- Compliance Automation ---
  class Compliance {
    static generateRegulatoryReport(): { id: string; status: string; details: string } {
      return {
        id: Kernel.generateId(),
        status: 'Pending',
        details: 'Generated report for regulatory compliance.'
      };
    }
  }

  // --- Audit Simulation ---
  class Audit {
    static simulateAudit(): { id: string; result: string; findings: string } {
      return {
        id: Kernel.generateId(),
        result: 'Passed',
        findings: 'No major issues found.'
      };
    }
  }

  // --- Telemetry ---
  class Telemetry {
    static collectData(): { timestamp: Date; event: string; data: any } {
      return {
        timestamp: new Date(),
        event: 'UserAction',
        data: { action: 'ButtonClicked', buttonId: Kernel.generateId() }
      };
    }
  }

  // --- User Interface ---
  class UI {
    static createUserDashboard(data: any): string {
      return `<div><h1>User Dashboard</h1><p>${JSON.stringify(data)}</p></div>`;
    }
  }

  // --- Branch 1: Citibankdemobusinessinc.loan.microloanplatform ---
  export namespace loan {
    export namespace microloanplatform {
      export class MicroLoanPlatformApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc MicroLoanPlatform',
            'provide accessible microloans to underserved communities.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const loanAmount = Kernel.generateRandomNumber(100, 1000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc MicroLoanPlatform</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Loan Amount: ${loanAmount}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ loanAmount, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 2: Citibankdemobusinessinc.invest.roboadvisor ---
  export namespace invest {
    export namespace roboadvisor {
      export class RoboAdvisorApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc RoboAdvisor',
            'provide automated investment advice to maximize returns.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const investmentAmount = Kernel.generateRandomNumber(1000, 10000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc RoboAdvisor</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Investment Amount: ${investmentAmount}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ investmentAmount, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 3: Citibankdemobusinessinc.insure.cybersecurityinsurance ---
  export namespace insure {
    export namespace cybersecurityinsurance {
      export class CybersecurityInsuranceApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc CybersecurityInsurance',
            'provide comprehensive cybersecurity insurance solutions.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const coverageAmount = Kernel.generateRandomNumber(5000, 50000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc CybersecurityInsurance</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Coverage Amount: ${coverageAmount}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ coverageAmount, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 4: Citibankdemobusinessinc.trade.algotradingplatform ---
  export namespace trade {
    export namespace algotradingplatform {
      export class AlgoTradingPlatformApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc AlgoTradingPlatform',
            'provide advanced algorithmic trading solutions for optimal returns.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const tradeVolume = Kernel.generateRandomNumber(10000, 100000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc AlgoTradingPlatform</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Trade Volume: ${tradeVolume}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ tradeVolume, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 5: Citibankdemobusinessinc.plan.retirementplanning ---
  export namespace plan {
    export namespace retirementplanning {
      export class RetirementPlanningApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc RetirementPlanning',
            'provide personalized retirement planning solutions for financial security.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const retirementSavings = Kernel.generateRandomNumber(50000, 500000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc RetirementPlanning</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Retirement Savings: ${retirementSavings}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ retirementSavings, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 6: Citibankdemobusinessinc.pay.internationalpayments ---
  export namespace pay {
    export namespace internationalpayments {
      export class InternationalPaymentsApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc InternationalPayments',
            'provide seamless international payment solutions for global transactions.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const paymentAmount = Kernel.generateRandomNumber(100, 1000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc InternationalPayments</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Payment Amount: ${paymentAmount}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ paymentAmount, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 7: Citibankdemobusinessinc.save.highyieldsavings ---
  export namespace save {
    export namespace highyieldsavings {
      export class HighYieldSavingsApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc HighYieldSavings',
            'provide high-yield savings accounts for maximizing returns.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const savingsBalance = Kernel.generateRandomNumber(1000, 10000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc HighYieldSavings</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Savings Balance: ${savingsBalance}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ savingsBalance, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 8: Citibankdemobusinessinc.protect.identitytheftprotection ---
  export namespace protect {
    export namespace identitytheftprotection {
      export class IdentityTheftProtectionApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc IdentityTheftProtection',
            'provide comprehensive identity theft protection services.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const coverageAmount = Kernel.generateRandomNumber(5000, 50000);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc IdentityTheftProtection</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Coverage Amount: ${coverageAmount}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ coverageAmount, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 9: Citibankdemobusinessinc.reward.cashbackrewards ---
  export namespace reward {
    export namespace cashbackrewards {
      export class CashbackRewardsApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc CashbackRewards',
            'provide generous cashback rewards on everyday purchases.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const cashbackEarned = Kernel.generateRandomNumber(10, 100);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc CashbackRewards</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Cashback Earned: ${cashbackEarned}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ cashbackEarned, risk })}
          `;
        }
      }
    }
  }

  // --- Branch 10: Citibankdemobusinessinc.learn.financialeducation ---
  export namespace learn {
    export namespace financialeducation {
      export class FinancialEducationApp {
        missionStatement: string;

        constructor() {
          this.missionStatement = Utils.generateMissionStatement(
            'Citibankdemobusinessinc FinancialEducation',
            'provide accessible financial education resources for everyone.'
          );
        }

        run(): string {
          const customer = DataGenerator.generateCustomerPersona();
          const coursesCompleted = Kernel.generateRandomNumber(1, 5);
          const risk = RiskManager.detectRisk();
          const report = Compliance.generateRegulatoryReport();
          const audit = Audit.simulateAudit();
          const telemetryData = Telemetry.collectData();

          return `
            <h1>Citibankdemobusinessinc FinancialEducation</h1>
            <p>${this.missionStatement}</p>
            <p>Customer: ${JSON.stringify(customer)}</p>
            <p>Courses Completed: ${coursesCompleted}</p>
            <p>Risk: ${JSON.stringify(risk)}</p>
            <p>Report: ${JSON.stringify(report)}</p>
            <p>Audit: ${JSON.stringify(audit)}</p>
            <p>Telemetry: ${JSON.stringify(telemetryData)}</p>
            ${UI.createUserDashboard({ coursesCompleted, risk })}
          `;
        }
      }
    }
  }

  // --- Master Orchestration Layer ---
  export class OrchestrationLayer {
    static runAllApps(): string {
      const microLoanPlatform = new loan.microloanplatform.MicroLoanPlatformApp();
      const roboAdvisor = new invest.roboadvisor.RoboAdvisorApp();
      const cybersecurityInsurance = new insure.cybersecurityinsurance.CybersecurityInsuranceApp();
      const algoTradingPlatform = new trade.algotradingplatform.AlgoTradingPlatformApp();
      const retirementPlanning = new plan.retirementplanning.RetirementPlanningApp();
      const internationalPayments = new pay.internationalpayments.InternationalPaymentsApp();
      const highYieldSavings = new save.highyieldsavings.HighYieldSavingsApp();
      const identityTheftProtection = new protect.identitytheftprotection.IdentityTheftProtectionApp();
      const cashbackRewards = new reward.cashbackrewards.CashbackRewardsApp();
      const financialEducation = new learn.financialeducation.FinancialEducationApp();

      return `
        <h1>Citibankdemobusinessinc Unified Ecosystem</h1>
        ${microLoanPlatform.run()}
        ${roboAdvisor.run()}
        ${cybersecurityInsurance.run()}
        ${algoTradingPlatform.run()}
        ${retirementPlanning.run()}
        ${internationalPayments.run()}
        ${highYieldSavings.run()}
        ${identityTheftProtection.run()}
        ${cashbackRewards.run()}
        ${financialEducation.run()}
      `;
    }
  }

  // --- Entry Point ---
  console.log(OrchestrationLayer.runAllApps());
}