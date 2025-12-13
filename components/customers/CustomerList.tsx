import React from 'react';
import { Customer } from '@/types/customer'; // Assuming you have a Customer type defined

interface CustomerListProps {
  customers: Customer[];
  onCustomerSelect: (customerId: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onCustomerSelect }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Customer List</h2>
      {customers.length === 0 ? (
        <p className="text-gray-500">No customers found.</p>
      ) : (
        <ul className="space-y-3">
          {customers.map((customer) => (
            <li
              key={customer.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition duration-200"
              onClick={() => onCustomerSelect(customer.id)}
            >
              <div>
                <p className="font-medium text-gray-800">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.email}</p>
              </div>
              <span className="text-sm text-gray-500">
                {customer.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerList;