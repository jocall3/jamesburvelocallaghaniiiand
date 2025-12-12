import React, { useState, useEffect } from 'react';
import { SparklesIcon, CubeTransparentIcon, ArchiveBoxIcon, CheckCircleIcon, ExclamationCircleIcon, TagIcon, UserIcon, ScaleIcon, DocumentTextIcon, BugAntIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { View } from '../../types'; // Assuming types.ts is in ../../types

// Unified Brand Namespace
namespace Citibankdemobusinessinc {

    // Shared Kernel
    export namespace Kernel {
        export const brandName = "Citibank demo business inc";

        // Utility function for generating random data
        export function generateRandomString(length: number = 10): string {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }

        // Utility function for generating random numbers within a range
        export function generateRandomNumber(min: number, max: number): number {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // Utility function for generating random dates within a range
        export function generateRandomDate(start: Date, end: Date): Date {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        }

        // Utility function for generating random boolean values
        export function generateRandomBoolean(): boolean {
            return Math.random() < 0.5;
        }

        // Utility function for generating random email addresses
        export function generateRandomEmail(): string {
            return `${generateRandomString()}@${generateRandomString(5)}.com`;
        }

        // Utility function for generating random phone numbers
        export function generateRandomPhoneNumber(): string {
            return `+1-${generateRandomNumber(200, 999)}-${generateRandomNumber(200, 999)}-${generateRandomNumber(1000, 9999)}`;
        }

        // Utility function for generating random addresses
        export function generateRandomAddress(): string {
            return `${generateRandomNumber(1, 999)} ${generateRandomString(8)} St, ${generateRandomString(6)}, ${generateRandomString(2).toUpperCase()} ${generateRandomNumber(10000, 99999)}`;
        }

        // Utility function for generating random names
        export function generateRandomName(): string {
            const firstNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'John', 'Jane', 'Michael', 'Emily', 'Daniel'];
            const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
            return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        }

        // Utility function for generating random job titles
        export function generateRandomJobTitle(): string {
            const jobTitles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'Marketing Manager', 'Sales Representative', 'Financial Analyst', 'Project Manager', 'Human Resources Manager', 'Operations Manager', 'Customer Service Representative'];
            return jobTitles[Math.floor(Math.random() * jobTitles.length)];
        }

        // Utility function for generating random company names
        export function generateRandomCompanyName(): string {
            return `${generateRandomString(6).toUpperCase()} Inc.`;
        }

        // Utility function for generating random credit card numbers
        export function generateRandomCreditCardNumber(): string {
            return `${generateRandomNumber(4000, 6000)}-${generateRandomNumber(1000, 9999)}-${generateRandomNumber(1000, 9999)}-${generateRandomNumber(1000, 9999)}`;
        }

        // Utility function for generating random currency amounts
        export function generateRandomCurrencyAmount(min: number, max: number): number {
            return parseFloat((Math.random() * (max - min) + min).toFixed(2));
        }

        // Utility function for generating random transaction types
        export function generateRandomTransactionType(): string {
            const transactionTypes = ['Debit', 'Credit', 'Transfer', 'Payment', 'Withdrawal', 'Deposit'];
            return transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        }

        // Utility function for generating random risk scores
        export function generateRandomRiskScore(): number {
            return parseFloat((Math.random() * 100).toFixed(2));
        }

        // Utility function for generating random compliance levels
        export function generateRandomComplianceLevel(): string {
            const complianceLevels = ['GDPR', 'CCPA', 'HIPAA', 'PCI DSS', 'SOX', 'None'];
            return complianceLevels[Math.floor(Math.random() * complianceLevels.length)];
        }

        // Utility function for generating random data quality statuses
        export function generateRandomDataQualityStatus(): string {
            const dataQualityStatuses = ['Good', 'Fair', 'Poor'];
            return dataQualityStatuses[Math.floor(Math.random() * dataQualityStatuses.length)];
        }

        // Utility function for generating random AI model names
        export function generateRandomAIModelName(): string {
            return `Model_${generateRandomString(5)}`;
        }

        // Utility function for generating random AI model versions
        export function generateRandomAIModelVersion(): string {
            return `${generateRandomNumber(1, 10)}.${generateRandomNumber(0, 9)}.${generateRandomNumber(0, 9)}`;
        }

        // Utility function for generating random AI model accuracy scores
        export function generateRandomAIAccuracyScore(): number {
            return parseFloat((Math.random() * 100).toFixed(2));
        }

        // Utility function for generating random AI model latency values
        export function generateRandomAILatency(): number {
            return parseFloat((Math.random() * 100).toFixed(2));
        }

        // Utility function for generating random AI model descriptions
        export function generateRandomAIDescription(): string {
            return `AI model for ${generateRandomString(10)} prediction.`;
        }

        // Utility function for generating random AI model usage guidelines
        export function generateRandomAIUsageGuidelines(): string {
            return `Use this model for ${generateRandomString(10)} analysis only.`;
        }

        // Utility function for generating random AI model compliance notes
        export function generateRandomAIComplianceNotes(): string {
            return `This model complies with ${generateRandomComplianceLevel()}.`;
        }

        // Utility function for generating random AI model tags
        export function generateRandomAITags(): string[] {
            const tags = ['AI', 'ML', 'Data', 'Model', 'Prediction', 'Analysis'];
            const numTags = generateRandomNumber(1, 3);
            const selectedTags: string[] = [];
            for (let i = 0; i < numTags; i++) {
                selectedTags.push(tags[Math.floor(Math.random() * tags.length)]);
            }
            return selectedTags;
        }

        // Utility function for generating random AI model quality issues
        export function generateRandomAIQualityIssue(): { severity: string; description: string; suggestion: string } {
            const severities = ['High', 'Medium', 'Low'];
            const descriptions = ['Data inconsistency', 'Model drift', 'Bias detected'];
            const suggestions = ['Review data', 'Retrain model', 'Address bias'];
            return {
                severity: severities[Math.floor(Math.random() * severities.length)],
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                suggestion: suggestions[Math.floor(Math.random() * suggestions.length)],
            };
        }

        // Utility function for generating random AI model quality reports
        export function generateRandomAIQualityReport(): { overallStatus: string; issues: { severity: string; description: string; suggestion: string }[] } {
            const overallStatuses = ['Good', 'Fair', 'Poor'];
            const numIssues = generateRandomNumber(0, 3);
            const issues: { severity: string; description: string; suggestion: string }[] = [];
            for (let i = 0; i < numIssues; i++) {
                issues.push(generateRandomAIQualityIssue());
            }
            return {
                overallStatus: overallStatuses[Math.floor(Math.random() * overallStatuses.length)],
                issues: issues,
            };
        }

        // Utility function for generating random dataset schema fields
        export function generateRandomDatasetSchemaField(): { name: string; type: string; description?: string } {
            const fieldNames = ['id', 'name', 'age', 'gender', 'region', 'income', 'date', 'amount'];
            const fieldTypes = ['Integer', 'String', 'Float', 'Date', 'Boolean'];
            return {
                name: fieldNames[Math.floor(Math.random() * fieldNames.length)],
                type: fieldTypes[Math.floor(Math.random() * fieldTypes.length)],
                description: generateRandomString(20),
            };
        }

        // Utility function for generating random dataset schemas
        export function generateRandomDatasetSchema(): { fields: { name: string; type: string; description?: string }[] } {
            const numFields = generateRandomNumber(3, 7);
            const fields: { name: string; type: string; description?: string }[] = [];
            for (let i = 0; i < numFields; i++) {
                fields.push(generateRandomDatasetSchemaField());
            }
            return {
                fields: fields,
            };
        }

        // Utility function for generating random dataset sample data
        export function generateRandomDatasetSampleData(schema: { fields: { name: string; type: string; description?: string }[] }): Record<string, any>[] {
            const numRows = generateRandomNumber(1, 5);
            const sampleData: Record<string, any>[] = [];
            for (let i = 0; i < numRows; i++) {
                const row: Record<string, any> = {};
                schema.fields.forEach(field => {
                    switch (field.type) {
                        case 'Integer':
                            row[field.name] = generateRandomNumber(1, 100);
                            break;
                        case 'String':
                            row[field.name] = generateRandomString(10);
                            break;
                        case 'Float':
                            row[field.name] = parseFloat((Math.random() * 100).toFixed(2));
                            break;
                        case 'Date':
                            row[field.name] = generateRandomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0];
                            break;
                        case 'Boolean':
                            row[field.name] = generateRandomBoolean();
                            break;
                        default:
                            row[field.name] = null;
                    }
                });
                sampleData.push(row);
            }
            return sampleData;
        }

        // Utility function for generating random dataset compliance levels
        export function generateRandomDatasetComplianceLevel(): string {
            const complianceLevels = ['GDPR', 'CCPA', 'HIPAA', 'None'];
            return complianceLevels[Math.floor(Math.random() * complianceLevels.length)];
        }

        // Utility function for generating random dataset tags
        export function generateRandomDatasetTags(): string[] {
            const tags = ['customer', 'demographics', 'marketing', 'transactions', 'finance', 'historical', 'ai', 'ml', 'logs', 'performance'];
            const numTags = generateRandomNumber(1, 5);
            const selectedTags: string[] = [];
            for (let i = 0; i < numTags; i++) {
                selectedTags.push(tags[Math.floor(Math.random() * tags.length)]);
            }
            return selectedTags;
        }

        // Utility function for generating random dataset owners
        export function generateRandomDatasetOwner(): string {
            const owners = ['Marketing Dept.', 'Finance Dept.', 'AI/ML Team', 'Sales Dept.', 'Operations Dept.'];
            return owners[Math.floor(Math.random() * owners.length)];
        }

        // Utility function for generating random dataset descriptions
        export function generateRandomDatasetDescription(): string {
            return `Dataset containing ${generateRandomString(15)} information.`;
        }

        // Utility function for generating random dataset names
        export function generateRandomDatasetName(): string {
            return `${generateRandomString(8)} Data ${generateRandomNumber(2020, 2024)}`;
        }

        // Utility function for generating random dataset IDs
        export function generateRandomDatasetId(): string {
            return `ds-${generateRandomString(5)}`;
        }

        // Utility function for generating random dataset ingestion dates
        export function generateRandomDatasetIngestionDate(): string {
            return generateRandomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0];
        }

        // Utility function for generating random dataset last updated dates
        export function generateRandomDatasetLastUpdatedDate(): string {
            return generateRandomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0];
        }

        // Utility function for generating random datasets
        export function generateRandomDataset(): MockDataset {
            const schema = generateRandomDatasetSchema();
            const sampleData = generateRandomDatasetSampleData(schema);
            return {
                id: generateRandomDatasetId(),
                name: generateRandomDatasetName(),
                description: generateRandomDatasetDescription(),
                owner: generateRandomDatasetOwner(),
                tags: generateRandomDatasetTags(),
                complianceLevel: generateRandomDatasetComplianceLevel(),
                ingestionDate: generateRandomDatasetIngestionDate(),
                lastUpdated: generateRandomDatasetLastUpdatedDate(),
                sampleData: sampleData,
                schema: schema,
                aiMetadata: {
                    description: generateRandomAIDescription(),
                    usageGuidelines: generateRandomAIUsageGuidelines(),
                    complianceNotes: [generateRandomAIComplianceNotes()],
                    tags: generateRandomAITags(),
                },
                aiQualityReport: generateRandomAIQualityReport(),
            };
        }

        // Utility function for generating multiple random datasets
        export function generateRandomDatasets(count: number): MockDataset[] {
            const datasets: MockDataset[] = [];
            for (let i = 0; i < count; i++) {
                datasets.push(generateRandomDataset());
            }
            return datasets;
        }

        // Function to simulate AI generation with a delay
        export const simulateAIGeneration = <T>(response: T, delay: number = 1500): Promise<T> => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(response), delay);
            });
        };
    }

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

    // Citibankdemobusinessinc.datacommons.datamanagement
    export namespace datacommons {
        export namespace datamanagement {
            // Mission: To provide a centralized, secure, and compliant data management platform for all business units.
            // Monetization: Data access subscriptions, premium data services, and data governance consulting.
            // IP Moat: Proprietary data governance framework, AI-powered data quality tools, and secure data storage infrastructure.
            export const DataManagementApp: React.FC = () => {
                const [datasets, setDatasets] = useState<MockDataset[]>(Kernel.generateRandomDatasets(5));
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
                    const metadata = await Kernel.simulateAIGeneration(mockAIResponse);
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


                    const report = await Kernel.simulateAIGeneration(mockAIReport);
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
                                                <p className="mb-2"><span