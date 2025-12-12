import React, { useState } from 'react';
import { SparklesIcon, Cog6ToothIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

// --- Type Definitions ---
enum BuildStatus {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
    RUNNING = 'RUNNING',
    QUEUED = 'QUEUED',
}

interface Stage {
    name: string;
    durationMs: number;
    status: BuildStatus;
    testsPassed: number;
    testsTotal: number;
}

interface Pipeline {
    id: string;
    name: string;
    description: string;
    lastBuildId: string;
    status: BuildStatus;
    lastRun: string; // DateTime string
    durationMs: number;
    stages: Stage[];
    branch: string;
}

// --- Utility Functions ---

const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
};

const getStatusColor = (status: BuildStatus): string => {
    switch (status) {
        case BuildStatus.SUCCESS: return 'text-green-400 bg-green-900/30';
        case BuildStatus.FAILURE: return 'text-red-400 bg-red-900/30';
        case BuildStatus.RUNNING: return 'text-cyan-400 bg-cyan-900/30 animate-pulse';
        case BuildStatus.QUEUED: return 'text-gray-400 bg-gray-700/30';
        default: return 'text-gray-500 bg-gray-800';
    }
};

const getStatusIcon = (status: BuildStatus): React.ReactElement => {
    switch (status) {
        case BuildStatus.SUCCESS: return <CheckCircleIcon className="w-5 h-5" />;
        case BuildStatus.FAILURE: return <XCircleIcon className="w-5 h-5" />;
        case BuildStatus.RUNNING: return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
        default: return <ClockIcon className="w-5 h-5" />;
    }
};

// --- Sub-Components ---

interface PipelineCardProps {
    pipeline: Pipeline;
    isSelected: boolean;
    onSelect: (pipeline: Pipeline) => void;
}

const PipelineCard: React.FC<PipelineCardProps> = ({ pipeline, isSelected, onSelect }) => {
    const colorClass = getStatusColor(pipeline.status);
    const testsFailed = pipeline.stages.reduce((sum, stage) => sum + (stage.testsTotal - stage.testsPassed), 0);

    return (
        <div
            className={`p-4 border rounded-lg shadow-lg cursor-pointer transition-all duration-200 
            ${isSelected ? 'border-cyan-400 ring-4 ring-cyan-500/20 bg-gray-800' : 'border-gray-700 hover:border-cyan-500 hover:bg-gray-800/50'}`}
            onClick={() => onSelect(pipeline)}
        >
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold truncate text-white">{pipeline.name}</h3>
                <div className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${colorClass}`}>
                    {getStatusIcon(pipeline.status)}
                    {pipeline.status}
                </div>
            </div>
            <p className="text-sm text-gray-400 mt-1 mb-3">{pipeline.description}</p>
            
            <div className="text-xs text-gray-500 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-300">{pipeline.lastBuildId} on {pipeline.branch}</span>
                    <span>Last Run: {new Date(pipeline.lastRun).toLocaleString()}</span>
                </div>
                <div className="text-right">
                    <span className="block font-semibold text-gray-300">Duration: {formatDuration(pipeline.durationMs)}</span>
                    {testsFailed > 0 && (
                         <span className="text-red-400 font-medium">{testsFailed} Tests Failed</span>
                    )}
                </div>
            </div>
        </div>
    );
};


const StageNode: React.FC<{ stage: Stage, index: number, total: number }> = ({ stage, index, total }) => {
    const colorClass = getStatusColor(stage.status);
    const isLast = index === total - 1;

    const testsInfo = stage.testsTotal > 0 ? (
        <span className={`text-xs ${stage.status === BuildStatus.SUCCESS ? 'text-green-300' : 'text-red-400'}`}>
            {stage.testsPassed}/{stage.testsTotal} Tests
        </span>
    ) : null;
    
    return (
        <div className="flex items-center">
            <div className="flex flex-col items-center">
                <div className={`w-28 h-28 p-4 rounded-xl border flex flex-col justify-center items-center shadow-lg transition-colors duration-300 
                                ${stage.status === BuildStatus.RUNNING ? 'border-cyan-500 ring-4 ring-cyan-500/20 bg-gray-800' : 
                                   stage.status === BuildStatus.SUCCESS ? 'border-green-600 bg-gray-800/70' :
                                   stage.status === BuildStatus.FAILURE ? 'border-red-600 bg-gray-800/70' : 'border-gray-600 bg-gray-800/50'}`}>
                    <div className={`flex items-center justify-center rounded-full p-1 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                        {getStatusIcon(stage.status)}
                    </div>
                    <span className="text-sm font-semibold mt-2 text-white text-center leading-tight">{stage.name}</span>
                    <span className="text-xs text-gray-400 mt-1">{formatDuration(stage.durationMs)}</span>
                    {testsInfo}
                </div>
            </div>
            {!isLast && (
                <div className="flex-1 min-w-[50px] relative h-full">
                    <div className={`absolute left-0 top-1/2 w-full h-1 -translate-y-1/2 ${
                        stage.status === BuildStatus.SUCCESS ? 'bg-green-600' :
                        stage.status === BuildStatus.FAILURE ? 'bg-red-600' : 'bg-gray-600'
                    }`}></div>
                    <ChevronRightIcon className="absolute right-0 top-1/2 w-4 h-4 -translate-y-1/2 transform text-gray-500" />
                </div>
            )}
        </div>
    );
};

const PipelineFlow: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    return (
        <div className="overflow-x-auto py-4">
            <div className="flex space-x-6 items-center w-max">
                {pipeline.stages.map((stage, index) => (
                    <StageNode key={index} stage={stage} index={index} total={pipeline.stages.length} />
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---

const CiCdView: React.FC = () => {
    const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>(Citibankdemobusinessinc.orchestration.pipelines[0]);

    // Simulated AI Root Cause Analysis for a failed build
    const aiAnalysis = selectedPipeline.status === BuildStatus.FAILURE
        ? `
        **Incident Summary (Build ${selectedPipeline.lastBuildId}):** The pipeline failed during the 'Validation Tests' stage (Stage 3).
        
        **Root Cause Analysis (AI Probability 92%):** A dependency change in the latest commit to \`${selectedPipeline.branch}\` introduced a mismatch in the input tensor shape for the AI scoring engine. Specifically, the 'date_of_birth' field was switched from an integer to a string, causing a runtime exception during the first validation batch.
        
        **Recommended Fix:** Revert the data type of 'date_of_birth' in the feature engineering script or update the model ingestion layer. The last successful build was \`b-899\`. Rerunning the pipeline on the previous commit \`git checkout ${selectedPipeline.lastBuildId}-1\` is recommended for an immediate fix.
        `
        : selectedPipeline.status === BuildStatus.RUNNING
        ? `
        **Status Prediction:** The 'Integration Tests' stage is currently running (300/650 total seconds). 
        
        **Success Probability (AI):** **78%**. The current resource allocation is stable, and test coverage is high. However, latency spiking has been observed in the external account simulator, which could lead to test timeouts.
        
        **AI Recommendation:** Monitor external service latency. Consider pausing non-critical adjacent pipelines (e.g., 'p-ai-advisor') to free up shared resources for this high-priority deployment.
        `
        : `
        **Deployment Confidence:** This pipeline, running on branch \`${selectedPipeline.branch}\`, has successfully passed all stages.
        
        **Next Steps (AI Recommendation):** Schedule an automated promotional deployment to the 'Canary' environment at the next low-traffic window (02:00 UTC). No manual intervention required.
        `;

    return (
        <div className="space-y-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    CI/CD Pipelines
                </h1>
                <p className="text-gray-400">
                    Continuous Integration and Deployment. Command the automated assembly lines of the Sovereign Ledger.
                </p>
            </header>

            {/* Pipeline List Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Citibankdemobusinessinc.orchestration.pipelines.map((p) => (
                    <PipelineCard
                        key={p.id}
                        pipeline={p}
                        isSelected={p.id === selectedPipeline.id}
                        onSelect={setSelectedPipeline}
                    />
                ))}
            </div>

            {/* Detailed View and AI Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pipeline Details & Flow */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
                    <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                        <Cog6ToothIcon className="w-6 h-6 mr-2 text-cyan-400" />
                        {selectedPipeline.name} - Build {selectedPipeline.lastBuildId}
                    </h2>
                    <div className={`p-3 rounded-lg text-sm font-medium mb-4 w-fit ${getStatusColor(selectedPipeline.status)}`}>
                        Current Status: {selectedPipeline.status}
                    </div>

                    <div className="border-b border-gray-700 pb-4 mb-4">
                        <p className="text-gray-400">Branch: <span className="font-mono text-cyan-300">{selectedPipeline.branch}</span></p>
                        <p className="text-gray-400">Total Duration: <span className="text-white font-semibold">{formatDuration(selectedPipeline.durationMs)}</span></p>
                    </div>

                    <h3 className="text-xl font-medium text-white mb-4">Execution Flow</h3>
                    <PipelineFlow pipeline={selectedPipeline} />
                </div>

                {/* AI Analysis Panel */}
                <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
                    <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-2 text-fuchsia-400" />
                        AI Strategy Advisor
                    </h2>
                    <div className="prose prose-sm prose-invert text-gray-300 space-y-3 whitespace-pre-line">
                        {aiAnalysis}
                    </div>
                    {selectedPipeline.status === BuildStatus.FAILURE && (
                        <button className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors">
                            Rerun with AI Suggested Fix
                        </button>
                    )}
                </div>
            </div>
            
            {/* Logs & Metrics Placeholder */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
                <h2 className="text-2xl font-semibold text-white mb-4">Build Logs & Metrics</h2>
                <div className="h-64 overflow-y-scroll bg-gray-950 p-3 rounded font-mono text-xs text-green-300/90">
                    <p className="text-gray-500">$ BUILD_START build-{selectedPipeline.lastBuildId}</p>
                    <p>Executing Stage 1: Checkout...</p>
                    <p>[SUCCESS] Docker image tagged: core-api:latest</p>
                    <p>Executing Stage 2: Unit Tests...</p>
                    {selectedPipeline.status === BuildStatus.FAILURE && (
                        <>
                            <p className="text-yellow-400">[WARN] Dependency version mismatch detected (v1.2.3 vs v1.2.4)</p>
                            <p className="text-red-400">[ERROR] Test suite 'DataValidation' failed 50/90 tests.</p>
                            <p className="text-red-400">java.lang.IllegalArgumentException: Invalid tensor shape for input 'date_of_birth'</p>
                            <p className="text-gray-500">$ BUILD_FAIL</p>
                        </>
                    )}
                    {selectedPipeline.status === BuildStatus.RUNNING && (
                        <>
                            <p>Executing Stage 3: Integration Tests... (35% complete)</p>
                            <p className="text-cyan-400">Testing external account synchronization...</p>
                        </>
                    )}
                    {selectedPipeline.status === BuildStatus.SUCCESS && (
                        <>
                            <p>[SUCCESS] All tests passed.</p>
                            <p>Executing Stage 4: Deploy Prod...</p>
                            <p className="text-green-400">[SUCCESS] Deployment complete. Rollout 100%.</p>
                            <p className="text-gray-500">$ BUILD_SUCCESS</p>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};

// --- Citibankdemobusinessinc Ecosystem ---

namespace Citibankdemobusinessinc {

    // --- Shared Kernel ---
    export namespace kernel {
        export const brandName = "Citibank demo business inc";

        // Generative Data Functions
        export function generateId(): string {
            return Math.random().toString(36).substring(2, 15);
        }

        export function generateRandomNumber(min: number, max: number): number {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        export function generateRandomDate(start: Date, end: Date): Date {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        }

        export function generateRandomStatus<T>(statuses: T[]): T {
            return statuses[Math.floor(Math.random() * statuses.length)];
        }

        export function generateRandomDescription(words: number): string {
            let description = '';
            const loremIpsum = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");
            for (let i = 0; i < words; i++) {
                description += loremIpsum[Math.floor(Math.random() * loremIpsum.length)] + " ";
            }
            return description.trim();
        }
    }

    // --- Orchestration Layer ---
    export namespace orchestration {
        import generateId = kernel.generateId;
        import generateRandomNumber = kernel.generateRandomNumber;
        import generateRandomDate = kernel.generateRandomDate;
        import generateRandomStatus = kernel.generateRandomStatus;
        import generateRandomDescription = kernel.generateRandomDescription;

        // Define possible build statuses
        const buildStatuses: BuildStatus[] = [BuildStatus.SUCCESS, BuildStatus.FAILURE, BuildStatus.RUNNING, BuildStatus.QUEUED];

        // Function to generate a mock stage
        function generateStage(name: string): Stage {
            const status = generateRandomStatus(buildStatuses);
            const durationMs = generateRandomNumber(60000, 600000); // 1min to 10min
            const testsTotal = generateRandomNumber(50, 500);
            const testsPassed = status === BuildStatus.SUCCESS || status === BuildStatus.RUNNING ? generateRandomNumber(testsTotal / 2, testsTotal) : generateRandomNumber(0, testsTotal / 2);

            return {
                name: name,
                durationMs: durationMs,
                status: status,
                testsPassed: testsPassed,
                testsTotal: testsTotal,
            };
        }

        // Function to generate a mock pipeline
        function generatePipeline(name: string, description: string, branch: string): Pipeline {
            const status = generateRandomStatus(buildStatuses);
            const durationMs = generateRandomNumber(300000, 1200000); // 5min to 20min
            const lastRun = generateRandomDate(new Date(2024, 0, 1), new Date());

            const stages: Stage[] = [
                generateStage('Checkout'),
                generateStage('Unit Tests'),
                generateStage('Integration Tests'),
                generateStage('Deploy Canary'),
                generateStage('Deploy Prod'),
            ];

            return {
                id: generateId(),
                name: name,
                description: description,
                lastBuildId: generateId(),
                status: status,
                lastRun: lastRun.toISOString(),
                durationMs: durationMs,
                stages: stages,
                branch: branch,
            };
        }

        // Generate mock pipelines
        export const pipelines: Pipeline[] = [
            generatePipeline(
                'Core Payment API',
                'Handles all account transactions and settlement logic.',
                'main'
            ),
            generatePipeline(
                'Sovereign UI/UX',
                'Build and deployment pipeline for the React front-end application.',
                'feat/new-sidebar'
            ),
            generatePipeline(
                'AI Model Service',
                'Retrain, test, and deploy the Quantum AI Advisor model.',
                'main'
            ),
            generatePipeline(
                'Fraud Detection Engine',
                'Pipeline for training and deploying the real-time fraud detection model.',
                'develop'
            ),
            generatePipeline(
                'Customer Onboarding Service',
                'Build and deploy the microservice responsible for new customer onboarding.',
                'release/v1.0'
            ),
            generatePipeline(
                'Regulatory Reporting System',
                'Automated pipeline for generating and submitting regulatory reports.',
                'main'
            ),
            generatePipeline(
                'Data Warehouse ETL',
                'Extract, transform, and load pipeline for the enterprise data warehouse.',
                'staging'
            ),
            generatePipeline(
                'Mobile Banking App',
                'CI/CD pipeline for the iOS and Android mobile banking applications.',
                'hotfix/security'
            ),
            generatePipeline(
                'Open Banking API Gateway',
                'Deployment pipeline for the API gateway managing open banking integrations.',
                'main'
            ),
            generatePipeline(
                'Cloud Infrastructure Provisioning',
                'Automated infrastructure provisioning and configuration management.',
                'production'
            ),
        ];
    }

    // --- Business Model Branches ---
    export namespace viewit {
        export namespace movieplayform {
            // Mission: Revolutionize movie streaming with AI-driven recommendations and personalized experiences.
            // Monetization: Subscription fees, targeted advertising, premium content rentals.
            // IP Moat: Proprietary AI recommendation algorithms, exclusive content partnerships.
        }
    }

    export namespace lendfast {
        export namespace microloanplatform {
            // Mission: Provide instant microloans to underserved communities using AI-powered risk assessment.
            // Monetization: Interest on loans, transaction fees, data analytics services.
            // IP Moat: AI-based credit scoring algorithms, proprietary risk models.
        }
    }

    export namespace savewise {
        export namespace automatedsavings {
            // Mission: Automate savings and investment strategies for users based on AI-driven financial planning.
            // Monetization: Management fees, commission on investment products, premium advisory services.
            // IP Moat: AI-driven financial planning algorithms, personalized investment strategies.
        }
    }

    export namespace tradex {
        export namespace aiassistedtrading {
            // Mission: Empower retail investors with AI-assisted trading tools and real-time market analysis.
            // Monetization: Subscription fees, commission on trades, premium analytics services.
            // IP Moat: AI-based trading algorithms, real-time market analysis tools.
        }
    }

    export namespace insuretech {
        export namespace aipoweredinsurance {
            // Mission: Disrupt the insurance industry with AI-powered underwriting and personalized policies.
            // Monetization: Premiums, data analytics services, risk assessment tools.
            // IP Moat: AI-based underwriting algorithms, personalized insurance policies.
        }
    }

    export namespace healthwise {
        export namespace aihealthadvisor {
            // Mission: Provide personalized health advice and wellness plans using AI-driven health analysis.
            // Monetization: Subscription fees, data analytics services, premium health plans.
            // IP Moat: AI-based health analysis algorithms, personalized wellness plans.
        }
    }

    export namespace edify {
        export namespace aipoweredtutoring {
            // Mission: Revolutionize education with AI-powered tutoring and personalized learning experiences.
            // Monetization: Subscription fees, data analytics services, premium educational content.
            // IP Moat: AI-based tutoring algorithms, personalized learning paths.
        }
    }

    export namespace lawassist {
        export namespace aiassistedlegal {
            // Mission: Provide affordable legal assistance and document review using AI-driven legal analysis.
            // Monetization: Subscription fees, data analytics services, premium legal services.
            // IP Moat: AI-based legal analysis algorithms, automated document review tools.
        }
    }

    export namespace realinvest {
        export namespace airealestate {
            // Mission: Simplify real estate investment with AI-driven property analysis and personalized recommendations.
            // Monetization: Commission on transactions, data analytics services, premium investment advice.
            // IP Moat: AI-based property analysis algorithms, personalized investment recommendations.
        }
    }

    export namespace supplychainx {
        export namespace aisupplychain {
            // Mission: Optimize supply chain operations with AI-driven forecasting and logistics management.
            // Monetization: Subscription fees, data analytics services, premium logistics solutions.
            // IP Moat: AI-based forecasting algorithms, optimized logistics management tools.
        }
    }
}

export default CiCdView;