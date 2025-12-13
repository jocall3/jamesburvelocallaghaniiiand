import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'App Subscription Platform',
  description = 'Discover and subscribe to a wide range of applications.',
  keywords = 'subscription, apps, software, services, platform',
}) => {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/apps', label: 'Browse Apps' },
    { href: '/subscriptions', label: 'My Subscriptions' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About Us' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/">
                <a className="text-2xl font-bold text-gray-800 hover:text-blue-600">
                  AppSub
                </a>
              </Link>
            </div>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`text-gray-600 hover:text-blue-600 transition duration-300 ${
                      router.pathname === item.href ? 'font-semibold text-blue-600' : ''
                    }`}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
            <div className="md:hidden">
              <button className="text-gray-600 focus:outline-none">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  ></path>
                </svg>
              </button>
              {/* Mobile menu would go here */}
            </div>
          </div>
        </nav>
      </header>

      <div className="container mx-auto flex flex-col md:flex-row mt-8 px-6">
        <aside className="w-full md:w-64 bg-white shadow-md rounded-lg p-6 mb-6 md:mb-0 md:mr-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Navigation</h3>
          <ul>
            {navItems.map((item) => (
              <li key={item.href} className="mb-2">
                <Link href={item.href}>
                  <a
                    className={`block py-2 px-3 rounded-md hover:bg-blue-50 transition duration-300 ${
                      router.pathname === item.href ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
          {/* Add more sidebar content here, e.g., user profile, settings */}
        </aside>

        <main className="flex-1 bg-white shadow-md rounded-lg p-6">
          {children}
        </main>
      </div>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} App Subscription Platform. All rights reserved.</p>
          <div className="mt-4">
            <Link href="/privacy">
              <a className="text-gray-400 hover:text-white mx-2">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="text-gray-400 hover:text-white mx-2">Terms of Service</a>
            </Link>
            <Link href="/contact">
              <a className="text-gray-400 hover:text-white mx-2">Contact Us</a>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;