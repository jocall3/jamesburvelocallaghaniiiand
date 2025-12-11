```tsx
import React from 'react';
import { useSort } from './useSort';
import { SortOrder } from './types';

interface SortControlsProps {
  onSortChange: (sortBy: string, sortOrder: SortOrder) => void;
  sortBy: string;
  sortOrder: SortOrder;
}

const SortControls: React.FC<SortControlsProps> = ({ onSortChange, sortBy, sortOrder }) => {
  const handleSort = (newSortBy: string) => {
    let newSortOrder: SortOrder;
    if (sortBy === newSortBy) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      newSortOrder = 'asc';
    }
    onSortChange(newSortBy, newSortOrder);
  };

  return (
    <div className="sort-controls">
      <button 
        onClick={() => handleSort('displayName')}
        className={`sort-button ${sortBy === 'displayName' ? 'active' : ''}`}
      >
        Name 
        {sortBy === 'displayName' && (sortOrder === 'asc' ? '▲' : '▼')}
      </button>
      <button 
        onClick={() => handleSort('createdDateTime')}
        className={`sort-button ${sortBy === 'createdDateTime' ? 'active' : ''}`}
      >
        Creation Date
        {sortBy === 'createdDateTime' && (sortOrder === 'asc' ? '▲' : '▼')}
      </button>
    </div>
  );
};

export default SortControls;
```