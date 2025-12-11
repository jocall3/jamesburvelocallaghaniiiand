import React, { useState, useEffect } from 'react';
import { SparklesIcon, CubeTransparentIcon, ArchiveBoxIcon, CheckCircleIcon, ExclamationCircleIcon, TagIcon, UserIcon, ScaleIcon, DocumentTextIcon, BugAntIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { View } from '../../types'; // Assuming types.ts is in ../../types

// Mock Data Interfaces
interface DatasetSchemaField {
    name: string;
    type: string;
    description?: string;
}

interface DatasetSchema {
    fields: DatasetSchemaField[];
}

interface AIMetadata {
    description: string;
    usageGuidelines: string;
    complianceNotes: string[];
    tags: string[];
}

interface AIQualityIssue {
    severity: 'High' | 'Medium' | 'Low';
    description: string;
    suggestion: string;
}

interface AIDataQualityReport {
    overallStatus: 'Good' | 'Fair' | 'Poor';
    issues: AIQualityIssue[];
}

interface MockDataset {
    id: string;
    name: string;
    description: string;
    owner: string;
    tags: string[];
    complianceLevel: 'GDPR' | 'CCPA' | 'HIPAA' | 'None';
    ingestionDate: string;
    lastUpdated: string;
    sampleData: Record<string, any>[];
    schema: DatasetSchema;
    aiMetadata?: AIMetadata;
    aiQualityReport?: AIDataQualityReport;
}

// Mock Data
const initialMockDatasets: MockDataset[] = [
    {
        id: 'ds-001',
        name: 'Customer Demographics Q4 2023',
        description: 'Anonymized customer demographic data for Q4 2023.',
        owner: 'Marketing Dept.',
        tags: ['customer', 'demographics', 'marketing'],
        complianceLevel: 'GDPR',
        ingestionDate: '2023-11-01',
        lastUpdated: '2024-01-15',
        sampleData: [
            { id: 1, age: 34, gender: 'Female', region: 'California', income: 75000 },
            { id: 2, age: 29, gender: 'Male', region: 'New York', income: 90000 },
        ],
        schema: {
            fields: [
                { name: 'id', type: 'Integer' },
                { name: 'age', type: 'Integer' },
                { name: 'gender', type: 'String' },
                { name: 'region', type: 'String' },
                { name: 'income', type: 'Integer' },
            ],
        },
        aiMetadata: {
            description: "This dataset contains anonymized customer demographic information collected during the fourth quarter of 2023. It includes age, gender, geographic region, and estimated income levels, primarily used for marketing segmentation and analysis.",
            usageGuidelines: "Strictly for internal marketing and product development analysis. Do not share raw data externally. Ensure all analyses maintain customer anonymity.",
            complianceNotes: ["Complies with GDPR and CCPA for anonymized data. Specific data points are pseudo-anonymized. Consent for data collection was obtained."],
            tags: ["customer", "demographics", "marketing", "q4-2023", "sales"]
        },
        aiQualityReport: {
            overallStatus: 'Good',
            issues: []
        }
    },
    {
        id: 'ds-002',
        name: 'Transaction History 2023',
        description: 'Complete transaction history for all users in 2023.',
        owner: 'Finance Dept.',
        tags: ['transactions', 'finance', 'historical'],
        complianceLevel: 'HIPAA', // Example for sensitive financial data
        ingestionDate: '2024-01-05',
        lastUpdated: '2024-01-05',
        sampleData: [
            { txn_id: 't001', user_id: 1, amount: 50.00, merchant: 'Starbucks', date: '2023-03-10' },
            { txn_id: 't002', user_id: 2, amount: 120.50, merchant: 'Amazon', date: '2023-03-11' },
        ],
        schema: {
            fields: [
                { name: 'txn_id', type: 'String' },
                { name: 'user_id', type: 'Integer' },
                { name: 'amount', type: 'Float' },
                { name: 'merchant', type: 'String' },
                { name: 'date', type: 'Date' },
            ],
        },
    },
    {
        id: 'ds-003',
        name: 'AI Model Performance Logs',
        description: 'Logs tracking performance metrics of deployed AI models.',
        owner: 'AI/ML Team',
        tags: ['ai', 'ml', 'logs', 'performance'],
        complianceLevel: 'None',
        ingestionDate: '2024-02-10',
        lastUpdated: '2024-02-20',
        sampleData: [
            { log_id: 'l001', model_id: 'm1', accuracy: 0.92, latency_ms: 50, timestamp: '2024-02-15T10:00:00Z' },
            { log_id: 'l002', model_id: 'm2', accuracy: 0.88, latency_ms: 75, timestamp: '2024-02-15T10:05:00Z' },
        ],
        schema: {
            fields: [
                { name: 'log_id', type: 'String' },
                { name: 'model_id', type: 'String' },
                { name: 'accuracy', type: 'Float' },
                { name: 'latency_ms', type: 'Integer' },
                { name: 'timestamp', type: 'DateTime' },
            ],
        },
    }
];

// Helper to simulate AI generation
const simulateAIGeneration = <T>(response: T, delay: number = 1500): Promise<T> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(response), delay);
    });
};


const DataCommonsView: React.FC = () => {
    const [datasets, setDatasets] = useState<MockDataset[]>(initialMockDatasets);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedDataset, setSelectedDataset] = useState<MockDataset | null>(null);
    const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
    const [newDatasetForm, setNewDatasetForm] = useState<{ name: string; description: string; owner: string; sampleData: string; schema: string; compliance: 'GDPR' | 'CCPA' | 'HIPAA' | 'None' }>({
        name: '',
        description: '',
        owner: '',
        sampleData: '[]',
        schema: '{"fields":[]}',
        compliance: 'None',
    });
    const [aiGeneratedMetadata, setAIGeneratedMetadata] = useState<AIMetadata | null>(null);
    const [aiQualityReport, setAIQualityReport] = useState<AIDataQualityReport | null>(null);
    const [aiLoading, setAILoading] = useState<boolean>(false);

    const filteredDatasets = datasets.filter(dataset =>
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewDatasetForm(prev => ({ ...prev, [name]: value }));
    };

    const openDatasetDetails = (dataset: MockDataset) => {
        setSelectedDataset(dataset);
    };

    const closeDatasetDetails = () => {
        setSelectedDataset(null);
    };

    const handleIngestNewDataset = () => {
        try {
            const parsedSchema = JSON.parse(newDatasetForm.schema);
            const parsedSampleData = JSON.parse(newDatasetForm.sampleData);

            const newId = `ds-${String(datasets.length + 1).padStart(3, '0')}`;
            const now = new Date().toISOString().split('T')[0];

            const newDataset: MockDataset = {
                id: newId,
                name: newDatasetForm.name,
                description: newDatasetForm.description,
                owner: newDatasetForm.owner,
                tags: aiGeneratedMetadata?.tags || [],
                complianceLevel: newDatasetForm.compliance,
                ingestionDate: now,
                lastUpdated: now,
                sampleData: parsedSampleData,
                schema: parsedSchema,
                aiMetadata: aiGeneratedMetadata || undefined,
                aiQualityReport: aiQualityReport || undefined,
            };

            setDatasets(prev => [...prev, newDataset]);
            setIsIngestModalOpen(false);
            setNewDatasetForm({
                name: '', description: '', owner: '', sampleData: '[]', schema: '{"fields":[]}', compliance: 'None'
            });
            setAIGeneratedMetadata(null);
            setAIQualityReport(null);
        } catch (error) {
            alert("Invalid JSON for Sample Data or Schema. Please correct it.");
            console.error("Ingestion error:", error);
        }
    };

    const handleAIGenerateMetadata = async () => {
        setAILoading(true);
        const prompt = `Analyze the following dataset schema and sample data. Generate a comprehensive description (1-2 sentences), usage guidelines (1-2 bullet points), compliance notes (1-2 bullet points, considering compliance level '${newDatasetForm.compliance}'), and 5-7 relevant tags (array of strings). Format as JSON.
        SCHEMA: ${newDatasetForm.schema}
        SAMPLE DATA: ${newDatasetForm.sampleData}`;

        // Simulate Gemini response
        const mockAIResponse: AIMetadata = {
            description: `This dataset contains ${newDatasetForm.name} information provided by ${newDatasetForm.owner}. It's a foundational dataset for various analytical processes.`,
            usageGuidelines: `- For internal use only.`,
            complianceNotes: newDatasetForm.compliance !== 'None' ? [`- Adheres to ${newDatasetForm.compliance} regulations.`] : ["- No specific compliance notes beyond general data handling best practices."],
            tags: [newDatasetForm.owner.toLowerCase().replace(' ', '-'), 'data-commons', 'core', newDatasetForm.name.toLowerCase().replace(/ /g, '-').substring(0, 15)].filter(Boolean).slice(0, 5)
        };
        const metadata = await simulateAIGeneration(mockAIResponse);
        setAIGeneratedMetadata(metadata);
        setAILoading(false);
    };

    const handleAIDataQualityMonitor = async () => {
        setAILoading(true);
        const prompt = `Analyze the given dataset sample and identify any potential data quality issues, inconsistencies, or anomalies. Provide a plain English explanation of findings and suggest corrective actions. Format as JSON with 'overallStatus' and an array of 'issues' (each with 'severity', 'description', 'suggestion').
        SAMPLE DATA: ${newDatasetForm.sampleData}`;

        // Simulate Gemini response
        const mockAIReport: AIDataQualityReport = {
            overallStatus: 'Good',
            issues: []
        };
        try {
            const sample = JSON.parse(newDatasetForm.sampleData);
            if (sample.length === 0) {
                mockAIReport.overallStatus = 'Fair';
                mockAIReport.issues.push({ severity: 'Low', description: 'Empty sample data provided, cannot perform thorough quality check.', suggestion: 'Provide representative sample data.' });
            } else if (sample.some((row: any) => Object.values(row).some(value => value === null || value === undefined))) {
                mockAIReport.overallStatus = 'Medium';
                mockAIReport.issues.push({ severity: 'Medium', description: 'Detected null or undefined values in sample data, indicating potential incompleteness.', suggestion: 'Implement data imputation or cleansing processes.' });
            } else {
                 mockAIReport.overallStatus = 'Good';
            }
        } catch (e) {
             mockAIReport.overallStatus = 'Poor';
             mockAIReport.issues.push({ severity: 'High', description: 'Sample data is not valid JSON, unable to parse for quality check.', suggestion: 'Ensure sample data is valid JSON format.' });
        }


        const report = await simulateAIGeneration(mockAIReport);
        setAIQualityReport(report);
        setAILoading(false);
    };

    // Calculate dashboard KPIs
    const totalDatasets = datasets.length;
    const goodQualityDatasets = datasets.filter(d => d.aiQualityReport?.overallStatus === 'Good').length;
    const avgQualityScore = totalDatasets > 0 ? (goodQualityDatasets / totalDatasets * 100).toFixed(0) : 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-full rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-cyan-400 mb-6 flex items-center">
                <ArchiveBoxIcon className="h-8 w-8 mr-3" /> Data Commons - The Chief Archivist's Office
            </h1>
            <p className="text-gray-400 mb-8">
                Manage the shared data repository, where standardized datasets are curated and made available to all agents.
                Ensure data integrity and accessibility across the platform.
            </p>

            {/* Dashboard Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                    <div className="flex items-center text-indigo-400 mb-2">
                        <CubeTransparentIcon className="h-6 w-6 mr-2" />
                        <h3 className="text-xl font-semibold">Total Datasets</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{totalDatasets}</p>
                    <p className="text-gray-500">Curated & Available</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                    <div className="flex items-center text-green-400 mb-2">
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        <h3 className="text-xl font-semibold">Avg. Quality Score</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{avgQualityScore}%</p>
                    <p className="text-gray-500">AI-Monitored Health</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                    <div className="flex items-center text-amber-400 mb-2">
                        <SparklesIcon className="h-6 w-6 mr-2" />
                        <h3 className="text-xl font-semibold">AI Insights</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{datasets.filter(d => d.aiQualityReport?.issues.length > 0).length}</p>
                    <p className="text-gray-500">Active Quality Issues</p>
                </div>
            </div>

            {/* Dataset Catalog */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <DocumentTextIcon className="h-6 w-6 mr-2" /> Dataset Catalog
                </h2>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                    <input
                        type="text"
                        placeholder="Search datasets..."
                        className="w-full sm:w-2/3 p-3 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <button
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
                        onClick={() => setIsIngestModalOpen(true)}
                    >
                        Ingest New Dataset
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tags</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Compliance</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quality</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredDatasets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No datasets found.</td>
                                </tr>
                            ) : (
                                filteredDatasets.map(dataset => (
                                    <tr key={dataset.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{dataset.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{dataset.owner}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {dataset.tags.map((tag, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300 mr-2">
                                                    {tag}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{dataset.complianceLevel}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                dataset.aiQualityReport?.overallStatus === 'Good' ? 'bg-green-100 text-green-800' :
                                                dataset.aiQualityReport?.overallStatus === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {dataset.aiQualityReport?.overallStatus || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                className="text-cyan-400 hover:text-cyan-500"
                                                onClick={() => openDatasetDetails(dataset)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dataset Details Modal */}
            {selectedDataset && (
                <div className="fixed inset-0 bg-gray-950 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h3 className="text-2xl font-bold text-white flex items-center">
                                <DocumentTextIcon className="h-6 w-6 mr-2" /> {selectedDataset.name}
                            </h3>
                            <button className="text-gray-400 hover:text-white" onClick={closeDatasetDetails}>
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 text-gray-300">
                            <p className="mb-4"><span className="font-semibold text-cyan-400">Description:</span> {selectedDataset.description}</p>
                            <p className="mb-4"><span className="font-semibold text-cyan-400">Owner:</span> {selectedDataset.owner}</p>
                            <p className="mb-4"><span className="font-semibold text-cyan-400">Compliance Level:</span> {selectedDataset.complianceLevel}</p>
                            <p className="mb-4"><span className="font-semibold text-cyan-400">Ingestion Date:</span> {selectedDataset.ingestionDate}</p>
                            <p className="mb-4"><span className="font-semibold text-cyan-400">Last Updated:</span> {selectedDataset.lastUpdated}</p>
                            
                            <h4 className="text-xl font-bold text-white mt-6 mb-3 flex items-center"><TagIcon className="h-5 w-5 mr-2" /> Tags</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedDataset.tags.map((tag, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h4 className="text-xl font-bold text-white mt-6 mb-3 flex items-center"><LightBulbIcon className="h-5 w-5 mr-2" /> AI Generated Metadata</h4>
                            {selectedDataset.aiMetadata ? (
                                <div className="bg-gray-700 p-4 rounded-md mb-4">
                                    <p className="mb-2"><span className="font-semibold text-cyan-400">Description:</span> {selectedDataset.aiMetadata.description}</p>
                                    <p className="mb-2"><span className="font-semibold text-cyan-400">Usage Guidelines:</span> {selectedDataset.aiMetadata.usageGuidelines}</p>
                                    <p className="mb-2"><span className="font-semibold text-cyan-400">Compliance Notes:</span> {selectedDataset.aiMetadata.complianceNotes.join(' ')}</p>
                                    <p className="mb-2"><span className="font-semibold text-cyan-400">AI Tags:</span> {selectedDataset.aiMetadata.tags.map((tag, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300 mr-1">
                                            {tag}
                                        </span>
                                    ))}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500">No AI-generated metadata available for this dataset.</p>
                            )}

                            <h4 className="text-xl font-bold text-white mt-6 mb-3 flex items-center"><BugAntIcon className="h-5 w-5 mr-2" /> AI Data Quality Report</h4>
                            {selectedDataset.aiQualityReport ? (
                                <div className="bg-gray-700 p-4 rounded-md mb-4">
                                    <p className="mb-2"><span className="font-semibold text-cyan-400">Overall Status:</span> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                selectedDataset.aiQualityReport.overallStatus === 'Good' ? 'bg-green-100 text-green-800' :
                                                selectedDataset.aiQualityReport.overallStatus === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedDataset.aiQualityReport.overallStatus}
                                            </span></p>
                                    {selectedDataset.aiQualityReport.issues.length > 0 ? (
                                        <ul className="list-disc list-inside ml-4">
                                            {selectedDataset.aiQualityReport.issues.map((issue, idx) => (
                                                <li key={idx} className="mb-1">
                                                    <span className={`font-semibold ${
                                                        issue.severity === 'High' ? 'text-red-400' :
                                                        issue.severity === 'Medium' ? 'text-yellow-400' :
                                                        'text-green-400'
                                                    }`}>{issue.severity}:</span> {issue.description} <br/> <span className="text-gray-500">Suggestion: {issue.suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500">No issues detected by AI.</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500">No AI data quality report available for this dataset.</p>
                            )}

                            <h4 className="text-xl font-bold text-white mt-6 mb-3 flex items-center"><ScaleIcon className="h-5 w-5 mr-2" /> Schema</h4>
                            <pre className="bg-gray-700 p-4 rounded-md overflow-x-auto text-sm text-green-300">
                                {JSON.stringify(selectedDataset.schema, null, 2)}
                            </pre>

                            <h4 className="text-xl font-bold text-white mt-6 mb-3 flex items-center"><ArchiveBoxIcon className="h-5 w-5 mr-2" /> Sample Data</h4>
                            <pre className="bg-gray-700 p-4 rounded-md overflow-x-auto text-sm text-blue-300">
                                {JSON.stringify(selectedDataset.sampleData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Ingest New Dataset Modal */}
            {isIngestModalOpen && (
                <div className="fixed inset-0 bg-gray-950 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h3 className="text-2xl font-bold text-white flex items-center">
                                <ArchiveBoxIcon className="h-6 w-6 mr-2" /> Ingest New Dataset
                            </h3>
                            <button className="text-gray-400 hover:text-white" onClick={() => setIsIngestModalOpen(false)}>
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 text-gray-300 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-400">Dataset Name</label>
                                <input type="text" id="name" name="name" value={newDatasetForm.name} onChange={handleFormChange}
                                    className="mt-1 block w-full p-2.5 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-cyan-500 focus:border-cyan-500" />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-400">Description</label>
                                <textarea id="description" name="description" value={newDatasetForm.description} onChange={handleFormChange} rows={2}
                                    className="mt-1 block w-full p-2.5 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-cyan-500 focus:border-cyan-500"></textarea>
                            </div>
                            <div>
                                <label htmlFor="owner" className="block text-sm font-medium text-gray-400">Owner</label>
                                <input type="text" id="owner" name="owner" value={newDatasetForm.owner} onChange={handleFormChange}
                                    className="mt-1 block w-full p-2.5 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-cyan-500 focus:border-cyan-500" />
                            </div>
                            <div>
                                <label htmlFor="compliance" className="block text-sm font-medium text-gray-400">Compliance Level</label>
                                <select id="compliance" name="compliance" value={newDatasetForm.compliance} onChange={handleFormChange}
                                    className="mt-1 block w-full p-2.5 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-cyan-500 focus:border-cyan-500">
                                    <option value="None">None</option>
                                    <option value="GDPR">GDPR</option>
                                    <option value="CCPA">CCPA</option>
                                    <option value="HIPAA">HIPAA</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="schema" className="block text-sm font-medium text-gray-400">Schema (JSON)</label>
                                <textarea id="schema" name="schema" value={newDatasetForm.schema} onChange={handleFormChange} rows={6}
                                    className="mt-1 block w-full p-2.5 rounded-md bg-gray-700 border-gray-600 text-white font-mono text-xs focus:ring-cyan-500 focus:border-cyan-500"></textarea>
                            </div>
                            <div>
                                <label htmlFor="sampleData" className="block text-sm font-medium text-gray-400">Sample Data (JSON Array)</label>
                                <textarea id="sampleData" name="sampleData" value={newDatasetForm.sampleData} onChange={handleFormChange} rows={6}
                                    className="mt-1 block w-full p-2.5 rounded-md bg-gray-700 border-gray-600 text-white font-mono text-xs focus:ring-cyan-500 focus:border-cyan-500"></textarea>
                            </div>

                            {/* AI Features */}
                            <div className="border-t border-gray-700 pt-4 mt-4">
                                <h4 className="text-xl font-bold text-white mb-3 flex items-center"><SparklesIcon className="h-5 w-5 mr-2" /> AI Assistant</h4>
                                <div className="flex flex-col space-y-3">
                                    <button
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleAIGenerateMetadata}
                                        disabled={aiLoading || !newDatasetForm.name || !newDatasetForm.description || !newDatasetForm.schema || !newDatasetForm.sampleData}
                                    >
                                        {aiLoading ? (
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <LightBulbIcon className="h-5 w-5 mr-2" />
                                        )}
                                        {aiLoading ? 'Generating...' : 'Generate AI Metadata'}
                                    </button>
                                    {aiGeneratedMetadata && (
                                        <div className="bg-gray-700 p-3 rounded-md text-sm">
                                            <p><span className="font-semibold text-cyan-400">AI Description:</span> {aiGeneratedMetadata.description}</p>
                                            <p><span className="font-semibold text-cyan-400">AI Tags:</span> {aiGeneratedMetadata.tags.join(', ')}</p>
                                        </div>
                                    )}

                                    <button
                                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleAIDataQualityMonitor}
                                        disabled={aiLoading || !newDatasetForm.schema || !newDatasetForm.sampleData}
                                    >
                                        {aiLoading ? (
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <BugAntIcon className="h-5 w-5 mr-2" />
                                        )}
                                        {aiLoading ? 'Analyzing...' : 'Run AI Data Quality Check'}
                                    </button>
                                    {aiQualityReport && (
                                        <div className="bg-gray-700 p-3 rounded-md text-sm">
                                            <p><span className="font-semibold text-cyan-400">Overall Quality:</span> {aiQualityReport.overallStatus}</p>
                                            {aiQualityReport.issues.length > 0 ? (
                                                <ul className="list-disc list-inside ml-4">
                                                    {aiQualityReport.issues.map((issue, idx) => <li key={idx}><span className={`font-semibold ${issue.severity === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>({issue.severity})</span> {issue.description}</li>)}
                                                </ul>
                                            ) : <p>No specific issues detected.</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                            <button
                                className="px-5 py-2.5 rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                                onClick={() => setIsIngestModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-5 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleIngestNewDataset}
                                disabled={!newDatasetForm.name || !newDatasetForm.description || !newDatasetForm.owner || !newDatasetForm.schema || !newDatasetForm.sampleData}
                            >
                                Ingest Dataset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataCommonsView;