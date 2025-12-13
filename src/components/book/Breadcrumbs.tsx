import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Define the structure for a breadcrumb item
interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Parses the current location pathname into a structured breadcrumb array.
 * Example: /book/part-1/chapter-5/page-12 ->
 * [
 *   { name: 'Home', path: '/' },
 *   { name: 'Part 1', path: '/book/part-1' },
 *   { name: 'Chapter 5', path: '/book/part-1/chapter-5' },
 *   { name: 'Page 12', path: '/book/part-1/chapter-5/page-12' }
 * ]
 *
 * NOTE: This implementation assumes a standard routing structure like:
 * /book/:partId/:chapterId/:pageId
 * And maps the segments to human-readable names (which might need refinement based on actual data fetching).
 */
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const parts = pathname.split('/').filter(p => p.length > 0);
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', path: '/' }];
  let currentPath = '';

  if (parts.length === 0) {
    return breadcrumbs;
  }

  // Assume the base path for the book structure is '/book'
  if (parts[0] === 'book') {
    currentPath = '/book';
    breadcrumbs.push({ name: 'Book Index', path: currentPath });
    parts.shift(); // Remove 'book'
  } else {
    // If the path doesn't start with /book, we might be on a root page or error page.
    // We'll just use the parts we have, but this might need adjustment based on the full router setup.
    return [{ name: 'Home', path: '/' }, { name: parts[0], path: `/${parts[0]}` }];
  }

  // Process remaining parts (Part, Chapter, Page)
  parts.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Simple heuristic for naming based on depth within the book structure
    let name = segment.replace(/-/g, ' '); // Basic cleanup

    if (index === 0) {
      name = `Part ${segment.split('-').pop() || 'X'}`; // e.g., part-1 -> Part 1
    } else if (index === 1) {
      name = `Chapter ${segment.split('-').pop() || 'Y'}`; // e.g., chapter-5 -> Chapter 5
    } else if (index >= 2) {
      name = `Page ${segment.split('-').pop() || 'Z'}`; // e.g., page-12 -> Page 12
    }

    // If it's the last segment, we usually don't link it, but for simplicity in this component, we link all.
    breadcrumbs.push({
      name: name,
      path: currentPath,
    });
  });

  return breadcrumbs;
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  if (breadcrumbs.length <= 1) {
    // Only show breadcrumbs if we are deeper than the root/home page
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="breadcrumbs-container">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li
              key={item.path}
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast ? (
                <span className="breadcrumb-link-text">{item.name}</span>
              ) : (
                <Link to={item.path} className="breadcrumb-link">
                  {item.name}
                </Link>
              )}
              {!isLast && <span className="breadcrumb-separator">/</span>}
            </li>
          );
        })}
      </ol>

      {/* Basic inline styling for demonstration purposes, usually this would be in a CSS module */}
      <style jsx>{`
        .breadcrumbs-container {
          padding: 10px 0;
          font-size: 0.9rem;
          color: #555;
        }
        .breadcrumb-list {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .breadcrumb-item {
          display: flex;
          align-items: center;
        }
        .breadcrumb-link {
          color: #007bff;
          text-decoration: none;
        }
        .breadcrumb-link:hover {
          text-decoration: underline;
        }
        .breadcrumb-link-text {
          color: #333;
          font-weight: 600;
        }
        .breadcrumb-separator {
          margin: 0 8px;
          color: #aaa;
        }
        .breadcrumb-item.active .breadcrumb-link-text {
          color: #333;
          font-weight: bold;
        }
        .breadcrumb-item:last-child .breadcrumb-separator {
          display: none;
        }
      `}</style>
    </nav>
  );
};

export default Breadcrumbs;