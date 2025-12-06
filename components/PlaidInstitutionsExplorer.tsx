
import React, { useState, useCallback, useEffect } from 'react';
import {
  Institution,
  Products,
  CountryCode,
} from 'plaid';
import { PlaidClient } from '../lib/plaidClient';
import { useDebounce } from '../hooks/useDebounce';

interface PlaidInstitutionsExplorerProps {
  client: PlaidClient;
}

export const PlaidInstitutionsExplorer: React.FC<PlaidInstitutionsExplorerProps> = ({ client }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
      if (debouncedSearchTerm) {
          client.institutionsSearch({ query: debouncedSearchTerm, products: [], country_codes: [] })
              .then(res => setInstitutions(res.institutions));
      } else {
          setInstitutions([]);
      }
  }, [debouncedSearchTerm, client]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Plaid Institutions</h1>
      <input
        type="text"
        placeholder="Search banks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />
      <ul className="border rounded divide-y">
        {institutions.map(inst => (
            <li key={inst.institution_id} className="p-3 hover:bg-gray-100">
                <div className="font-bold">{inst.name}</div>
                <div className="text-sm text-gray-500">{inst.institution_id}</div>
            </li>
        ))}
      </ul>
    </div>
  );
};
