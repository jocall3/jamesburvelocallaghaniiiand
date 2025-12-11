import React from 'react';

interface Identity {
  id: string;
  displayName: string;
  applicationType: string;
}

type ActionType = 'Delete' | 'Disable';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  identity: Identity;
  actionType: ActionType;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  identity,
  actionType,
}) => {
  if (!isOpen) {
    return null;
  }

  const isDeleting = actionType === 'Delete';
  const actionVerb = isDeleting ? 'delete' : 'disable';
  
  let confirmationText = '';
  if (isDeleting) {
    confirmationText = 'Deleting this application is irreversible. All associated configurations and access grants will be permanently removed.';
  } else {
    confirmationText = 'Disabling this application will immediately revoke all user and service principal access. Users will lose access until the application is re-enabled.';
  }

  const buttonColorClass = isDeleting
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';

  const iconColorClass = isDeleting ? 'text-red-600' : 'text-yellow-600';
  const iconBgClass = isDeleting ? 'bg-red-100' : 'bg-yellow-100';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full m-4">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div 
              className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBgClass} sm:mx-0 sm:h-10 sm:w-10`}
            >
              {/* Warning Icon */}
              <svg 
                className={`h-6 w-6 ${iconColorClass}`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Confirm {actionType} Application
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-700">
                  Are you absolutely sure you want to {actionVerb} the critical application:
                </p>
                <p className="font-bold text-md mt-1 text-red-700">
                  {identity.displayName} ({identity.id})
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  <span className="font-semibold text-red-600">WARNING:</span> {confirmationText}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action should be performed only after confirming all dependencies.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm 
              ${buttonColorClass}
              focus:outline-none focus:ring-2 focus:ring-offset-2`}
            onClick={onConfirm}
          >
            {actionType}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;