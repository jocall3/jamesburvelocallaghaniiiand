

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  VirtualAccount,
} from '../types';
import { Input } from './Input';
import { Button } from './ui/button'; // Ensure this matches component filename casing
import { useInternalAccounts } from '../hooks/useInternalAccounts';
import { useCounterparties } from '../hooks/useCounterparties';

interface VirtualAccountCreateRequest {
    name: string;
    description?: string;
    counterparty_id?: string;
    internal_account_id: string;
    debit_ledger_account_id?: string;
    credit_ledger_account_id?: string;
    metadata?: Record<string, string>;
    account_details?: any[];
    routing_details?: any[];
}

interface VirtualAccountUpdateRequest {
    name?: string;
    description?: string;
    metadata?: Record<string, string>;
}

interface VirtualAccountFormProps {
  initialValues?: VirtualAccount;
  onSubmit: (
    data: VirtualAccountCreateRequest | VirtualAccountUpdateRequest,
  ) => void;
  isSubmitting: boolean;
  error?: string;
}

const VirtualAccountForm: React.FC<VirtualAccountFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VirtualAccountCreateRequest & VirtualAccountUpdateRequest>({
    defaultValues: initialValues || {
        name: '', description: '', counterparty_id: '', internal_account_id: '',
        debit_ledger_account_id: '', credit_ledger_account_id: '', metadata: {},
        account_details: [], routing_details: [],
    },
  });

  const { data: internalAccounts } = useInternalAccounts();
  const { data: counterparties } = useCounterparties();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}
      <Input label="Name" {...register('name', { required: 'Name is required' })} />
      <Input label="Description" {...register('description')} />
      
       {counterparties && (
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300">Counterparty</label>
            <select {...register('counterparty_id')} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
              <option value="">Select a Counterparty</option>
              {counterparties.map((cp: any) => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
            </select>
          </div>
        )}

      {internalAccounts && (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300">Internal Account</label>
          <select {...register('internal_account_id')} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            <option value="">Select an Internal Account</option>
            {internalAccounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>
      )}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : initialValues ? 'Update' : 'Create'}
      </Button>
    </form>
  );
};

export default VirtualAccountForm;