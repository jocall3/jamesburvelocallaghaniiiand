import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const router = useRouter();

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center">App Hub</h2>
        <p className="text-sm text-center text-gray-400">Your Subscription Gateway</p>
      </div>
      <nav>
        <ul>
          {items.map((item) => (
            <li key={item.href} className="mb-2">
              <Link href={item.href}>
                <a
                  className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                    router.pathname === item.href
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;