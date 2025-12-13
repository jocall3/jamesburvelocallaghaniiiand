import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm p-4 flex items-center justify-between border-b border-gray-200">
      {/* Left section: Logo/App Name */}
      <div className="flex items-center">
        <span className="text-2xl font-extrabold text-indigo-600">Stripe Apps</span>
      </div>

      {/* Center section: Search Bar */}
      <div className="flex-grow mx-4 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search apps, customers, or features..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out text-sm"
          />
        </div>
      </div>

      {/* Right section: User Info, Notifications, Settings */}
      <div className="flex items-center space-x-4">
        {/* Notifications icon */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {/* User Avatar and Name */}
        <div className="flex items-center space-x-2 cursor-pointer group p-1 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out">
          <img
            src="https://api.dicebear.com/7.x/initials/svg?seed=JD&backgroundColor=indigo&backgroundType=gradientLinear&radius=50" // Placeholder avatar
            alt="User Avatar"
            className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 group-hover:border-indigo-500 transition duration-150 ease-in-out"
          />
          <span className="font-medium text-gray-700 hidden md:block group-hover:text-indigo-600 transition duration-150 ease-in-out text-sm">John Doe</span>
        </div>

        {/* Settings/Menu icon */}
        <button className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;