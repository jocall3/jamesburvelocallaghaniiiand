import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  BellAlertIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  CubeTransparentIcon,
  RocketLaunchIcon,
  WalletIcon,
  CalendarDaysIcon,
  TagIcon,
  GiftIcon,
  SparklesIcon,
  ChartPieIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  ScaleIcon,
  BanknotesIcon,
  BriefcaseIcon,
  QrCodeIcon,
  FingerPrintIcon,
  LockClosedIcon,
  CubeIcon,
  HeartIcon,
  XCircleIcon,
  ShieldExclamationIcon,
  CommandLineIcon,
  GiftTopIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

// Define a type for the navigation items
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description?: string; // Optional description for tooltip or more info
}

// Invented Stripe Apps (a representative sample, would scale to 100)
const stripeApps: NavItem[] = [
  { name: 'Revenue Forecast AI', href: '/apps/revenue-forecast-ai', icon: ChartBarIcon, description: 'Predict future revenue with AI-powered insights' },
  { name: 'Subscription Health Monitor', href: '/apps/subscription-health', icon: HeartIcon, description: 'Track and improve the health of your recurring revenue' },
  { name: 'Dynamic Pricing Engine', href: '/apps/dynamic-pricing', icon: CurrencyDollarIcon, description: 'Optimize pricing in real-time based on market conditions' },
  { name: 'Churn Prevention AI', href: '/apps/churn-prevention', icon: ShieldCheckIcon, description: 'Identify and mitigate customer churn risks proactively' },
  { name: 'Fraud Shield Pro', href: '/apps/fraud-shield-pro', icon: LockClosedIcon, description: 'Advanced fraud detection and prevention for all transactions' },
  { name: 'Invoice Automation Hub', href: '/apps/invoice-automation', icon: DocumentTextIcon, description: 'Automate invoice generation, delivery, and reconciliation' },
  { name: 'Tax Compliance Manager', href: '/apps/tax-compliance', icon: ScaleIcon, description: 'Simplify global tax calculation and reporting' },
  { name: 'Customer Lifetime Value (CLV) Predictor', href: '/apps/clv-predictor', icon: SparklesIcon, description: 'Forecast customer lifetime value for better marketing' },
  { name: 'Payment Method Optimizer', href: '/apps/payment-optimizer', icon: CreditCardIcon, description: 'Suggest optimal payment methods to reduce fees and increase conversions' },
  { name: 'Refund & Dispute Resolution', href: '/apps/refund-dispute', icon: XCircleIcon, description: 'Streamline the process of managing refunds and disputes' },
  { name: 'Affiliate & Referral Tracker', href: '/apps/affiliate-tracker', icon: UsersIcon, description: 'Manage and track your affiliate and referral programs' },
  { name: 'Expense Categorization AI', href: '/apps/expense-categorization', icon: TagIcon, description: 'Automatically categorize business expenses from Stripe data' },
  { name: 'Multi-Currency Payout Manager', href: '/apps/multi-currency-payouts', icon: BanknotesIcon, description: 'Manage payouts in multiple currencies with ease' },
  { name: 'Grants & Donations Platform', href: '/apps/grants-donations', icon: GiftIcon, description: 'Facilitate and track grants and donations for non-profits' },
  { name: 'Subscription Upsell Recommender', href: '/apps/upsell-recommender', icon: RocketLaunchIcon, description: 'AI-driven recommendations for subscription upgrades' },
  { name: 'Localized Payment Gateway', href: '/apps/localized-payments', icon: GlobeAltIcon, description: 'Offer region-specific payment options and currencies' },
  { name: 'Cash Flow Projection', href: '/apps/cash-flow-projection', icon: ChartPieIcon, description: 'Visualize and predict your future cash flow' },
  { name: 'Vendor Payout Portal', href: '/apps/vendor-payouts', icon: BriefcaseIcon, description: 'Dedicated portal for managing and paying vendors' },
  { name: 'Loyalty Program Builder', href: '/apps/loyalty-builder', icon: SparklesIcon, description: 'Create and manage customer loyalty programs directly in Stripe' },
  { name: 'Event Ticketing & Registration', href: '/apps/event-ticketing', icon: CalendarDaysIcon, description: 'Handle ticket sales and event registrations seamlessly' },
  { name: 'QR Code Payment Generator', href: '/apps/qr-payments', icon: QrCodeIcon, description: 'Generate QR codes for quick and easy payments' },
  { name: 'API Usage & Billing Monitor', href: '/apps/api-billing', icon: CommandLineIcon, description: 'Track API usage and bill customers based on consumption' },
  { name: 'Smart Discount & Coupon Engine', href: '/apps/smart-discounts', icon: ReceiptPercentIcon, description: 'Create intelligent discounts and coupon campaigns' },
  { name: 'Automated Chargeback Defense', href: '/apps/chargeback-defense', icon: ShieldExclamationIcon, description: 'Automate the process of responding to chargebacks' },
  { name: 'Customer Feedback Loop', href: '/apps/feedback-loop', icon: ChatBubbleLeftRightIcon, description: 'Collect and analyze customer feedback directly from payment interactions' },
  { name: 'Inventory Sync for Payments', href: '/apps/inventory-sync', icon: CubeTransparentIcon, description: 'Synchronize inventory levels with payment and order data' },
  { name: 'Subscription Gifting Platform', href: '/apps/subscription-gifting', icon: GiftTopIcon, description: 'Allow customers to gift subscriptions to others' },
  { name: 'Automated Debt Collection', href: '/apps/debt-collection', icon: BellAlertIcon, description: 'Automate reminders and processes for overdue payments' },
  { name: 'Compliance & KYC Onboarding', href: '/apps/kyc-onboarding', icon: FingerPrintIcon, description: 'Streamline Know Your Customer (KYC) and compliance checks' },
  { name: 'Marketplace Payout Splitter', href: '/apps/marketplace-splitter', icon: BuildingStorefrontIcon, description: 'Automate splitting payments for marketplace vendors' },
  { name: 'Wallet & Stored Value Manager', href: '/apps/wallet-manager', icon: WalletIcon, description: 'Manage customer wallets and stored value balances' },
  { name: 'AI-Powered Search & Discovery', href: '/apps/search-discovery', icon: MagnifyingGlassIcon, description: 'Enhance product search and discovery for customers' },
  // ... (In a real scenario, this array would contain 70 more unique and valuable apps)
];

// Main navigation links (e.g., core Stripe dashboards)
const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Subscriptions', href: '/subscriptions', icon: ArrowPathIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarSquareIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Sidebar Header */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          {/* Assuming a Stripe-like logo is available in the public directory */}
          <img
            className="h-8 w-auto"
            src="/stripe-logo.svg"
            alt="Stripe Apps"
          />
          <span className="sr-only">Stripe Apps</span>
          <span className="hidden md:block">Apps</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-6 py-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Core</p>
          {mainNavigation.map((item) => (
            <NavLink key={item.name} item={item} currentPath={router.pathname} />
          ))}
        </div>

        <div className="mt-8 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Stripe Apps</p>
          {stripeApps.map((item) => (
            <NavLink key={item.name} item={item} currentPath={router.pathname} />
          ))}
        </div>
      </nav>

      {/* Sidebar Footer (e.g., user info, settings, logout) */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <Link href="/profile" className="group flex items-center gap-3 rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
          <img
            className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-700"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User Avatar"
          />
          <span className="truncate">Tom Cook</span>
        </Link>
      </div>
    </div>
  );
};

interface NavLinkProps {
  item: NavItem;
  currentPath: string;
}

const NavLink: React.FC<NavLinkProps> = ({ item, currentPath }) => {
  // Determine if the link is active. Handles root path and nested paths.
  const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));

  const linkClasses = `
    group flex items-center gap-3 rounded-md p-2 text-sm font-medium
    ${isActive
      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:bg-opacity-40 dark:text-indigo-300'
      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
    }
  `;
  const iconClasses = `
    h-6 w-6 shrink-0
    ${isActive
      ? 'text-indigo-500 dark:text-indigo-400'
      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
    }
  `;

  return (
    <Link href={item.href} className={linkClasses}>
      <item.icon className={iconClasses} aria-hidden="true" />
      <span className="truncate">{item.name}</span>
    </Link>
  );
};

export default Sidebar;