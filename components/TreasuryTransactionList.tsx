import React, { useState } from 'react';

// Mocking Stripe types for standalone execution
// In a real application, you would import these from the 'stripe' package.
interface StripeTreasuryTransaction {
  id: string;
  financial_account: string;
  flow?: string;
  flow_type?: string;
  status: 'open' | 'posted' | 'void';
  created: number;
  status_transitions: {
    posted_at?: number;
    void_at?: number;
  };
  amount: number;
  currency: string;
  description?: string;
  balance_impact: {
    cash: number;
    inbound_pending: number;
    outbound_pending: number;
  };
}

// --- Internal Generative Data Functions ---

const generateRandomString = (length: number = 10): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const generateRandomTimestamp = (): number => {
  const now = Date.now();
  const past = now - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000); // Within the last year
  return past;
};

const generateRandomStatus = (): StripeTreasuryTransaction['status'] => {
  const statuses: StripeTreasuryTransaction['status'][] = ['open', 'posted', 'void'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const generateRandomAmount = (): number => {
  return Math.floor(Math.random() * 100000) - 50000; // Range from -50000 to 50000
};

const generateRandomCurrency = (): string => {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
  return currencies[Math.floor(Math.random() * currencies.length)];
};

const generateRandomTransaction = (): StripeTreasuryTransaction => {
  const status = generateRandomStatus();
  const created = generateRandomTimestamp();
  const posted_at = status === 'posted' ? generateRandomTimestamp() : undefined;
  const void_at = status === 'void' ? generateRandomTimestamp() : undefined;
  const amount = generateRandomAmount();
  const currency = generateRandomCurrency();

  return {
    id: `txn_${generateRandomString(12)}`,
    financial_account: `fa_${generateRandomString(10)}`,
    flow: Math.random() > 0.5 ? `flow_${generateRandomString(8)}` : undefined,
    flow_type: Math.random() > 0.5 ? 'credit' : 'debit',
    status: status,
    created: created,
    status_transitions: {
      posted_at: posted_at,
      void_at: void_at,
    },
    amount: amount,
    currency: currency,
    description: `Transaction description for ${generateRandomString(5)}`,
    balance_impact: {
      cash: generateRandomAmount(),
      inbound_pending: generateRandomAmount(),
      outbound_pending: generateRandomAmount(),
    },
  };
};

// --- Shared UI Components (Internal Generative) ---

const Amount = ({ amount, currency, className }: { amount: number; currency: string; className?: string }) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Assuming amount is in cents

  return <span className={className}>{formattedAmount}</span>;
};

const Timestamp = ({ ts }: { ts: number }) => {
  const date = new Date(ts);
  return <span className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleString()}</span>;
};

const Badge = ({ variant, children }: { variant: string; children: React.ReactNode }) => {
  const baseStyle = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
  let variantStyle = "";
  switch (variant) {
    case 'default':
      variantStyle = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      break;
    case 'success':
      variantStyle = "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200";
      break;
    case 'secondary':
      variantStyle = "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200";
      break;
    case 'outline':
      variantStyle = "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300";
      break;
    default:
      variantStyle = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
  return <span className={`${baseStyle} ${variantStyle}`}>{children}</span>;
};

const NexusLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  // In a real app, this would be a routing component. For standalone, it's just a link.
  return <a href={to} className="text-blue-500 hover:underline">{children}</a>;
};

const DetailItem = ({ title, value }: { title: string; value: React.ReactNode }) => {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
};

// --- Component Logic ---

const getStatusVariant = (status: StripeTreasuryTransaction['status']) => {
  switch (status) {
    case 'open':
      return 'default';
    case 'posted':
      return 'success';
    case 'void':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const TransactionDetails = ({
  transaction,
}: {
  transaction: StripeTreasuryTransaction;
}) => {
  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailItem title="Transaction ID" value={<NexusLink to={`/treasury/transactions/${transaction.id}`}>{transaction.id}</NexusLink>} />
        <DetailItem title="Financial Account" value={<NexusLink to={`/treasury/financial_accounts/${transaction.financial_account}`}>{transaction.financial_account}</NexusLink>} />
        {transaction.flow && (
          <DetailItem title="Flow" value={
            <div className="flex items-center gap-2">
              <NexusLink to={`/treasury/flows/${transaction.flow}`}>{transaction.flow}</NexusLink>
              <Badge variant="outline">{transaction.flow_type}</Badge>
            </div>
          } />
        )}
        <DetailItem title="Status" value={
          <Badge variant={getStatusVariant(transaction.status)}>
            {transaction.status}
          </Badge>
        } />
        <DetailItem title="Created" value={<Timestamp ts={transaction.created} />} />
        {transaction.status_transitions.posted_at && (
          <DetailItem title="Posted at" value={<Timestamp ts={transaction.status_transitions.posted_at} />} />
        )}
        {transaction.status_transitions.void_at && (
          <DetailItem title="Void at" value={<Timestamp ts={transaction.status_transitions.void_at} />} />
        )}
        <div className="col-span-1 sm:col-span-2">
          <div className="py-1">
             <span className="text-gray-400 text-sm block mb-2">Balance Impact</span>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Cash
                  </span>
                  <div className="mt-1">
                    <Amount
                      amount={transaction.balance_impact.cash}
                      currency={transaction.currency}
                    />
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Inbound Pending
                  </span>
                  <div className="mt-1">
                    <Amount
                      amount={transaction.balance_impact.inbound_pending}
                      currency={transaction.currency}
                    />
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Outbound Pending
                  </span>
                  <div className="mt-1">
                    <Amount
                      amount={transaction.balance_impact.outbound_pending}
                      currency={transaction.currency}
                    />
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpandableListItem = ({
  transaction,
}: {
  transaction: StripeTreasuryTransaction;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCredit = transaction.amount >= 0;

  return (
    <li>
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {isCredit ? (
              <ArrowDownCircleIcon className="h-8 w-8 text-emerald-500" />
            ) : (
              <ArrowUpCircleIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {transaction.description}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Badge variant={getStatusVariant(transaction.status)}>
                {transaction.status}
              </Badge>
              <span>{transaction.flow_type}</span>
              <span>&middot;</span>
              <Timestamp ts={transaction.created} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Amount
            amount={transaction.amount}
            currency={transaction.currency}
            className={`text-sm font-medium ${
              isCredit ? 'text-emerald-600' : 'text-gray-900'
            } dark:text-white`}
          />
          {expanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      {expanded && <TransactionDetails transaction={transaction} />}
    </li>
  );
};

// --- Heroicons Mock (for standalone execution) ---
const ArrowDownCircleIcon = ({ className, ...props }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowUpCircleIcon = ({ className, ...props }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12.75l-3-3m0 0l-3 3m3-3v7.5M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
  </svg>
);

const ChevronDownIcon = ({ className, ...props }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronRightIcon = ({ className, ...props }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);


// --- Main Component Export ---

export const TreasuryTransactionList = ({
  transactions,
  title = 'Transactions',
  emptyMessage = 'No transactions found.',
}: {
  transactions: StripeTreasuryTransaction[];
  title?: string;
  emptyMessage?: string;
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {transactions.map((transaction) => (
          <ExpandableListItem key={transaction.id} transaction={transaction} />
        ))}
      </ul>
    </div>
  );
};

// --- Example Usage (for standalone testing) ---
/*
const App = () => {
  const [mockTransactions, setMockTransactions] = useState<StripeTreasuryTransaction[]>([]);

  React.useEffect(() => {
    const generated = Array.from({ length: 5 }, generateRandomTransaction);
    setMockTransactions(generated);
  }, []);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <TreasuryTransactionList transactions={mockTransactions} />
    </div>
  );
};

// To run this standalone:
// 1. Save as TreasuryTransactionList.tsx
// 2. Create an index.html file:
//    <!DOCTYPE html>
//    <html>
//    <head>
//      <title>Treasury Transaction List</title>
//      <script src="https://cdn.tailwindcss.com"></script>
//    </head>
//    <body>
//      <div id="root"></div>
//      <script type="module" src="TreasuryTransactionList.tsx"></script>
//    </body>
//    </html>
// 3. Create a React app entry point (e.g., main.tsx or index.tsx) that renders the App component:
//    import React from 'react';
//    import ReactDOM from 'react-dom/client';
//    import { TreasuryTransactionList } from './TreasuryTransactionList'; // Assuming this file is named TreasuryTransactionList.tsx
//
//    const App = () => {
//      const [mockTransactions, setMockTransactions] = useState<StripeTreasuryTransaction[]>([]);
//
//      React.useEffect(() => {
//        const generated = Array.from({ length: 5 }, generateRandomTransaction);
//        setMockTransactions(generated);
//      }, []);
//
//      return (
//        <div className="p-8 bg-gray-900 min-h-screen">
//          <TreasuryTransactionList transactions={mockTransactions} />
//        </div>
//      );
//    };
//
//    const root = ReactDOM.createRoot(document.getElementById('root')!);
//    root.render(<App />);
//
// 4. Run using a local server (e.g., `npx serve` or `vite`).
*/