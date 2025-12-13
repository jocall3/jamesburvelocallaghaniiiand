import React from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  subscriptionStatus: 'active' | 'inactive' | 'pending';
  subscriptionEndDate?: string;
  createdAt: string;
}

interface CustomerDetailProps {
  customer: Customer;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Customer Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Name</p>
          <p className="text-lg text-gray-900">{customer.name}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Email</p>
          <p className="text-lg text-gray-900">{customer.email}</p>
        </div>
        {customer.phone && (
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Phone</p>
            <p className="text-lg text-gray-900">{customer.phone}</p>
          </div>
        )}
        {customer.address && (
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Address</p>
            <p className="text-lg text-gray-900">{customer.address}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Subscription Status</p>
          <span className={`text-lg font-medium px-3 py-1 rounded-full ${
            customer.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
            customer.subscriptionStatus === 'inactive' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {customer.subscriptionStatus.charAt(0).toUpperCase() + customer.subscriptionStatus.slice(1)}
          </span>
        </div>
        {customer.subscriptionEndDate && (
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Subscription End Date</p>
            <p className="text-lg text-gray-900">{new Date(customer.subscriptionEndDate).toLocaleDateString()}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Customer Since</p>
          <p className="text-lg text-gray-900">{new Date(customer.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;