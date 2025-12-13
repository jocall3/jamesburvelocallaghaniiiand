import { useState, useEffect, useCallback } from 'react';

interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  // Add other relevant book properties as needed
}

interface SearchResult {
  books: Book[];
  total: number;
}

interface UseSearchOptions {
  initialQuery?: string;
  debounceDelay?: number;
}

const DEFAULT_DEBOUNCE_DELAY = 300;

const useSearch = (options: UseSearchOptions = {}) => {
  const { initialQuery = '', debounceDelay = DEFAULT_DEBOUNCE_DELAY } = options;

  const [query, setQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<Book[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceDelay]);

  // Fetch search results when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setResults([]);
      setTotalResults(0);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: SearchResult = await response.json();
        setResults(data.books);
        setTotalResults(data.total);
      } catch (err: any) {
        setError(`Failed to fetch search results: ${err.message}`);
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleSearchChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    query,
    results,
    totalResults,
    loading,
    error,
    handleSearchChange,
  };
};

export default useSearch;