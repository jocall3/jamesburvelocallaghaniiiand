import React, { useState, useEffect } from 'react';
import { FiLightbulb, FiZap, FiAlertTriangle, FiInfo, FiLoader } from 'react-icons/fi';

// Unified Configuration Layer
const CitibankdemobusinessincConfig = {
  brandName: "Citibank demo business inc",
  primaryColor: "#007bff",
  secondaryColor: "#6c757d",
  apiBaseUrl: generateApiUrl(),
  telemetryEnabled: true,
  encryptionKey: generateEncryptionKey(),
};

// Shared Identity Layer
interface UserIdentity {
  userId: string;
  userName: string;
  roles: string[];
  permissions: string[];
}

function generateUserIdentity(): UserIdentity {
  const userId = generateUniqueId();
  return {
    userId: userId,
    userName: `user_${userId}`,
    roles: ['user'],
    permissions: ['read', 'write'],
  };
}

// Internal Event Bus
interface Event {
  type: string;
  payload: any;
  timestamp: string;
}

const eventBus: {
  listeners: { [key: string]: ((event: Event) => void)[] };
  subscribe: (type: string, callback: (event: Event) => void) => void;
  publish: (event: Event) => void;
} = {
  listeners: {},
  subscribe: function (type: string, callback: (event: Event) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  },
  publish: function (event: Event) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(listener => listener(event));
    }
  }
};

// Common Security Primitives
function encryptData(data: string, key: string): string {
  // Simplified encryption (replace with a proper algorithm)
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) + (key.charCodeAt(i % key.length) % 26));
  }
  return btoa(encrypted); // Base64 encode
}

function decryptData(encryptedData: string, key: string): string {
  const decoded = atob(encryptedData); // Base64 decode
  let decrypted = '';
  for (let i = 0; i < decoded.length; i++) {
    decrypted += String.fromCharCode(decoded.charCodeAt(i) - (key.charCodeAt(i % key.length) % 26));
  }
  return decrypted;
}

// Internal Messaging Queue
interface Message {
  id: string;
  body: any;
  timestamp: string;
}

const messageQueue: Message[] = [];

function enqueueMessage(body: any): string {
  const messageId = generateUniqueId();
  const message: Message = {
    id: messageId,
    body: body,
    timestamp: new Date().toISOString(),
  };
  messageQueue.push(message);
  return messageId;
}

function dequeueMessage(): Message | undefined {
  return messageQueue.shift();
}

// Schema Auto-Generation
function generateSchema(data: any): string {
  // Simplified schema generation (improve for complex types)
  let schema = '{\n';
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const type = typeof data[key];
      schema += `  ${key}: ${type},\n`;
    }
  }
  schema += '}';
  return schema;
}

// Deterministic Build-Generation
function generateBuildVersion(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day}.${hour}${minute}`;
}

// Utility Functions
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function generateRandomBoolean(): boolean {
  return Math.random() < 0.5;
}

function generateRandomString(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateApiUrl(): string {
  return `https://${generateRandomString(10)}.example.com/api`;
}

function generateEncryptionKey(): string {
  return generateRandomString(32);
}

// ====================================================================================================================
// Business Models
// ====================================================================================================================

// 1. Citibankdemobusinessinc.openaccess.identityvault
namespace Citibankdemobusinessinc {
  export namespace openaccess {
    export namespace identityvault {
      // Mission: To provide a secure, decentralized identity management platform leveraging blockchain technology.
      // Monetization: Subscription fees for identity verification and management services.
      // IP Moat: Proprietary blockchain consensus algorithm and identity verification process.

      interface IdentityRecord {
        id: string;
        name: string;
        dob: string;
        address: string;
        verified: boolean;
      }

      function createIdentityRecord(name: string, dob: string, address: string): IdentityRecord {
        return {
          id: generateUniqueId(),
          name: name,
          dob: dob,
          address: address,
          verified: false,
        };
      }

      function verifyIdentity(record: IdentityRecord): IdentityRecord {
        record.verified = true;
        return record;
      }

      // Self-Hosted App
      export function runIdentityVaultApp(): void {
        console.log("Running Identity Vault App");
        const record = createIdentityRecord("John Doe", "1990-01-01", "123 Main St");
        console.log("Created Identity Record:", record);
        const verifiedRecord = verifyIdentity(record);
        console.log("Verified Identity Record:", verifiedRecord);
      }
    }
  }
}

// 2. Citibankdemobusinessinc.insights.creditadvisor
namespace Citibankdemobusinessinc {
  export namespace insights {
    export namespace creditadvisor {
      // Mission: To provide personalized credit advice and monitoring services to improve financial health.
      // Monetization: Premium subscription for advanced credit monitoring and personalized advice.
      // IP Moat: Proprietary credit scoring algorithm and personalized recommendation engine.

      interface CreditReport {
        score: number;
        accounts: { [key: string]: number };
        history: string[];
      }

      function generateCreditReport(): CreditReport {
        return {
          score: generateRandomNumber(300, 850),
          accounts: {
            'creditCard1': generateRandomNumber(0, 10000),
            'loan1': generateRandomNumber(0, 50000),
          },
          history: [generateRandomString(50), generateRandomString(50)],
        };
      }

      function analyzeCreditReport(report: CreditReport): string {
        if (report.score > 700) {
          return "Excellent credit score";
        } else {
          return "Needs improvement";
        }
      }

      // Self-Hosted App
      export function runCreditAdvisorApp(): void {
        console.log("Running Credit Advisor App");
        const report = generateCreditReport();
        console.log("Generated Credit Report:", report);
        const analysis = analyzeCreditReport(report);
        console.log("Credit Report Analysis:", analysis);
      }
    }
  }
}

// 3. Citibankdemobusinessinc.payments.smartrouting
namespace Citibankdemobusinessinc {
  export namespace payments {
    export namespace smartrouting {
      // Mission: To optimize payment routing for businesses, reducing transaction costs and improving efficiency.
      // Monetization: Transaction fees based on savings achieved through optimized routing.
      // IP Moat: Proprietary payment routing algorithm and integration with multiple payment gateways.

      interface PaymentTransaction {
        amount: number;
        currency: string;
        destination: string;
      }

      function createPaymentTransaction(amount: number, currency: string, destination: string): PaymentTransaction {
        return {
          amount: amount,
          currency: currency,
          destination: destination,
        };
      }

      function routePayment(transaction: PaymentTransaction): string {
        // Simplified routing logic
        return `Routed payment of ${transaction.amount} ${transaction.currency} to ${transaction.destination}`;
      }

      // Self-Hosted App
      export function runSmartRoutingApp(): void {
        console.log("Running Smart Routing App");
        const transaction = createPaymentTransaction(100, "USD", "Bank ABC");
        console.log("Created Payment Transaction:", transaction);
        const routingResult = routePayment(transaction);
        console.log("Payment Routing Result:", routingResult);
      }
    }
  }
}

// 4. Citibankdemobusinessinc.lending.dynamicpricing
namespace Citibankdemobusinessinc {
  export namespace lending {
    export namespace dynamicpricing {
      // Mission: To offer dynamic loan pricing based on real-time risk assessment and market conditions.
      // Monetization: Interest rate spread based on dynamic pricing model.
      // IP Moat: Proprietary risk assessment algorithm and dynamic pricing engine.

      interface LoanApplication {
        amount: number;
        term: number;
        creditScore: number;
      }

      function createLoanApplication(amount: number, term: number, creditScore: number): LoanApplication {
        return {
          amount: amount,
          term: term,
          creditScore: creditScore,
        };
      }

      function calculateInterestRate(application: LoanApplication): number {
        // Simplified interest rate calculation
        return 0.05 + (1 - application.creditScore / 850) * 0.1;
      }

      // Self-Hosted App
      export function runDynamicPricingApp(): void {
        console.log("Running Dynamic Pricing App");
        const application = createLoanApplication(10000, 36, generateRandomNumber(300, 850));
        console.log("Created Loan Application:", application);
        const interestRate = calculateInterestRate(application);
        console.log("Calculated Interest Rate:", interestRate);
      }
    }
  }
}

// 5. Citibankdemobusinessinc.compliance.automatedreporting
namespace Citibankdemobusinessinc {
  export namespace compliance {
    export namespace automatedreporting {
      // Mission: To automate regulatory reporting, ensuring compliance and reducing manual effort.
      // Monetization: Subscription fees for automated reporting services.
      // IP Moat: Proprietary reporting engine and integration with regulatory databases.

      interface RegulatoryReport {
        name: string;
        data: { [key: string]: any };
        timestamp: string;
      }

      function generateRegulatoryReport(name: string): RegulatoryReport {
        return {
          name: name,
          data: {
            'value1': generateRandomNumber(100, 1000),
            'value2': generateRandomString(10),
          },
          timestamp: new Date().toISOString(),
        };
      }

      function submitReport(report: RegulatoryReport): string {
        // Simplified submission logic
        return `Submitted report ${report.name} at ${report.timestamp}`;
      }

      // Self-Hosted App
      export function runAutomatedReportingApp(): void {
        console.log("Running Automated Reporting App");
        const report = generateRegulatoryReport("Report ABC");
        console.log("Generated Regulatory Report:", report);
        const submissionResult = submitReport(report);
        console.log("Report Submission Result:", submissionResult);
      }
    }
  }
}

// 6. Citibankdemobusinessinc.risk.predictiveanalytics
namespace Citibankdemobusinessinc {
  export namespace risk {
    export namespace predictiveanalytics {
      // Mission: To predict and mitigate financial risks using advanced analytics and machine learning.
      // Monetization: Subscription fees for risk prediction and mitigation services.
      // IP Moat: Proprietary risk prediction models and data analysis algorithms.

      interface RiskAssessment {
        score: number;
        factors: string[];
        timestamp: string;
      }

      function assessRisk(): RiskAssessment {
        return {
          score: generateRandomNumber(0, 100),
          factors: [generateRandomString(20), generateRandomString(20)],
          timestamp: new Date().toISOString(),
        };
      }

      function recommendMitigation(assessment: RiskAssessment): string {
        if (assessment.score > 50) {
          return "Implement risk mitigation strategy";
        } else {
          return "No immediate action required";
        }
      }

      // Self-Hosted App
      export function runPredictiveAnalyticsApp(): void {
        console.log("Running Predictive Analytics App");
        const assessment = assessRisk();
        console.log("Risk Assessment:", assessment);
        const recommendation = recommendMitigation(assessment);
        console.log("Risk Mitigation Recommendation:", recommendation);
      }
    }
  }
}

// 7. Citibankdemobusinessinc.wealth.roboadvisor
namespace Citibankdemobusinessinc {
  export namespace wealth {
    export namespace roboadvisor {
      // Mission: To provide automated investment advice and portfolio management services.
      // Monetization: Management fees based on assets under management.
      // IP Moat: Proprietary investment algorithms and portfolio optimization strategies.

      interface InvestmentPortfolio {
        assets: { [key: string]: number };
        riskScore: number;
        returns: number;
      }

      function createPortfolio(): InvestmentPortfolio {
        return {
          assets: {
            'stock1': generateRandomNumber(100, 1000),
            'bond1': generateRandomNumber(100, 1000),
          },
          riskScore: generateRandomNumber(0, 100),
          returns: generateRandomNumber(0, 10),
        };
      }

      function optimizePortfolio(portfolio: InvestmentPortfolio): InvestmentPortfolio {
        portfolio.riskScore = generateRandomNumber(0, 50);
        return portfolio;
      }

      // Self-Hosted App
      export function runRoboAdvisorApp(): void {
        console.log("Running Robo Advisor App");
        const portfolio = createPortfolio();
        console.log("Created Investment Portfolio:", portfolio);
        const optimizedPortfolio = optimizePortfolio(portfolio);
        console.log("Optimized Investment Portfolio:", optimizedPortfolio);
      }
    }
  }
}

// 8. Citibankdemobusinessinc.insurance.dynamicunderwriting
namespace Citibankdemobusinessinc {
  export namespace insurance {
    export namespace dynamicunderwriting {
      // Mission: To provide dynamic insurance underwriting based on real-time data and risk assessment.
      // Monetization: Premium pricing based on dynamic underwriting model.
      // IP Moat: Proprietary risk assessment algorithms and data integration platform.

      interface InsurancePolicy {
        premium: number;
        coverage: number;
        riskScore: number;
      }

      function underwritePolicy(): InsurancePolicy {
        return {
          premium: generateRandomNumber(100, 1000),
          coverage: generateRandomNumber(10000, 100000),
          riskScore: generateRandomNumber(0, 100),
        };
      }

      function adjustPremium(policy: InsurancePolicy): InsurancePolicy {
        policy.premium = policy.premium * (1 + (policy.riskScore / 100));
        return policy;
      }

      // Self-Hosted App
      export function runDynamicUnderwritingApp(): void {
        console.log("Running Dynamic Underwriting App");
        const policy = underwritePolicy();
        console.log("Underwritten Insurance Policy:", policy);
        const adjustedPolicy = adjustPremium(policy);
        console.log("Adjusted Insurance Policy:", adjustedPolicy);
      }
    }
  }
}

// 9. Citibankdemobusinessinc.realestate.propertyvaluation
namespace Citibankdemobusinessinc {
  export namespace realestate {
    export namespace propertyvaluation {
      // Mission: To provide accurate and automated property valuation services.
      // Monetization: Fees for property valuation reports.
      // IP Moat: Proprietary valuation algorithms and data integration platform.

      interface PropertyDetails {
        location: string;
        size: number;
        age: number;
      }

      interface ValuationReport {
        propertyDetails: PropertyDetails;
        value: number;
        timestamp: string;
      }

      function evaluateProperty(details: PropertyDetails): ValuationReport {
        return {
          propertyDetails: details,
          value: generateRandomNumber(100000, 1000000),
          timestamp: new Date().toISOString(),
        };
      }

      // Self-Hosted App
      export function runPropertyValuationApp(): void {
        console.log("Running Property Valuation App");
        const details: PropertyDetails = {
          location: generateRandomString(10),
          size: generateRandomNumber(500, 2000),
          age: generateRandomNumber(1, 50),
        };
        const report = evaluateProperty(details);
        console.log("Property Valuation Report:", report);
      }
    }
  }
}

// 10. Citibankdemobusinessinc.healthcare.claimsProcessing
namespace Citibankdemobusinessinc {
  export namespace healthcare {
    export namespace claimsProcessing {
      // Mission: To automate healthcare claims processing, reducing costs and improving efficiency.
      // Monetization: Transaction fees for claims processed.
      // IP Moat: Proprietary claims processing engine and integration with healthcare providers.

      interface ClaimDetails {
        patientId: string;
        providerId: string;
        amount: number;
      }

      interface ClaimStatus {
        claimDetails: ClaimDetails;
        status: string;
        timestamp: string;
      }

      function processClaim(details: ClaimDetails): ClaimStatus {
        return {
          claimDetails: details,
          status: "Processed",
          timestamp: new Date().toISOString(),
        };
      }

      // Self-Hosted App
      export function runClaimsProcessingApp(): void {
        console.log("Running Claims Processing App");
        const details: ClaimDetails = {
          patientId: generateUniqueId(),
          providerId: generateUniqueId(),
          amount: generateRandomNumber(100, 1000),
        };
        const status = processClaim(details);
        console.log("Claim Status:", status);
      }
    }
  }
}

// ====================================================================================================================
// Master Orchestration Layer
// ====================================================================================================================

function orchestrateCitibankdemobusinessinc(): void {
  console.log("Orchestrating Citibank demo business inc Ecosystem");
  Citibankdemobusinessinc.openaccess.identityvault.runIdentityVaultApp();
  Citibankdemobusinessinc.insights.creditadvisor.runCreditAdvisorApp();
  Citibankdemobusinessinc.payments.smartrouting.runSmartRoutingApp();
  Citibankdemobusinessinc.lending.dynamicpricing.runDynamicPricingApp();
  Citibankdemobusinessinc.compliance.automatedreporting.runAutomatedReportingApp();
  Citibankdemobusinessinc.risk.predictiveanalytics.runPredictiveAnalyticsApp();
  Citibankdemobusinessinc.wealth.roboadvisor.runRoboAdvisorApp();
  Citibankdemobusinessinc.insurance.dynamicunderwriting.runDynamicUnderwritingApp();
  Citibankdemobusinessinc.realestate.propertyvaluation.runPropertyValuationApp();
  Citibankdemobusinessinc.healthcare.claimsProcessing.runClaimsProcessingApp();
  console.log("Citibank demo business inc Ecosystem Orchestration Complete");
}

// Run the orchestration
orchestrateCitibankdemobusinessinc();

// Define the shape of an insight
interface Insight {
  id: string;
  type: 'recommendation' | 'alert' | 'warning' | 'info';
  message: string;
  timestamp: string; // ISO string or similar
  severity: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    url: string;
  };
}

// Helper component for displaying individual insights
const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'recommendation':
        return <FiLightbulb className="text-yellow-500" />;
      case 'alert':
        return <FiZap className="text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="text-orange-500" />;
      case 'info':
        return <FiInfo className="text-blue-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getSeverityStyle = (severity: Insight['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50';
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return `${years} years ago`;
  };

  return (
    <div className={`flex items-start p-4 rounded-lg shadow-sm ${getSeverityStyle(insight.severity)}`}>
      <div className="flex-shrink-0 mr-3 text-2xl">
        {getIcon(insight.type)}
      </div>
      <div className="flex-grow">
        <p className="font-medium text-gray-800">{insight.message}</p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="mr-2">{timeAgo(insight.timestamp)}</span>
          {insight.action && (
            <a href={insight.action.url} className="text-blue-600 hover:underline font-medium">
              {insight.action.label} &rarr;
            </a>
          )}
        </p>
      </div>
    </div>
  );
};

// Main ProactiveInsightWidget component
const ProactiveInsightWidget: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call to AI Core
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

        // Mock data from AI Core
        const mockInsights: Insight[] = [
          {
            id: 'rec1',
            type: 'recommendation',
            message: 'Your monthly report generation could be optimized by pre-caching frequently accessed data points. Estimated 15% speed improvement.',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            severity: 'low',
            action: { label: 'Optimize Report', url: '/settings/reports' },
          },
          {
            id: 'alert1',
            type: 'alert',
            message: 'High CPU utilization detected on Production Server 1 (server-prod-01) for the last 30 minutes. Consider scaling up or investigating recent deployments.',
            timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            severity: 'high',
            action: { label: 'View Server Metrics', url: '/servers/server-prod-01' },
          },
          {
            id: 'warning1',
            type: 'warning',
            message: 'Database connection pool usage reached 85% capacity. Monitor for potential performance degradation during peak hours.',
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            severity: 'medium',
            action: { label: 'Check Database', url: '/monitoring/database' },
          },
          {
            id: 'info1',
            type: 'info',
            message: 'New AI model update available for enhanced sentiment analysis. Review release notes for new features.',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            severity: 'low',
            action: { label: 'Read More', url: '/updates/ai-model' },
          },
          // { // Example of no insights
          //   id: 'empty',
          //   type: 'info',
          //   message: 'No proactive insights at the moment.',
          //   timestamp: new Date().toISOString(),
          //   severity: 'low',
          // }
        ];

        setInsights(mockInsights);
      } catch (err) {
        setError('Failed to load insights. Please try again.');
        console.error('Error fetching insights:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FiZap className="mr-3 text-blue-500" /> Proactive Insights
      </h2>

      {isLoading && (
        <div className="flex items-center justify-center py-8 text-blue-500">
          <FiLoader className="animate-spin text-4xl mr-3" />
          <p className="text-lg">Loading insights...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {!isLoading && !error && insights.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <FiInfo className="text-5xl mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No proactive insights at the moment. Everything looks good!</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for new recommendations or alerts from the AI Core.</p>
        </div>
      )}

      {!isLoading && !error && insights.length > 0 && (
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProactiveInsightWidget;