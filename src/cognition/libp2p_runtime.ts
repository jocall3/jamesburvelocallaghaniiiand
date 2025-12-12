import { createLibp2p, Libp2p, Libp2pOptions } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { webTransport } from '@libp2p/webtransport';
import { bootstrap } from '@libp2p/bootstrap';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { autoNAT } from '@libp2p/autonat';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { PeerId } from '@libp2p/interface/peer-id';
import { createFromProtobuf, createEd25519PeerId } from '@libp2p/peer-id-factory';
import { Multiaddr } from '@multiformats/multiaddr';
import { CID } from 'multiformats/cid';
import { Stream } from '@libp2p/interface/connection';
import { Message } from '@libp2p/interface/pubsub';

// Unified brand name
const BRAND_NAME = "Citibankdemobusinessinc";

// --- SHARED KERNEL ---
namespace CitibankdemobusinessincKernel {
    export interface Config {
        nodeId: string;
        environment: 'production' | 'development';
        logLevel: 'debug' | 'info' | 'warn' | 'error';
    }

    export function generateUniqueId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    export function log(config: Config, message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
        if (config.environment === 'development' || level === 'error') {
            console[level](`[${config.nodeId}][${level.toUpperCase()}]: ${message}`);
        }
    }

    export function encryptData(data: string, key: string): string {
        // Simplified encryption (replace with a real crypto library in production)
        let encrypted = '';
        for (let i = 0; i < data.length; i++) {
            encrypted += String.fromCharCode(data.charCodeAt(i) + key.charCodeAt(i % key.length));
        }
        return btoa(encrypted); // Base64 encode for transport
    }

    export function decryptData(encryptedData: string, key: string): string {
        const decoded = atob(encryptedData); // Base64 decode
        let decrypted = '';
        for (let i = 0; i < decoded.length; i++) {
            decrypted += String.fromCharCode(decoded.charCodeAt(i) - key.charCodeAt(i % key.length));
        }
        return decrypted;
    }

    export function generateFinancialReport(data: any): string {
        // Simplified report generation
        return `Financial Report: ${JSON.stringify(data)}`;
    }

    export function generateExecutiveSummary(data: any): string {
        // Simplified executive summary
        return `Executive Summary: ${JSON.stringify(data)}`;
    }

    export function generateInvestorDeck(data: any): string {
        // Simplified investor deck content
        return `Investor Deck: ${JSON.stringify(data)}`;
    }

    export function generateRegulatoryReport(data: any): string {
        // Simplified regulatory report
        return `Regulatory Report: ${JSON.stringify(data)}`;
    }
}

// --- BUSINESS MODEL 1: Citibankdemobusinessinc.opencredit.creditmarketplace ---
namespace Citibankdemobusinessinc.opencredit.creditmarketplace {
    // Mission: To democratize access to credit through a decentralized, transparent marketplace.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateCreditScore(): number {
        return Math.floor(Math.random() * 850); // Generates a random credit score
    }

    export function calculateInterestRate(creditScore: number): number {
        // Simplified interest rate calculation based on credit score
        if (creditScore > 750) return 0.05;
        if (creditScore > 650) return 0.10;
        return 0.15;
    }

    export function simulateLoanApplication(): any {
        const creditScore = generateCreditScore();
        const interestRate = calculateInterestRate(creditScore);
        const loanAmount = Math.floor(Math.random() * 100000); // Up to $100,000
        return {
            creditScore,
            interestRate,
            loanAmount
        };
    }

    export function runCreditMarketplaceSimulation(): string {
        const loanData = simulateLoanApplication();
        CitibankdemobusinessincKernel.log(config, `Loan application simulated: ${JSON.stringify(loanData)}`);
        return `Credit Marketplace Simulation: ${JSON.stringify(loanData)}`;
    }

    // Monetization: Transaction fees on loan origination, premium data services.
    // IP Moat: Proprietary credit scoring algorithms, network effects.
    // Regulatory Alignment: Compliance with lending regulations, KYC/AML.
    // Auto-scaling: Cloud-based infrastructure, distributed ledger technology.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Credit Marketplace App started.");
        const simulationResult = runCreditMarketplaceSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 2: Citibankdemobusinessinc.wealthwise.aiadvisor ---
namespace Citibankdemobusinessinc.wealthwise.aiadvisor {
    // Mission: To provide personalized AI-driven financial advice to individuals.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateInvestmentProfile(): any {
        // Simulate user investment profile
        const riskTolerance = Math.random(); // 0 to 1
        const investmentHorizon = Math.floor(Math.random() * 30); // Years
        const income = Math.floor(Math.random() * 200000); // Annual income
        return {
            riskTolerance,
            investmentHorizon,
            income
        };
    }

    export function recommendInvestmentStrategy(profile: any): string {
        // Simplified investment strategy recommendation
        if (profile.riskTolerance > 0.7) return "High-growth portfolio";
        if (profile.riskTolerance > 0.3) return "Balanced portfolio";
        return "Conservative portfolio";
    }

    export function runAIAdvisorSimulation(): string {
        const profile = generateInvestmentProfile();
        const recommendation = recommendInvestmentStrategy(profile);
        CitibankdemobusinessincKernel.log(config, `AI Advisor simulation: ${recommendation}`);
        return `AI Advisor Simulation: ${recommendation}`;
    }

    // Monetization: Subscription fees, commission on investment products.
    // IP Moat: Proprietary AI algorithms, personalized recommendations.
    // Regulatory Alignment: Compliance with investment advisory regulations.
    // Auto-scaling: Cloud-based AI infrastructure, real-time data processing.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "AI Advisor App started.");
        const simulationResult = runAIAdvisorSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 3: Citibankdemobusinessinc.safeguard.cyberinsurance ---
namespace Citibankdemobusinessinc.safeguard.cyberinsurance {
    // Mission: To protect businesses from cyber threats with comprehensive insurance solutions.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateCyberRiskScore(): number {
        return Math.floor(Math.random() * 100); // 0 to 100
    }

    export function calculateInsurancePremium(riskScore: number): number {
        // Simplified premium calculation
        return riskScore * 100;
    }

    export function simulateCyberInsuranceQuote(): any {
        const riskScore = generateCyberRiskScore();
        const premium = calculateInsurancePremium(riskScore);
        const coverageAmount = Math.floor(Math.random() * 1000000); // Up to $1M
        return {
            riskScore,
            premium,
            coverageAmount
        };
    }

    export function runCyberInsuranceSimulation(): string {
        const quote = simulateCyberInsuranceQuote();
        CitibankdemobusinessincKernel.log(config, `Cyber Insurance simulation: ${JSON.stringify(quote)}`);
        return `Cyber Insurance Simulation: ${JSON.stringify(quote)}`;
    }

    // Monetization: Insurance premiums, risk assessment services.
    // IP Moat: Proprietary risk assessment models, threat intelligence.
    // Regulatory Alignment: Compliance with insurance regulations, data privacy.
    // Auto-scaling: Cloud-based security infrastructure, real-time threat monitoring.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Cyber Insurance App started.");
        const simulationResult = runCyberInsuranceSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 4: Citibankdemobusinessinc.futuretrade.decentralizedexchange ---
namespace Citibankdemobusinessinc.futuretrade.decentralizedexchange {
    // Mission: To create a secure and transparent decentralized exchange for digital assets.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateTradeVolume(): number {
        return Math.floor(Math.random() * 1000000); // Daily trade volume
    }

    export function calculateExchangeFees(volume: number): number {
        return volume * 0.001; // 0.1% fee
    }

    export function simulateTrade(): any {
        const volume = generateTradeVolume();
        const fees = calculateExchangeFees(volume);
        const assetPair = "BTC/USD";
        return {
            volume,
            fees,
            assetPair
        };
    }

    export function runDecentralizedExchangeSimulation(): string {
        const trade = simulateTrade();
        CitibankdemobusinessincKernel.log(config, `Decentralized Exchange simulation: ${JSON.stringify(trade)}`);
        return `Decentralized Exchange Simulation: ${JSON.stringify(trade)}`;
    }

    // Monetization: Transaction fees, listing fees.
    // IP Moat: Secure smart contracts, high-performance trading engine.
    // Regulatory Alignment: Compliance with securities regulations, KYC/AML.
    // Auto-scaling: Distributed ledger technology, high-throughput infrastructure.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Decentralized Exchange App started.");
        const simulationResult = runDecentralizedExchangeSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 5: Citibankdemobusinessinc.greenfinance.carboncredits ---
namespace Citibankdemobusinessinc.greenfinance.carboncredits {
    // Mission: To facilitate the trading of carbon credits to promote environmental sustainability.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateCarbonOffset(): number {
        return Math.floor(Math.random() * 1000); // Tons of CO2 offset
    }

    export function calculateCreditPrice(offset: number): number {
        return offset * 10; // $10 per ton
    }

    export function simulateCarbonCreditTrade(): any {
        const offset = generateCarbonOffset();
        const price = calculateCreditPrice(offset);
        return {
            offset,
            price
        };
    }

    export function runCarbonCreditsSimulation(): string {
        const trade = simulateCarbonCreditTrade();
        CitibankdemobusinessincKernel.log(config, `Carbon Credits simulation: ${JSON.stringify(trade)}`);
        return `Carbon Credits Simulation: ${JSON.stringify(trade)}`;
    }

    // Monetization: Transaction fees, carbon offset consulting.
    // IP Moat: Verified carbon offset projects, transparent trading platform.
    // Regulatory Alignment: Compliance with carbon trading regulations, environmental standards.
    // Auto-scaling: Blockchain-based registry, global trading network.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Carbon Credits App started.");
        const simulationResult = runCarbonCreditsSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 6: Citibankdemobusinessinc.mobilemoney.micropayments ---
namespace Citibankdemobusinessinc.mobilemoney.micropayments {
    // Mission: To enable seamless micropayments for digital content and services.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateTransactionAmount(): number {
        return Math.random() * 5; // Up to $5
    }

    export function calculateTransactionFee(amount: number): number {
        return amount * 0.01; // 1% fee
    }

    export function simulateMicropayment(): any {
        const amount = generateTransactionAmount();
        const fee = calculateTransactionFee(amount);
        return {
            amount,
            fee
        };
    }

    export function runMicropaymentsSimulation(): string {
        const payment = simulateMicropayment();
        CitibankdemobusinessincKernel.log(config, `Micropayments simulation: ${JSON.stringify(payment)}`);
        return `Micropayments Simulation: ${JSON.stringify(payment)}`;
    }

    // Monetization: Transaction fees, premium service subscriptions.
    // IP Moat: Secure payment gateway, user-friendly mobile app.
    // Regulatory Alignment: Compliance with payment processing regulations, data privacy.
    // Auto-scaling: High-throughput payment infrastructure, mobile-first design.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Micropayments App started.");
        const simulationResult = runMicropaymentsSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 7: Citibankdemobusinessinc.datainsight.creditriskmodeling ---
namespace Citibankdemobusinessinc.datainsight.creditriskmodeling {
    // Mission: To provide advanced credit risk modeling solutions for financial institutions.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateLoanDefaultProbability(): number {
        return Math.random() * 0.05; // Up to 5% default probability
    }

    export function calculateExpectedLoss(probability: number): number {
        return probability * 100000; // Expected loss on a $100,000 loan
    }

    export function simulateCreditRiskAssessment(): any {
        const probability = generateLoanDefaultProbability();
        const expectedLoss = calculateExpectedLoss(probability);
        return {
            probability,
            expectedLoss
        };
    }

    export function runCreditRiskModelingSimulation(): string {
        const assessment = simulateCreditRiskAssessment();
        CitibankdemobusinessincKernel.log(config, `Credit Risk Modeling simulation: ${JSON.stringify(assessment)}`);
        return `Credit Risk Modeling Simulation: ${JSON.stringify(assessment)}`;
    }

    // Monetization: Subscription fees, consulting services.
    // IP Moat: Proprietary risk models, machine learning algorithms.
    // Regulatory Alignment: Compliance with banking regulations, risk management standards.
    // Auto-scaling: Cloud-based analytics platform, real-time data processing.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Credit Risk Modeling App started.");
        const simulationResult = runCreditRiskModelingSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 8: Citibankdemobusinessinc.blockchainsolutions.smartcontracts ---
namespace Citibankdemobusinessinc.blockchainsolutions.smartcontracts {
    // Mission: To develop and deploy secure smart contract solutions for various industries.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateContractExecutionCost(): number {
        return Math.random() * 10; // Cost in gas units
    }

    export function calculateContractRevenue(cost: number): number {
        return cost * 100; // Revenue multiple
    }

    export function simulateSmartContractExecution(): any {
        const cost = generateContractExecutionCost();
        const revenue = calculateContractRevenue(cost);
        return {
            cost,
            revenue
        };
    }

    export function runSmartContractsSimulation(): string {
        const execution = simulateSmartContractExecution();
        CitibankdemobusinessincKernel.log(config, `Smart Contracts simulation: ${JSON.stringify(execution)}`);
        return `Smart Contracts Simulation: ${JSON.stringify(execution)}`;
    }

    // Monetization: Development fees, transaction fees.
    // IP Moat: Secure smart contract templates, audit services.
    // Regulatory Alignment: Compliance with blockchain regulations, data privacy.
    // Auto-scaling: Distributed ledger technology, secure execution environment.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Smart Contracts App started.");
        const simulationResult = runSmartContractsSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 9: Citibankdemobusinessinc.digitalidentity.biometricauth ---
namespace Citibankdemobusinessinc.digitalidentity.biometricauth {
    // Mission: To provide secure and convenient biometric authentication solutions.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateAuthenticationSuccessRate(): number {
        return 0.99 + Math.random() * 0.01; // 99% to 100% success rate
    }

    export function calculateFraudReduction(successRate: number): number {
        return successRate * 1000000; // Fraud reduction in dollars
    }

    export function simulateBiometricAuthentication(): any {
        const successRate = generateAuthenticationSuccessRate();
        const fraudReduction = calculateFraudReduction(successRate);
        return {
            successRate,
            fraudReduction
        };
    }

    export function runBiometricAuthenticationSimulation(): string {
        const authentication = simulateBiometricAuthentication();
        CitibankdemobusinessincKernel.log(config, `Biometric Authentication simulation: ${JSON.stringify(authentication)}`);
        return `Biometric Authentication Simulation: ${JSON.stringify(authentication)}`;
    }

    // Monetization: Subscription fees, transaction fees.
    // IP Moat: Proprietary biometric algorithms, secure authentication platform.
    // Regulatory Alignment: Compliance with data privacy regulations, security standards.
    // Auto-scaling: Cloud-based authentication infrastructure, real-time processing.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Biometric Authentication App started.");
        const simulationResult = runBiometricAuthenticationSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- BUSINESS MODEL 10: Citibankdemobusinessinc.regtech.complianceautomation ---
namespace Citibankdemobusinessinc.regtech.complianceautomation {
    // Mission: To automate regulatory compliance processes for financial institutions.
    const config: CitibankdemobusinessincKernel.Config = {
        nodeId: CitibankdemobusinessincKernel.generateUniqueId(),
        environment: 'production',
        logLevel: 'info'
    };

    export function generateComplianceScore(): number {
        return Math.floor(Math.random() * 100); // 0 to 100
    }

    export function calculateCostSavings(complianceScore: number): number {
        return complianceScore * 10000; // Cost savings in dollars
    }

    export function simulateComplianceAutomation(): any {
        const complianceScore = generateComplianceScore();
        const costSavings = calculateCostSavings(complianceScore);
        return {
            complianceScore,
            costSavings
        };
    }

    export function runComplianceAutomationSimulation(): string {
        const automation = simulateComplianceAutomation();
        CitibankdemobusinessincKernel.log(config, `Compliance Automation simulation: ${JSON.stringify(automation)}`);
        return `Compliance Automation Simulation: ${JSON.stringify(automation)}`;
    }

    // Monetization: Subscription fees, consulting services.
    // IP Moat: Proprietary compliance rules engine, automated reporting.
    // Regulatory Alignment: Compliance with financial regulations, reporting standards.
    // Auto-scaling: Cloud-based compliance platform, real-time monitoring.

    // Self-contained app logic
    export function startApp(): void {
        CitibankdemobusinessincKernel.log(config, "Compliance Automation App started.");
        const simulationResult = runComplianceAutomationSimulation();
        CitibankdemobusinessincKernel.log(config, simulationResult);
    }
}

// --- MASTER ORCHESTRATION LAYER ---
namespace CitibankdemobusinessincOrchestrator {
    export function orchestrate(): void {
        console.log("Starting Citibankdemobusinessinc Ecosystem Orchestration...");

        // Start each business model's app
        Citibankdemobusinessinc.opencredit.creditmarketplace.startApp();
        Citibankdemobusinessinc.wealthwise.aiadvisor.startApp();
        Citibankdemobusinessinc.safeguard.cyberinsurance.startApp();
        Citibankdemobusinessinc.futuretrade.decentralizedexchange.startApp();
        Citibankdemobusinessinc.greenfinance.carboncredits.startApp();
        Citibankdemobusinessinc.mobilemoney.micropayments.startApp();
        Citibankdemobusinessinc.datainsight.creditriskmodeling.startApp();
        Citibankdemobusinessinc.blockchainsolutions.smartcontracts.startApp();
        Citibankdemobusinessinc.digitalidentity.biometricauth.startApp();
        Citibankdemobusinessinc.regtech.complianceautomation.startApp();

        console.log("Citibankdemobusinessinc Ecosystem Orchestration Complete.");
    }
}

// --- RUN THE ORCHESTRATOR ---
CitibankdemobusinessincOrchestrator.orchestrate();

// Default bootstrap nodes for connecting to the public libp2p network
const BOOTSTRAP_NODES = [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTf5bn6E5W18iadR6OD',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
];

// Helper to persist PeerId in localStorage to avoid creating a new identity on each load
const getOrCreatePeerId = async (): Promise<PeerId> => {
  const peerIdKey = 'p2p-peer-id';
  const storedKey = localStorage.getItem(peerIdKey);

  if (storedKey) {
    try {
      const privateKeyBytes = new Uint8Array(JSON.parse(storedKey));
      return await createFromProtobuf(privateKeyBytes);
    } catch (error) {
      console.error('Failed to parse stored PeerId, creating a new one.', error);
      localStorage.removeItem(peerIdKey);
    }
  }

  const newPeerId = await createEd25519PeerId();
  const privateKeyBytes = newPeerId.privateKey;
  if (privateKeyBytes) {
      localStorage.setItem(peerIdKey, JSON.stringify(Array.from(privateKeyBytes)));
  }
  return newPeerId;
};

/**
 * Creates a libp2p node configuration tailored for browser environments.
 * @param peerId - The PeerId for this node.
 * @param bootstrapList - Optional list of bootstrap multiaddrs.
 * @returns A Libp2pOptions object.
 */
const createNodeOptions = (peerId: PeerId, bootstrapList: string[] = BOOTSTRAP_NODES): Libp2pOptions => ({
  peerId,
  addresses: {
    // Browser nodes can't listen on a stable address, they connect outbound
    listen: [],
  },
  transports: [
    webSockets(),
    webRTC(),
    webTransport(),
    circuitRelayTransport({
      discoverRelays: 1,
    }),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [mplex()],
  peerDiscovery: [
    bootstrap({
      list: bootstrapList,
    }),
  ],
  services: {
    identify: identify(),
    autoNAT: autoNAT(),
    pubsub: gossipsub({
      allowPublishToZeroPeers: true,
    }),
    dht: kadDHT({
      clientMode: true, // Crucial for browser nodes
      protocol: '/ipfs/kad/1.0.0',
    }),
  },
});

/**
 * Libp2pRuntime encapsulates a client-side libp2p node, providing a high-level
 * API for peer-to-peer communication and data sharing.
 */
export class Libp2pRuntime {
  private node: Libp2p | null = null;
  private started = false;
  private pubsubHandlers = new Map<string, Set<(message: Message) => void>>();
  private isPubsubListenerActive = false;

  public static async create(options?: Partial<Libp2pOptions>): Promise<Libp2pRuntime> {
    const instance = new Libp2pRuntime();
    const peerId = await getOrCreatePeerId();
    const baseOptions = createNodeOptions(peerId, options?.peerDiscovery?.[0]?.list);
    
    // Simple merge, user options take precedence
    const finalOptions = { ...baseOptions, ...options };
    
    instance.node = await createLibp2p(finalOptions);
    return instance;
  }

  private constructor() {}

  public async start(): Promise<void> {
    if (!this.node) throw new Error('Libp2p node not initialized. Call create() first.');
    if (this.started) return;
    
    await this.node.start();
    this.attachPubsubListener();
    this.started = true;
    console.log('Libp2p node started with PeerId:', this.node.peerId.toString());
    this.node.getMultiaddrs().forEach(ma => console.log('Listening on:', ma.toString()));
  }

  public async stop(): Promise<void> {
    if (!this.node || !this.started) return;
    
    await this.node.stop();
    this.started = false;
    this.isPubsubListenerActive = false;
    console.log('Libp2p node stopped.');
  }

  public isStarted(): boolean {
    return this.started;
  }

  public getNode(): Libp2p {
    if (!this.node) throw new Error('Libp2p node not initialized.');
    return this.node;
  }

  public getPeerId(): PeerId {
      if (!this.node) throw new Error('Libp2p node not initialized.');
      return this.node.peerId;
  }
  
  public getMultiaddrs(): Multiaddr[] {
    if (!this.node) throw new Error('Libp2p node not initialized.');
    return this.node.getMultiaddrs();
  }
  
  private attachPubsubListener(): void {
    if (!this.node || this.isPubsubListenerActive) return;

    this.node.services.pubsub.addEventListener('message', (evt) => {
        const handlers = this.pubsubHandlers.get(evt.detail.topic);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(evt.detail);
                } catch(err) {
                    console.error(`Error in pubsub handler for topic ${evt.detail.topic}`, err);
                }
            }
        }
    });
    this.isPubsubListenerActive = true;
  }

  public subscribe(topic: string, handler: (message: Message) => void): () => void {
    if (!this.node || !this.started) throw new Error('Node not started.');
    
    let handlers = this.pubsubHandlers.get(topic);
    if (!handlers) {
        handlers = new Set();
        this.pubsubHandlers.set(topic, handlers);
        this.node.services.pubsub.subscribe(topic);
    }
    handlers.add(handler);
    
    return () => this.unsubscribe(topic, handler);
  }

  public unsubscribe(topic: string, handler?: (message: Message) => void): void {
    if (!this.node) return;

    const handlers = this.pubsubHandlers.get(topic);
    if (!handlers) return;

    if (handler) {
        handlers.delete(handler);
    } else {
        handlers.clear();
    }

    if (handlers.size === 0) {
        this.pubsubHandlers.delete(topic);
        if (this.started) {
            this.node.services.pubsub.unsubscribe(topic);
        }
    }
  }

  public async publish(topic: string, data: Uint8Array): Promise<void> {
    if (!this.node || !this.started) throw new Error('Node not started.');
    await this.node.services.pubsub.publish(topic, data);
  }

  public handle(protocol: string, handler: (props: { stream: Stream }) => void): Promise<void> {
    if (!this.node) throw new Error('Libp2p node not initialized.');
    return this.node.handle(protocol, handler);
  }

  public async dial(peer: PeerId | Multiaddr, protocol: string): Promise<Stream> {
    if (!this.node || !this.started) throw new Error('Node not started.');
    return this.node.dial(peer, protocol);
  }

  public async findPeer(peerId: PeerId) {
    if (!this.node || !this.started) throw new Error('Node not started.');
    return this.node.services.dht.findPeer(peerId);
  }

  public async provide(cid: CID): Promise<void> {
    if (!this.node || !this.started) throw new Error('Node not started.');
    // Browser nodes may struggle to provide content effectively due to NATs.
    // This relies heavily on circuit relays being available.
    for await (const _ of this.node.services.dht.provide(cid)) {
      // Iterating consumes the async generator, completing the operation.
    }
  }

  public findProviders(cid: CID, timeout?: number) {
    if (!this.node || !this.started) throw new Error('Node not started.');
    return this.node.services.dht.findProviders(cid, { timeout });
  }
}