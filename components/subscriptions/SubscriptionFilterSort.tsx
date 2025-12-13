import React, { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  renewalDate: string; // e.g., "2023-10-27"
  isActive: boolean;
}

interface SubscriptionFilterSortProps {
  subscriptions: Subscription[];
  onFilterSortChange: (filteredSortedSubscriptions: Subscription[]) => void;
}

const SubscriptionFilterSort: React.FC<SubscriptionFilterSortProps> = ({
  subscriptions,
  onFilterSortChange,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');

  useEffect(() => {
    let filtered = [...subscriptions];

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((sub) => sub.category === filterCategory);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter((sub) => sub.isActive === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortBy) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'price':
          valA = a.price;
          valB = b.price;
          break;
        case 'renewalDate':
          valA = new Date(a.renewalDate);
          valB = new Date(b.renewalDate);
          break;
        default:
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
      }

      if (valA < valB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    onFilterSortChange(filtered);
  }, [subscriptions, filterCategory, filterStatus, sortBy, sortOrder, onFilterSortChange]);

  // Extract unique categories for filter options
  const categories = ['all', ...new Set(subscriptions.map((sub) => sub.category))];

  return (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-100 rounded-lg shadow-sm">
      {/* Category Filter */}
      <div className="flex flex-col">
        <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="categoryFilter"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex flex-col">
        <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="statusFilter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="flex flex-col">
        <label htmlFor="sortBy" className="text-sm font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="renewalDate">Renewal Date</option>
        </select>
      </div>

      {/* Sort Order */}
      <div className="flex flex-col">
        <label htmlFor="sortOrder" className="text-sm font-medium text-gray-700 mb-1">
          Order
        </label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
};

export default SubscriptionFilterSort;