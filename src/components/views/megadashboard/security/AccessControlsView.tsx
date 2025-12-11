import React, { useState, useContext } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  AlertTriangle, 
  Cpu, 
  Code, 
  Save, 
  RefreshCw, 
  Search 
} from 'lucide-react';
import { DataContext } from '../../../../context/DataContext';

interface PolicyStatement {
  effect: 'Allow' | 'Deny';
  action: string[];
  resource: string[];
  condition?: Record<string, any>;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  version: string;
  statements: PolicyStatement[];
  createdAt: string;
  lastUpdated: string;
}

const INITIAL_POLICIES: Policy[] = [
  {
    id: 'pol_001',
    name: 'AdminFullAccess',
    description: 'Provides full access to all resources. Restricted to System Administrators.',
    version: '2023-10-27',
    createdAt: '2023-01-15T08:00:00Z',
    lastUpdated: '2023-10-27T14:30:00Z',
    statements: [
      {
        effect: 'Allow',
        action: ['*'],
        resource: ['*'],
      },
    ],
  },
  {
    id: 'pol_002',
    name: 'ReadOnlyBilling',
    description: 'Allows read-only access to billing and usage data.',
    version: '2023-11-05',
    createdAt: '2023-03-22T09:15:00Z',
    lastUpdated: '2023-11-05T10:00:00Z',
    statements: [
      {
        effect: 'Allow',
        action: ['billing:Get*', 'billing:List*', 'usage:Get*'],
        resource: ['*'],
      },
    ],
  },
  {
    id: 'pol_003',
    name: 'DeveloperSandboxAccess',
    description: 'Access to development environments restricted by IP range.',
    version: '2024-01-12',
    createdAt: '2023-06-10T11:45:00Z',
    lastUpdated: '2024-01-12T16:20:00Z',
    statements: [
      {
        effect: 'Allow',
        action: ['ec2:*', 's3:*', 'lambda:*'],
        resource: ['arn:aws:*:us-east-1:*:env/dev/*'],
        condition: {
          IpAddress: {
            'aws:SourceIp': '203.0.113.0/24'
          }
        }
      },
    ],
  },
];

const AccessControlsView: React.FC = () => {
  const { generateContent } = useContext(DataContext);
  const [policies, setPolicies] = useState<Policy[]>(INITIAL_POLICIES);
  const [nlInput, setNlInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPolicyJson, setGeneratedPolicyJson] = useState<string | null>(null);
  const [generatedPolicyName, setGeneratedPolicyName] = useState('');
  
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    analysis: string;
    suggestions: string[];
  } | null>(null);

  const handleGeneratePolicy = async () => {
    if (!nlInput.trim()) return;

    setIsGenerating(true);
    setGeneratedPolicyJson(null);

    try {
      const prompt = `
        You are an expert security architect and IAM policy generator.
        Convert the following natural language requirement into a strict JSON Access Control Policy structure.
        The JSON must adhere to a standard AWS-like IAM policy format with 'Version', 'Statement' array (Effect, Action, Resource, Condition).
        Do not include any explanation, markdown formatting, or conversational text. Return ONLY the valid JSON string.
        
        Requirement: "${nlInput}"
      `;

      const response = await generateContent(prompt);
      // Strip markdown code blocks if present
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      setGeneratedPolicyJson(cleanJson);
      
      // Auto-generate a name
      const namePrompt = `Generate a concise, PascalCase name (max 30 chars) for this policy: "${nlInput}". Return only the name.`;
      const nameResponse = await generateContent(namePrompt);
      setGeneratedPolicyName(nameResponse.replace(/[^a-zA-Z0-9]/g, ''));

    } catch (error) {
      console.error("Failed to generate policy:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGeneratedPolicy = () => {
    if (!generatedPolicyJson) return;

    try {
      const parsed = JSON.parse(generatedPolicyJson);
      const newPolicy: Policy = {
        id: `pol_${Date.now()}`,
        name: generatedPolicyName || 'NewPolicy',
        description: nlInput,
        version: new Date().toISOString().split('T')[0],
        statements: parsed.Statement || parsed.statements || [], // Handle potential case variations from AI
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      setPolicies([newPolicy, ...policies]);
      setGeneratedPolicyJson(null);
      setNlInput('');
      setGeneratedPolicyName('');
    } catch (e) {
      alert("The generated JSON was invalid. Please regenerate.");
    }
  };

  const handleValidatePolicy = async (policy: Policy) => {
    setIsValidating(true);
    setSelectedPolicy(policy);
    setValidationResult(null);

    try {
      const prompt = `
        You are a senior security auditor. Analyze the following IAM policy JSON for security risks, over-permissioning (wildcards), and logic errors.
        
        Policy: ${JSON.stringify(policy)}
        
        Return a JSON object with the following structure:
        {
          "riskLevel": "Low" | "Medium" | "High" | "Critical",
          "analysis": "A concise 2-3 sentence summary of the security posture.",
          "suggestions": ["Array of specific strings for improvement"]
        }
        Return ONLY the JSON.
      `;

      const response = await generateContent(prompt);
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      setValidationResult(JSON.parse(cleanJson));
    } catch (error) {
      console.error("Validation failed", error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-cyan-400" />
            Access Controls
          </h1>
          <p className="text-gray-400 mt-2">
            Define, audit, and enforce the laws of access. The Gatekeeper's Keys.
          </p>
        </div>
      </header>

      {/* AI Policy Generator Section */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Cpu className="h-32 w-32 text-cyan-400" />
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Code className="h-5 w-5 text-purple-400" />
          AI Policy Generator
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Describe the access requirements in natural language. The AI will construct the strict IAM JSON policy for you.
            </p>
            <div className="relative">
              <textarea
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="e.g., Allow members of the DataScience team to read from S3 buckets starting with 'data-lake-' but deny delete permissions."
                className="w-full h-40 bg-gray-950 border border-gray-700 rounded-lg p-4 text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-mono text-sm"
              />
              <button
                onClick={handleGeneratePolicy}
                disabled={isGenerating || !nlInput.trim()}
                className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                  isGenerating 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-900/20'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Forging Policy...
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    Generate Policy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 relative font-mono text-xs overflow-auto h-64 lg:h-auto">
            {generatedPolicyJson ? (
              <>
                <div className="flex justify-between items-center mb-2 sticky top-0 bg-gray-950 pb-2 border-b border-gray-800">
                  <span className="text-green-400 font-bold">JSON Preview</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={generatedPolicyName} 
                      onChange={(e) => setGeneratedPolicyName(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs"
                      placeholder="Policy Name"
                    />
                    <button
                      onClick={handleSaveGeneratedPolicy}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Save className="h-3 w-3" /> Save
                    </button>
                  </div>
                </div>
                <pre className="text-green-300 whitespace-pre-wrap">{generatedPolicyJson}</pre>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <Code className="h-8 w-8 mb-2 opacity-50" />
                <p>Waiting for input...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Policy List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Active Policies</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search policies..." 
                className="bg-gray-900 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-cyan-500 w-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            {policies.map((policy) => (
              <div 
                key={policy.id} 
                className={`bg-gray-900 border rounded-xl p-5 transition-all hover:shadow-md hover:shadow-cyan-900/10 cursor-pointer ${selectedPolicy?.id === policy.id ? 'border-cyan-500/50 bg-gray-800/50' : 'border-gray-800 hover:border-gray-700'}`}
                onClick={() => handleValidatePolicy(policy)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      {policy.name}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">v{policy.version}</span>
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{policy.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-cyan-400 transition-colors" title="Edit Policy">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-red-400 transition-colors" title="Delete Policy">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4 text-xs font-mono text-gray-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Active</span>
                  </div>
                  <div>Created: {new Date(policy.createdAt).toLocaleDateString()}</div>
                  <div>Statements: {policy.statements.length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="space-y-6">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 h-full backdrop-blur-sm sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              AI Policy Validator
            </h2>
            
            {isValidating ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
                <p className="text-sm">Auditing policy structure...</p>
              </div>
            ) : selectedPolicy && validationResult ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-gray-800">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Selected Policy</span>
                  <div className="text-white font-medium mt-1">{selectedPolicy.name}</div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Security Risk Level</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      validationResult.riskLevel === 'Critical' ? 'bg-red-900/30 text-red-400 border border-red-900' :
                      validationResult.riskLevel === 'High' ? 'bg-orange-900/30 text-orange-400 border border-orange-900' :
                      validationResult.riskLevel === 'Medium' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900' :
                      'bg-green-900/30 text-green-400 border border-green-900'
                    }`}>
                      {validationResult.riskLevel}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        validationResult.riskLevel === 'Critical' ? 'bg-red-500 w-full' :
                        validationResult.riskLevel === 'High' ? 'bg-orange-500 w-3/4' :
                        validationResult.riskLevel === 'Medium' ? 'bg-yellow-500 w-1/2' :
                        'bg-green-500 w-1/4'
                      }`} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Analysis</span>
                  <p className="text-sm text-gray-300 leading-relaxed bg-gray-950 p-3 rounded-lg border border-gray-800">
                    {validationResult.analysis}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Recommendations</span>
                  <ul className="space-y-2">
                    {validationResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex gap-2 items-start">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <Lock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a policy to run a real-time AI security audit.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControlsView;