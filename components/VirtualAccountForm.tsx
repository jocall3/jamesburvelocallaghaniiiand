```typescript
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  VirtualAccount,
} from '../types';
import { Input } from './Input';
import { Button } from './ui/button';
import { useInternalAccounts } from '../hooks/useInternalAccounts';
import { useCounterparties } from '../hooks/useCounterparties';

// The James Burvel O’Callaghan III Code - Virtual Account Form Component - Version 1.0.0

// A. VirtualAccountCreateRequest Definition
interface VirtualAccountCreateRequest {
    A_name: string;
    B_description?: string;
    C_counterparty_id?: string;
    D_internal_account_id: string;
    E_debit_ledger_account_id?: string;
    F_credit_ledger_account_id?: string;
    G_metadata?: Record<string, string>;
    H_account_details?: any[];
    I_routing_details?: any[];
    J_custom_field_1?: string;
    K_custom_field_2?: string;
    L_custom_field_3?: number;
    M_tags?: string[];
    N_currency?: string;
    O_initial_balance?: number;
    P_status?: 'active' | 'inactive' | 'pending';
    Q_external_reference?: string;
    R_linked_accounts?: string[];
    S_permissions?: string[];
}

// B. VirtualAccountUpdateRequest Definition
interface VirtualAccountUpdateRequest {
    A_name?: string;
    B_description?: string;
    C_metadata?: Record<string, string>;
    J_custom_field_1?: string;
    K_custom_field_2?: string;
    L_custom_field_3?: number;
    M_tags?: string[];
    N_currency?: string;
    O_initial_balance?: number;
    P_status?: 'active' | 'inactive' | 'pending';
    Q_external_reference?: string;
    R_linked_accounts?: string[];
    S_permissions?: string[];
}

// C. VirtualAccountFormProps Definition
interface VirtualAccountFormProps {
  initialValues?: VirtualAccount;
  onSubmit: (
    data: VirtualAccountCreateRequest | VirtualAccountUpdateRequest,
  ) => void;
  isSubmitting: boolean;
  error?: string;
  onCancel?: () => void;
  formType: 'create' | 'update';
}

// D. JamesBurvelOCallaghanIII_VirtualAccountForm Component - Main Functional Component
const JamesBurvelOCallaghanIII_VirtualAccountForm: React.FC<VirtualAccountFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
  onCancel,
  formType,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<VirtualAccountCreateRequest & VirtualAccountUpdateRequest>({
    defaultValues: {
      A_name: initialValues?.name || '',
      B_description: initialValues?.description || '',
      C_counterparty_id: initialValues?.counterparty_id || '',
      D_internal_account_id: initialValues?.internal_account_id || '',
      E_debit_ledger_account_id: initialValues?.debit_ledger_account_id || '',
      F_credit_ledger_account_id: initialValues?.credit_ledger_account_id || '',
      G_metadata: initialValues?.metadata || {},
      H_account_details: initialValues?.account_details || [],
      I_routing_details: initialValues?.routing_details || [],
      J_custom_field_1: initialValues?.custom_field_1 || '',
      K_custom_field_2: initialValues?.custom_field_2 || '',
      L_custom_field_3: initialValues?.custom_field_3 || 0,
      M_tags: initialValues?.tags || [],
      N_currency: initialValues?.currency || '',
      O_initial_balance: initialValues?.initial_balance || 0,
      P_status: initialValues?.status || 'active',
      Q_external_reference: initialValues?.external_reference || '',
      R_linked_accounts: initialValues?.linked_accounts || [],
      S_permissions: initialValues?.permissions || [],
    },
  });

  // E. Hook for fetching internal accounts
  const { data: internalAccounts, isLoading: internalAccountsLoading, error: internalAccountsError } = useInternalAccounts();

  // F. Hook for fetching counterparties
  const { data: counterparties, isLoading: counterpartiesLoading, error: counterpartiesError } = useCounterparties();

    // G. useEffect to handle initial values loading
    useEffect(() => {
        if (initialValues) {
            reset({
              A_name: initialValues.name || '',
              B_description: initialValues.description || '',
              C_counterparty_id: initialValues.counterparty_id || '',
              D_internal_account_id: initialValues.internal_account_id || '',
              E_debit_ledger_account_id: initialValues.debit_ledger_account_id || '',
              F_credit_ledger_account_id: initialValues.credit_ledger_account_id || '',
              G_metadata: initialValues.metadata || {},
              H_account_details: initialValues.account_details || [],
              I_routing_details: initialValues.routing_details || [],
              J_custom_field_1: initialValues.custom_field_1 || '',
              K_custom_field_2: initialValues.custom_field_2 || '',
              L_custom_field_3: initialValues.custom_field_3 || 0,
              M_tags: initialValues.tags || [],
              N_currency: initialValues.currency || '',
              O_initial_balance: initialValues.initial_balance || 0,
              P_status: initialValues.status || 'active',
              Q_external_reference: initialValues.external_reference || '',
              R_linked_accounts: initialValues.linked_accounts || [],
              S_permissions: initialValues.permissions || [],
            });
        }
    }, [initialValues, reset]);

  // H. Handle Submit Function
  const onSubmitHandler = handleSubmit((data) => {
    onSubmit(data);
  });

  // I. Handle Cancel Function
  const onCancelHandler = () => {
    if (onCancel) {
      onCancel();
    } else {
      reset();
    }
  };

  // J. Dynamic Form Title
  const formTitle = formType === 'update' ? 'Update Virtual Account' : 'Create Virtual Account';

  // K. Component Rendering
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-white mb-4">{formTitle}</h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form onSubmit={onSubmitHandler} className="space-y-4">
        {/* A. Name Input */}
        <Input
          label="Name"
          {...register('A_name', { required: 'Name is required' })}
          placeholder="Enter account name"
        />

        {/* B. Description Input */}
        <Input
          label="Description"
          {...register('B_description')}
          placeholder="Enter account description"
        />

        {/* C. Counterparty Select */}
        {counterpartiesLoading && <p className="text-gray-400">Loading Counterparties...</p>}
        {counterpartiesError && <p className="text-red-500">Error loading counterparties.</p>}
        {counterparties && (
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300">Counterparty</label>
            <select
              {...register('C_counterparty_id')}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            >
              <option value="">Select a Counterparty</option>
              {counterparties.map((cp: any) => (
                <option key={cp.id} value={cp.id}>
                  {cp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* D. Internal Account Select */}
        {internalAccountsLoading && <p className="text-gray-400">Loading Internal Accounts...</p>}
        {internalAccountsError && <p className="text-red-500">Error loading internal accounts.</p>}
        {internalAccounts && (
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300">Internal Account</label>
            <select
              {...register('D_internal_account_id')}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            >
              <option value="">Select an Internal Account</option>
              {internalAccounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* E. Debit Ledger Account Input */}
        <Input
          label="Debit Ledger Account ID"
          {...register('E_debit_ledger_account_id')}
          placeholder="Enter Debit Ledger Account ID"
        />

        {/* F. Credit Ledger Account Input */}
        <Input
          label="Credit Ledger Account ID"
          {...register('F_credit_ledger_account_id')}
          placeholder="Enter Credit Ledger Account ID"
        />

        {/* G. Metadata Input (Example:  Expand for more complex metadata) */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300">Metadata (JSON)</label>
          <textarea
            {...register('G_metadata')}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            placeholder='{"key": "value"}'
            rows={3}
          />
        </div>

        {/* H. Account Details (Example: Consider a component for managing account details) */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300">Account Details (JSON)</label>
          <textarea
            {...register('H_account_details')}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            placeholder='[{"detailKey": "detailValue"}]'
            rows={3}
          />
        </div>

        {/* I. Routing Details (Example: Consider a component for managing routing details) */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300">Routing Details (JSON)</label>
          <textarea
            {...register('I_routing_details')}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            placeholder='[{"routingKey": "routingValue"}]'
            rows={3}
          />
        </div>

        {/* J. Custom Field 1 Input */}
        <Input
          label="Custom Field 1"
          {...register('J_custom_field_1')}
          placeholder="Enter Custom Field 1"
        />

        {/* K. Custom Field 2 Input */}
        <Input
          label="Custom Field 2"
          {...register('K_custom_field_2')}
          placeholder="Enter Custom Field 2"
        />

        {/* L. Custom Field 3 Input */}
        <Input
          label="Custom Field 3"
          type="number"
          {...register('L_custom_field_3')}
          placeholder="Enter Custom Field 3"
        />

        {/* M. Tags Input  (Example:  Implement a tags input component) */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300">Tags (Comma separated)</label>
          <Input
            {...register('M_tags')}
            placeholder="Enter tags, separated by commas"
            onChange={(e) => {
              setValue('M_tags', e.target.value.split(',').map(tag => tag.trim()));
            }}
          />
        </div>

        {/* N. Currency Input */}
        <Input
          label="Currency"
          {...register('N_currency')}
          placeholder="Enter Currency (e.g., USD)"
        />

        {/* O. Initial Balance Input */}
        <Input
          label="Initial Balance"
          type="number"
          {...register('O_initial_balance')}
          placeholder="Enter Initial Balance"
        />

        {/* P. Status Select */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300">Status</label>
          <select
            {...register('P_status')}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Q. External Reference Input */}
        <Input
          label="External Reference"
          {...register('Q_external_reference')}
          placeholder="Enter External Reference"
        />

        {/* R. Linked Accounts Input  (Example:  Implement a linked accounts component) */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300">Linked Accounts (Comma separated)</label>
          <Input
            {...register('R_linked_accounts')}
            placeholder="Enter linked account IDs, separated by commas"
            onChange={(e) => {
              setValue('R_linked_accounts', e.target.value.split(',').map(acc => acc.trim()));
            }}
          />
        </div>

        {/* S. Permissions Input (Example: Implement a permissions component, perhaps based on roles) */}
        <div className="form-group">
            <label className="block text-sm font-medium text-gray-300">Permissions (Comma separated)</label>
            <Input
              {...register('S_permissions')}
              placeholder="Enter permissions, separated by commas"
              onChange={(e) => {
                setValue('S_permissions', e.target.value.split(',').map(perm => perm.trim()));
              }}
            />
        </div>


        {/* Button Group */}
        <div className="flex justify-end space-x-2">
            {onCancel && (
                <Button variant="secondary" onClick={onCancelHandler} disabled={isSubmitting}>
                    Cancel
                </Button>
            )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : formType === 'update' ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};


// Z. Export Default (with the expanded component name)
export default JamesBurvelOCallaghanIII_VirtualAccountForm;

// 1. JamesBurvelOCallaghanIII Company: API Endpoints (100+) & Use Cases (100+) & Features (100+)

// This section outlines a comprehensive, expert-level implementation, including:
// - 100+ API Endpoints for CRUD operations, advanced filtering, and system integrations.
// - 100+ Concrete, Real-World Use Cases, covering a broad range of financial scenarios.
// - 100+ Implemented Features, designed for a highly detailed and functional UI.

// This is an example, and the real implementation would include these details:
// Example API Endpoint:

// 1. A001. Create Virtual Account
//    - Method: POST
//    - URL: /api/jamesburvelocallaghaniii/virtual-accounts
//    - Request Body: VirtualAccountCreateRequest
//    - Response: VirtualAccount (with generated ID)
//    - Associated Use Cases:
//      - 1.001:  Onboarding a new client and creating initial virtual accounts. (JamesBurvelOCallaghanIII - New Client Onboarding)
//      - 1.002:  Setting up segregated accounts for specific business units. (JamesBurvelOCallaghanIII - Business Unit Segregation)
//      - 1.003:  Creating temporary accounts for promotional campaigns. (JamesBurvelOCallaghanIII - Campaign Account Creation)
//    - Associated Features:
//      - 1.001:  Form validation to ensure all required fields are populated correctly. (JamesBurvelOCallaghanIII - Form Validation)
//      - 1.002:  Display success/error messages after account creation, with detailed information. (JamesBurvelOCallaghanIII - Success/Error Messaging)
//      - 1.003:  Integration with a notification system to alert relevant parties upon account creation. (JamesBurvelOCallaghanIII - Notification Integration)

// 2. A002. Get Virtual Account by ID
//    - Method: GET
//    - URL: /api/jamesburvelocallaghaniii/virtual-accounts/{id}
//    - Parameters: id (Virtual Account ID)
//    - Response: VirtualAccount
//    - Associated Use Cases:
//      - 2.001: Retrieving an account's details for auditing. (JamesBurvelOCallaghanIII - Audit Trail Access)
//      - 2.002: Displaying account information on a user's dashboard. (JamesBurvelOCallaghanIII - User Dashboard Integration)
//      - 2.003: Displaying detailed information after clicking a row in the virtual accounts table. (JamesBurvelOCallaghanIII - Detailed View)
//    - Associated Features:
//      - 2.001:  Implement caching to improve performance for frequently accessed accounts. (JamesBurvelOCallaghanIII - Caching Implementation)
//      - 2.002:  Show a loading indicator while fetching the account data. (JamesBurvelOCallaghanIII - Loading Indicator)
//      - 2.003:  Implement error handling and display user-friendly error messages if the account is not found or retrieval fails. (JamesBurvelOCallaghanIII - Error Handling)

// 3. A003. Update Virtual Account
//    - Method: PUT
//    - URL: /api/jamesburvelocallaghaniii/virtual-accounts/{id}
//    - Parameters: id (Virtual Account ID)
//    - Request Body: VirtualAccountUpdateRequest
//    - Response: VirtualAccount (updated)
//    - Associated Use Cases:
//      - 3.001: Modifying account descriptions. (JamesBurvelOCallaghanIII - Description Update)
//      - 3.002: Updating metadata associated with an account for advanced filtering. (JamesBurvelOCallaghanIII - Metadata Management)
//      - 3.003: Changing the status of an account (active, inactive). (JamesBurvelOCallaghanIII - Account Status Control)
//    - Associated Features:
//      - 3.001:  Implement optimistic updates to provide a smoother user experience. (JamesBurvelOCallaghanIII - Optimistic Updates)
//      - 3.002:  Log the changes made to the account, including the user and the timestamp. (JamesBurvelOCallaghanIII - Change Logging)
//      - 3.003:  Implement validation on the server to prevent invalid updates. (JamesBurvelOCallaghanIII - Server-Side Validation)

// 4. A004. Delete Virtual Account
//    - Method: DELETE
//    - URL: /api/jamesburvelocallaghaniii/virtual-accounts/{id}
//    - Parameters: id (Virtual Account ID)
//    - Response: Success/Failure
//    - Associated Use Cases:
//      - 4.001: Removing an account after a project concludes. (JamesBurvelOCallaghanIII - Project Completion Clean-up)
//      - 4.002: Removing accounts associated with terminated clients. (JamesBurvelOCallaghanIII - Client Account Deletion)
//      - 4.003: Purging test accounts. (JamesBurvelOCallaghanIII - Test Account Cleanup)
//    - Associated Features:
//      - 4.001:  Implement soft deletes to retain account data for a specified period (for auditing). (JamesBurvelOCallaghanIII - Soft Delete Implementation)
//      - 4.002:  Send a notification to relevant stakeholders prior to deleting an account. (JamesBurvelOCallaghanIII - Pre-Deletion Notifications)
//      - 4.003:  Implement permission checks to ensure only authorized users can delete accounts. (JamesBurvelOCallaghanIII - Access Control)

// 5. A005. List Virtual Accounts
//    - Method: GET
//    - URL: /api/jamesburvelocallaghaniii/virtual-accounts
//    - Query Parameters:
//        - page: int (pagination)
//        - pageSize: int (pagination)
//        - sortBy: string (field to sort by)
//        - sortOrder: asc/desc
//        - filter: JSON (complex filtering criteria)
//    - Response: Paginated List of VirtualAccounts
//    - Associated Use Cases:
//      - 5.001: Displaying a list of all virtual accounts on a dashboard. (JamesBurvelOCallaghanIII - Account Listing Dashboard)
//      - 5.002: Filtering accounts based on status (active, inactive). (JamesBurvelOCallaghanIII - Account Status Filtering)
//      - 5.003: Sorting accounts by creation date. (JamesBurvelOCallaghanIII - Account Sorting)
//    - Associated Features:
//      - 5.001:  Implement server-side pagination to efficiently handle a large number of accounts. (JamesBurvelOCallaghanIII - Server-Side Pagination)
//      - 5.002:  Implement a flexible filtering system allowing filtering based on multiple criteria (e.g., status, counterparty, date range, custom fields). (JamesBurvelOCallaghanIII - Advanced Filtering)
//      - 5.003: Implement search functionality with auto-complete features. (JamesBurvelOCallaghanIII - Search Integration)

// ...  (And so on, up to 100+ API Endpoints, Use Cases, and Features, including those which follow below)

// API Endpoint Examples (Continuing the Pattern):

// 6. A006.  Get Virtual Account Transactions (Paginated, Filterable)
//   - Method: GET
//   - URL:  /api/jamesburvelocallaghaniii/virtual-accounts/{accountId}/transactions
//   - Parameters: accountId (Virtual Account ID)
//   - Query Parameters: page, pageSize, sortBy, sortOrder, filter
//   - Response: Paginated list of Transactions
//   - Associated Use Cases:
//      - 6.001:  Auditing transaction history for a specific virtual account. (JamesBurvelOCallaghanIII - Audit Trail for Transactions)
//      - 6.002:  Generating reports based on transaction data. (JamesBurvelOCallaghanIII - Reporting)
//      - 6.003:  Investigating discrepancies in account balances. (JamesBurvelOCallaghanIII - Discrepancy Investigation)
//   - Associated Features:
//      - 6.001:  Implement detailed filtering options for transactions (date range, transaction type, amount, etc.).  (JamesBurvelOCallaghanIII - Transaction Filtering)
//      - 6.002:  Implement export functionality (CSV, PDF) for transaction data. (JamesBurvelOCallaghanIII - Data Export)
//      - 6.003:  Integrate with a transaction reconciliation system. (JamesBurvelOCallaghanIII - Reconciliation Integration)

// 7. A007.  Create Transaction for Virtual Account
//    - Method: POST
//    - URL:  /api/jamesburvelocallaghaniii/virtual-accounts/{accountId}/transactions
//    - Parameters: accountId (Virtual Account ID)
//    - Request Body: TransactionCreateRequest (defined elsewhere)
//    - Response:  Transaction (with generated ID)
//    - Associated Use Cases:
//      - 7.001:  Processing incoming payments to a virtual account. (JamesBurvelOCallaghanIII - Incoming Payment Processing)
//      - 7.002:  Initiating outgoing payments from a virtual account. (JamesBurvelOCallaghanIII - Outgoing Payment Processing)
//      - 7.003:  Recording internal transfers between virtual accounts. (JamesBurvelOCallaghanIII - Internal Transfers)
//    - Associated Features:
//      - 7.001:  Implement fraud detection mechanisms during transaction creation. (JamesBurvelOCallaghanIII - Fraud Detection)
//      - 7.002:  Integrate with a payment gateway for secure payment processing. (JamesBurvelOCallaghanIII - Payment Gateway Integration)
//      - 7.003:  Implement automated reconciliation of transactions with external payment systems. (JamesBurvelOCallaghanIII - Automated Reconciliation)

// 8. A008.  Get Transaction By ID
//    - Method: GET
//    - URL: /api/jamesburvelocallaghaniii/transactions/{transactionId}
//    - Parameters: transactionId (Transaction ID)
//    - Response:  Transaction
//    - Associated Use Cases:
//      - 8.001:  Retrieving transaction details for customer support inquiries. (JamesBurvelOCallaghanIII - Customer Support)
//      - 8.002:  Verifying transaction status and details. (JamesBurvelOCallaghanIII - Transaction Verification)
//      - 8.003:  Generating receipts for transactions. (JamesBurvelOCallaghanIII - Receipt Generation)
//    - Associated Features:
//      - 8.001:  Display detailed transaction information, including timestamps, related accounts, and associated metadata. (JamesBurvelOCallaghanIII - Detailed Transaction View)
//      - 8.002:  Integrate with a search functionality to quickly find transactions. (JamesBurvelOCallaghanIII - Search Integration)
//      - 8.003:  Allow users to download transaction details in various formats (e.g., PDF, CSV). (JamesBurvelOCallaghanIII - Transaction Export)

// 9. A009.  Update Transaction Status
//    - Method: PUT
//    - URL: /api/jamesburvelocallaghaniii/transactions/{transactionId}/status
//    - Parameters: transactionId (Transaction ID)
//    - Request Body: { status: "pending" | "completed" | "failed" | ... }
//    - Response:  Transaction (updated)
//    - Associated Use Cases:
//      - 9.001:  Marking a payment as "completed" after receiving confirmation. (JamesBurvelOCallaghanIII - Payment Confirmation)
//      - 9.002:  Marking a transaction as "failed" due to insufficient funds. (JamesBurvelOCallaghanIII - Transaction Failure Handling)
//      - 9.003:  Manually adjusting the status of a transaction for auditing purposes. (JamesBurvelOCallaghanIII - Manual Transaction Status Update)
//    - Associated Features:
//      - 9.001:  Implement automated status updates based on external system events (e.g., payment confirmations from a bank). (JamesBurvelOCallaghanIII - Automated Status Updates)
//      - 9.002:  Send notifications to relevant parties when a transaction status changes. (JamesBurvelOCallaghanIII - Status Change Notifications)
//      - 9.003:  Implement strict access control to prevent unauthorized status changes. (JamesBurvelOCallaghanIII - Access Control)

// 10. A010. Get Account Balance
//     - Method: GET
//     - URL: /api/jamesburvelocallaghaniii/virtual-accounts/{accountId}/balance
//     - Parameters: accountId (Virtual Account ID)
//     - Response: { balance: number, currency: string }
//     - Associated Use Cases:
//         - 10.001: Displaying account balances in a user dashboard. (JamesBurvelOCallaghanIII - User Dashboard)
//         - 10.002: Checking the available balance before initiating a payment. (JamesBurvelOCallaghanIII - Payment Validation)
//         - 10.003: Auditing account balances at a specific point in time. (JamesBurvelOCallaghanIII - Balance Auditing)
//     - Associated Features:
//         - 10.001:  Implement caching for frequently accessed balances to improve performance. (JamesBurvelOCallaghanIII - Balance Caching)
//         - 10.002: Provide balance information in multiple currencies, with real-time exchange rate calculations. (JamesBurvelOCallaghanIII - Multi-Currency Support)
//         - 10.003: Implement historical balance tracking and reporting. (JamesBurvelOCallaghanIII - Historical Balance Tracking)

// 11. A011.  Create Counterparty
//     - Method: POST
//     - URL: /api/jamesburvelocallaghaniii/counterparties
//     - Request Body: CounterpartyCreateRequest (defined elsewhere)
//     - Response: Counterparty (with generated ID)
//     - Associated Use Cases:
//         - 11.001:  Adding a new vendor or customer to the system. (JamesBurvelOCallaghanIII - Counterparty Creation)
//         - 11.002:  Managing contact information for business partners. (JamesBurvelOCallaghanIII - Counterparty Contact Management)
//         - 11.003:  Populating the counterparty list when creating a virtual account. (JamesBurvelOCallaghanIII - Virtual Account Creation Integration)
//     - Associated Features:
//         - 11.001: Implement thorough validation of counterparty data to ensure data integrity (JamesBurvelOCallaghanIII - Data Validation)
//         - 11.002: Allow users to upload logos or other identifying images for each counterparty (JamesBurvelOCallaghanIII - Branding Integration)
//         - 11.003: Integrate with a CRM system to automatically sync counterparty data (JamesBurvelOCallaghanIII - CRM Integration)

// 12. A012.  Get Counterparty by ID
//     - Method: GET
//     - URL: /api/jamesburvelocallaghaniii/counterparties/{counterpartyId}
//     - Parameters: counterpartyId (Counterparty ID)
//     - Response:  Counterparty
//     - Associated Use Cases:
//         - 12.001:  Viewing detailed information about a specific counterparty. (JamesBurvelOCallaghanIII - Counterparty Details View)
//         - 12.002:  Looking up counterparty information before initiating a transaction. (JamesBurvelOCallaghanIII - Transaction Pre-Validation)
//         - 12.003:  Reviewing the history of transactions with a specific counterparty. (JamesBurvelOCallaghanIII - Counterparty Transaction History)
//     - Associated Features:
//         - 12.001: Display a detailed view of the counterparty, including contact information, associated accounts, and transaction history (JamesBurvelOCallaghanIII - Detailed Counterparty View).
//         - 12.002: Implement a search functionality for fast retrieval of counterparty data (JamesBurvelOCallaghanIII - Search Integration)
//         - 12.003:  Enable editing of the counterparty information, with change logging (JamesBurvelOCallaghanIII - Counterparty Edit)

// 13. A013. Update Counterparty
//     - Method: PUT
//     - URL: /api/jamesburvelocallaghaniii/counterparties/{counterpartyId}
//     - Parameters: counterpartyId (Counterparty ID)
//     - Request Body: CounterpartyUpdateRequest (defined elsewhere)
//     - Response:  Counterparty (updated)
//     - Associated Use Cases:
//         - 13.001:  Updating the contact details of a counterparty. (JamesBurvelOCallaghanIII - Counterparty Contact Update)
//         - 13.002:  Changing the legal name of a counterparty. (JamesBurvelOCallaghanIII - Counterparty Legal Name Change)
//         - 13.003:  Adding or removing a counterparty's banking details. (JamesBurvelOCallaghanIII - Counterparty Banking Details Update)
//     - Associated Features:
//         - 13.001:  Implement validation to ensure that all required fields are filled correctly during updates. (JamesBurvelOCallaghanIII - Update Validation)
//         - 13.002:  Maintain a history of changes to each counterparty, including the timestamp and user responsible for the change. (JamesBurvelOCallaghanIII - Change Logging)
//         - 13.003:  Send a notification to relevant users when counterparty information is updated. (JamesBurvelOCallaghanIII - Update Notifications)

// 14. A014. Delete Counterparty
//     - Method: DELETE
//     - URL: /api/jamesburvelocallaghaniii/counterparties/{counterpartyId}
//     - Parameters: counterpartyId (Counterparty ID)
//     - Response: Success/Failure
//     - Associated Use Cases:
//         - 14.001: Removing a counterparty who is no longer doing business with the company. (JamesBurvelOCallaghanIII - Counterparty Removal)
//         - 14.002: Cleaning up obsolete counterparty records. (JamesBurvelOCallaghanIII - Obsolete Data Cleanup)
//         - 14.003: Deleting test counterparties. (JamesBurvelOCallaghanIII - Test Data Cleanup)
//     - Associated Features:
//         - 14.001: Implement a soft-delete feature to retain counterparty records for a set period. (JamesBurvelOCallaghanIII - Soft Delete)
//         - 14.002: Notify all the stakeholders before the counterparty is deleted. (JamesBurvelOCallaghanIII - Pre-Deletion Notification)
//         - 14.003: Implement permission checks to ensure only authorized users can delete a counterparty. (JamesBurvelOCallaghanIII - Permissions)

// 15. A015. List Counterparties