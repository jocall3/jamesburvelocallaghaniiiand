import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// ----------------------------------------------------------------------------
// Type Definitions based on OpenAPI Specification
// ----------------------------------------------------------------------------

interface AccountsGroupDetailsList {
  accountGroupDetails?: AccountGroupDetails[];
  customer?: any;
}

interface AccountGroupDetails {
  accountGroup: 'CHECKING' | 'SAVINGS' | 'CREDITCARD' | 'LOAN' | 'LINEOFCREDIT' | 'BROKERAGE' | 'RETIREMENT';
  checkingAccountsDetails?: CheckingAccountDetails[];
  savingsAccountsDetails?: SavingsAccountDetails[];
  creditCardAccountsDetails?: any[];
  loanAccountsDetails?: any[];
  lineOfCreditAccountsDetails?: any[];
  brokerageAccountsDetails?: BrokerageAccountDetails[];
  retirementAccountsDetails?: any[];
  totalCurrentBalance?: GroupBalance;
  totalAvailableBalance?: GroupBalance;
}

interface GroupBalance {
  localCurrencyCode?: string;
  localCurrencyBalanceAmount?: number;
}

interface CheckingAccountDetails {
  accountId: string;
  productName: string;
  currencyCode: string;
  currentBalance?: number;
  availableBalance?: number;
}

interface SavingsAccountDetails {
  accountId: string;
  productName: string;
  currencyCode: string;
  currentBalance?: number;
  availableBalance?: number;
}

interface BrokerageAccountDetails {
  accountId: string;
  productName: string;
  accountHoldings?: AccountHolding[];
  totalPortfolioBalanceAmount?: number;
}

interface AccountHolding {
  currencyCode: string;
  holdingCategory?: string;
  assetClass?: string;
  symbol?: string;
  securityName?: string;
  totalValueAmount?: number;
}

interface BalanceTransferEligibilityResponse {
  balanceTransferEligibilityDetails: BalanceTransferEligibilityDetails[];
}

interface BalanceTransferEligibilityDetails {
  accountId: string;
  displayAccountNumber: string;
  maximumEligibleLoanAmount: number;
  btDisbursementOptions: { btDisbursementOption: string }[];
}

interface SimulationConfig {
  baseUrlAccounts: string;
  baseUrlBalanceTransfer: string;
  authToken: string;
  clientId: string;
  inflationThresholdRate: number; // e.g., 0.10 for 10%
}

interface SimulationResult {
  timestamp: string;
  liquidityPosition: number;
  hedgePosition: number;
  protectionScore: number;
  alerts: string[];
  opportunities: string[];
}

// ----------------------------------------------------------------------------
// HyperInflation Scenario Logic
// ----------------------------------------------------------------------------

/**
 * HyperInflationScenario
 * 
 * Purpose:
 * Simulates an environment of rapid currency devaluation to test the system's
 * reporting of asset protection strategies. It analyzes account allocations
 * between fiat currency (cash) and hard assets (equities, commodities), and 
 * checks for eligibility to leverage debt (Balance Transfers) which is 
 * financially advantageous during hyperinflation.
 */
export class HyperInflationScenario {
  private accountsClient: AxiosInstance;
  private btClient: AxiosInstance;
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
    
    // Client for Accounts API
    this.accountsClient = axios.create({
      baseURL: this.config.baseUrlAccounts,
      headers: {
        'Authorization': `Bearer ${this.config.authToken}`,
        'client_id': this.config.clientId,
        'Accept': 'application/json'
      }
    });

    // Client for Balance Transfer API
    this.btClient = axios.create({
      baseURL: this.config.baseUrlBalanceTransfer,
      headers: {
        'Authorization': `Bearer ${this.config.authToken}`,
        'client_id': this.config.clientId,
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Runs the simulation.
   */
  public async execute(): Promise<SimulationResult> {
    const result: SimulationResult = {
      timestamp: new Date().toISOString(),
      liquidityPosition: 0,
      hedgePosition: 0,
      protectionScore: 0,
      alerts: [],
      opportunities: []
    };

    try {
      // 1. Fetch Portfolio Data
      const accounts = await this.getAccountDetails();
      
      // 2. Analyze Exposure
      this.analyzeCurrencyExposure(accounts, result);

      // 3. Analyze Hedges (Brokerage)
      this.analyzeHedgeAssets(accounts, result);

      // 4. Calculate Protection Score
      const totalValue = result.liquidityPosition + result.hedgePosition;
      if (totalValue > 0) {
        // Simple score: % of assets in hedges
        result.protectionScore = (result.hedgePosition / totalValue) * 100;
      }

      // 5. Generate Alerts based on Hyperinflation Logic
      if (result.protectionScore < 30) {
        result.alerts.push('CRITICAL: High exposure to fiat currency during hyperinflation event.');
      } else if (result.protectionScore < 60) {
        result.alerts.push('WARNING: Moderate protection. Consider diversifying into hard assets.');
      } else {
        result.alerts.push('INFO: Portfolio is reasonably hedged against inflation.');
      }

      // 6. Check for Strategic Debt Opportunities (Balance Transfers)
      // In hyperinflation, borrowing at fixed rates to buy assets is a common strategy.
      await this.checkLeverageOpportunities(result);

    } catch (error) {
      result.alerts.push(`ERROR: Simulation failed - ${(error as Error).message}`);
    }

    return result;
  }

  private async getAccountDetails(): Promise<AccountGroupDetails[]> {
    const uuid = uuidv4();
    try {
      const response: AxiosResponse<AccountsGroupDetailsList> = await this.accountsClient.get('/accounts/details', {
        headers: { 'uuid': uuid }
      });
      return response.data.accountGroupDetails || [];
    } catch (error) {
      throw new Error(`Failed to fetch account details: ${(error as any).response?.statusText || (error as Error).message}`);
    }
  }

  private analyzeCurrencyExposure(groups: AccountGroupDetails[], result: SimulationResult): void {
    for (const group of groups) {
      // Checking and Savings are pure fiat exposure
      if (group.checkingAccountsDetails) {
        for (const acc of group.checkingAccountsDetails) {
          result.liquidityPosition += acc.availableBalance || 0;
        }
      }
      if (group.savingsAccountsDetails) {
        for (const acc of group.savingsAccountsDetails) {
          result.liquidityPosition += acc.availableBalance || 0;
        }
      }
    }
  }

  private analyzeHedgeAssets(groups: AccountGroupDetails[], result: SimulationResult): void {
    for (const group of groups) {
      if (group.brokerageAccountsDetails) {
        for (const brokerAcc of group.brokerageAccountsDetails) {
          if (brokerAcc.accountHoldings) {
            for (const holding of brokerAcc.accountHoldings) {
              if (this.isInflationResistant(holding)) {
                result.hedgePosition += holding.totalValueAmount || 0;
              } else {
                // Treat non-hedged brokerage cash/bonds as liquidity/fiat exposure depending on strictness
                // Here we treat everything else as 'liquidity' risk for simplicity
                result.liquidityPosition += holding.totalValueAmount || 0;
              }
            }
          }
        }
      }
    }
  }

  private isInflationResistant(holding: AccountHolding): boolean {
    const resistantClasses = ['EQUITY', 'COMMODITIES', 'REAL_ESTATE', 'PRECIOUS_METALS'];
    const resistantCategories = ['Equities', 'Mutual Funds', 'Gold', 'Silver', 'Crypto'];
    
    // Check Asset Class
    if (holding.assetClass && resistantClasses.includes(holding.assetClass.toUpperCase())) {
      return true;
    }
    
    // Check Holding Category
    if (holding.holdingCategory && resistantCategories.some(c => holding.holdingCategory!.includes(c))) {
      return true;
    }

    // Check Security Name for keywords
    const name = (holding.securityName || '').toUpperCase();
    if (name.includes('GOLD') || name.includes('SILVER') || name.includes('OIL') || name.includes('REIT')) {
      return true;
    }

    return false;
  }

  private async checkLeverageOpportunities(result: SimulationResult): Promise<void> {
    const uuid = uuidv4();
    try {
      // Note: Endpoint derived from spec: /accounts/loans/balanceTransfers
      // Spec defines paths relative to server URL.
      const response: AxiosResponse<BalanceTransferEligibilityResponse> = await this.btClient.get('/', {
        headers: { 
          'uuid': uuid,
          'clientDetails': 'Simulation-Bot-v1' // Mock client details
        },
        params: {
          btSupportedAccountGroup: 'CREDITCARD' // Assumption based on common banking logic
        }
      });

      if (response.status === 200 && response.data.balanceTransferEligibilityDetails) {
        for (const offer of response.data.balanceTransferEligibilityDetails) {
          if (offer.maximumEligibleLoanAmount > 1000) {
            result.opportunities.push(
              `LEVERAGE: Account ${offer.displayAccountNumber} eligible for Balance Transfer loan up to ${offer.maximumEligibleLoanAmount}. ` +
              `Strategy: Secure fixed-rate debt to acquire inflation-resistant assets.`
            );
          }
        }
      }
    } catch (error) {
      // 422 or 404 means not eligible or business validation failed, which is a valid simulation result
      const status = (error as any).response?.status;
      if (status !== 404 && status !== 422) {
        result.alerts.push(`WARNING: Unable to verify leverage opportunities (API Error ${status}).`);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Execution Entry Point (if run directly)
// ----------------------------------------------------------------------------
if (require.main === module) {
  const config: SimulationConfig = {
    baseUrlAccounts: 'https://localhost/api/accounts/account-transactions/partner/v1',
    baseUrlBalanceTransfer: 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers',
    authToken: process.env.SIMULATION_AUTH_TOKEN || 'mock-token',
    clientId: process.env.SIMULATION_CLIENT_ID || 'mock-client-id',
    inflationThresholdRate: 0.15
  };

  const sim = new HyperInflationScenario(config);
  sim.execute().then(res => console.log(JSON.stringify(res, null, 2)));
}