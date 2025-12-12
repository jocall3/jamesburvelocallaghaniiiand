import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

// --- Type Definitions ---
// Defining locally to ensure component self-containment, 
// though in a full project these might be imported from a shared types file.
export interface ComplianceCheckResult {
    id: string;
    featureDescription: string;
    checkDate: string; // ISO string
    aiReport: string;
    suggestedLicenses: string[];
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Completed' | 'Pending Review';
    reviewedBy?: string;
    reviewDate?: string;
    notes?: string;
    associatedFeatureId?: string;
}

interface AICheckerProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckComplete: (result: ComplianceCheckResult) => void;
}

// --- Helper Utilities ---
const generateId = () => `_${Math.floor(Math.random() * 100000)}_${Date.now()}`;

const AIChecker: React.FC<AICheckerProps> = ({ isOpen, onClose, onCheckComplete }) => {
    const [featureDesc, setFeatureDesc] = useState("A new feature to allow cross-border payments to Brazil.");
    const [complianceReport, setComplianceReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckCompliance = async () => {
        setIsLoading(true);
        setComplianceReport('');
        setError(null);

        try {
            // Retrieve API Key from environment variables
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.API_KEY;
            
            if (!apiKey) {
                throw new Error("API Key is missing. Please configure REACT_APP_GEMINI_API_KEY or API_KEY.");
            }

            const ai = new GoogleGenAI({ apiKey });
            
            const prompt = `As a highly experienced financial compliance expert and regulatory lawyer, meticulously review the following new feature description and provide a comprehensive compliance assessment.
            
            **New Feature Description:** "${featureDesc}"
            
            **Our Existing Licensing Context (summary):** We currently hold various money transmitter licenses (e.g., California, New York, UK FCA, Ireland CBI) and are authorized for electronic money services in the EEA.
            
            **Your Task:**
            1.  **Identify Potential New Licenses:** Based on the feature, what new licenses or regulatory registrations might be required? Consider different jurisdictions.
            2.  **Key Compliance Areas:** Highlight the most critical compliance areas impacted by this feature (e.g., AML/KYC, consumer protection, data privacy, cross-border reporting, sanctions, capital requirements).
            3.  **Regulatory Challenges/Risks:** Describe specific regulatory challenges or risks this feature might introduce.
            4.  **Mitigation Strategies:** Suggest high-level strategies or considerations to mitigate these risks and ensure compliance.
            5.  **Jurisdictional Nuances:** If applicable, point out significant differences or specific requirements in key potential jurisdictions (e.g., Brazil, if mentioned).
            
            Provide your response in a structured, professional report format, suitable for internal compliance review.`;

            // Call Google GenAI model
            // Using 'gemini-1.5-flash' for speed and efficiency as per project standards
            const response = await ai.models.generateContent({ 
                model: 'gemini-1.5-flash', 
                contents: [{ parts: [{ text: prompt }] }] // Standard structure for @google/genai / @google/generative-ai
            });
            
            const aiText = response.response.text();
            setComplianceReport(aiText);

            // Parse suggested licenses using regex (heuristic based)
            const suggestedLics = (aiText.match(/(?:new licenses required:|potential new licenses:|licenses needed:)\s*([^\n\r]+)/i)?.[1] || '')
                                   .split(/,|\sand\s/i)
                                   .map(s => s.trim())
                                   .filter(Boolean);

            // Determine risk level based on keywords in the text (heuristic based)
            let riskLevel: ComplianceCheckResult['riskLevel'] = 'Low';
            const lowerText = aiText.toLowerCase();
            if (lowerText.includes('critical risk') || lowerText.includes('severe risk')) riskLevel = 'Critical';
            else if (lowerText.includes('high risk')) riskLevel = 'High';
            else if (lowerText.includes('medium risk') || lowerText.includes('moderate risk')) riskLevel = 'Medium';

            const newCheckResult: ComplianceCheckResult = {
                id: `CCR-${generateId()}`,
                featureDescription: featureDesc,
                checkDate: new Date().toISOString(),
                aiReport: aiText,
                suggestedLicenses: suggestedLics,
                riskLevel: riskLevel,
                status: 'Completed',
            };

            // Notify parent component of completion
            onCheckComplete(newCheckResult);

        } catch (err: any) {
            console.error("AI compliance check failed:", err);
            const errorMessage = err.message || "Unknown error occurred during AI check.";
            setError(errorMessage);
            setComplianceReport(`Error: Could not complete AI compliance check. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">AI Compliance Checker</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <label htmlFor="featureDesc" className="block text-gray-300 text-sm font-bold mb-1">Describe your new feature:</label>
                    <textarea
                        id="featureDesc"
                        value={featureDesc}
                        onChange={e => setFeatureDesc(e.target.value)}
                        className="w-full h-32 bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 placeholder-gray-500"
                        placeholder="e.g., A new feature to allow cross-border payments to Brazil, including instant transfers up to $10,000 and a currency exchange service."
                    />
                    
                    {error && (
                        <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    <button 
                        onClick={handleCheckCompliance} 
                        disabled={isLoading || !featureDesc.trim()} 
                        className="w-full py-2 bg-cyan-600 rounded disabled:opacity-50 text-white font-medium hover:bg-cyan-700 flex items-center justify-center transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Checking Compliance...
                            </>
                        ) : 'Check Compliance'}
                    </button>
                    
                    {complianceReport && !error && (
                        <div className="p-3 bg-gray-900/50 rounded whitespace-pre-line text-sm text-gray-200 border border-gray-700 max-h-60 overflow-y-auto custom-scrollbar">
                            <h4 className="font-semibold text-cyan-400 mb-2">AI Compliance Report:</h4>
                            {complianceReport}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIChecker;