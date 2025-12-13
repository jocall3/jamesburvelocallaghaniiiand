import React from 'react';

interface BookLayoutProps {
  /**
   * The main content of the book page to be displayed in the primary content area.
   */
  children: React.ReactNode;
  /**
   * Content for the sidebar, typically chapter navigation or related links.
   */
  sidebarContent: React.ReactNode;
  /**
   * Optional title for the book, displayed at the top of the sidebar.
   */
  bookTitle?: string;
  /**
   * Optional additional CSS classes for the main layout container.
   */
  className?: string;
}

/**
 * BookLayout component provides a two-column layout for displaying book content.
 * It features a sticky sidebar for navigation and a main content area for pages.
 *
 * The layout is responsive, stacking the sidebar above the main content on small screens
 * and displaying them side-by-side on larger screens.
 */
const BookLayout: React.FC<BookLayoutProps> = ({
  children,
  sidebarContent,
  bookTitle,
  className,
}) => {
  return (
    <div
      className={`
        flex flex-col lg:flex-row
        min-h-screen
        bg-gray-50 dark:bg-gray-900
        text-gray-900 dark:text-gray-100
        ${className || ''}
      `}
    >
      {/* Sidebar for navigation */}
      <aside
        className={`
          lg:w-1/4 xl:w-1/5
          bg-white dark:bg-gray-800
          border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700
          p-4 lg:p-6
          shadow-sm lg:shadow-md
          flex-shrink-0
          lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto
          z-10
        `}
      >
        {bookTitle && (
          <h2 className="text-2xl font-bold mb-4 text-indigo-700 dark:text-indigo-400">
            {bookTitle}
          </h2>
        )}
        <nav className="space-y-2">
          {sidebarContent}
        </nav>
      </aside>

      {/* Main content area for book pages */}
      <main
        className={`
          flex-1
          p-4 lg:p-8
          overflow-y-auto
          relative
        `}
      >
        <article className="prose dark:prose-invert max-w-none">
          {children}
        </article>
      </main>
    </div>
  );
};

export default BookLayout;