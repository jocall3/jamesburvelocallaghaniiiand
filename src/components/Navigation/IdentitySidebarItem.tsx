import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Sidebar navigation item component that links to the Identity Management features.
 * Displays an icon and label, handling active state styling automatically.
 */
const IdentitySidebarItem: React.FC = () => {
  return (
    <NavLink
      to="/identity"
      className={({ isActive }) =>
        `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
      aria-label="Identity Management"
    >
      <svg
        className="mr-3 h-5 w-5 flex-shrink-0 transition-colors"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.542 17H11a1 1 0 01-1-1v-1h-1v-1H8v-1m-1.5-3.5a6 6 0 118.293-8.293 2.016 2.016 0 01-3.293 3.293z"
        />
      </svg>
      <span>Identity</span>
    </NavLink>
  );
};

export default IdentitySidebarItem;