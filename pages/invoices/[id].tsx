import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';

// Mock Invoice Data Structure (Replace with actual API calls in a real application)
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amountDue: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  issueDate: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// Mock API Fetch Function
const fetchInvoiceDetails = async (id: string): Promise<Invoice> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock Data based on ID
  const mockData: Record<string, Invoice> = {
    'inv_12345': {
      id: 'inv_12345',
      invoiceNumber: 'INV-2023-001',
      customerName: 'Acme Corp',
      customerEmail: 'billing@acmecorp.com',
      amountDue: 1599.99,
      status: 'Paid',
      issueDate: '2023-10-01',
      dueDate: '2023-10-31',
      items: [
        { description: 'Premium Subscription (Monthly)', quantity: 1, unitPrice: 999.00 },
        { description: 'Setup Fee', quantity: 1, unitPrice: 600.99 },
      ],
    },
    'inv_67890': {
      id: 'inv_67890',
      invoiceNumber: 'INV-2023-002',
      customerName: 'Beta Solutions LLC',
      customerEmail: 'finance@betasolutions.com',
      amountDue: 49.99,
      status: 'Pending',
      issueDate: '2023-11-15',
      dueDate: '2023-12-15',
      items: [
        { description: 'Basic Plan Access', quantity: 1, unitPrice: 49.99 },
      ],
    },
  };

  const invoice = mockData[id] || {
    id,
    invoiceNumber: `INV-${id.substring(4).toUpperCase()}`,
    customerName: 'Unknown Customer',
    customerEmail: 'unknown@example.com',
    amountDue: 0.00,
    status: 'Overdue',
    issueDate: '2023-01-01',
    dueDate: '2023-01-31',
    items: [{ description: 'Legacy Service', quantity: 1, unitPrice: 0.00 }],
  };

  return invoice;
};

const getStatusClasses = (status: Invoice['status']) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const InvoiceDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const loadInvoice = async () => {
        try {
          setLoading(true);
          const data = await fetchInvoiceDetails(id);
          setInvoice(data);
          setError(null);
        } catch (err) {
          console.error("Failed to fetch invoice:", err);
          setError("Could not load invoice details. Please try again.");
          setInvoice(null);
        } finally {
          setLoading(false);
        }
      };
      loadInvoice();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading Invoice #{id}...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Invoice</h1>
          <p className="text-red-500 mb-6">{error || "Invoice not found."}</p>
          <Link href="/invoices" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to Invoice List
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-xl p-6 md:p-10 border border-gray-100">
        
        <header className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-1">Invoice</h1>
            <p className="text-xl font-semibold text-gray-700">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusClasses(invoice.status)}`}>
              {invoice.status}
            </span>
            <p className="text-sm text-gray-500 mt-2">Invoice ID: {invoice.id}</p>
          </div>
        </header>

        {/* Billing Information */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
          <div>
            <h3 className="font-bold text-gray-600 mb-2 uppercase tracking-wider">Billed To</h3>
            <p className="font-semibold text-gray-900">{invoice.customerName}</p>
            <p className="text-gray-700">{invoice.customerEmail}</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
                <h3 className="font-bold text-gray-600 mb-2 uppercase tracking-wider">Issue Date</h3>
                <p className="text-gray-800">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
                <h3 className="font-bold text-gray-600 mb-2 uppercase tracking-wider">Due Date</h3>
                <p className={`font-bold ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'Paid' ? 'text-red-600' : 'text-gray-800'}`}>
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                </p>
            </div>
          </div>
        </section>

        {/* Items Table */}
        <section className="mb-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/2 lg:w-1/3 space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 border-b pb-2">
              <span>Tax (0%):</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
              <span>Total Due:</span>
              <span>${invoice.amountDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <footer className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-center">
          <Link href="/invoices" className="text-blue-600 hover:text-blue-800 font-medium mb-4 sm:mb-0">
            &larr; Back to Invoice List
          </Link>
          
          <div className="flex space-x-3">
            {invoice.status !== 'Paid' && (
                <button 
                    onClick={() => alert(`Simulating payment for ${invoice.invoiceNumber}`)}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition duration-150"
                >
                    Make Payment
                </button>
            )}
            <button 
                onClick={() => alert(`Simulating PDF download for ${invoice.invoiceNumber}`)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition duration-150"
            >
                Download PDF
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default InvoiceDetail;