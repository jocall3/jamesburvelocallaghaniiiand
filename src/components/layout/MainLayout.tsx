import React, { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  title?: string; // Optional title for the header
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'Dashboard' }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg z-20">
        <div className="text-3xl font-extrabold mb-10 text-indigo-400 tracking-tight">
          Stripe Apps
        </div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-3">
              <a href="#" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-lg font-medium">
                <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                Dashboard
              </a>
            </li>
            <li className="mb-3">
              <a href="#" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-lg font-medium">
                <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m3 10V7"></path></svg>
                My Apps
              </a>
            </li>
            <li className="mb-3">
              <a href="#" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-lg font-medium">
                <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Marketplace
              </a>
            </li>
            <li className="mb-3">
              <a href="#" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-lg font-medium">
                <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Settings
              </a>
            </li>
          </ul>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-700 text-sm text-gray-400">
          <p className="mb-2">© 2023 Stripe Apps</p>
          <p>Version 1.0.0</p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center space-x-6">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="flex items-center space-x-3 cursor-pointer group">
              <img src="https://api.dicebear.com/7.x/initials/svg?seed=JD" alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-400 group-hover:border-indigo-600 transition-colors duration-200" />
              <span className="text-gray-800 font-semibold text-lg group-hover:text-indigo-600 transition-colors duration-200">John Doe</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;