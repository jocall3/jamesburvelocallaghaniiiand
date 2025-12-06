
import React, { useState } from 'react';

interface TransactionFilterProps {
  onApplyFilters: (filters: TransactionFilters) => void;
  availableCategories?: string[];
}

export interface TransactionFilters {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
  category?: string;
}

const defaultCategories = [
  'All', 'ATM Fee', 'Advertising', 'Air Travel', 'Alcohol & Bars', 'Allowance',
  'Amusement', 'Arts', 'Auto & Transport', 'Auto Insurance', 'Auto Payment',
  'Baby Supplies', 'Babysitter & Day Care', 'Bank Fee', 'Bills & Utilities',
  'Bonus', 'Books', 'Books & Supplies', 'Business Services', 'Buy', 'Cash & ATM',
  'Charity', 'Check', 'Child Support', 'Clothing', 'Coffee Shops', 'Credit Card Payment',
  'Dentist', 'Deposit', 'Dividend & Cap Gains', 'Doctor', 'Education', 'Electronics & Software',
  'Entertainment', 'Eye Care', 'Fast Food', 'Federal Tax', 'Fees & Charges',
  'Finance Charge', 'Financial', 'Financial Advisor', 'Food & Dining', 'Furnishings',
  'Gas & Fuel', 'Gift', 'Gifts & Donations', 'Groceries', 'Gym', 'Hair',
  'Health & Fitness', 'Health Insurance', 'Hobbies', 'Home', 'Home Improvement',
  'Home Insurance', 'Home Phone', 'Home Services', 'Home Supplies', 'Hotel',
  'Income', 'Interest Income', 'Internet', 'Investments', 'Kids', 'Kids Activities',
  'Late Fee', 'Laundry', 'Lawn & Garden', 'Legal', 'Life Insurance', 'Loan Fees and Charges',
  'Loan Insurance', 'Loan Interest', 'Loan Payment', 'Loan Principal', 'Loans',
  'Local Tax', 'Low Balance', 'Mobile Phone', 'Mortgage & Rent', 'Movies & DVDs', 'Music',
  'Newspapers & Magazines', 'Office Supplies', 'Parking', 'Paycheck', 'Personal Care',
  'Pet Food & Supplies', 'Pet Grooming', 'Pets', 'Pharmacy', 'Printing', 'Property Tax',
  'Public Transportation', 'Reimbursement', 'Rental Car & Taxi', 'Restaurants', 'Sales Tax',
  'Sell', 'Services & Parts', 'Service Fee', 'Shipping', 'Shopping', 'Spa & Massage',
  'Sporting Goods', 'Sports', 'State Tax', 'Streaming Services', 'Student Loan', 'Taxes',
  'Television', 'Toys', 'Trade Commissions', 'Transfer', 'Transfer for Cash Spending',
  'Travel', 'Tuition', 'Uncategorized', 'Utilities', 'Vacation', 'Veterinary',
  'Internet / Broadband Charges'
];

const TransactionFilter: React.FC<TransactionFilterProps> = ({ onApplyFilters, availableCategories }) => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('All');

  const categoriesToDisplay = availableCategories && availableCategories.length > 0
    ? ['All', ...availableCategories.filter(c => c !== 'All')]
    : defaultCategories;

  const handleApplyFilters = () => {
    const filters: TransactionFilters = {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      category: category !== 'All' ? category : undefined,
    };
    onApplyFilters(filters);
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setMinAmount('');
    setMaxAmount('');
    setCategory('All');
    onApplyFilters({});
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Filter Transactions</h3>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="fromDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From Date:</label>
        <input
          type="date"
          id="fromDate"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="toDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To Date:</label>
        <input
          type="date"
          id="toDate"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="minAmount" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Min Amount:</label>
        <input
          type="number"
          id="minAmount"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          placeholder="e.g. 10.00"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="maxAmount" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Max Amount:</label>
        <input
          type="number"
          id="maxAmount"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          placeholder="e.g. 100.00"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="category" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category:</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
        >
          {categoriesToDisplay.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleApplyFilters} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply Filters</button>
        <button onClick={handleResetFilters} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reset Filters</button>
      </div>
    </div>
  );
};

export default TransactionFilter;
