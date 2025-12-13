import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'usehooks-ts';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  debounceDelay?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search books...',
  initialQuery = '',
  debounceDelay = 300,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const debouncedQuery = useDebounce(query, debounceDelay);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    } else {
      onSearch(''); // Clear search results if the query is empty
    }
  }, [debouncedQuery, onSearch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-grow outline-none bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
        aria-label="Search books"
      />
      {query && (
        <button
          onClick={handleClear}
          className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;