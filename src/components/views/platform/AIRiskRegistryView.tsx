import React, { useState, useEffect, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnomalySeverity, AnomalyStatus } from '../../../types'; // Assuming types are in ../../../types
import { AiOutlineWarning, AiFillCloseCircle, AiOutlineCheckCircle, AiOutlineEye } from 'react-icons/ai';
import { TbAlertTriangleFilled } from 'react-icons/tb';
import { FeatureGuard } from '../../../components/FeatureGuard';
import { View } from '../../../types';

// Unified Brand Namespace
namespace Citibankdemobusinessinc {

  // Shared Kernel
  export namespace Kernel {
    export const generateId = (): string => {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    export const generateTimestamp = (): string => {
      return new Date().toISOString();
    };

    export const generateRandomNumber = (min: number, max: number): number => {
      return Math.random() * (max - min) + min;
    };

    export const encryptData = (data: string): string => {
      // Simplified encryption (replace with a real algorithm)
      return btoa(data);
    };

    export const decryptData = (encryptedData: string): string => {
      // Simplified decryption (replace with a real algorithm)
      return atob(encryptedData);
    };

    export const generateRandomSeverity = (): AnomalySeverity => {
      const severities: AnomalySeverity[] = [AnomalySeverity.Low, AnomalySeverity.Medium, AnomalySeverity.High, AnomalySeverity.Critical];
      return severities[Math.floor(Math.random() * severities.length)];
    };

    export const generateRandomStatus = (): AnomalyStatus => {
      const statuses: AnomalyStatus[] = [AnomalyStatus.New, AnomalyStatus.UnderReview, AnomalyStatus.Dismissed, AnomalyStatus.Resolved];
      return statuses[Math.floor(Math.random() * statuses.length)];
    };
  }

  // 1. Citibankdemobusinessinc.openaccess.creditriskmodel
  export namespace openaccess {
    export namespace creditriskmodel {
      // Mission: Democratize credit risk assessment through open, transparent, and accessible models.
      // Monetization: Premium API access, custom model development, and training services.
      // IP Moat: Proprietary model training techniques and unique data aggregation methods.

      export interface CreditRiskData {
        id: string;
        applicantId: string;
        creditScore: number;
        loanAmount: number;
        interestRate: number;
        timestamp: string;
      }

      export const generateCreditRiskData = (): CreditRiskData => {
        const applicantId = Kernel.generateId();
        const creditScore = Math.floor(Kernel.generateRandomNumber(300, 850));
        const loanAmount = Kernel.generateRandomNumber(1000, 100000);
        const interestRate = Kernel.generateRandomNumber(0.02, 0.20); // 2% to 20%
        const timestamp = Kernel.generateTimestamp();

        return {
          id: Kernel.generateId(),
          applicantId,
          creditScore,
          loanAmount,
          interestRate,
          timestamp,
        };
      };

      export const simulateCreditRiskDataset = (size: number): CreditRiskData[] => {
        return Array.from({ length: size }, () => generateCreditRiskData());
      };

      export const trainCreditRiskModel = (data: CreditRiskData[]): any => {
        // Simplified model training (replace with a real ML algorithm)
        const averageCreditScore = data.reduce((sum, item) => sum + item.creditScore, 0) / data.length;
        const averageInterestRate = data.reduce((sum, item) => sum + item.interestRate, 0) / data.length;

        return {
          averageCreditScore,
          averageInterestRate,
        };
      };

      export const assessCreditRisk = (model: any, applicantData: CreditRiskData): number => {
        // Simplified risk assessment based on the trained model
        const score = (applicantData.creditScore - model.averageCreditScore) * (1 - applicantData.interestRate / model.averageInterestRate);
        return score;
      };

      export const runCreditRiskApp = (): void => {
        const dataset = simulateCreditRiskDataset(100);
        const model = trainCreditRiskModel(dataset);
        const newApplicant = generateCreditRiskData();
        const riskScore = assessCreditRisk(model, newApplicant);

        console.log('Credit Risk Assessment:');
        console.log('Applicant ID:', newApplicant.applicantId);
        console.log('Risk Score:', riskScore);
      };
    }
  }

  // 2. Citibankdemobusinessinc.aifinance.fraudguard
  export namespace aifinance {
    export namespace fraudguard {
      // Mission: Protect financial institutions and customers from fraud using advanced AI-driven detection systems.
      // Monetization: Subscription fees, transaction-based charges, and fraud recovery services.
      // IP Moat: Real-time anomaly detection algorithms and behavioral biometrics.

      export interface TransactionData {
        id: string;
        accountId: string;
        amount: number;
        timestamp: string;
        location: string;
        isFraudulent?: boolean;
      }

      export const generateTransactionData = (): TransactionData => {
        const accountId = Kernel.generateId();
        const amount = Kernel.generateRandomNumber(1, 1000);
        const timestamp = Kernel.generateTimestamp();
        const locations = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'];
        const location = locations[Math.floor(Math.random() * locations.length)];

        return {
          id: Kernel.generateId(),
          accountId,
          amount,
          timestamp,
          location,
        };
      };

      export const simulateTransactionDataset = (size: number): TransactionData[] => {
        return Array.from({ length: size }, () => generateTransactionData());
      };

      export const trainFraudDetectionModel = (data: TransactionData[]): any => {
        // Simplified fraud detection model (replace with a real ML algorithm)
        const averageTransactionAmount = data.reduce((sum, item) => sum + item.amount, 0) / data.length;
        const commonLocation = data.reduce((acc: { [key: string]: number }, item) => {
          acc[item.location] = (acc[item.location] || 0) + 1;
          return acc;
        }, {});

        const mostCommonLocation = Object.keys(commonLocation).reduce((a, b) => commonLocation[a] > commonLocation[b] ? a : b);

        return {
          averageTransactionAmount,
          mostCommonLocation,
        };
      };

      export const detectFraud = (model: any, transaction: TransactionData): boolean => {
        // Simplified fraud detection logic
        const amountDeviation = Math.abs(transaction.amount - model.averageTransactionAmount);
        const locationMismatch = transaction.location !== model.mostCommonLocation;

        return amountDeviation > model.averageTransactionAmount * 0.5 || locationMismatch;
      };

      export const runFraudGuardApp = (): void => {
        const dataset = simulateTransactionDataset(100);
        const model = trainFraudDetectionModel(dataset);
        const newTransaction = generateTransactionData();
        const isFraudulent = detectFraud(model, newTransaction);

        console.log('Fraud Detection:');
        console.log('Transaction ID:', newTransaction.id);
        console.log('Is Fraudulent:', isFraudulent);
      };
    }
  }

  // 3. Citibankdemobusinessinc.wealthmanager.roboadvisor
  export namespace wealthmanager {
    export namespace roboadvisor {
      // Mission: Provide personalized investment advice and automated portfolio management to individuals.
      // Monetization: Management fees, performance-based fees, and financial planning services.
      // IP Moat: Algorithmic asset allocation and risk profiling.

      export interface InvestmentProfile {
        id: string;
        age: number;
        income: number;
        riskTolerance: string;
        investmentGoals: string[];
      }

      export interface PortfolioAllocation {
        assetClass: string;
        percentage: number;
      }

      export const generateInvestmentProfile = (): InvestmentProfile => {
        const age = Math.floor(Kernel.generateRandomNumber(18, 70));
        const income = Kernel.generateRandomNumber(30000, 200000);
        const riskTolerances = ['Low', 'Medium', 'High'];
        const riskTolerance = riskTolerances[Math.floor(Math.random() * riskTolerances.length)];
        const investmentGoals = ['Retirement', 'Education', 'Home Purchase'];

        return {
          id: Kernel.generateId(),
          age,
          income,
          riskTolerance,
          investmentGoals,
        };
      };

      export const determinePortfolioAllocation = (profile: InvestmentProfile): PortfolioAllocation[] => {
        // Simplified portfolio allocation logic
        const allocation: PortfolioAllocation[] = [];

        if (profile.riskTolerance === 'Low') {
          allocation.push({ assetClass: 'Bonds', percentage: 0.7 });
          allocation.push({ assetClass: 'Stocks', percentage: 0.3 });
        } else if (profile.riskTolerance === 'Medium') {
          allocation.push({ assetClass: 'Bonds', percentage: 0.5 });
          allocation.push({ assetClass: 'Stocks', percentage: 0.5 });
        } else {
          allocation.push({ assetClass: 'Bonds', percentage: 0.3 });
          allocation.push({ assetClass: 'Stocks', percentage: 0.7 });
        }

        return allocation;
      };

      export const runRoboAdvisorApp = (): void => {
        const profile = generateInvestmentProfile();
        const allocation = determinePortfolioAllocation(profile);

        console.log('Robo-Advisor Portfolio Allocation:');
        console.log('Profile ID:', profile.id);
        console.log('Risk Tolerance:', profile.riskTolerance);
        console.log('Allocation:', allocation);
      };
    }
  }

  // 4. Citibankdemobusinessinc.insurtech.smartclaims
  export namespace insurtech {
    export namespace smartclaims {
      // Mission: Streamline insurance claims processing using AI to reduce costs and improve customer satisfaction.
      // Monetization: Claims processing fees, fraud detection services, and data analytics.
      // IP Moat: AI-powered image recognition and natural language processing for claims assessment.

      export interface ClaimData {
        id: string;
        policyId: string;
        claimType: string;
        amount: number;
        description: string;
        timestamp: string;
      }

      export const generateClaimData = (): ClaimData => {
        const policyId = Kernel.generateId();
        const claimTypes = ['Auto', 'Home', 'Health'];
        const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
        const amount = Kernel.generateRandomNumber(100, 10000);
        const description = `Claim for ${claimType} insurance due to an incident.`;

        return {
          id: Kernel.generateId(),
          policyId,
          claimType,
          amount,
          description,
          timestamp: Kernel.generateTimestamp(),
        };
      };

      export const assessClaim = (claim: ClaimData): string => {
        // Simplified claim assessment logic
        if (claim.amount > 5000) {
          return 'Requires manual review due to high claim amount.';
        } else {
          return 'Approved automatically.';
        }
      };

      export const runSmartClaimsApp = (): void => {
        const claim = generateClaimData();
        const assessment = assessClaim(claim);

        console.log('Smart Claims Assessment:');
        console.log('Claim ID:', claim.id);
        console.log('Assessment:', assessment);
      };
    }
  }

  // 5. Citibankdemobusinessinc.regtech.complianceai
  export namespace regtech {
    export namespace complianceai {
      // Mission: Automate regulatory compliance processes using AI to reduce risk and improve efficiency.
      // Monetization: Compliance monitoring subscriptions, regulatory reporting services, and audit support.
      // IP Moat: AI-driven regulatory change management and compliance risk assessment.

      export interface RegulatoryRule {
        id: string;
        ruleName: string;
        description: string;
        jurisdiction: string;
        effectiveDate: string;
      }

      export const generateRegulatoryRule = (): RegulatoryRule => {
        const jurisdictions = ['US', 'EU', 'UK'];
        const jurisdiction = jurisdictions[Math.floor(Math.random() * jurisdictions.length)];
        const ruleName = `Rule ${Kernel.generateId()}`;
        const description = `A new regulatory rule for ${jurisdiction}.`;

        return {
          id: Kernel.generateId(),
          ruleName,
          description,
          jurisdiction,
          effectiveDate: Kernel.generateTimestamp(),
        };
      };

      export const monitorCompliance = (rule: RegulatoryRule): string => {
        // Simplified compliance monitoring logic
        return `Monitoring compliance for rule ${rule.ruleName} in ${rule.jurisdiction}.`;
      };

      export const runComplianceAIApp = (): void => {
        const rule = generateRegulatoryRule();
        const monitoringStatus = monitorCompliance(rule);

        console.log('Compliance AI Monitoring:');
        console.log('Rule ID:', rule.id);
        console.log('Monitoring Status:', monitoringStatus);
      };
    }
  }

  // 6. Citibankdemobusinessinc.cybersecurity.threatdetect
  export namespace cybersecurity {
    export namespace threatdetect {
      // Mission: Provide advanced threat detection and response using AI to protect against cyber attacks.
      // Monetization: Security monitoring subscriptions, incident response services, and vulnerability assessments.
      // IP Moat: AI-powered anomaly detection and behavioral analysis for cybersecurity.

      export interface SecurityEvent {
        id: string;
        eventType: string;
        timestamp: string;
        sourceIp: string;
        severity: string;
      }

      export const generateSecurityEvent = (): SecurityEvent => {
        const eventTypes = ['Login', 'Access', 'Malware'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const sourceIp = `192.168.1.${Math.floor(Kernel.generateRandomNumber(1, 254))}`;
        const severities = ['Low', 'Medium', 'High'];
        const severity = severities[Math.floor(Math.random() * severities.length)];

        return {
          id: Kernel.generateId(),
          eventType,
          timestamp: Kernel.generateTimestamp(),
          sourceIp,
          severity,
        };
      };

      export const analyzeSecurityEvent = (event: SecurityEvent): string => {
        // Simplified security event analysis logic
        return `Analyzing ${event.eventType} event from ${event.sourceIp} with severity ${event.severity}.`;
      };

      export const runThreatDetectApp = (): void => {
        const event = generateSecurityEvent();
        const analysis = analyzeSecurityEvent(event);

        console.log('Threat Detection:');
        console.log('Event ID:', event.id);
        console.log('Analysis:', analysis);
      };
    }
  }

  // 7. Citibankdemobusinessinc.customerexperience.personalizationai
  export namespace customerexperience {
    export namespace personalizationai {
      // Mission: Enhance customer engagement and loyalty through AI-driven personalized experiences.
      // Monetization: Targeted advertising, personalized product recommendations, and premium customer service.
      // IP Moat: AI-powered customer segmentation and behavioral prediction.

      export interface CustomerData {
        id: string;
        name: string;
        age: number;
        location: string;
        interests: string[];
      }

      export const generateCustomerData = (): CustomerData => {
        const names = ['Alice', 'Bob', 'Charlie'];
        const name = names[Math.floor(Math.random() * names.length)];
        const age = Math.floor(Kernel.generateRandomNumber(18, 60));
        const locations = ['New York', 'London', 'Tokyo'];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const interests = ['Finance', 'Technology', 'Travel'];

        return {
          id: Kernel.generateId(),
          name,
          age,
          location,
          interests,
        };
      };

      export const personalizeExperience = (customer: CustomerData): string => {
        // Simplified personalization logic
        return `Personalizing experience for ${customer.name} based on interests in ${customer.interests.join(', ')}.`;
      };

      export const runPersonalizationAIApp = (): void => {
        const customer = generateCustomerData();
        const personalizedMessage = personalizeExperience(customer);

        console.log('Personalization AI:');
        console.log('Customer ID:', customer.id);
        console.log('Message:', personalizedMessage);
      };
    }
  }

  // 8. Citibankdemobusinessinc.operations.processautomation
  export namespace operations {
    export namespace processautomation {
      // Mission: Automate business processes using AI to improve efficiency and reduce operational costs.
      // Monetization: Process automation subscriptions, custom workflow development, and robotic process automation (RPA).
      // IP Moat: AI-driven workflow optimization and intelligent document processing.

      export interface TaskData {
        id: string;
        taskType: string;
        status: string;
        priority: string;
        timestamp: string;
      }

      export const generateTaskData = (): TaskData => {
        const taskTypes = ['Approval', 'Review', 'Processing'];
        const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
        const statuses = ['New', 'Pending', 'Completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priorities = ['High', 'Medium', 'Low'];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];

        return {
          id: Kernel.generateId(),
          taskType,
          status,
          priority,
          timestamp: Kernel.generateTimestamp(),
        };
      };

      export const automateTask = (task: TaskData): string => {
        // Simplified task automation logic
        return `Automating ${task.taskType} task with priority ${task.priority}.`;
      };

      export const runProcessAutomationApp = (): void => {
        const task = generateTaskData();
        const automationStatus = automateTask(task);

        console.log('Process Automation:');
        console.log('Task ID:', task.id);
        console.log('Status:', automationStatus);
      };
    }
  }

  // 9. Citibankdemobusinessinc.hr.talentacquisitionai
  export namespace hr {
    export namespace talentacquisitionai {
      // Mission: Improve talent acquisition using AI to identify and recruit top candidates.
      // Monetization: Recruitment process optimization, candidate scoring, and talent pool management.
      // IP Moat: AI-powered resume screening and candidate matching.

      export interface CandidateData {
        id: string;
        name: string;
        skills: string[];
        experience: number;
        education: string;
      }

      export const generateCandidateData = (): CandidateData => {
        const names = ['David', 'Eve', 'Frank'];
        const name = names[Math.floor(Math.random() * names.length)];
        const skills = ['Java', 'Python', 'SQL'];
        const experience = Math.floor(Kernel.generateRandomNumber(0, 10));
        const educations = ['Bachelor', 'Master', 'PhD'];

        return {
          id: Kernel.generateId(),
          name,
          skills,
          experience,
          education: educations[Math.floor(Math.random() * educations.length)],
        };
      };

      export const matchCandidate = (candidate: CandidateData): string => {
        // Simplified candidate matching logic
        return `Matching candidate ${candidate.name} with skills ${candidate.skills.join(', ')}.`;
      };

      export const runTalentAcquisitionAIApp = (): void => {
        const candidate = generateCandidateData();
        const matchStatus = matchCandidate(candidate);

        console.log('Talent Acquisition AI:');
        console.log('Candidate ID:', candidate.id);
        console.log('Match Status:', matchStatus);
      };
    }
  }

  // 10. Citibankdemobusinessinc.sustainability.esganalytics
  export namespace sustainability {
    export namespace esganalytics {
      // Mission: Provide ESG analytics using AI to help businesses make sustainable decisions.
      // Monetization: ESG scoring, sustainability reporting, and investment recommendations.
      // IP Moat: AI-driven ESG data analysis and sustainability risk assessment.

      export interface CompanyData {
        id: string;
        name: string;
        industry: string;
        esgScore: number;
      }

      export const generateCompanyData = (): CompanyData => {
        const industries = ['Tech', 'Finance', 'Energy'];
        const esgScore = Kernel.generateRandomNumber(0, 100);

        return {
          id: Kernel.generateId(),
          name: `Company ${Kernel.generateId()}`,
          industry: industries[Math.floor(Math.random() * industries.length)],
          esgScore,
        };
      };

      export const analyzeESG = (company: CompanyData): string => {
        // Simplified ESG analysis logic
        return `Analyzing ESG score of ${company.esgScore} for company ${company.name}.`;
      };

      export const runESGAnalyticsApp = (): void => {
        const company = generateCompanyData();
        const analysisResult = analyzeESG(company);

        console.log('ESG Analytics:');
        console.log('Company ID:', company.id);
        console.log('Analysis Result:', analysisResult);
      };
    }
  }

  // Master Orchestration Layer
  export const orchestrateCitibankdemobusinessinc = (): void => {
    console.log('Orchestrating Citibankdemobusinessinc Ecosystem...');
    openaccess.creditriskmodel.runCreditRiskApp();
    aifinance.fraudguard.runFraudGuardApp();
    wealthmanager.roboadvisor.runRoboAdvisorApp();
    insurtech.smartclaims.runSmartClaimsApp();
    regtech.complianceai.runComplianceAIApp();
    cybersecurity.threatdetect.runThreatDetectApp();
    customerexperience.personalizationai.runPersonalizationAIApp();
    operations.processautomation.runProcessAutomationApp();
    hr.talentacquisitionai.runTalentAcquisitionAIApp();
    sustainability.esganalytics.runESGAnalyticsApp();
    console.log('Citibankdemobusinessinc Ecosystem Orchestration Complete.');
  };
}

// Run the orchestration
Citibankdemobusinessinc.orchestrateCitibankdemobusinessinc();

// GraphQL Schema for AI Risk Registry
const GET_RISK_DATA = gql`
  query GetRiskData {
    listAnomalies(status: null) { # Fetch all anomalies initially
      id
      description
      details
      severity
      status
      timestamp
      riskScore
      entityType
      entityId
    }
  }
`;

const UPDATE_ANOMALY_STATUS = gql`
  mutation UpdateAnomalyStatus($anomalyId: ID!, $status: AnomalyStatus!, $resolutionNotes: String) {
    resolveAnomaly(anomalyId: $anomalyId, status: $status, resolutionNotes: $resolutionNotes) {
      id
      status
      resolutionNotes
    }
  }
`;

type Anomaly = {
  id: string;
  description: string;
  details: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  timestamp: string;
  riskScore: number;
  entityType: string;
  entityId: string;
};

const AIRiskRegistryView: React.FC = () => {
  const { loading, error, data, refetch } = useQuery<{ listAnomalies: Anomaly[] }>(GET_RISK_DATA);
  const [updateAnomalyStatus] = useMutation(UPDATE_ANOMALY_STATUS, {
    onCompleted: () => refetch(), // Refetch data after status update
  });

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<AnomalyStatus | ''>('');

  const anomalies = data?.listAnomalies || [];

  const filteredAnomalies = useMemo(() => {
    if (!filterStatus) {
      return anomalies;
    }
    return anomalies.filter(a => a.status === filterStatus);
  }, [anomalies, filterStatus]);

  const severityData = useMemo(() => {
    const counts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    filteredAnomalies.forEach(anomaly => {
      if (counts.hasOwnProperty(anomaly.severity)) {
        counts[anomaly.severity]++;
      }
    });
    return Object.entries(counts).map(([severity, value]) => ({ severity, value }));
  }, [filteredAnomalies]);

  const handleUpdateStatus = (newStatus: AnomalyStatus) => {
    if (selectedAnomaly) {
      updateAnomalyStatus({
        variables: {
          anomalyId: selectedAnomaly.id,
          status: newStatus,
          resolutionNotes: newStatus !== AnomalyStatus.Dismissed ? resolutionNotes : '', // Only save notes if not dismissed
        },
      });
      setSelectedAnomaly(null);
      setResolutionNotes('');
    }
  };

  const getSeverityColor = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.Low: return 'bg-green-500';
      case AnomalySeverity.Medium: return 'bg-yellow-500';
      case AnomalySeverity.High: return 'bg-orange-500';
      case AnomalySeverity.Critical: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderSeverityIcon = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.Low: return <AiOutlineCheckCircle className="text-green-400" />;
      case AnomalySeverity.Medium: return <AiOutlineWarning className="text-yellow-400" />;
      case AnomalySeverity.High: return <TbAlertTriangleFilled className="text-orange-400 animate-pulse" />;
      case AnomalySeverity.Critical: return <TbAlertTriangleFilled className="text-red-400 animate-pulse text-xl" />;
      default: return null;
    }
  };

  if (loading && !data) return <div className="flex justify-center items-center h-full">Loading AI Risks...</div>;
  if (error) return <div className="text-red-500">Error loading AI Risks: {error.message}</div>;

  return (
    <FeatureGuard view={View.AIRiskRegistry}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-100">AI Risk Registry</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-md flex items-center space-x-4">
            <div>
              <div className="text-sm font-medium text-gray-400">Total Risks</div>
              <div className="text-3xl font-bold text-gray-100">{anomalies.length}</div>
            </div>
          </div>
          {severityData.map(({ severity, value }) => (
            <div key={severity} className="bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-md flex items-center space-x-4 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => setFilterStatus(severity as AnomalyStatus)}>
              <div>
                <div className="text-sm font-medium text-gray-400 capitalize">{severity}</div>
                <div className={`text-3xl font-bold ${getSeverityColor(severity as AnomalySeverity)} rounded-full p-2`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-300">Filter by Status:</label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AnomalyStatus)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
            >
              <option value="">All</option>
              <option value={AnomalyStatus.New}>New</option>
              <option value={AnomalyStatus.UnderReview}>Under Review</option>
              <option value={AnomalyStatus.Dismissed}>Dismissed</option>
              <option value={AnomalyStatus.Resolved}>Resolved</option>
            </select>
            <button onClick={() => { setFilterStatus(''); setSelectedAnomaly(null); }} className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Clear Filters</button>
          </div>
          <button onClick={() => refetch()} className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1">
            <AiOutlineEye className="h-5 w-5" />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Severity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Entity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {filteredAnomalies.length > 0 ? filteredAnomalies.map((anomaly) => (
                <tr key={anomaly.id} className={`${selectedAnomaly?.id === anomaly.id ? 'bg-gray-800/50' : ''} hover:bg-gray-800/30 transition-colors cursor-pointer`} onClick={() => setSelectedAnomaly(anomaly)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                    {renderSeverityIcon(anomaly.severity)}
                    <span className="capitalize">{anomaly.severity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate" title={anomaly.description}>
                    {anomaly.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 max-w-xs truncate" title={anomaly.details}>
                    {anomaly.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      anomaly.status === AnomalyStatus.New ? 'bg-blue-100 text-blue-800' :
                      anomaly.status === AnomalyStatus.UnderReview ? 'bg-yellow-100 text-yellow-800' :
                      anomaly.status === AnomalyStatus.Dismissed ? 'bg-gray-100 text-gray-800' :
                      anomaly.status === AnomalyStatus.Resolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {anomaly.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {anomaly.entityType}: {anomaly.entityId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(anomaly.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {anomaly.status === AnomalyStatus.New && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedAnomaly(anomaly); }} className="text-blue-400 hover:text-blue-300 transition-colors">Review</button>
                    )}