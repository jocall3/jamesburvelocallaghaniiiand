import React, { useState, useMemo, useCallback } from 'react';

// Define the AIModel interface
interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  useCases: string[];
  pricingTier: 'Free' | 'Standard' | 'Premium';
  category: 'Text Generation' | 'Image Generation' | 'Natural Language Understanding' | 'Code Generation' | 'Speech Recognition' | 'Multimodal';
  parameters: number; // e.g., 175B for GPT-3
  lastUpdated: string; // ISO date string
  status: 'Active' | 'Beta' | 'Deprecated';
  apiEndpoint?: string; // Optional, for direct integration info
  documentationUrl?: string;
}

// Mock data for AI models
const mockModels: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Our most advanced, multimodal model that integrates text, vision, and audio capabilities.',
    capabilities: ['Text Generation', 'Image Understanding', 'Audio Understanding', 'Code Generation'],
    useCases: ['Content Creation', 'Chatbots', 'Data Analysis', 'Creative Writing'],
    pricingTier: 'Premium',
    category: 'Multimodal',
    parameters: 1000000000000, // Placeholder, actual not public
    lastUpdated: '2024-05-13',
    status: 'Active',
    documentationUrl: 'https://platform.openai.com/docs/models/gpt-4o',
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Anthropic\'s most intelligent model, offering state-of-the-art performance on highly complex tasks.',
    capabilities: ['Text Generation', 'Natural Language Understanding', 'Code Generation', 'Vision'],
    useCases: ['Research', 'Strategic Analysis', 'Complex Automation'],
    pricingTier: 'Premium',
    category: 'Multimodal',
    parameters: 1000000000000, // Placeholder
    lastUpdated: '2024-03-04',
    status: 'Active',
    documentationUrl: 'https://www.anthropic.com/news/claude-3-family',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Google\'s powerful, multimodal model with a massive context window, ideal for long-form content and complex reasoning.',
    capabilities: ['Text Generation', 'Image Understanding', 'Video Understanding', 'Code Generation'],
    useCases: ['Long Document Analysis', 'Video Summarization', 'Advanced Chatbots'],
    pricingTier: 'Standard',
    category: 'Multimodal',
    parameters: 1000000000000, // Placeholder
    lastUpdated: '2024-02-15',
    status: 'Active',
    documentationUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini-1-5-pro',
  },
  {
    id: 'llama-3-8b',
    name: 'Llama 3 8B',
    provider: 'Meta',
    description: 'A powerful and efficient open-source large language model from Meta, suitable for a wide range of tasks.',
    capabilities: ['Text Generation', 'Natural Language Understanding', 'Code Generation'],
    useCases: ['Local Development', 'Fine-tuning', 'General Purpose Chatbots'],
    pricingTier: 'Free',
    category: 'Text Generation',
    parameters: 8000000000,
    lastUpdated: '2024-04-18',
    status: 'Active',
    documentationUrl: 'https://llama.meta.com/llama3/',
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    description: 'OpenAI\'s advanced image generation model, capable of creating high-quality images from text prompts.',
    capabilities: ['Image Generation'],
    useCases: ['Art Creation', 'Marketing Content', 'Prototyping'],
    pricingTier: 'Standard',
    category: 'Image Generation',
    parameters: 1000000000, // Placeholder
    lastUpdated: '2023-09-20',
    status: 'Active',
    documentationUrl: 'https://openai.com/dall-e-3',
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    description: 'A powerful open-source text-to-image model, offering high-resolution image generation and fine-tuning capabilities.',
    capabilities: ['Image Generation'],
    useCases: ['Creative Arts', 'Graphic Design', 'Research'],
    pricingTier: 'Free',
    category: 'Image Generation',
    parameters: 3500000000, // Placeholder
    lastUpdated: '2023-07-26',
    status: 'Active',
    documentationUrl: 'https://stability.ai/blog/stable-diffusion-xl-release',
  },
  {
    id: 'whisper',
    name: 'Whisper',
    provider: 'OpenAI',
    description: 'A robust speech-to-text model trained on a large dataset of audio and text.',
    capabilities: ['Speech-to-Text', 'Language Identification'],
    useCases: ['Transcription', 'Voice Assistants', 'Meeting Summaries'],
    pricingTier: 'Free',
    category: 'Speech Recognition',
    parameters: 1500000000, // Placeholder
    lastUpdated: '2022-09-21',
    status: 'Active',
    documentationUrl: 'https://openai.com/research/whisper',
  },
];

// Helper to format large numbers for readability (e.g., 1.5B, 175M)
const formatParameters = (num: number): string => {
  if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(1)}T`;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  return num.toString();
};

// ModelCard Component: Displays a summary of an AI model in the list
const ModelCard: React.FC<{ model: AIModel; onSelect: (model: AIModel) => void; isSelected: boolean }> = ({ model, onSelect, isSelected }) => (
  <div
    className={`p-4 border rounded-lg shadow-sm cursor-pointer transition-all duration-200
                ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-200 hover:shadow-md hover:border-gray-300'}`}
    onClick={() => onSelect(model)}
  >
    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
    <p className="text-sm text-gray-600 mb-2">{model.provider} - {model.category}</p>
    <p className="text-sm text-gray-700 line-clamp-2">{model.description}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        model.pricingTier === 'Free' ? 'bg-green-100 text-green-800' :
        model.pricingTier === 'Standard' ? 'bg-yellow-100 text-yellow-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        {model.pricingTier}
      </span>
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        {formatParameters(model.parameters)} Params
      </span>
    </div>
  </div>
);

// ModelDetail Component: Displays comprehensive information about a selected AI model
const ModelDetail: React.FC<{ model: AIModel }> = ({ model }) => (
  <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{model.name}</h2>
    <p className="text-md text-gray-600 mb-4">{model.provider} - {model.category}</p>

    <p className="text-gray-800 mb-4">{model.description}</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <h3 className="font-semibold text-gray-700">Capabilities:</h3>
        <ul className="list-disc list-inside text-gray-600">
          {model.capabilities.map((cap, i) => <li key={i}>{cap}</li>)}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700">Use Cases:</h3>
        <ul className="list-disc list-inside text-gray-600">
          {model.useCases.map((uc, i) => <li key={i}>{uc}</li>)}
        </ul>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <h3 className="font-semibold text-gray-700">Details:</h3>
        <p className="text-gray-600"><strong>Pricing Tier:</strong> {model.pricingTier}</p>
        <p className="text-gray-600"><strong>Parameters:</strong> {formatParameters(model.parameters)}</p>
        <p className="text-gray-600"><strong>Last Updated:</strong> {model.lastUpdated}</p>
        <p className="text-gray-600"><strong>Status:</strong> <span className={`font-medium ${
          model.status === 'Active' ? 'text-green-600' :
          model.status === 'Beta' ? 'text-yellow-600' :
          'text-red-600'
        }`}>{model.status}</span></p>
      </div>
      <div>
        {model.documentationUrl && (
          <>
            <h3 className="font-semibold text-gray-700">Resources:</h3>
            <a
              href={model.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center"
            >
              Documentation
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0l-7 7"></path>
              </svg>
            </a>
          </>
        )}
        {model.apiEndpoint && (
          <p className="text-gray-600 mt-2"><strong>API Endpoint:</strong> <code className="bg-gray-100 p-1 rounded text-sm">{model.apiEndpoint}</code></p>
        )}
      </div>
    </div>
  </div>
);

// Main AIModelExplorer Component: Allows users to browse, search, and filter AI models
const AIModelExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<AIModel['category'] | 'All'>('All');
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  // Dynamically get all unique categories from mockModels
  const allCategories = useMemo(() => {
    const categories = new Set<AIModel['category']>();
    mockModels.forEach(model => categories.add(model.category));
    return ['All', ...Array.from(categories).sort()];
  }, []);

  // Filter models based on search term and category
  const filteredModels = useMemo(() => {
    return mockModels.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            model.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || model.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, filterCategory]);

  // Callback for selecting a model from the list
  const handleSelectModel = useCallback((model: AIModel) => {
    setSelectedModel(model);
  }, []);

  // Effect to manage selectedModel when filteredModels change
  React.useEffect(() => {
    if (!selectedModel && filteredModels.length > 0) {
      // If no model is selected, and there are filtered models, select the first one
      setSelectedModel(filteredModels[0]);
    } else if (selectedModel && !filteredModels.some(m => m.id === selectedModel.id)) {
      // If the currently selected model is no longer in the filtered list, clear selection
      // and select the first available if any
      setSelectedModel(filteredModels.length > 0 ? filteredModels[0] : null);
    }
  }, [filteredModels, selectedModel]);


  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">AI Model Explorer</h1>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search models by name, description, or provider..."
          className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="p-3 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 md:w-auto w-full"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as AIModel['category'] | 'All')}
        >
          {allCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Model List and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model List */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-md border border-gray-200 max-h-[calc(100vh-200px)] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Models ({filteredModels.length})</h2>
          <div className="space-y-4">
            {filteredModels.length > 0 ? (
              filteredModels.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onSelect={handleSelectModel}
                  isSelected={selectedModel?.id === model.id}
                />
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No models found matching your criteria.</p>
            )}
          </div>
        </div>

        {/* Model Detail */}
        <div className="lg:col-span-2">
          {selectedModel ? (
            <ModelDetail model={selectedModel} />
          ) : (
            <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200 text-center flex items-center justify-center h-full min-h-[300px]">
              <p className="text-gray-600 text-lg">Select a model from the left to view its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIModelExplorer;