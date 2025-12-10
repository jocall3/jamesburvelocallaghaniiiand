import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  /**
   * Controls the visibility of the modal.
   */
  isOpen: boolean;
  /**
   * Callback function to close the modal.
   */
  onClose: () => void;
  /**
   * The content to be displayed inside the modal.
   */
  children: React.ReactNode;
  /**
   * Optional title for the modal header.
   */
  title?: string;
  /**
   * Optional additional CSS classes for the modal content box.
   */
  className?: string;
  /**
   * Optional additional CSS classes for the overlay backdrop.
   */
  overlayClassName?: string;
  /**
   * If true, clicking on the overlay backdrop will not close the modal.
   * @default false
   */
  disableCloseOnOverlayClick?: boolean;
  /**
   * If true, pressing the Escape key will not close the modal.
   * @default false
   */
  disableCloseOnEscape?: boolean;
}

/**
 * A reusable modal component for displaying overlay content, such as forms,
 * confirmations, or detailed views. It handles accessibility concerns like
 * focus trapping and keyboard navigation (Escape key to close).
 *
 * Requires a `<div id="modal-root"></div>` element in your `index.html` or
 * root component for `createPortal` to render into.
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  overlayClassName = '',
  disableCloseOnOverlayClick = false,
  disableCloseOnEscape = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLElement | null>(null); // Stores the element that had focus before the modal opened

  // Store the element that had focus before the modal opened
  useEffect(() => {
    if (isOpen) {
      initialFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Handle Escape key and focus trapping
  useEffect(() => {
    if (!isOpen) {
      // Return focus to the element that opened the modal when it closes
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
        initialFocusRef.current = null; // Clear it after use
      }
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disableCloseOnEscape) {
        onClose();
      }
    };

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            lastElement?.focus();
            event.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);

    // Focus the first focusable element or the modal itself when it opens
    // Using a timeout to ensure the modal is rendered before attempting to focus
    const timeoutId = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        } else {
          modalRef.current.focus(); // Fallback to focusing the modal container
        }
      }
    }, 0);


    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      clearTimeout(timeoutId);
    };
  }, [isOpen, onClose, disableCloseOnEscape]);

  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !disableCloseOnOverlayClick) {
      onClose();
    }
  }, [onClose, disableCloseOnOverlayClick]);

  if (!isOpen) {
    return null;
  }

  // Ensure the portal root exists
  const portalRoot = document.getElementById('modal-root');
  if (!portalRoot) {
    console.error(
      "Modal: Element with id 'modal-root' not found. " +
      "Please add <div id='modal-root'></div> to your index.html or root component."
    );
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 ${overlayClassName}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      tabIndex={-1} // Make the overlay focusable programmatically but not via tab key
    >
      <div
        ref={modalRef}
        className={`relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 flex flex-col max-h-[90vh] overflow-hidden ${className}`}
        role="document"
        tabIndex={0} // Make the modal content itself focusable for initial focus if no other elements
      >
        {title && (
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
            <h2 id="modal-title" className="text-2xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {!title && ( // If no title, still provide a close button at the top right
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default Modal;