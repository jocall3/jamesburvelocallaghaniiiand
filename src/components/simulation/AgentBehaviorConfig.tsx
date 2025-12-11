```tsx
// src/components/simulation/AgentBehaviorConfig.tsx
import React, { useState, useCallback } from 'react';

interface AgentBehaviorConfigProps {
    initialRationality: number;
    onRationalityChange: (rationality: number) => void;
    initialRiskAversion: number;
    onRiskAversionChange: (riskAversion: number) => void;
}

const AgentBehaviorConfig: React.FC<AgentBehaviorConfigProps> = ({
    initialRationality,
    onRationalityChange,
    initialRiskAversion,
    onRiskAversionChange,
}) => {
    const [rationality, setRationality] = useState(initialRationality);
    const [riskAversion, setRiskAversion] = useState(initialRiskAversion);

    const handleRationalityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 1) {
            setRationality(newValue);
            onRationalityChange(newValue);
        }
    }, [onRationalityChange]);

    const handleRiskAversionInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 1) {
            setRiskAversion(newValue);
            onRiskAversionChange(newValue);
        }
    }, [onRiskAversionChange]);

    return (
        <div className="p-4 border rounded-md bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Agent Behavior Configuration</h3>

            <div className="mb-4">
                <label htmlFor="rationality" className="block text-sm font-medium text-gray-300">
                    Rationality (0-1):
                </label>
                <input
                    type="number"
                    id="rationality"
                    className="mt-1 p-2 w-full rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none bg-gray-700 text-gray-100 border-gray-600"
                    min="0"
                    max="1"
                    step="0.01"
                    value={rationality.toString()}
                    onChange={handleRationalityInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Higher values indicate more rational decision-making.
                </p>
            </div>

            <div>
                <label htmlFor="riskAversion" className="block text-sm font-medium text-gray-300">
                    Risk Aversion (0-1):
                </label>
                <input
                    type="number"
                    id="riskAversion"
                    className="mt-1 p-2 w-full rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none bg-gray-700 text-gray-100 border-gray-600"
                    min="0"
                    max="1"
                    step="0.01"
                    value={riskAversion.toString()}
                    onChange={handleRiskAversionInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Higher values indicate greater aversion to risk.
                </p>
            </div>
        </div>
    );
};

export default AgentBehaviorConfig;
```