
import React, { useState, useEffect, useRef, useContext } from 'react';
import Card from './Card';
import { GoogleGenAI } from "@google/genai";
import { DataContext } from '../context/DataContext';

const AIAdvisorView: React.FC = () => {
    const context = useContext(DataContext);
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('I am your AI Financial Advisor. How can I help you today?');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        
        try {
            if (context?.geminiApiKey) {
                const ai = new GoogleGenAI({ apiKey: context.geminiApiKey });
                const result = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: input,
                });
                setResponse(result.text);
            } else {
                 // Fallback simulation
                setTimeout(() => {
                    setResponse(`I have analyzed your request: "${input}". Based on your current portfolio, I recommend diversifying into index funds to mitigate risk.`);
                    setIsLoading(false);
                }, 1000);
            }
        } catch (error) {
            console.error("AI Advisor Error:", error)
            setResponse("I'm sorry, I encountered an error processing your request.");
        } finally {
            setIsLoading(false);
            setInput('');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">AI Financial Advisor</h2>
            <Card title="Strategic Counsel">
                <div className="h-96 flex flex-col">
                    <div className="flex-grow p-4 bg-gray-900/50 rounded-lg mb-4 overflow-y-auto border border-gray-700">
                        <p className="text-gray-300 whitespace-pre-wrap">{response}</p>
                        {isLoading && <p className="text-cyan-400 mt-2 animate-pulse">Analyzing financial data...</p>}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            className="flex-grow p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            placeholder="Ask for advice..."
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AIAdvisorView;