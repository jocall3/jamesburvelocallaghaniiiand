
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

// Type definitions based on the OpenAPI specification
interface Address {
    line1: string | null;
    line2: string | null;
    locality: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
}

interface AccountDetail {
    account_number: string;
    account_number_type: 'iban' | 'clabe' | 'wallet_address' | 'pan' | 'other';
}

interface RoutingDetail {
    routing_number: string;
    routing_number_type: 'aba' | 'swift' | 'au_bsb' | 'ca_cpa' | 'cnaps' | 'gb_sort_code' | 'in_ifsc' | 'my_branch_code' | 'br_codigo';
    payment_type?: 'ach' | 'au_becs' | 'bacs' | 'book' | 'card' | 'check' | 'eft' | 'cross_border' | 'interac' | 'masav' | 'neft' | 'provxchange' | 'rtp' | 'sen' | 'sepa' | 'signet' | 'wire';
}

interface ExternalAccount {
    name: string | null;
    party_name: string;
    party_type: 'business' | 'individual' | null;
    party_address?: Address;
    account_type: 'cash' | 'checking' | 'loan' | 'non_resident' | 'other' | 'overdraft' | 'savings';
    account_details: AccountDetail[];
    routing_details: RoutingDetail[];
    metadata?: { [key: string]: string };
}

export interface CounterpartyFormData {
    name: string | null;
    email: string | null;
    send_remittance_advice: boolean;
    taxpayer_identifier?: string;
    accounts: ExternalAccount[];
    metadata?: { [key: string]: string };
}

interface CounterpartyFormProps {
    initialData?: Partial<CounterpartyFormData>;
    onSubmit: (data: CounterpartyFormData) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    mode?: 'create' | 'edit';
}

const defaultAccount: ExternalAccount = {
    name: '',
    party_name: '',
    party_type: 'business',
    party_address: {
        line1: '',
        line2: '',
        locality: '',
        region: '',
        postal_code: '',
        country: '',
    },
    account_type: 'checking',
    account_details: [{ account_number: '', account_number_type: 'other' }],
    routing_details: [{ routing_number: '', routing_number_type: 'aba' }],
    metadata: {},
};

const defaultFormData: CounterpartyFormData = {
    name: '',
    email: '',
    send_remittance_advice: false,
    taxpayer_identifier: '',
    accounts: [],
    metadata: {},
};

export const CounterpartyForm: React.FC<CounterpartyFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting = false,
    mode = 'create'
}) => {
    const [formData, setFormData] = useState<CounterpartyFormData>(defaultFormData);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultFormData,
                ...initialData,
                accounts: initialData.accounts || [],
                send_remittance_advice: initialData.send_remittance_advice ?? false,
            });
        }
    }, [initialData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">{mode === 'create' ? 'Create Counterparty' : 'Edit Counterparty'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Taxpayer Identifier</label>
                    <input 
                        type="text" 
                        name="taxpayer_identifier" 
                        value={formData.taxpayer_identifier || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" 
                    />
                </div>
                <div className="flex items-center pt-6">
                    <input 
                        type="checkbox" 
                        name="send_remittance_advice" 
                        checked={formData.send_remittance_advice} 
                        onChange={handleChange} 
                        id="send_remittance_advice"
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-500 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <label htmlFor="send_remittance_advice" className="ml-2 text-sm font-medium text-gray-300">Send Remittance Advice</label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Saving...' : 'Save Counterparty'}
                </button>
            </div>
        </form>
    );
};
