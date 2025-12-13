import React, { useState, useMemo, useCallback } from 'react';

// --- Types ---

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g., 0.05 for 5%
}

interface InvoiceDraft {
  customerId: string | null;
  lineItems: LineItem[];
  dueDate: string;
  memo: string;
  currency: 'USD'; // Fixed currency for simplicity
  status: 'draft' | 'sent';
}

// --- Mock Data & Services (Simulating Stripe API interactions) ---

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'cus_A1B2C3D4', name: 'Acme Corp', email: 'billing@acme.com' },
  { id: 'cus_E5F6G7H8', name: 'Beta Solutions', email: 'finance@beta.net' },
  { id: 'cus_I9J0K1L2', name: 'Global Services Ltd', email: 'accounts@global.co' },
];

const mockSubmitInvoice = (invoice: InvoiceDraft) => {
  return new Promise((resolve) => {
    console.log('Submitting Invoice:', invoice);
    // Simulate API latency
    setTimeout(() => {
      resolve({ success: true, invoiceId: `inv_${Math.random().toString(36).substring(2, 9)}` });
    }, 1000);
  });
};

// --- Utility Functions ---

const calculateLineItemTotal = (item: LineItem): number => {
  const subtotal = item.quantity * item.unitPrice;
  const taxAmount = subtotal * item.taxRate;
  return subtotal + taxAmount;
};

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Ensure amount is treated as a fixed-point number for currency display
  const roundedAmount = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(roundedAmount);
};

// --- Initial State ---

const getInitialInvoiceState = (): InvoiceDraft => ({
  customerId: null,
  lineItems: [
    { id: 'temp-1', description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
  ],
  // Default due date 7 days from now
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  memo: 'Thank you for your business!',
  currency: 'USD',
  status: 'draft',
});

// --- Component ---

const CreateInvoicePage: React.FC = () => {
  const [invoice, setInvoice] = useState<InvoiceDraft>(getInitialInvoiceState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const selectedCustomer = useMemo(() => 
    MOCK_CUSTOMERS.find(c => c.id === invoice.customerId), 
    [invoice.customerId]
  );

  // --- Calculations ---
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    invoice.lineItems.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * item.taxRate;
      subtotal += itemSubtotal;
      totalTax += itemTax;
    });

    return {
      subtotal,
      totalTax,
      grandTotal: subtotal + totalTax,
    };
  }, [invoice.lineItems]);

  // --- Handlers ---

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInvoice(prev => ({ ...prev, customerId: e.target.value }));
  };

  const handleInvoiceSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = useCallback((id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          let parsedValue: string | number = value;
          if (field !== 'description' && typeof value === 'string') {
            // Parse numerical fields, defaulting to 0 if empty
            parsedValue = parseFloat(value || '0');
          }
          
          // Handle tax rate conversion (input is %, state is decimal)
          if (field === 'taxRate' && typeof parsedValue === 'number') {
             parsedValue = parsedValue / 100;
          }

          return { ...item, [field]: parsedValue };
        }
        return item;
      }),
    }));
  }, []);

  const addLineItem = () => {
    setInvoice(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: `temp-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
      ],
    }));
  };

  const removeLineItem = (id: string) => {
    if (invoice.lineItems.length === 1) return; // Prevent removing the last item
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }));
  };

  const handleSubmit = async (sendImmediately: boolean) => {
    if (!invoice.customerId) {
      setSubmissionMessage({ type: 'error', message: 'Please select a customer.' });
      return;
    }
    if (invoice.lineItems.filter(item => item.description && item.quantity > 0 && item.unitPrice >= 0).length === 0) {
        setSubmissionMessage({ type: 'error', message: 'Please add at least one valid line item.' });
        return;
    }

    setIsSubmitting(true);
    setSubmissionMessage(null);

    const finalInvoice = {
      ...invoice,
      status: sendImmediately ? 'sent' : 'draft',
      // Clean up line items (remove empty descriptions)
      lineItems: invoice.lineItems.filter(item => item.description.trim() !== ''),
    };

    try {
      const result: any = await mockSubmitInvoice(finalInvoice);
      if (result.success) {
        setSubmissionMessage({ 
          type: 'success', 
          message: `Invoice ${result.invoiceId} successfully ${sendImmediately ? 'sent' : 'saved as draft'}.` 
        });
        // Reset form after successful submission
        setInvoice(getInitialInvoiceState());
      } else {
        throw new Error('Submission failed.');
      }
    } catch (error) {
      setSubmissionMessage({ type: 'error', message: 'An error occurred during submission.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Helpers ---

  const renderLineItemRow = (item: LineItem) => {
    const total = calculateLineItemTotal(item);

    return (
      <tr key={item.id} className="border-b hover:bg-gray-50">
        <td className="p-2 w-1/3">
          <input
            type="text"
            value={item.description}
            onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
            placeholder="Description"
            className="w-full border p-1 rounded focus:ring-2 focus:ring-blue-300"
          />
        </td>
        <td className="p-2 w-1/6">
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => handleLineItemChange(item.id, 'quantity', e.target.value)}
            className="w-full border p-1 rounded text-right"
          />
        </td>
        <td className="p-2 w-1/6">
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => handleLineItemChange(item.id, 'unitPrice', e.target.value)}
            className="w-full border p-1 rounded text-right"
          />
        </td>
        <td className="p-2 w-1/12">
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.taxRate * 100} // Display as percentage
            onChange={(e) => handleLineItemChange(item.id, 'taxRate', e.target.value)}
            className="w-full border p-1 rounded text-right"
          />
        </td>
        <td className="p-2 w-1/6 text-right font-medium">
          {formatCurrency(total, invoice.currency)}
        </td>
        <td className="p-2 w-10 text-center">
          {invoice.lineItems.length > 1 && (
            <button
              onClick={() => removeLineItem(item.id)}
              className="text-red-500 hover:text-red-700 text-lg"
              title="Remove item"
            >
              &times;
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg font-sans">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Invoice</h1>

      {submissionMessage && (
        <div className={`p-3 mb-4 rounded ${submissionMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
          {submissionMessage.message}
        </div>
      )}

      {/* 1. Customer Selection */}
      <section className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Customer Details</h2>
        <div className="flex items-center space-x-4">
          <label htmlFor="customer-select" className="font-medium w-32 text-sm">Bill To:</label>
          <select
            id="customer-select"
            value={invoice.customerId || ''}
            onChange={handleCustomerChange}
            className="flex-grow border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Select a customer...</option>
            {MOCK_CUSTOMERS.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </select>
        </div>
        {selectedCustomer && (
          <div className="mt-3 ml-36 text-sm text-gray-600 p-2 bg-white border rounded">
            <p className="font-semibold">{selectedCustomer.name}</p>
            <p>{selectedCustomer.email}</p>
          </div>
        )}
      </section>

      {/* 2. Line Items */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Line Items</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Description</th>
                <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Qty</th>
                <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit Price ({invoice.currency})</th>
                <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Tax (%)</th>
                <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Total</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.lineItems.map(renderLineItemRow)}
            </tbody>
          </table>
        </div>
        <button
          onClick={addLineItem}
          className="mt-3 px-4 py-2 border border-blue-500 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition duration-150"
        >
          + Add Line Item
        </button>
      </section>

      {/* 3. Totals and Settings */}
      <div className="flex justify-between gap-8">
        
        {/* Settings Column */}
        <section className="w-1/2">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Invoice Settings</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={invoice.dueDate}
                onChange={handleInvoiceSettingChange}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">Memo / Footer Note</label>
              <textarea
                id="memo"
                name="memo"
                rows={3}
                value={invoice.memo}
                onChange={handleInvoiceSettingChange}
                placeholder="Thank you for your business!"
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Totals Column */}
        <section className="w-1/3 bg-gray-50 p-4 rounded-lg border h-fit">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(totals.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax Amount:</span>
              <span className="font-medium">{formatCurrency(totals.totalTax, invoice.currency)}</span>
            </div>
            <div className="border-t mt-4 pt-3 flex justify-between text-xl font-bold text-gray-800">
              <span>Amount Due:</span>
              <span>{formatCurrency(totals.grandTotal, invoice.currency)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Actions */}
      <div className="mt-10 pt-4 border-t flex justify-end space-x-4">
        <button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition duration-150"
        >
          {isSubmitting && invoice.status === 'draft' ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || !invoice.customerId || totals.grandTotal <= 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-150"
        >
          {isSubmitting && invoice.status === 'sent' ? 'Sending...' : 'Send Invoice'}
        </button>
      </div>
    </div>
  );
};

export default CreateInvoicePage;