import React, { useState, useContext, useMemo } from 'react';
import { DataContext } from '../../../context/DataContext';
import { View } from '../../../types';
import { RoadmapItem, RoadmapStatus, RoadmapType } from '../../../types/models/roadmap';
import Chip from '../../ui/Chip';
import { ArrowRightIcon, CalendarIcon, CodeBracketIcon, CogIcon, LightBulbIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import useFeatureFlag from '../../../hooks/useFeatureFlag';
import { LockClosedIcon } from '@heroicons/react/24/solid';

// Namespace Declaration
namespace Citibankdemobusinessinc {

    // Shared Kernel - Core Utilities and Types
    export namespace Kernel {
        export type ID = string;

        export enum Status {
            Planned = "Planned",
            InProgress = "In Progress",
            Launched = "Launched",
            OnHold = "On Hold",
        }

        export function generateID(): ID {
            return Math.random().toString(36).substring(2, 15);
        }

        export function generateRandomNumber(min: number, max: number): number {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        export function generateRandomDate(start: Date, end: Date): Date {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        }

        export function generateRandomStatus(): Status {
            const statuses = Object.values(Status);
            return statuses[Math.floor(Math.random() * statuses.length)];
        }

        export function generateRandomText(length: number): string {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }
    }

    // --- Business Model 1: Citibankdemobusinessinc.openbanking.marketplace ---
    export namespace openbanking {
        export namespace marketplace {
            // Mission: To create a decentralized marketplace for financial APIs, fostering innovation and competition.
            // Monetization: Transaction fees, premium API access, and data analytics services.
            // IP Moat: Proprietary API discovery algorithm and reputation system.

            interface APIListing {
                id: Kernel.ID;
                name: string;
                description: string;
                provider: string;
                category: string;
                pricing: string;
                status: Kernel.Status;
            }

            function generateAPIListing(): APIListing {
                return {
                    id: Kernel.generateID(),
                    name: `API ${Kernel.generateRandomText(5)}`,
                    description: Kernel.generateRandomText(50),
                    provider: `Provider ${Kernel.generateRandomText(5)}`,
                    category: `Category ${Kernel.generateRandomText(5)}`,
                    pricing: `$${Kernel.generateRandomNumber(1, 100)}/call`,
                    status: Kernel.generateRandomStatus(),
                };
            }

            export function runMarketplace(): APIListing[] {
                const listings: APIListing[] = [];
                for (let i = 0; i < 10; i++) {
                    listings.push(generateAPIListing());
                }
                return listings;
            }
        }
    }

    // --- Business Model 2: Citibankdemobusinessinc.data.analytics ---
    export namespace data {
        export namespace analytics {
            // Mission: To provide advanced data analytics services to financial institutions, enabling better decision-making.
            // Monetization: Subscription fees, custom analytics reports, and consulting services.
            // IP Moat: Proprietary machine learning algorithms for financial data analysis.

            interface FinancialData {
                id: Kernel.ID;
                date: Date;
                transactionType: string;
                amount: number;
                location: string;
            }

            function generateFinancialData(): FinancialData {
                return {
                    id: Kernel.generateID(),
                    date: Kernel.generateRandomDate(new Date(2023, 0, 1), new Date()),
                    transactionType: `Type ${Kernel.generateRandomText(5)}`,
                    amount: Kernel.generateRandomNumber(10, 1000),
                    location: `Location ${Kernel.generateRandomText(5)}`,
                };
            }

            export function runAnalytics(): FinancialData[] {
                const data: FinancialData[] = [];
                for (let i = 0; i < 10; i++) {
                    data.push(generateFinancialData());
                }
                return data;
            }
        }
    }

    // --- Business Model 3: Citibankdemobusinessinc.identity.verification ---
    export namespace identity {
        export namespace verification {
            // Mission: To provide secure and reliable identity verification services for financial transactions.
            // Monetization: Per-verification fees, subscription plans for high-volume users.
            // IP Moat: Advanced biometric authentication and fraud detection algorithms.

            interface IdentityRecord {
                id: Kernel.ID;
                name: string;
                address: string;
                dob: Date;
                verificationStatus: string;
            }

            function generateIdentityRecord(): IdentityRecord {
                return {
                    id: Kernel.generateID(),
                    name: `Name ${Kernel.generateRandomText(5)}`,
                    address: `Address ${Kernel.generateRandomText(10)}`,
                    dob: Kernel.generateRandomDate(new Date(1970, 0, 1), new Date(2000, 0, 1)),
                    verificationStatus: Kernel.generateRandomStatus().toString(),
                };
            }

            export function runVerification(): IdentityRecord[] {
                const records: IdentityRecord[] = [];
                for (let i = 0; i < 10; i++) {
                    records.push(generateIdentityRecord());
                }
                return records;
            }
        }
    }

    // --- Business Model 4: Citibankdemobusinessinc.lending.platform ---
    export namespace lending {
        export namespace platform {
            // Mission: To create a peer-to-peer lending platform connecting borrowers and lenders.
            // Monetization: Loan origination fees, interest rate spreads, and late payment fees.
            // IP Moat: Proprietary credit scoring algorithm and risk management system.

            interface LoanApplication {
                id: Kernel.ID;
                borrowerName: string;
                loanAmount: number;
                interestRate: number;
                loanTerm: number;
                status: Kernel.Status;
            }

            function generateLoanApplication(): LoanApplication {
                return {
                    id: Kernel.generateID(),
                    borrowerName: `Borrower ${Kernel.generateRandomText(5)}`,
                    loanAmount: Kernel.generateRandomNumber(1000, 10000),
                    interestRate: Kernel.generateRandomNumber(5, 15) / 100,
                    loanTerm: Kernel.generateRandomNumber(12, 60),
                    status: Kernel.generateRandomStatus(),
                };
            }

            export function runLending(): LoanApplication[] {
                const applications: LoanApplication[] = [];
                for (let i = 0; i < 10; i++) {
                    applications.push(generateLoanApplication());
                }
                return applications;
            }
        }
    }

    // --- Business Model 5: Citibankdemobusinessinc.payment.gateway ---
    export namespace payment {
        export namespace gateway {
            // Mission: To provide a secure and reliable payment gateway for online transactions.
            // Monetization: Transaction fees, subscription plans for merchants.
            // IP Moat: Advanced fraud detection and security protocols.

            interface TransactionRecord {
                id: Kernel.ID;
                amount: number;
                timestamp: Date;
                status: Kernel.Status;
                merchant: string;
            }

            function generateTransactionRecord(): TransactionRecord {
                return {
                    id: Kernel.generateID(),
                    amount: Kernel.generateRandomNumber(1, 500),
                    timestamp: Kernel.generateRandomDate(new Date(2023, 0, 1), new Date()),
                    status: Kernel.generateRandomStatus(),
                    merchant: `Merchant ${Kernel.generateRandomText(5)}`,
                };
            }

            export function runGateway(): TransactionRecord[] {
                const transactions: TransactionRecord[] = [];
                for (let i = 0; i < 10; i++) {
                    transactions.push(generateTransactionRecord());
                }
                return transactions;
            }
        }
    }

    // --- Business Model 6: Citibankdemobusinessinc.wealth.management ---
    export namespace wealth {
        export namespace management {
            // Mission: To provide personalized wealth management services to high-net-worth individuals.
            // Monetization: Management fees, performance-based fees.
            // IP Moat: Proprietary investment algorithms and financial planning tools.

            interface Portfolio {
                id: Kernel.ID;
                clientName: string;
                assets: string[];
                value: number;
                riskScore: number;
            }

            function generatePortfolio(): Portfolio {
                return {
                    id: Kernel.generateID(),
                    clientName: `Client ${Kernel.generateRandomText(5)}`,
                    assets: [`Asset ${Kernel.generateRandomText(3)}`, `Asset ${Kernel.generateRandomText(3)}`],
                    value: Kernel.generateRandomNumber(100000, 1000000),
                    riskScore: Kernel.generateRandomNumber(1, 10),
                };
            }

            export function runManagement(): Portfolio[] {
                const portfolios: Portfolio[] = [];
                for (let i = 0; i < 10; i++) {
                    portfolios.push(generatePortfolio());
                }
                return portfolios;
            }
        }
    }

    // --- Business Model 7: Citibankdemobusinessinc.insurance.platform ---
    export namespace insurance {
        export namespace platform {
            // Mission: To provide a platform for comparing and purchasing insurance products.
            // Monetization: Commissions, advertising revenue.
            // IP Moat: Proprietary insurance recommendation engine.

            interface InsurancePolicy {
                id: Kernel.ID;
                policyHolder: string;
                type: string;
                coverageAmount: number;
                premium: number;
            }

            function generateInsurancePolicy(): InsurancePolicy {
                return {
                    id: Kernel.generateID(),
                    policyHolder: `Holder ${Kernel.generateRandomText(5)}`,
                    type: `Type ${Kernel.generateRandomText(5)}`,
                    coverageAmount: Kernel.generateRandomNumber(50000, 500000),
                    premium: Kernel.generateRandomNumber(100, 1000),
                };
            }

            export function runInsurance(): InsurancePolicy[] {
                const policies: InsurancePolicy[] = [];
                for (let i = 0; i < 10; i++) {
                    policies.push(generateInsurancePolicy());
                }
                return policies;
            }
        }
    }

    // --- Business Model 8: Citibankdemobusinessinc.realestate.investment ---
    export namespace realestate {
        export namespace investment {
            // Mission: To provide a platform for investing in real estate.
            // Monetization: Management fees, transaction fees.
            // IP Moat: Proprietary real estate valuation algorithm.

            interface Property {
                id: Kernel.ID;
                address: string;
                value: number;
                rentalYield: number;
                occupancyRate: number;
            }

            function generateProperty(): Property {
                return {
                    id: Kernel.generateID(),
                    address: `Address ${Kernel.generateRandomText(10)}`,
                    value: Kernel.generateRandomNumber(200000, 2000000),
                    rentalYield: Kernel.generateRandomNumber(3, 10) / 100,
                    occupancyRate: Kernel.generateRandomNumber(70, 100) / 100,
                };
            }

            export function runRealEstate(): Property[] {
                const properties: Property[] = [];
                for (let i = 0; i < 10; i++) {
                    properties.push(generateProperty());
                }
                return properties;
            }
        }
    }

    // --- Business Model 9: Citibankdemobusinessinc.healthcare.finance ---
    export namespace healthcare {
        export namespace finance {
            // Mission: To provide financial solutions for healthcare providers and patients.
            // Monetization: Loan interest, service fees.
            // IP Moat: Proprietary healthcare-specific credit scoring algorithm.

            interface MedicalBill {
                id: Kernel.ID;
                patientName: string;
                amount: number;
                dueDate: Date;
                status: Kernel.Status;
            }

            function generateMedicalBill(): MedicalBill {
                return {
                    id: Kernel.generateID(),
                    patientName: `Patient ${Kernel.generateRandomText(5)}`,
                    amount: Kernel.generateRandomNumber(50, 5000),
                    dueDate: Kernel.generateRandomDate(new Date(), new Date(2024, 11, 31)),
                    status: Kernel.generateRandomStatus(),
                };
            }

            export function runHealthcareFinance(): MedicalBill[] {
                const bills: MedicalBill[] = [];
                for (let i = 0; i < 10; i++) {
                    bills.push(generateMedicalBill());
                }
                return bills;
            }
        }
    }

    // --- Business Model 10: Citibankdemobusinessinc.education.finance ---
    export namespace education {
        export namespace finance {
            // Mission: To provide financial solutions for students and educational institutions.
            // Monetization: Loan interest, service fees.
            // IP Moat: Proprietary education-specific credit scoring algorithm.

            interface StudentLoan {
                id: Kernel.ID;
                studentName: string;
                loanAmount: number;
                interestRate: number;
                term: number;
            }

            function generateStudentLoan(): StudentLoan {
                return {
                    id: Kernel.generateID(),
                    studentName: `Student ${Kernel.generateRandomText(5)}`,
                    loanAmount: Kernel.generateRandomNumber(1000, 50000),
                    interestRate: Kernel.generateRandomNumber(3, 12) / 100,
                    term: Kernel.generateRandomNumber(1, 10),
                };
            }

            export function runEducationFinance(): StudentLoan[] {
                const loans: StudentLoan[] = [];
                for (let i = 0; i < 10; i++) {
                    loans.push(generateStudentLoan());
                }
                return loans;
            }
        }
    }

    // --- Orchestration Layer ---
    export function orchestrate(): void {
        console.log("Citibankdemobusinessinc Orchestration Layer");
        console.log("Running Open Banking Marketplace:", openbanking.marketplace.runMarketplace());
        console.log("Running Data Analytics:", data.analytics.runAnalytics());
        console.log("Running Identity Verification:", identity.verification.runVerification());
        console.log("Running Lending Platform:", lending.platform.runLending());
        console.log("Running Payment Gateway:", payment.gateway.runGateway());
        console.log("Running Wealth Management:", wealth.management.runManagement());
        console.log("Running Insurance Platform:", insurance.platform.runInsurance());
        console.log("Running Real Estate Investment:", realestate.investment.runRealEstate());
        console.log("Running Healthcare Finance:", healthcare.finance.runHealthcareFinance());
        console.log("Running Education Finance:", education.finance.runEducationFinance());
    }
}

// Mock Data Structure for the Roadmap - This would ideally come from the GraphQL API (e.g., /roadmap)
const initialRoadmap: RoadmapItem[] = [
    {
        id: "roadmap-1",
        title: "Quantum Oracle 1.0 Launch",
        description: "Full public launch of the What-If Simulation Engine. Includes core finance modeling (budget/goal impact).",
        status: RoadmapStatus.Launched,
        type: RoadmapType.CoreFeature,
        milestones: ["Q4/2023 - Alpha Release", "Q1/2024 - Beta Testing", "Q2/2024 - Public Release"],
        kpiTarget: "15% Active User Engagement",
        quarter: "Q2 2024",
    },
    {
        id: "roadmap-2",
        title: "AI Agent Marketplace Framework",
        description: "Infrastructure for third-party and internal AI agents to be listed, discovered, and integrated.",
        status: RoadmapStatus.InProgress,
        type: RoadmapType.Platform,
        milestones: ["Q2/2024 - Core Schema Defined", "Q3/2024 - Agent SDK Alpha"],
        kpiTarget: "5 Agent Integrations Live",
        quarter: "Q3 2024",
    },
    {
        id: "roadmap-3",
        title: "Generative Jurisprudence",
        description: "Blueprint implementation: AI generates draft legal documents based on the user's Constitutional Charter.",
        status: RoadmapStatus.InProgress,
        type: RoadmapType.Blueprint,
        milestones: ["Q3/2024 - Initial Charter Parser", "Q4/2024 - Contract Generation MVP"],
        kpiTarget: "90% Accuracy on Indemnity Clauses",
        quarter: "Q4 2024",
    },
    {
        id: "roadmap-4",
        title: "Economic Synthesis Engine (v1)",
        description: "First stable release of the internal micro-economy simulator to test policy impact.",
        status: RoadmapStatus.Planned,
        type: RoadmapType.Advanced,
        milestones: ["Q4/2024 - Core Agent Logic Complete", "Q1/2025 - Initial Simulation Deployment"],
        kpiTarget: "100% Consistency with Axioms",
        quarter: "Q1 2025",
    },
    {
        id: "roadmap-5",
        title: "Biometric Wallet Integration",
        description: "Integration with native device biometrics (FaceID/TouchID) for high-security transactions.",
        status: RoadmapStatus.Planned,
        type: RoadmapType.Security,
        milestones: ["Q4/2024 - Proof of Concept", "Q1/2025 - Full Rollout"],
        kpiTarget: "Zero Credential Compromise Incidents",
        quarter: "Q1 2025",
    },
];

// Utility Functions
const getStatusClasses = (status: RoadmapStatus): string => {
    switch (status) {
        case RoadmapStatus.Launched:
            return "bg-green-500/20 text-green-400 border-green-500";
        case RoadmapStatus.InProgress:
            return "bg-cyan-500/20 text-cyan-400 border-cyan-500";
        case RoadmapStatus.Planned:
            return "bg-gray-500/20 text-gray-400 border-gray-500";
        case RoadmapStatus.OnHold:
            return "bg-amber-500/20 text-amber-400 border-amber-500";
        default:
            return "bg-gray-500/20 text-gray-400 border-gray-500";
    }
};

const getTypeIcon = (type: RoadmapType): React.ReactElement => {
    switch (type) {
        case RoadmapType.CoreFeature:
            return <RocketLaunchIcon className="w-4 h-4 text-cyan-400" />;
        case RoadmapType.Platform:
            return <CodeBracketIcon className="w-4 h-4 text-blue-400" />;
        case RoadmapType.Advanced:
            return <CogIcon className="w-4 h-4 text-purple-400" />;
        case RoadmapType.Blueprint:
            return <LightBulbIcon className="w-4 h-4 text-yellow-400" />;
        case RoadmapType.Security:
            return <LockClosedIcon className="w-4 h-4 text-red-400" />;
        default:
            return <LightBulbIcon className="w-4 h-4 text-gray-400" />;
    }
};

// --- Sub-Components ---

interface RoadmapCardProps {
    item: RoadmapItem;
    isDetailView: boolean;
    onToggleDetail: (id: string) => void;
}

const RoadmapCard: React.FC<RoadmapCardProps> = ({ item, isDetailView, onToggleDetail }) => {
    const statusClasses = getStatusClasses(item.status);
    
    return (
        <div className={`p-5 rounded-xl transition-all duration-300 shadow-lg ${isDetailView ? 'bg-gray-800/70 border border-cyan-500/50' : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800/80'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                    <Chip label={item.quarter} className="text-xs font-semibold bg-gray-700/50 text-gray-300 border-gray-600" />
                    <Chip 
                        label={item.type} 
                        icon={getTypeIcon(item.type)}
                        className={`text-xs font-semibold border ${statusClasses}`}
                    />
                </div>
                <Chip 
                    label={item.status} 
                    className={`text-xs font-semibold border ${statusClasses}`}
                />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-gray-400 mb-4 line-clamp-2">{item.description}</p>

            <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                <div className="text-sm text-gray-400 flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4 text-cyan-400" />
                    <span>Target KPI: {item.kpiTarget}</span>
                </div>
                
                <button
                    onClick={() => onToggleDetail(item.id)}
                    className="flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group"
                >
                    {isDetailView ? 'Hide Details' : 'View Milestones'}
                    {isDetailView ? <ChevronUpIcon className="w-4 h-4 ml-1 transition-transform group-hover:scale-110" /> : <ChevronDownIcon className="w-4 h-4 ml-1 transition-transform group-hover:scale-110" />}
                </button>
            </div>

            {isDetailView && (
                <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Milestones:</h4>
                    <ol className="relative border-l border-gray-600 ml-2">
                        {item.milestones.map((milestone, index) => (
                            <li key={index} className="mb-3 ml-6">
                                <span className={`absolute flex items-center justify-center w-3 h-3 bg-cyan-600 rounded-full -left-1.5 ring-8 ring-gray-800/50`}>
                                    {index === item.milestones.length - 1 ? 
                                        <RocketLaunchIcon className="w-2 h-2 text-white" /> : 
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                    }
                                </span>
                                <p className="text-sm font-medium text-gray-200">{milestone.split(' - ')[0]}</p>
                                <p className="text-xs text-gray-500">{milestone.split(' - ').slice(1).join(' - ')}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};


// --- Main Component ---

const RoadmapView: React.FC = () => {
    const { setCustomBackgroundUrl, activeIllusion } = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<RoadmapStatus | 'All'>('All');
    const [selectedType, setSelectedType] = useState<RoadmapType | 'All'>('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Enable the 'aurora-illusion' for high-level strategic views
    React.useEffect(() => {
        setCustomBackgroundUrl(null); // Turn off custom image background
        // @ts-ignore - Global CSS class manipulation for illusion effects
        document.body.classList.add('aurora-illusion');
        return () => {
            // @ts-ignore
            document.body.classList.remove('aurora-illusion');
        };
    }, [setCustomBackgroundUrl]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredRoadmap = useMemo(() => {
        let filtered = initialRoadmap;

        if (selectedStatus !== 'All') {
            filtered = filtered.filter(item => item.status === selectedStatus);
        }

        if (selectedType !== 'All') {
            filtered = filtered.filter(item => item.type === selectedType);
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(lowerCaseSearch) ||
                item.description.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // Sort by quarter, then by status (Launched last)
        return filtered.sort((a, b) => {
            if (a.quarter === b.quarter) {
                if (a.status === b.status) return 0;
                if (a.status === RoadmapStatus.Launched) return 1;
                if (b.status === RoadmapStatus.Launched) return -1;
                return 0; // Maintain relative order for others in the same quarter
            }
            // Simple string comparison for quarters should work for the mock data format QX/YYYY
            return a.quarter.localeCompare(b.quarter);
        });
    }, [searchTerm, selectedStatus, selectedType]);

    const statusOptions: ('All' | RoadmapStatus)[] = ['All', RoadmapStatus.Launched, RoadmapStatus.InProgress, RoadmapStatus.Planned, RoadmapStatus.OnHold];
    const typeOptions: ('All' | RoadmapType)[] = ['All', RoadmapType.CoreFeature, RoadmapType.Platform, RoadmapType.Advanced, RoadmapType.Blueprint, RoadmapType.Security];

    return (
        <div className="space-y-8">
            <header className="pb-4 border-b border-gray-800">
                <h1 className="text-4xl font-extrabold text-white tracking-tighter">The Sovereign's Roadmap</h1>
                <p className="text-gray-400 mt-1">Charting the course of will across the temporal expanse. Every milestone is a command executed.</p>
            </header>

            {/* Control Panel */}
            <div className="bg-gray-800/50 p-5 rounded-xl shadow-inner border border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search titles or descriptions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-2 pl-10 pr-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                        <ArrowRightIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 rotate-90" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                    <span className="text-gray-400 font-medium mr-1 self-center">Filter By:</span>
                    
                    <div className="flex flex-wrap gap-2">
                        <span className="font-bold text-white text-xs self-center mr-1">Status:</span>
                        {statusOptions.map(status => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status as RoadmapStatus | 'All')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border 
                                    ${selectedStatus === status 
                                        ? getStatusClasses(status as RoadmapStatus) + ' ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400' 
                                        : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="font-bold text-white text-xs self-center mr-1">Type:</span>
                        {typeOptions.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type as RoadmapType | 'All')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border flex items-center space-x-1
                                    ${selectedType === type 
                                        ? (type === 'All' ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400' : getTypeIcon(type as RoadmapType) + ' ' + getStatusClasses(RoadmapStatus.InProgress) + ' ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400') 
                                        : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'
                                    }`}
                            >
                                {type !== 'All' && getTypeIcon(type as RoadmapType)}
                                <span>{type}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Roadmap Timeline */}
            <div className="space-y-6">
                {filteredRoadmap.length > 0 ? (
                    filteredRoadmap.map(item => (
                        <RoadmapCard
                            key={item.id}
                            item={item}
                            isDetailView={expandedId === item.id}
                            onToggleDetail={toggleExpand}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                        <LightBulbIcon className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                        <h4 className="text-lg text-white">No Manifestations Found</h4>
                        <p className="text-gray-400">Adjust your filters or search term to reveal hidden potential.</p>
                    </div>
                )}
            </div>

             {/* Visual Timeline Footer */}
            <div className="pt-8 border-t border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-4">Timeline View</h2>
                <div className="flex justify-between text-sm text-gray-400 border-b border-gray-700 pb-2 mb-4">
                    <div className="w-1/5 font-semibold">Quarter</div>
                    <div className="w-1/5 font-semibold">Status Coverage</div>
                    <div className="w-3/5 font-semibold">Key Initiatives</div>
                </div>
                {Object.entries(
                    filteredRoadmap.reduce((acc, item) => {
                        const quarterKey = item.quarter;
                        if (!acc[quarterKey]) {
                            acc[quarterKey] = { planned: 0, inProgress: 0, launched: 0, items: [] };
                        }
                        if (item.status === RoadmapStatus.Planned) acc[quarterKey].planned++;
                        if (item.status === RoadmapStatus.InProgress) acc[quarterKey].inProgress++;
                        if (item.status === RoadmapStatus.Launched) acc[quarterKey].launched++;
                        acc[quarterKey].items.push(item);
                        return acc;
                    }, {} as Record<string, { planned: number, inProgress: number, launched: number, items: RoadmapItem[] }>)
                ).sort(([qA], [qB]) => qA.localeCompare(qB)).map(([quarter, data]) => (
                    <div key={quarter} className="flex justify-between items-center py-3 border-b border-gray-800/50 hover:bg-gray-800/20 transition rounded-md px-1">
                        <div className="w-1/5 text-white font-bold">{quarter}</div>
                        <div className="w-1/5 flex space-x-2 text-xs">
                            {data.launched > 0 && <Chip label={`${data.launched} Done`} className="bg-green-500/20 text-green-400 border-green-500" />}
                            {data.inProgress > 0 && <Chip label={`${data.inProgress} In Progress`} className="bg-cyan-500/20 text-cyan-400 border-cyan-500" />}
                            {data.planned > 0 && <Chip label={`${data.planned} Planned`} className="bg-gray-500/20 text-gray-400 border-gray-500"