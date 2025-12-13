```typescript
import React, { useState, useCallback, useEffect } from 'react';
import {
  Institution,
  Products,
  CountryCode,
} from 'plaid';
import { PlaidClient } from '../lib/plaidClient';
import { useDebounce } from '../hooks/useDebounce';

// Begin: The James Burvel O’Callaghan III Code - Plaid Institutions Explorer - Version 1.0.0
// Company: JBO III Code - Core Services Division
// File: components/PlaidInstitutionsExplorer.tsx
// Module: PlaidInstitutionsExplorer - UI Component

interface PlaidInstitutionsExplorerProps {
  client: PlaidClient;
}

const PlaidInstitutionsExplorerA = ({ client }: PlaidInstitutionsExplorerProps) => {
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

const PlaidInstitutionsExplorerB = ({ client }: PlaidInstitutionsExplorerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        if (debouncedSearchTerm) {
            client.institutionsSearch({ query: debouncedSearchTerm, products: ['auth', 'transactions'], country_codes: ['US', 'CA'] })
                .then(res => {
                    if (res.institutions && Array.isArray(res.institutions)) {
                        setInstitutions(res.institutions);
                    } else {
                        setInstitutions([]);
                    }
                })
                .catch(error => {
                    console.error("Error fetching institutions:", error);
                    setInstitutions([]);
                });
        } else {
            setInstitutions([]);
        }
    }, [debouncedSearchTerm, client]);

    return (
        <div className="p-8 bg-gray-50 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold mb-6 text-gray-800">Plaid Institutions Explorer</h2>
            <div className="mb-6">
                <label htmlFor="institutionSearch" className="block text-sm font-medium text-gray-700">Search for Institutions:</label>
                <input
                    type="text"
                    id="institutionSearch"
                    placeholder="Enter institution name or keyword"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
            </div>
            {institutions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Products Supported
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Country Codes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {institutions.map(institution => (
                                <tr key={institution.institution_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {institution.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {institution.institution_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Placeholder for products */}
                                        Auth, Transactions, Investments
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        US, CA
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center text-gray-500">
                    {debouncedSearchTerm ? 'Loading institutions...' : 'Enter a search term to find institutions.'}
                </div>
            )}
        </div>
    );
};

const PlaidInstitutionsExplorerC = ({ client }: PlaidInstitutionsExplorerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchInstitutions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (debouncedSearchTerm) {
                const response = await client.institutionsSearch({ query: debouncedSearchTerm, products: ['auth', 'transactions', 'identity'], country_codes: ['US', 'GB', 'CA'] });
                if (response.institutions && Array.isArray(response.institutions)) {
                    setInstitutions(response.institutions);
                } else {
                    setInstitutions([]);
                }
            } else {
                setInstitutions([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching institutions.');
            console.error("Error fetching institutions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, client]);

    useEffect(() => {
        fetchInstitutions();
    }, [fetchInstitutions]);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-4">Plaid Institutions Explorer - Advanced</h1>
            <p className="text-gray-700 mb-4">Explore and search for Plaid-supported institutions. This component demonstrates advanced features including error handling, loading states, and expanded search parameters.</p>
            <div className="mb-4">
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700">Search Institutions:</label>
                <input
                    type="text"
                    id="search-input"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by name or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="text-center text-gray-500">
                    <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.313 2.687 6 6 6v-1.709z"></path>
                    </svg>
                    <p>Loading...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong> <span className="block sm:inline">{error}</span>
                </div>
            )}

            {institutions.length > 0 && !isLoading && !error && (
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supported Products
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Country Codes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {institutions.map((institution, index) => (
                                <tr key={institution.institution_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {institution.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {institution.institution_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Placeholder for dynamic product display */}
                                        Auth, Transactions, Identity
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        US, GB, CA
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isLoading && !error && institutions.length === 0 && (
                <div className="text-center text-gray-500">
                    {debouncedSearchTerm ? 'No institutions found.' : 'Enter a search term to find institutions.'}
                </div>
            )}
        </div>
    );
};

const PlaidInstitutionsExplorerD = ({ client }: PlaidInstitutionsExplorerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchInstitutions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (debouncedSearchTerm) {
                const response = await client.institutionsSearch({ query: debouncedSearchTerm, products: ['auth', 'transactions', 'identity', 'assets'], country_codes: ['US', 'GB', 'CA', 'ES'] });
                if (response.institutions && Array.isArray(response.institutions)) {
                    setInstitutions(response.institutions);
                } else {
                    setInstitutions([]);
                }
            } else {
                setInstitutions([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching institutions.');
            console.error("Error fetching institutions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, client]);

    useEffect(() => {
        fetchInstitutions();
    }, [fetchInstitutions]);

    const handleInstitutionClick = (institution: Institution) => {
        setSelectedInstitution(institution);
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-4">Plaid Institutions Explorer - Detailed</h1>
            <p className="text-gray-700 mb-4">This version features detailed institution information and click-to-view functionality.</p>

            <div className="mb-4">
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700">Search Institutions:</label>
                <input
                    type="text"
                    id="search-input"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by name or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="text-center text-gray-500">
                    <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.313 2.687 6 6 6v-1.709z"></path>
                    </svg>
                    <p>Loading...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong> <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="flex">
                <div className="w-1/2 pr-4">
                    {institutions.length > 0 && !isLoading && !error && (
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Institution Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {institutions.map((institution, index) => (
                                        <tr key={institution.institution_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {institution.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleInstitutionClick(institution)}
                                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!isLoading && !error && institutions.length === 0 && (
                        <div className="text-center text-gray-500">
                            {debouncedSearchTerm ? 'No institutions found.' : 'Enter a search term to find institutions.'}
                        </div>
                    )}
                </div>

                <div className="w-1/2 pl-4">
                    {selectedInstitution && (
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-2">{selectedInstitution.name}</h3>
                            <p className="text-gray-700"><strong>Institution ID:</strong> {selectedInstitution.institution_id}</p>
                            <p className="text-gray-700"><strong>Supported Products:</strong> Auth, Transactions, Identity, Assets</p>
                            <p className="text-gray-700"><strong>Country Codes:</strong> US, GB, CA, ES</p>
                            {/* Add more detailed institution information here as needed */}
                        </div>
                    )}
                    {!selectedInstitution && (
                        <div className="text-gray-500">
                            Select an institution to view details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlaidInstitutionsExplorerE = ({ client }: PlaidInstitutionsExplorerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [institutionDetails, setInstitutionDetails] = useState<any | null>(null); // Assuming a more complex detail structure
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchInstitutions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (debouncedSearchTerm) {
                const response = await client.institutionsSearch({ query: debouncedSearchTerm, products: ['auth', 'transactions', 'identity', 'assets', 'investments'], country_codes: ['US', 'GB', 'CA', 'ES', 'DE'] });
                if (response.institutions && Array.isArray(response.institutions)) {
                    setInstitutions(response.institutions);
                } else {
                    setInstitutions([]);
                }
            } else {
                setInstitutions([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching institutions.');
            console.error("Error fetching institutions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, client]);

    useEffect(() => {
        fetchInstitutions();
    }, [fetchInstitutions]);

    const handleInstitutionClick = async (institution: Institution) => {
        setSelectedInstitution(institution);
        setIsLoading(true);
        setError(null);
        try {
            // Assuming a hypothetical detailed institution endpoint
            // Replace with your actual implementation
            // const detailsResponse = await client.getInstitutionDetails(institution.institution_id);
            // setInstitutionDetails(detailsResponse);

            // Placeholder for demonstration: Simulate a fetch
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
            setInstitutionDetails({
                name: institution.name,
                institution_id: institution.institution_id,
                products: ['auth', 'transactions', 'identity', 'assets', 'investments'],
                country_codes: ['US', 'GB', 'CA', 'ES', 'DE'],
                url: 'https://example.com/institution/' + institution.institution_id,
                logo: 'https://via.placeholder.com/150',
                primary_color: '#3366cc',
                additional_details: {
                    established_year: 1980,
                    customer_support_email: 'support@example.com',
                }
            });

        } catch (err: any) {
            setError(err.message || 'Failed to fetch institution details.');
            console.error("Error fetching institution details:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-4">Plaid Institutions Explorer - Comprehensive</h1>
            <p className="text-gray-700 mb-4">This version features comprehensive institution details, including simulated API calls and advanced UI elements.</p>

            <div className="mb-4">
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700">Search Institutions:</label>
                <input
                    type="text"
                    id="search-input"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by name or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="text-center text-gray-500">
                    <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.313 2.687 6 6 6v-1.709z"></path>
                    </svg>
                    <p>Loading...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong> <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="flex">
                <div className="w-1/2 pr-4">
                    {institutions.length > 0 && !isLoading && !error && (
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Institution Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {institutions.map((institution, index) => (
                                        <tr key={institution.institution_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {institution.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleInstitutionClick(institution)}
                                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!isLoading && !error && institutions.length === 0 && (
                        <div className="text-center text-gray-500">
                            {debouncedSearchTerm ? 'No institutions found.' : 'Enter a search term to find institutions.'}
                        </div>
                    )}
                </div>

                <div className="w-1/2 pl-4">
                    {selectedInstitution && institutionDetails && (
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-2">{institutionDetails.name}</h3>
                            <img src={institutionDetails.logo} alt={`${institutionDetails.name} Logo`} className="mb-4 rounded-md" />
                            <p className="text-gray-700"><strong>Institution ID:</strong> {institutionDetails.institution_id}</p>
                            <p className="text-gray-700"><strong>Supported Products:</strong> {institutionDetails.products.join(', ')}</p>
                            <p className="text-gray-700"><strong>Country Codes:</strong> {institutionDetails.country_codes.join(', ')}</p>
                            <p className="text-gray-700"><strong>Website:</strong> <a href={institutionDetails.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{institutionDetails.url}</a></p>
                            <p className="text-gray-700"><strong>Primary Color:</strong> <span style={{ color: institutionDetails.primary_color }}>{institutionDetails.primary_color}</span></p>
                            <div className="mt-4">
                                <h4 className="text-lg font-medium mb-1">Additional Details</h4>
                                <p className="text-gray-700"><strong>Established Year:</strong> {institutionDetails.additional_details.established_year}</p>
                                <p className="text-gray-700"><strong>Customer Support Email:</strong> {institutionDetails.additional_details.customer_support_email}</p>
                            </div>
                        </div>
                    )}
                    {!selectedInstitution && (
                        <div className="text-gray-500">
                            Select an institution to view details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlaidInstitutionsExplorerF = ({ client }: PlaidInstitutionsExplorerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [institutionDetails, setInstitutionDetails] = useState<any | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchInstitutions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (debouncedSearchTerm) {
                const response = await client.institutionsSearch({ query: debouncedSearchTerm, products: ['auth', 'transactions', 'identity', 'assets', 'investments', 'liabilities'], country_codes: ['US', 'GB', 'CA', 'ES', 'DE', 'FR'] });
                if (response.institutions && Array.isArray(response.institutions)) {
                    setInstitutions(response.institutions);
                } else {
                    setInstitutions([]);
                }
            } else {
                setInstitutions([]);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching institutions.');
            console.error("Error fetching institutions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, client]);

    useEffect(() => {
        fetchInstitutions();
    }, [fetchInstitutions]);

    const handleInstitutionClick = async (institution: Institution) => {
        setSelectedInstitution(institution);
        setIsDetailsLoading(true);
        setError(null);
        try {
            // Simulate API call for details
            await new Promise(resolve => setTimeout(resolve, 750));
            setInstitutionDetails({
                name: institution.name,
                institution_id: institution.institution_id,
                products: ['auth', 'transactions', 'identity', 'assets', 'investments', 'liabilities'],
                country_codes: ['US', 'GB', 'CA', 'ES', 'DE', 'FR'],
                url: 'https://example.com/institution/' + institution.institution_id,
                logo: 'https://via.placeholder.com/150',
                primary_color: '#007bff',
                additional_details: {
                    established_year: 1975,
                    customer_support_phone: '+1-555-123-4567',
                    customer_support_email: 'support@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zip: '91234',
                    }
                }
            });
        } catch (err: any) {
            setError(err.message || 'Failed to fetch institution details.');
            console.error("Error fetching institution details:", err);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-4">Plaid Institutions Explorer - Advanced Details</h1>
            <p className="text-gray-700 mb-4">This version features advanced detail display, error handling, and loading indicators.</p>

            <div className="mb-4">
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700">Search Institutions:</label>
                <input
                    type="text"
                    id="search-input"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by name or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading && (
                <div className="text-center text-gray-500">
                    <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.313 2.687 6 6 6v-1.709z"></path>
                    </svg>
                    <p>Loading institutions...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong> <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="