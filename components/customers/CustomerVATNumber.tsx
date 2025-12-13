import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CustomerVATNumberProps {
  customerId: string;
  initialVATNumber: string;
  onVATNumberChange: (vatNumber: string) => void;
  isReadOnly: boolean;
}

/**
 * React component for displaying and managing a customer's VAT number (for AD55).
 * This component handles input, validation, and state management for the VAT number.
 */
const CustomerVATNumber: React.FC<CustomerVATNumberProps> = ({
  customerId,
  initialVATNumber,
  onVATNumberChange,
  isReadOnly,
}) => {
  const [vatNumber, setVatNumber] = useState(initialVATNumber);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update local state if initialVATNumber prop changes externally
  useEffect(() => {
    setVatNumber(initialVATNumber);
  }, [initialVATNumber]);

  // Simple validation logic (can be expanded based on specific AD55 requirements)
  const isValidVAT = (value: string): boolean => {
    // Basic check: must not be empty if required, or match a general pattern
    if (!value) return true; // Assuming VAT is optional unless specified otherwise
    // Example: Basic EU VAT format check (e.g., starts with 2 letters followed by digits)
    // This is highly dependent on the target region(s). For simplicity, we check length/format loosely.
    return value.length >= 5 && value.length <= 15;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim().toUpperCase();
    setVatNumber(newValue);
    setSaveStatus('idle'); // Reset status on change
  };

  const handleSave = useCallback(async () => {
    if (isReadOnly) return;

    if (!isValidVAT(vatNumber)) {
      setSaveStatus('error');
      // In a real app, you'd show a toast or inline error message here
      console.error("Invalid VAT number format.");
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // --- Mock API Call Simulation ---
      console.log(`Saving VAT for Customer ${customerId}: ${vatNumber}`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

      // If successful:
      onVATNumberChange(vatNumber);
      setSaveStatus('success');
      console.log("VAT saved successfully.");

    } catch (error) {
      setSaveStatus('error');
      console.error("Failed to save VAT number:", error);
    } finally {
      setIsSaving(false);
    }
  }, [vatNumber, customerId, onVATNumberChange, isReadOnly]);

  const showSaveButton = !isReadOnly && (vatNumber !== initialVATNumber || saveStatus === 'error');

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <Label htmlFor={`vat-number-${customerId}`} className="text-sm font-medium">
          Customer VAT Number (AD55)
        </Label>
        {saveStatus === 'success' && (
          <Alert className="w-auto p-2 bg-green-50 border-green-300 text-green-800">
            <AlertTitle className="sr-only">Success</AlertTitle>
            <AlertDescription className="text-xs">Saved!</AlertDescription>
          </Alert>
        )}
        {saveStatus === 'error' && (
          <Alert className="w-auto p-2 bg-red-50 border-red-300 text-red-800">
            <AlertCircle className="h-4 w-4 mr-2 inline" />
            <AlertTitle className="sr-only">Error</AlertTitle>
            <AlertDescription className="text-xs">Save Failed</AlertDescription>
          </Alert>
        )}
      </div>

      <Input
        id={`vat-number-${customerId}`}
        type="text"
        value={vatNumber}
        onChange={handleInputChange}
        placeholder="Enter VAT Number (e.g., GB123456789)"
        disabled={isReadOnly || isSaving}
        className={!isValidVAT(vatNumber) && vatNumber.length > 0 ? "border-red-500 focus-visible:ring-red-500" : ""}
      />

      {!isValidVAT(vatNumber) && vatNumber.length > 0 && (
        <p className="text-xs text-red-600 mt-1">
          Please enter a valid VAT number format.
        </p>
      )}

      {showSaveButton && !isReadOnly && (
        <Button
          onClick={handleSave}
          disabled={isSaving || !isValidVAT(vatNumber)}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save VAT Number'}
        </Button>
      )}

      {isReadOnly && (
        <p className="text-xs text-gray-500 mt-1">
          Read-only mode. Changes require editing permissions.
        </p>
      )}
    </div>
  );
};

export default CustomerVATNumber;