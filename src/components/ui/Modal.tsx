import React, { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: string;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-2xl',
    className = '',
}) => {
    const modalContentRef = useRef<HTMLDivElement>(null);

    // Handle Escape key press to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isOpen && event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Lock body scroll when modal is open to prevent background scrolling
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={modalContentRef}
                className={`bg-gray-800 rounded-lg shadow-2xl w-full mx-4 my-8 flex flex-col relative ${maxWidth} ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <div className="text-xl font-semibold text-white">
                        {title}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl leading-none transition-colors focus:outline-none"
                        aria-label="Close modal"
                    >
                        &times;
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar max-h-[calc(100vh-8rem)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;