```tsx
import React, { useState } from 'react';
import { View } from '../../types';
import { GovernanceIcon } from '../../assets/icons'; // Assuming GovernanceIcon is the correct icon for OSPO
import { useGemini } from '../../hooks/useGemini'; // Assuming useGemini hook is available

// Mock data for OSPO management
const mockOsLibraries = [
    { id: 'lib-001', name: 'React', version: '18.2.0', license: 'MIT', status: 'Compliant', aiStatus: 'OK' },
    { id: 'lib-002', name: 'Lodash', version: '4.17.21', license: 'MIT', status: 'Compliant', aiStatus: 'OK' },
    { id: 'lib-003', name: 'Express', version: '4.18.2', license: 'MIT', status: 'Compliant', aiStatus: 'OK' },
    { id: 'lib-004', name: 'Moment.js', version: '2.29.4', license: 'MIT', status: 'Compliant', aiStatus: 'OK' },
    { id: 'lib-005', name: 'jQuery', version: '3.6.0', license: 'MIT', status: 'Compliant', aiStatus: 'OK' },
    { id: 'lib-006', name: 'Log4j', version: '2.17.1', license: 'Apache-2.0', status: 'Requires Review', aiStatus: 'VULNERABLE' },
];

const mockContributions = [
    { id: 'contrib-001', project: 'DemoBank Frontend', contributor: 'Alice Smith', status: 'Approved', aiSummary: 'Positive contribution to UI components.' },
    { id: 'contrib-002', project: 'DemoBank API', contributor: 'Bob Johnson', status: 'Pending Review', aiSummary: 'Code changes require thorough security review.' },
    { id: 'contrib-003', project: 'DemoBank Docs', contributor: 'Charlie Brown', status: 'Approved', aiSummary: 'Clear and concise documentation updates.' },
];

// Mock components for UI elements
const KPI = ({ title, value, color }: { title: string; value: string; color?: string }) => (
    <div className={`p-4 border border-gray-700 rounded-lg bg-gray-800 ${color ? '' : ''}`}>
        <div className="text-sm font-medium text-gray-400">{title}</div>
        <div className={`text-xl font-bold ${color || 'text-gray-200'}`}>{value}</div>
    </div>
);

const ComplianceTable = ({ libraries, onReview }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Library</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">License</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">AI Assessment</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
                {libraries.map((lib) => (
                    <tr key={lib.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lib.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{lib.version}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{lib.license}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lib.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {lib.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lib.aiStatus === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {lib.aiStatus}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {lib.status === 'Requires Review' && (
                                <button onClick={() => onReview(lib)} className="text-indigo-400 hover:text-indigo-200">Review</button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ContributionTable = ({ contributions }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contributor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">AI Summary</th>
                </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
                {contributions.map(contrib => (
                    <tr key={contrib.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{contrib.project}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{contrib.contributor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contrib.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {contrib.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{contrib.aiSummary}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const OSPOView: React.FC<{ setActiveView: (view: View) => void }> = ({ setActiveView }) => {
    const [libraries] = useState(mockOsLibraries);
    const [contributions] = useState(mockContributions);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedLibrary, setSelectedLibrary] = useState<any>(null);
    const { sendPrompt } = useGemini();

    const handleReview = (lib) => {
        setSelectedLibrary(lib);
        setReviewModalOpen(true);
    };

    const handleCloseModal = () => {
        setReviewModalOpen(false);
        setSelectedLibrary(null);
    };

    const getAiAssessment = async (library) => {
        if (!library) return "N/A";
        const prompt = `
            Analyze the security implications of using '${library.name}' version '${library.version}' with an ${library.license} license in a financial application.
            Focus on potential vulnerabilities, compliance risks, and any known issues with this specific version or license.
            Provide a concise summary of the risks and a recommendation (e.g., "Continue using", "Monitor closely", "Replace immediately").
            Format the output as a JSON object with keys "riskSummary" (string) and "recommendation" (string).
        `;
        try {
            const response = await sendPrompt(prompt, { responseSchema: { type: "object", properties: { riskSummary: { type: "string" }, recommendation: { type: "string" } } } });
            if (response && response.riskSummary && response.recommendation) {
                return `${response.recommendation}: ${response.riskSummary}`;
            }
            return "AI analysis unavailable.";
        } catch (error) {
            console.error("Error getting AI assessment:", error);
            return "AI analysis error.";
        }
    };

    const compliantCount = libraries.filter(lib => lib.status === 'Compliant').length;
    const needsReviewCount = libraries.length - compliantCount;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <GovernanceIcon className="h-8 w-8 text-indigo-400" />
                    <h1 className="text-3xl font-bold text-gray-200">Open Source Program Office (OSPO)</h1>
                </div>
                <button onClick={() => setActiveView(View.MetaDashboard)} className="text-indigo-400 hover:text-indigo-200 flex items-center">
                    Back to Dashboard <i className="fas fa-arrow-left ml-2"></i>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <KPI title="Compliant Libraries" value={`${compliantCount}/${libraries.length}`} color="text-green-400" />
                <KPI title="Libraries Requiring Review" value={needsReviewCount.toString()} color="text-yellow-400" />
                <KPI title="Approved Contributions" value={contributions.filter(c => c.status === 'Approved').length.toString()} color="text-blue-400" />
            </div>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">Library Compliance Overview</h2>
                <ComplianceTable libraries={libraries} onReview={handleReview} />
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">Open Source Contributions</h2>
                <ContributionTable contributions={contributions} />
            </section>

            {reviewModalOpen && selectedLibrary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-2xl w-full mx-4 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-200">Review: {selectedLibrary.name} ({selectedLibrary.version})</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div className="mb-6 p-4 border border-gray-700 rounded bg-gray-800">
                            <p className="text-gray-300 text-sm mb-2">License: {selectedLibrary.license}</p>
                            <p className="text-gray-300 text-sm mb-2">Current Status: {selectedLibrary.status}</p>
                            <p className="text-gray-300 text-sm">AI Assessment Status: {selectedLibrary.aiStatus}</p>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-200 mb-3">AI Security Analysis:</h4>
                            <div className="p-4 border border-gray-700 rounded bg-gray-800 text-gray-300 text-sm animate-pulse">
                                Analyzing... (This would be an API call to Gemini)
                                {/* Example of how the AI result would be displayed */}
                                {/*
                                <p><strong>Recommendation:</strong> Continue using</p>
                                <p><strong>Risk Summary:</strong> No critical vulnerabilities found for this version.</p>
                                */}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button onClick={() => { /* Implement logic to change status to Compliant */ handleCloseModal() }} className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                                Mark as Compliant
                            </button>
                            <button onClick={() => { /* Implement logic to require further review */ handleCloseModal() }} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                                Request Deeper Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OSPOView;
```