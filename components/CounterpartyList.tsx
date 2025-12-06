
import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';

// Based on the OpenAPI spec for a Counterparty
interface Counterparty {
  id: string;
  object: string;
  live_mode: boolean;
  created_at: string;
  updated_at: string;
  discarded_at: string | null;
  name: string | null;
  email: string | null;
  metadata: { [key: string]: string };
  send_remittance_advice: boolean;
  accounts: any[]; // Note: 'accounts' is a complex array, simplified here for the list view
}

// A real app would likely use a configurable base URL
const API_BASE_URL = 'https://virtserver.swaggerhub.com/JOCALL3_1/citibank___demo_business_inc_api/1.0.0/api';

const CounterpartyList: React.FC = () => {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for filter form inputs
  const [filterInputs, setFilterInputs] = useState({
    name: '',
    email: '',
  });

  // State for filters that are actually applied to the API request
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    email: '',
  });

  // State to manage cursor-based pagination
  const [currentPageCursor, setCurrentPageCursor] = useState<string | null>(null);
  const [nextPageCursor, setNextPageCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const PER_PAGE = 10;

  const fetchCounterparties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('per_page', String(PER_PAGE));

      if (currentPageCursor) {
        params.append('after_cursor', currentPageCursor);
      }
      if (appliedFilters.name) {
        params.append('name', appliedFilters.name);
      }
      if (appliedFilters.email) {
        params.append('email', appliedFilters.email);
      }
      
      // In a real application, auth headers would be handled by an API client instance
      const response = await fetch(`${API_BASE_URL}/counterparties?${params.toString()}`);

      if (!response.ok) {
        // Try to parse error details from the API response
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.errors?.message || JSON.stringify(errorData);
        } catch (e) {
            // Ignore if the body is not JSON
        }
        throw new Error(errorMessage);
      }
      
      const newNextPageCursor = response.headers.get('X-After-Cursor');
      setNextPageCursor(newNextPageCursor);
      
      const data: Counterparty[] = await response.json();
      setCounterparties(data);

    } catch (e: any) {
      setError(e.message || 'An unknown error occurred while fetching counterparties.');
      setCounterparties([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPageCursor]);

  useEffect(() => {
    fetchCounterparties();
  }, [fetchCounterparties]);

  const handleFilterInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAppliedFilters(filterInputs);
    // Reset pagination to the first page when applying new filters
    setCurrentPageCursor(null);
    setCursorHistory([null]);
    setCurrentPageIndex(0);
  };
  
  const handleNextPage = () => {
    if (nextPageCursor) {
      // If we are at the end of our known history, add the new cursor
      if (currentPageIndex === cursorHistory.length - 1) {
        setCursorHistory([...cursorHistory, nextPageCursor]);
      }
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      setCurrentPageCursor(cursorHistory[newIndex] || nextPageCursor);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      setCurrentPageCursor(cursorHistory[newIndex]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (loading) {
      return <p>Loading counterparties...</p>;
    }
    if (error) {
      return <p style={{ color: 'red' }}>Error: {error}</p>;
    }
    if (counterparties.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                No counterparties found for the current filters.
            </div>
        );
    }
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', width: '35%' }}>Name</th>
                <th style={{ padding: '0.75rem', width: '35%' }}>Email</th>
                <th style={{ padding: '0.75rem', width: '30%' }}>Created At</th>
            </tr>
            </thead>
            <tbody>
            {counterparties.map(cp => (
                <tr key={cp.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cp.name || 'N/A'}</td>
                <td style={{ padding: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cp.email || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>{formatDate(cp.created_at)}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '1.5rem', maxWidth: '1000px', margin: 'auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Counterparties</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          name="name"
          placeholder="Filter by name..."
          value={filterInputs.name}
          onChange={handleFilterInputChange}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="email"
          name="email"
          placeholder="Filter by email..."
          value={filterInputs.email}
          onChange={handleFilterInputChange}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px' }}>
          Search
        </button>
      </form>

      {renderContent()}

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0 || loading}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          Previous
        </button>
        <span>Page {currentPageIndex + 1}</span>
        <button
          onClick={handleNextPage}
          disabled={!nextPageCursor || loading}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CounterpartyList;
