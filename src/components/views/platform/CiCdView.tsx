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

// --- Mock Data ---

const mockPipelines: Pipeline[] = [
    {
        id: 'p-core-api',
        name: 'Core Payment API',
        description: 'Handles all account transactions and settlement logic.',
        lastBuildId: 'b-901',
        status: BuildStatus.RUNNING,
        lastRun: '2024-07-22T10:30:00Z',
        durationMs: 650000,
        branch: 'main',
        stages: [
            { name: 'Checkout', durationMs: 120000, status: BuildStatus.SUCCESS, testsPassed: 50, testsTotal: 50 },
            { name: 'Unit Tests', durationMs: 90000, status: BuildStatus.SUCCESS, testsPassed: 450, testsTotal: 450 },
            { name: 'Integration Tests', durationMs: 300000, status: BuildStatus.RUNNING, testsPassed: 0, testsTotal: 120 },
            { name: 'Deploy Canary', durationMs: 100000, status: BuildStatus.QUEUED, testsPassed: 0, testsTotal: 0 },
            { name: 'Deploy Prod', durationMs: 0, status: BuildStatus.QUEUED, testsPassed: 0, testsTotal: 0 },
        ],
    },
    {
        id: 'p-frontend-ui',
        name: 'Sovereign UI/UX',
        description: 'Build and deployment pipeline for the React front-end application.',
        lastBuildId: 'b-899',
        status: BuildStatus.SUCCESS,
        lastRun: '2024-07-21T18:45:00Z',
        durationMs: 450000,
        branch: 'feat/new-sidebar',
        stages: [
            { name: 'Linting & Build', durationMs: 150000, status: BuildStatus.SUCCESS, testsPassed: 0, testsTotal: 0 },
            { name: 'E2E Tests', durationMs: 200000, status: BuildStatus.SUCCESS, testsPassed: 85, testsTotal: 85 },
            { name: 'Deploy Staging', durationMs: 50000, status: BuildStatus.SUCCESS, testsPassed: 0, testsTotal: 0 },
            { name: 'Prod Approval', durationMs: 50000, status: BuildStatus.SUCCESS, testsPassed: 0, testsTotal: 0 },
        ],
    },
    {
        id: 'p-ai-advisor',
        name: 'AI Model Service',
        description: 'Retrain, test, and deploy the Quantum AI Advisor model.',
        lastBuildId: 'b-900',
        status: BuildStatus.FAILURE,
        lastRun: '2024-07-22T08:15:00Z',
        durationMs: 550000,
        branch: 'main',
        stages: [
            { name: 'Data Prep', durationMs: 100000, status: BuildStatus.SUCCESS, testsPassed: 0, testsTotal: 0 },
            { name: 'Model Training', durationMs: 300000, status: BuildStatus.SUCCESS, testsPassed: 0, testsTotal: 0 },
            { name: 'Validation Tests', durationMs: 100000, status: BuildStatus.FAILURE, testsPassed: 40, testsTotal: 90 },
            { name: 'Deploy', durationMs: 0, status: BuildStatus.QUEUED, testsPassed: 0, testsTotal: 0 },
        ],
    },
];

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
    const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>(mockPipelines[0]);

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
                {mockPipelines.map((p) => (
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

export default CiCdView;
```