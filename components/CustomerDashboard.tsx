
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Type Definitions (based on OpenAPI schema) ---

interface Customer {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  type: 'active' | 'testing';
  createdDate: string; // Should be a string representation of Unix timestamp
}

interface CustomersResponse {
  found: number;
  displaying: number;
  moreAvailable: boolean;
  customers: Customer[];
}

interface NewCustomer {
    username: string;
    firstName?: string;
    lastName?: string;
}

interface CustomerUpdate {
    firstName?: string;
    lastName?: string;
}

// --- Mock API Functions ---
// In a real application, these would be in a separate API service file.

const MOCK_CUSTOMERS: Customer[] = [
    { id: '1005061234', username: 'john.doe', firstName: 'John', lastName: 'Doe', type: 'active', createdDate: '1607450357' },
    { id: '1005061235', username: 'jane.smith', firstName: 'Jane', lastName: 'Smith', type: 'active', createdDate: '1607451357' },
    { id: '1005061236', username: 'test.user.1', firstName: 'Test', lastName: 'User1', type: 'testing', createdDate: '1607452357' },
    { id: '1005061237', username: 'samantha.green', firstName: 'Samantha', lastName: 'Green', type: 'active', createdDate: '1607453357' },
    { id: '1005061238', username: 'test.user.2', firstName: 'Test', lastName: 'User2', type: 'testing', createdDate: '1607454357' },
    { id: '1005061239', username: 'peter.jones', firstName: 'Peter', lastName: 'Jones', type: 'active', createdDate: '1607455357' },
    { id: '1005061240', username: 'mary.williams', firstName: 'Mary', lastName: 'Williams', type: 'active', createdDate: '1607456357' },
    { id: '1005061241', username: 'test.user.3', firstName: 'Test', lastName: 'User3', type: 'testing', createdDate: '1607457357' },
    { id: '1005061242', username: 'david.brown', firstName: 'David', lastName: 'Brown', type: 'active', createdDate: '1607458357' },
    { id: '1005061243', username: 'linda.davis', firstName: 'Linda', lastName: 'Davis', type: 'active', createdDate: '1607459357' },
];

const api = {
  getCustomers: async (start: number, limit: number, search: string, type: '' | 'active' | 'testing'): Promise<CustomersResponse> => {
    console.log(`Fetching customers: start=${start}, limit=${limit}, search='${search}', type='${type}'`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    let filtered = MOCK_CUSTOMERS;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.username.toLowerCase().includes(lowerSearch) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowerSearch)
      );
    }

    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }

    const startIndex = (start - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      found: filtered.length,
      displaying: paginated.length,
      moreAvailable: startIndex + paginated.length < filtered.length,
      customers: paginated,
    };
  },
  addCustomer: async (customerData: NewCustomer, type: 'active' | 'testing'): Promise<Customer> => {
    console.log(`Adding ${type} customer:`, customerData);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newCustomer: Customer = {
      id: Math.random().toString(36).substring(2, 12),
      createdDate: String(Math.floor(Date.now() / 1000)),
      type,
      ...customerData
    };
    MOCK_CUSTOMERS.unshift(newCustomer); // Add to the top for visibility
    return newCustomer;
  },
  modifyCustomer: async (customerId: string, customerData: CustomerUpdate): Promise<void> => {
    console.log(`Modifying customer ${customerId}:`, customerData);
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
    if (index !== -1) {
        MOCK_CUSTOMERS[index] = { ...MOCK_CUSTOMERS[index], ...customerData };
    } else {
        throw new Error("Customer not found");
    }
  },
  deleteCustomer: async (customerId: string): Promise<void> => {
    console.log(`Deleting customer ${customerId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_CUSTOMERS.findIndex(c => c.id === customerId);
    if (index !== -1) {
        MOCK_CUSTOMERS.splice(index, 1);
    } else {
        throw new Error("Customer not found");
    }
  },
};

// --- Helper Components ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

const CustomerForm: React.FC<{
    initialData?: Partial<Customer>;
    onSubmit: (data: NewCustomer | CustomerUpdate, type?: 'active' | 'testing') => void;
    onCancel: () => void;
    isSubmitting: boolean;
    isEditMode?: boolean;
}> = ({ initialData, onSubmit, onCancel, isSubmitting, isEditMode = false }) => {
    const [username, setUsername] = useState(initialData?.username || '');
    const [firstName, setFirstName] = useState(initialData?.firstName || '');
    const [lastName, setLastName] = useState(initialData?.lastName || '');
    const [type, setType] = useState<'active' | 'testing'>(initialData?.type || 'active');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = isEditMode
          ? { firstName, lastName }
          : { username, firstName, lastName };
        onSubmit(data, type);
    };

    return (
        <form onSubmit={handleSubmit}>
            {!isEditMode && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Username</label>
                    <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring" />
                </div>
            )}
             {!isEditMode && (
                 <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">Customer Type</label>
                    <select id="type" value={type} onChange={e => setType(e.target.value as 'active' | 'testing')} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring">
                        <option value="active">Active</option>
                        <option value="testing">Testing</option>
                    </select>
                </div>
             )}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">First Name</label>
                <input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring" />
            </div>
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">Last Name</label>
                <input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring" />
            </div>
            <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300">
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
};

// --- Main Dashboard Component ---

const CustomerDashboard: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Pagination & Filtering State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [customerType, setCustomerType] = useState<'' | 'active' | 'testing'>('');

    // Modal State
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalPages = useMemo(() => Math.ceil(totalRecords / limit), [totalRecords, limit]);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.getCustomers(currentPage, limit, debouncedSearch, customerType);
            setCustomers(response.customers);
            setTotalRecords(response.found);
        } catch (err) {
            setError('Failed to fetch customers.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, limit, debouncedSearch, customerType]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset to first page on search
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleFormSubmit = async (data: NewCustomer | CustomerUpdate, type: 'active' | 'testing' = 'active') => {
        setIsSubmitting(true);
        try {
            if (isAddModalOpen) {
                await api.addCustomer(data as NewCustomer, type);
            } else if (isEditModalOpen && selectedCustomer) {
                await api.modifyCustomer(selectedCustomer.id, data as CustomerUpdate);
            }
            closeModals();
            await fetchCustomers();
        } catch (err) {
            console.error("Submission failed:", err);
            setError("Failed to save customer data.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!selectedCustomer) return;
        setIsSubmitting(true);
        try {
            await api.deleteCustomer(selectedCustomer.id);
            closeModals();
            await fetchCustomers();
        } catch(err) {
            console.error("Delete failed:", err);
            setError("Failed to delete customer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setEditModalOpen(true);
    };

    const openDeleteModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDeleteModalOpen(true);
    };

    const closeModals = () => {
        setAddModalOpen(false);
        setEditModalOpen(false);
        setDeleteModalOpen(false);
        setSelectedCustomer(null);
    };
    
    const formatDate = (unixTimestamp: string) => {
        return new Date(parseInt(unixTimestamp, 10) * 1000).toLocaleDateString();
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Dashboard</h1>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search by username or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="col-span-1 md:col-span-2 shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring"
                        />
                        <select
                            value={customerType}
                            onChange={(e) => {
                                setCustomerType(e.target.value as '' | 'active' | 'testing');
                                setCurrentPage(1);
                            }}
                            className="col-span-1 shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring"
                        >
                            <option value="">All Types</option>
                            <option value="active">Active</option>
                            <option value="testing">Testing</option>
                        </select>
                        <button onClick={() => setAddModalOpen(true)} className="col-span-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Add Customer
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="text-center p-10">Loading...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled On</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customers.map(customer => (
                                    <tr key={customer.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${customer.firstName || ''} ${customer.lastName || ''}`.trim()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                customer.type === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {customer.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(customer.createdDate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => openEditModal(customer)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button onClick={() => openDeleteModal(customer)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!isLoading && totalRecords > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-700">
                            Showing <span className="font-semibold">{(currentPage - 1) * limit + 1}</span> to <span className="font-semibold">{Math.min(currentPage * limit, totalRecords)}</span> of <span className="font-semibold">{totalRecords}</span> results
                        </span>
                        <div className="space-x-2">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                Previous
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            <Modal isOpen={isAddModalOpen} onClose={closeModals} title="Add New Customer">
                <CustomerForm onSubmit={handleFormSubmit} onCancel={closeModals} isSubmitting={isSubmitting} />
            </Modal>

            {/* Edit Customer Modal */}
            <Modal isOpen={isEditModalOpen} onClose={closeModals} title="Edit Customer">
                {selectedCustomer && (
                    <CustomerForm initialData={selectedCustomer} onSubmit={handleFormSubmit} onCancel={closeModals} isSubmitting={isSubmitting} isEditMode />
                )}
            </Modal>

            {/* Delete Customer Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={closeModals} title="Delete Customer">
                {selectedCustomer && (
                    <div>
                        <p className="mb-4 text-gray-700">Are you sure you want to delete customer "{selectedCustomer.username}"? This action cannot be undone.</p>
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={closeModals} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-red-300">
                                {isSubmitting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CustomerDashboard;
