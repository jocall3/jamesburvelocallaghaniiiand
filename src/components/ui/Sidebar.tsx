import React from 'react';

interface SidebarProps {
  /**
   * Controls the visibility of the sidebar.
   */
  isOpen: boolean;
  /**
   * Callback function to be called when the sidebar needs to be closed,
   * e.g., by clicking the overlay.
   */
  onClose?: () => void;
  /**
   * Determines the position of the sidebar ('left' or 'right') and its slide direction.
   * @default 'left'
   */
  position?: 'left' | 'right';
  /**
   * Additional Tailwind CSS classes to apply to the sidebar container.
   */
  className?: string;
  /**
   * The content to be displayed inside the sidebar.
   */
  children: React.ReactNode;
  /**
   * Tailwind CSS width class for the sidebar, e.g., 'w-64', 'w-80', 'w-full'.
   * @default 'w-64'
   */
  width?: string;
  /**
   * If true, a semi-transparent overlay will appear behind the sidebar when open,
   * which can be clicked to close the sidebar.
   * @default true
   */
  showOverlay?: boolean;
}

/**
 * A general-purpose sidebar component, designed to be flexible for displaying
 * navigation, chapter lists, or other contextual information.
 * It supports sliding in from the left or right, an optional overlay, and custom widths.
 */
const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  position = 'left',
  className = '',
  children,
  width = 'w-64',
  showOverlay = true,
}) => {
  const sidebarClasses = [
    'fixed',
    'top-0',
    'h-full',
    'bg-white',
    'dark:bg-gray-800',
    'shadow-lg',
    'transform',
    'transition-transform',
    'duration-300',
    'ease-in-out',
    'z-40', // Ensure sidebar is above main content and overlay
    width,
    className,
  ];

  // Apply position-specific classes for sliding animation
  if (position === 'left') {
    sidebarClasses.push('left-0');
    sidebarClasses.push(isOpen ? 'translate-x-0' : '-translate-x-full');
  } else { // right
    sidebarClasses.push('right-0');
    sidebarClasses.push(isOpen ? 'translate-x-0' : 'translate-x-full');
  }

  const overlayClasses = [
    'fixed',
    'inset-0',
    'bg-black',
    'transition-opacity',
    'duration-300',
    'ease-in-out',
    'z-30', // Ensure overlay is below sidebar but above main content
  ];

  // Control overlay visibility and clickability
  if (isOpen && showOverlay) {
    overlayClasses.push('opacity-50', 'pointer-events-auto');
  } else {
    overlayClasses.push('opacity-0', 'pointer-events-none');
  }

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className={overlayClasses.join(' ')}
          onClick={onClose}
          aria-hidden={!isOpen} // Hide from accessibility tree when not open
        />
      )}

      {/* Sidebar */}
      <aside
        className={sidebarClasses.join(' ')}
        role="complementary" // Or 'navigation' if primarily for navigation
        aria-hidden={!isOpen} // Hide from accessibility tree when not open
      >
        <div className="p-4 overflow-y-auto h-full">
          {children}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;