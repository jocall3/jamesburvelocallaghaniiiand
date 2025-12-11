import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Landmark, User, Store } from 'lucide-react';
import clsx from 'clsx';

export type FinancialNodeType = 'bank' | 'user' | 'vendor';

export interface FinancialNodeData {
  type: FinancialNodeType;
  label: string;
  amount?: number;
  currency?: string;
}

type FinancialNodeProps = NodeProps<FinancialNodeData>;

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error(`Error formatting currency:`, error);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const nodeConfig: Record<
  FinancialNodeType,
  {
    Icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    borderColor: string;
    iconColor: string;
    iconBgColor: string;
  }
> = {
  bank: {
    Icon: Landmark,
    bgColor: 'bg-sky-100 dark:bg-sky-900/50',
    borderColor: 'border-sky-300 dark:border-sky-700',
    iconColor: 'text-sky-600 dark:text-sky-400',
    iconBgColor: 'bg-sky-200 dark:bg-sky-800/60',
  },
  user: {
    Icon: User,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBgColor: 'bg-emerald-200 dark:bg-emerald-800/60',
  },
  vendor: {
    Icon: Store,
    bgColor: 'bg-amber-100 dark:bg-amber-900/50',
    borderColor: 'border-amber-300 dark:border-amber-700',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBgColor: 'bg-amber-200 dark:bg-amber-800/60',
  },
};

const FinancialNode = ({ data, selected }: FinancialNodeProps) => {
  const { type, label, amount, currency } = data;
  const config = nodeConfig[type];
  if (!config) {
    return null;
  }

  const { Icon, bgColor, borderColor, iconColor, iconBgColor } = config;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 dark:!bg-gray-600"
      />
      <div
        className={clsx(
          'p-3 rounded-lg border-2 shadow-md w-52 transition-all duration-150',
          'font-sans',
          bgColor,
          borderColor,
          {
            'ring-2 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 dark:ring-offset-gray-800': selected,
            'shadow-lg': selected,
          }
        )}
      >
        <div className="flex items-center space-x-3">
          <div
            className={clsx(
              'flex-shrink-0 p-2 rounded-full',
              iconBgColor
            )}
          >
            <Icon className={clsx('w-6 h-6', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate" title={label}>
              {label}
            </p>
            {amount !== undefined && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatCurrency(amount, currency)}
              </p>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 dark:!bg-gray-600"
      />
    </>
  );
};

export default memo(FinancialNode);