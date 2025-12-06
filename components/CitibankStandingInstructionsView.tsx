
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMoneyMovement } from './MoneyMovementContext';
import {
  StandingInstructions,
  RetrievePaymentInitiationTransactionRepeatingPaymentsResponse,
  UpdatePaymentInitiationTransactionRepeatingPaymentsPreprocessRequest,
  UpdatePaymentInitiationTransactionRepeatingPaymentsPreprocessResponse,
  UpdatePaymentInitiationTransactionRepeatingPaymentsConfirmationResponse,
  StandingInstruction,
  ErrorResponse,
} from './CitibankMoneyMovementSDK';

interface CitibankStandingInstructionsViewProps {
  // Any props if needed, e.g., initial filters
}

const CitibankStandingInstructionsView: React.FC<CitibankStandingInstructionsViewProps> = () => {
  const { api, accessToken, uuid, generateNewUuid } = useMoneyMovement();

  const [instructions, setInstructions] = useState<StandingInstructions[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateEditModal, setShowCreateEditModal] = useState<boolean>(false);
  const [editingInstruction, setEditingInstruction] = useState<StandingInstructions | null>(null);

  const initialFormState: UpdatePaymentInitiationTransactionRepeatingPaymentsPreprocessRequest = {
    accountId: '',
    paymentMethod: '',
    transactionReferenceId: '',
    transactionAmount: 0,
    standingInstruction: {
      standingInstructionStartDate: '',
      paymentFrequency: '',
      perpetualFlag: false,
      standingInstructionEndDate: '',
    },
    remarks: '',
  };
  const [formState, setFormState] = useState<UpdatePaymentInitiationTransactionRepeatingPaymentsPreprocessRequest>(initialFormState);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [instructionToDelete, setInstructionToDelete] = useState<StandingInstructions | null>(null);

  const paymentFrequencies = useMemo(() => ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALFYEARLY', 'YEARLY'], []);
  const paymentMethods = useMemo(() => ['INTERNAL_DOMESTIC', 'EXTERNAL_DOMESTIC', 'BILL_PAYMENT', 'SEPA', 'CROSS_BORDER_WIRE', 'CITI_GLOBAL'], []);

  const fetchInstructions = useCallback(async () => {
    if (!api || !accessToken || !uuid) {
      setError('API client not initialized or access token/UUID missing.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response: RetrievePaymentInitiationTransactionRepeatingPaymentsResponse =
        await api.retrievePaymentInitiationTransactionRepeatingPayments(accessToken, uuid);
      setInstructions(response.standingInstructions || []);
    } catch (err: any) {
      console.error('Failed to fetch standing instructions:', err);
      const errorMessage = err.response?.data?.errors?.[0]?.details || err.message || 'An unknown error occurred while fetching instructions.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [api, accessToken, uuid]);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name.startsWith('standingInstruction.')) {
      const subFieldName = name.split('.')[1] as keyof StandingInstruction;
      setFormState(prevState => ({
        ...prevState,
        standingInstruction: {
          ...prevState.standingInstruction!,
          [subFieldName]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }));
    } else {
      setFormState(prevState => ({
        ...prevState,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    }
  };

  const openCreateModal = () => {
    setEditingInstruction(null);
    setFormState({
      ...initialFormState,
      transactionReferenceId: crypto.randomUUID(),
      standingInstruction: {
        standingInstructionStartDate: '',
        paymentFrequency: '',
        perpetualFlag: false,
        standingInstructionEndDate: '',
      },
    });
    setShowCreateEditModal(true);
  };

  const openEditModal = (instruction: StandingInstructions) => {
    setEditingInstruction(instruction);
    setFormState({
      accountId: instruction.accountId,
      paymentMethod: instruction.paymentMethod,
      transactionReferenceId: instruction.transactionReferenceId,
      transactionAmount: instruction.transactionAmount,
      standingInstruction: {
        standingInstructionStartDate: instruction.standingInstruction?.standingInstructionStartDate || '',
        paymentFrequency: instruction.standingInstruction?.paymentFrequency || '',
        perpetualFlag: instruction.standingInstruction?.perpetualFlag || false,
        standingInstructionEndDate: instruction.standingInstruction?.standingInstructionEndDate || '',
      },
      remarks: instruction.remarks || '',
    });
    setShowCreateEditModal(true);
  };

  const closeCreateEditModal = () => {
    setShowCreateEditModal(false);
    setEditingInstruction(null);
    setError(null);
    setFormState(initialFormState);
  };

  const handleCreateEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || !accessToken || !uuid) {
      setError('API client not initialized or access token/UUID missing.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestBody: UpdatePaymentInitiationTransactionRepeatingPaymentsPreprocessRequest = {
        ...formState,
        transactionAmount: formState.transactionAmount || 0,
        standingInstruction: {
          ...formState.standingInstruction!,
          standingInstructionEndDate: formState.standingInstruction?.perpetualFlag
            ? undefined
            : formState.standingInstruction?.standingInstructionEndDate,
        },
      };

      const preprocessResponse: any =
        await api.createBillPaymentPreprocess(accessToken, uuid, requestBody as any); // Casting for simplicity in mock

      if (!preprocessResponse.controlFlowId) {
        throw new Error('Preprocess failed: No controlFlowId received.');
      }

      const confirmationResponse: any =
        await api.confirmBillPayment(accessToken, uuid, {
          controlFlowId: preprocessResponse.controlFlowId,
        });

      if (confirmationResponse.transactionReferenceId) {
        alert(`Standing instruction ${editingInstruction ? 'updated' : 'created'} successfully! Reference ID: ${confirmationResponse.transactionReferenceId}`);
        fetchInstructions();
        closeCreateEditModal();
      } else {
        throw new Error('Confirmation failed: No transactionReferenceId received.');
      }
    } catch (err: any) {
      console.error(`Failed to ${editingInstruction ? 'update' : 'create'} standing instruction:`, err);
      const errorMessage = err.response?.data?.errors?.[0]?.details || err.message || `Failed to ${editingInstruction ? 'update' : 'create'} standing instruction.`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteConfirmModal = (instruction: StandingInstructions) => {
    setInstructionToDelete(instruction);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteConfirmModal = () => {
    setInstructionToDelete(null);
    setShowDeleteConfirmModal(false);
    setError(null);
  };

  const confirmDelete = async () => {
    closeDeleteConfirmModal();
    alert("Delete functionality mock");
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Standing Instructions</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <button
        onClick={openCreateModal}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Add New Standing Instruction
      </button>

      {isLoading && <p>Loading instructions...</p>}

      {!isLoading && instructions.length === 0 && <p>No standing instructions found.</p>}

      {!isLoading && instructions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 text-black">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Ref ID</th>
                <th className="py-2 px-4 border-b text-left">Account</th>
                <th className="py-2 px-4 border-b text-right">Amount</th>
                <th className="py-2 px-4 border-b text-left">Freq</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instructions.map((inst) => (
                <tr key={inst.transactionReferenceId} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{inst.transactionReferenceId}</td>
                  <td className="py-2 px-4 border-b">{inst.accountId}</td>
                  <td className="py-2 px-4 border-b text-right">{inst.transactionAmount.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">{inst.standingInstruction?.paymentFrequency || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => openEditModal(inst)} className="text-blue-600 mr-2">Edit</button>
                    <button onClick={() => openDeleteConfirmModal(inst)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CitibankStandingInstructionsView;
