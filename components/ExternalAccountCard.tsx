import React from 'react';

// Define a simplified interface for nested types used in ExternalAccount
interface AccountDetail {
  id: string;
  account_number_safe: string; // The last 4 digits of the account_number.
  account_number_type: 'clabe' | 'iban' | 'other' | 'pan' | 'wallet_address';
  // Other fields like account_number are often sensitive and not displayed in summary
}

interface RoutingDetail {
  id: string;
  routing_number: string;
  routing_number_type: 'aba' | 'au_bsb' | 'br_codigo' | 'ca_cpa' | 'cnaps' | 'gb_sort_code' | 'in_ifsc' | 'my_branch_code' | 'swift';
  bank_name: string;
  // Other fields not displayed in summary
}

// Define the core ExternalAccount interface based on the OpenAPI schema
interface ExternalAccount {
  id: string;
  name: string | null; // A nickname for the external account
  party_name: string; // The legal name of the entity which owns the account.
  account_type: 'cash' | 'checking' | 'loan' | 'non_resident' | 'other' | 'overdraft' | 'savings';
  verification_status: 'pending_verification' | 'unverified' | 'verified';
  account_details: AccountDetail[];
  routing_details: RoutingDetail[];
  metadata?: { [key: string]: string };
  // For a summary card, these are the most relevant fields.
  // Other fields like created_at, updated_at, discarded_at, live_mode, party_type,
  // party_address, contact_details are omitted for brevity in this summary component.
}

interface ExternalAccountCardProps {
  account: ExternalAccount;
}

const ExternalAccountCard: React.FC<ExternalAccountCardProps> = ({ account }) => {
  const displayName = account.name || account.party_name;

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayName}</h3>
      <p className="text-sm text-gray-500 mb-4">ID: {account.id}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p><strong className="font-medium">Account Type:</strong> {account.account_type}</p>
          <p>
            <strong className="font-medium">Verification Status:</strong>{' '}
            {account.verification_status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </p>
        </div>

        {account.account_details && account.account_details.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mt-2">Account Details:</h4>
            {account.account_details.map((detail) => (
              <p key={detail.id} className="ml-2">
                {detail.account_number_type.toUpperCase()}: &bull;&bull;&bull;&bull; {detail.account_number_safe}
              </p>
            ))}
          </div>
        )}

        {account.routing_details && account.routing_details.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mt-2">Routing Details:</h4>
            {account.routing_details.map((detail) => (
              <div key={detail.id} className="ml-2">
                <p>{detail.bank_name}</p>
                <p>
                  <strong className="font-light">
                    {detail.routing_number_type.toUpperCase()}:
                  </strong>{' '}
                  {detail.routing_number}
                </p>
              </div>
            ))}
          </div>
        )}

        {account.metadata && Object.keys(account.metadata).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mt-2">Metadata:</h4>
            {Object.entries(account.metadata).map(([key, value]) => (
              <p key={key} className="ml-2">
                <strong className="font-light">{key}:</strong> {value}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalAccountCard;