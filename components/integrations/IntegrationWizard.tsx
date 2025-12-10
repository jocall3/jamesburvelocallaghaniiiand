import React, { useState, ReactNode, useCallback } from 'react';

// Define a type for the props that each step component will receive
interface StepProps {
  onNext: (data: Record<string, any>) => void; // Callback to move to next step, passing collected data
  onPrevious: () => void; // Callback to move to previous step
  formData: Record<string, any>; // Data collected from previous steps
  isLastStep: boolean;
  isFirstStep: boolean;
}

// Define a type for a wizard step configuration
interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.FC<StepProps>; // Each step will be a React component
}

// --- Step Components (Placeholders) ---

const Step1ChooseIntegration: React.FC<StepProps> = ({ onNext, formData }) => {
  const [selectedIntegration, setSelectedIntegration] = useState(formData.integrationType || '');

  const handleNext = useCallback(() => {
    if (selectedIntegration) {
      onNext({ integrationType: selectedIntegration });
    } else {
      alert('Please select an integration type.'); // Basic client-side validation
    }
  }, [selectedIntegration, onNext]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Choose Integration Type</h2>
      <p className="text-gray-600 mb-6">Select the service you want to connect with.</p>
      <div className="space-y-3">
        {['Google', 'Microsoft', 'Apple', 'Amazon', 'Slack', 'Stripe', 'Salesforce'].map((type) => (
          <label key={type} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="integrationType"
              value={type}
              checked={selectedIntegration === type}
              onChange={(e) => setSelectedIntegration(e.target.value)}
              className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-lg text-gray-700">{type}</span>
          </label>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!selectedIntegration}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const Step2ConfigureIntegration: React.FC<StepProps> = ({ onNext, onPrevious, formData }) => {
  const [configData, setConfigData] = useState(formData.config || { apiKey: '', clientId: '', clientSecret: '' });

  const integrationType = formData.integrationType || 'Unknown';

  const handleNext = useCallback(() => {
    // Basic validation based on integration type
    if (integrationType === 'Google' || integrationType === 'Microsoft' || integrationType === 'Apple') {
      if (!configData.clientId || !configData.clientSecret) {
        alert('Please enter Client ID and Client Secret.');
        return;
      }
    } else {
      if (!configData.apiKey) {
        alert('Please enter API Key.');
        return;
      }
    }
    onNext({ config: configData });
  }, [configData, integrationType, onNext]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Configure {integrationType}</h2>
      <p className="text-gray-600 mb-6">Enter the necessary credentials for {integrationType}.</p>
      <div className="space-y-5">
        {(integrationType === 'Google' || integrationType === 'Microsoft' || integrationType === 'Apple') ? (
          <>
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                id="clientId"
                className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={configData.clientId}
                onChange={(e) => setConfigData({ ...configData, clientId: e.target.value })}
                placeholder="Enter Client ID"
              />
            </div>
            <div>
              <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <input
                type="password" // Use password type for sensitive info
                id="clientSecret"
                className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={configData.clientSecret}
                onChange={(e) => setConfigData({ ...configData, clientSecret: e.target.value })}
                placeholder="Enter Client Secret"
              />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password" // Use password type for sensitive info
              id="apiKey"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={configData.apiKey}
              onChange={(e) => setConfigData({ ...configData, apiKey: e.target.value })}
              placeholder="Enter API Key"
            />
          </div>
        )}
        {/* Add more configuration fields as needed based on integrationType */}
      </div>
      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const Step3Permissions: React.FC<StepProps> = ({ onNext, onPrevious, formData }) => {
  const [permissions, setPermissions] = useState(formData.permissions || { read: true, write: false, delete: false });

  const integrationType = formData.integrationType || 'Unknown';

  const handleNext = useCallback(() => {
    onNext({ permissions });
  }, [permissions, onNext]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Set Permissions for {integrationType}</h2>
      <p className="text-gray-600 mb-6">Define what data this integration can access and modify.</p>
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={permissions.read}
            onChange={(e) => setPermissions({ ...permissions, read: e.target.checked })}
            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-lg text-gray-700">Read data (e.g., view contacts, events)</span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={permissions.write}
            onChange={(e) => setPermissions({ ...permissions, write: e.target.checked })}
            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-lg text-gray-700">Write data (e.g., create new contacts, update tasks)</span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={permissions.delete}
            onChange={(e) => setPermissions({ ...permissions, delete: e.target.checked })}
            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-lg text-gray-700">Delete data (e.g., remove records)</span>
        </label>
        {/* More granular permissions could go here */}
      </div>
      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const Step4ReviewAndConnect: React.FC<StepProps> = ({ onNext, onPrevious, formData, isLastStep }) => {
  const integrationType = formData.integrationType || 'Unknown';

  const handleConnect = useCallback(() => {
    // In a real application, this would trigger an API call to your backend
    // to save the integration details and initiate the connection process.
    console.log('Attempting to connect integration with data:', formData);
    alert(`Connecting ${integrationType} integration... (Check console for full data)`);
    onNext({}); // Signal completion, maybe clear form or redirect
  }, [formData, integrationType, onNext]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Review & Connect {integrationType}</h2>
      <p className="text-gray-600 mb-6">Please review the details before connecting your integration.</p>
      <div className="bg-gray-50 p-6 rounded-lg space-y-4 border border-gray-200">
        <p className="text-lg"><strong>Integration Type:</strong> <span className="font-normal">{integrationType}</span></p>
        {formData.config && (
          <div>
            <p className="text-lg mb-2"><strong>Configuration:</strong></p>
            <ul className="list-disc list-inside ml-4 text-gray-700 space-y-1">
              {formData.config.apiKey && <li>API Key: <span className="font-mono text-sm">••••{formData.config.apiKey.slice(-4)}</span></li>}
              {formData.config.clientId && <li>Client ID: <span className="font-mono text-sm">••••{formData.config.clientId.slice(-4)}</span></li>}
              {formData.config.clientSecret && <li>Client Secret: <span className="font-mono text-sm">••••{formData.config.clientSecret.slice(-4)}</span></li>}
              {/* Do NOT display full sensitive keys */}
            </ul>
          </div>
        )}
        {formData.permissions && (
          <div>
            <p className="text-lg mb-2"><strong>Permissions:</strong></p>
            <ul className="list-disc list-inside ml-4 text-gray-700 space-y-1">
              <li>Read Data: <span className="font-normal">{formData.permissions.read ? 'Yes' : 'No'}</span></li>
              <li>Write Data: <span className="font-normal">{formData.permissions.write ? 'Yes' : 'No'}</span></li>
              <li>Delete Data: <span className="font-normal">{formData.permissions.delete ? 'Yes' : 'No'}</span></li>
            </ul>
          </div>
        )}
      </div>
      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Connect Integration
        </button>
      </div>
    </div>
  );
};

// --- Main Integration Wizard Component ---

const IntegrationWizard: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({}); // Stores data collected from all steps

  const steps: WizardStep[] = [
    { id: 'choose-type', title: 'Choose Integration', description: 'Select the service you want to connect.', component: Step1ChooseIntegration },
    { id: 'configure', title: 'Configure Credentials', description: 'Enter API keys or client IDs.', component: Step2ConfigureIntegration },
    { id: 'permissions', title: 'Set Permissions', description: 'Define access levels for the integration.', component: Step3Permissions },
    { id: 'review-connect', title: 'Review & Connect', description: 'Confirm settings and activate.', component: Step4ReviewAndConnect },
  ];

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = useCallback((stepData: Record<string, any>) => {
    setFormData((prevData) => ({ ...prevData, ...stepData }));
    if (!isLastStep) {
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
    } else {
      // Wizard completed, final action (e.g., redirect, show success message)
      console.log('Wizard completed with final data:', { ...formData, ...stepData });
      alert('Integration setup complete! You can now manage it from your dashboard.');
      // Optionally reset wizard or navigate away
      // setCurrentStepIndex(0);
      // setFormData({});
    }
  }, [isLastStep, formData]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex((prevIndex) => prevIndex - 1);
    }
  }, [isFirstStep]);

  const CurrentStepComponent = currentStep.component;

  return (
    <div className="max-w-4xl mx-auto my-10 p-8 bg-white shadow-xl rounded-lg border border-gray-100">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">New Integration Wizard</h1>

      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-10 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 mx-4">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 text-center relative z-10">
            <div
              className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg
                ${index === currentStepIndex ? 'bg-blue-600 ring-4 ring-blue-200' : ''}
                ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-400'}
                transition-all duration-300 ease-in-out
              `}
            >
              {index + 1}
            </div>
            <p className={`text-sm mt-3 ${index === currentStepIndex ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
              {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="border border-gray-200 rounded-lg min-h-[350px] bg-white shadow-sm">
        <CurrentStepComponent
          onNext={handleNext}
          onPrevious={handlePrevious}
          formData={formData}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      </div>
    </div>
  );
};

export default IntegrationWizard;