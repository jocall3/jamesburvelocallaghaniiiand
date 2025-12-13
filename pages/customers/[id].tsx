import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';

// Assume you have a PrismaClient instance available
const prisma = new PrismaClient();

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptions: Subscription[];
}

interface Subscription {
  id: string;
  plan: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  customerId: string;
}

interface CustomerDetailsProps {
  customer: Customer | null;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer }) => {
  const router = useRouter();
  const { id } = router.query;

  const [customerData, setCustomerData] = useState<Customer | null>(customer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer data if not provided by getServerSideProps or if it needs refreshing
  useEffect(() => {
    if (!customer && id) {
      const fetchCustomer = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/customers/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch customer: ${response.statusText}`);
          }
          const data: Customer = await response.json();
          setCustomerData(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [id, customer]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading customer details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="container mx-auto p-4">
        <p>Customer not found.</p>
      </div>
    );
  }

  const handleUpdateCustomer = async () => {
    // Placeholder for update functionality
    alert('Update customer functionality not implemented yet.');
  };

  const handleDeleteCustomer = async () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete customer: ${response.statusText}`);
        }
        alert('Customer deleted successfully!');
        router.push('/customers'); // Redirect to the customers list page
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Customer Details - {customerData.name}</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">Customer Details</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 font-semibold">Customer ID:</p>
            <p className="text-lg">{customerData.id}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Name:</p>
            <p className="text-lg">{customerData.name}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Email:</p>
            <p className="text-lg">{customerData.email}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Created At:</p>
            <p className="text-lg">{new Date(customerData.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Last Updated:</p>
            <p className="text-lg">{new Date(customerData.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleUpdateCustomer}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Edit Customer
          </button>
          <button
            onClick={handleDeleteCustomer}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Delete Customer
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Subscriptions</h2>

      {customerData.subscriptions.length === 0 ? (
        <p>This customer has no active subscriptions.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerData.subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.plan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sub.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sub.status === 'active' ? 'bg-green-100 text-green-800' :
                      sub.status === 'canceled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => router.push(`/subscriptions/${sub.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    {/* Add edit/cancel buttons for subscriptions here */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<CustomerDetailsProps> = async (context) => {
  const { id } = context.params!;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: String(id) },
      include: {
        subscriptions: true,
      },
    });

    if (!customer) {
      return {
        props: { customer: null },
      };
    }

    // Ensure dates are serializable
    const serializedCustomer = {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      subscriptions: customer.subscriptions.map(sub => ({
        ...sub,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate ? sub.endDate.toISOString() : null,
      })),
    };

    return {
      props: { customer: serializedCustomer },
    };
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return {
      props: { customer: null },
    };
  }
};

export default CustomerDetails;