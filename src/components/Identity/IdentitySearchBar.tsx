import React, { useState, useCallback } from 'react';

interface IdentitySearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

const IdentitySearchBar: React.FC<IdentitySearchBarProps> = ({ onSearch, placeholder = "Search by Name or ID" }) => {
    const [query, setQuery] = useState('');

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
    }, []);

    const handleSearch = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        onSearch(query);
    }, [query, onSearch]);

    return (
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px 0 0 4px',
                    flexGrow: 1,
                    outline: 'none',
                    minWidth: '250px'
                }}
            />
            <button
                type="submit"
                style={{
                    padding: '8px 15px',
                    fontSize: '14px',
                    backgroundColor: '#0078d4',
                    color: 'white',
                    border: '1px solid #005a9e',
                    borderRadius: '0 4px 4px 0',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                }}
                title="Search"
            >
                Search
            </button>
        </form>
    );
};

export default IdentitySearchBar;