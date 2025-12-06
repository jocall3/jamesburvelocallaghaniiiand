
import React, { useState, useEffect, FC } from 'react';
import axios from 'axios';

// Assuming a UI kit is used for components like Modal, Button, Input, etc.
// These would be replaced with actual library imports (e.g., from @chakra-ui/react or @mui/material)
// Placeholder components for this file fix
const Modal = ({ children, isOpen, onClose }: any) => isOpen ? <div className="modal">{children}</div> : null;
const ModalOverlay = () => null;
const ModalContent = ({ children }: any) => <div className="modal-content">{children}</div>;
const ModalHeader = ({ children }: any) => <h3>{children}</h3>;
const ModalFooter = ({ children }: any) => <div>{children}</div>;
const ModalBody = ({ children }: any) => <div>{children}</div>;
const ModalCloseButton = () => <button>Close</button>;
const Button = (props: any) => <button {...props} />;
const FormControl = ({ children }: any) => <div>{children}</div>;
const FormLabel = ({ children }: any) => <label>{children}</label>;
const FormErrorMessage = ({ children }: any) => <span>{children}</span>;
const Input = (props: any) => <input {...props} />;
const Text = ({ children }: any) => <p>{children}</p>;
const VStack = ({ children }: any) => <div>{children}</div>;
const HStack = ({ children }: any) => <div>{children}</div>;
const Select = ({ children, ...props }: any) => <select {...props}>{children}</select>;
const Spinner = () => <span>Loading...</span>;
const Alert = ({ children }: any) => <div>{children}</div>;
const AlertIcon = () => <span>!</span>;
const useToast = () => (props: any) => console.log(props);

// Simplified types based on the OpenAPI schema for this component's needs
interface ExternalAccount {
  id: string;
  party_name: string;
  verification_status: 'unverified' | 'pending_verification' | 'verified';
}

interface InternalAccount {
    id: string;
    name: string;
    currency: string;
}

interface AccountVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  externalAccount: ExternalAccount | null;
}

type VerificationStep = 'initiate' | 'confirm' | 'success';

export const AccountVerificationModal: FC<AccountVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  externalAccount,
}) => {
  const [step, setStep] = useState<VerificationStep>('initiate');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState(['', '']);
  const [internalAccounts, setInternalAccounts] = useState<InternalAccount[]>([]);
  const [selectedInternalAccountId, setSelectedInternalAccountId] = useState<string>('');
  const toast = useToast();

  useEffect(() => {
    if (isOpen && externalAccount) {
      // Reset state on open
      setError(null);
      setIsLoading(false);
      setAmounts(['', '']);

      // Determine the initial step based on the account's current status
      if (externalAccount.verification_status === 'pending_verification') {
        setStep('confirm');
      } else {
        setStep('initiate');
        // Fetch internal accounts needed for starting the verification
        const fetchInternalAccounts = async () => {
          try {
            setIsLoading(true);
            // Simulate API call
            // const response = await axios.get('/api/internal_accounts');
            // setInternalAccounts(response.data);
            const mockInternalAccounts = [{ id: 'int_1', name: 'Operating', currency: 'USD' }];
            setInternalAccounts(mockInternalAccounts);
            if (mockInternalAccounts.length > 0) {
              setSelectedInternalAccountId(mockInternalAccounts[0].id);
            }
          } catch (e) {
            setError('Failed to load necessary data. Please try again.');
          } finally {
            setIsLoading(false);
          }
        };
        fetchInternalAccounts();
      }
    }
  }, [isOpen, externalAccount]);

  const handleStartVerification = async () => {
    if (!externalAccount || !selectedInternalAccountId) return;
    setIsLoading(true);
    setError(null);
    try {
    //   await axios.post(`/api/external_accounts/${externalAccount.id}/verify`, {
    //     originating_account_id: selectedInternalAccountId,
    //     payment_type: 'ach', // Assuming ACH for micro-deposits
    //   });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('confirm');
      toast({
        title: 'Verification Started',
        description: 'Micro-deposits are on their way to your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (e: any) {
      setError(e.response?.data?.errors?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteVerification = async () => {
    if (!externalAccount) return;
    const parsedAmounts = amounts.map(a => Math.round(parseFloat(a) * 100)).filter(a => !isNaN(a));

    if (parsedAmounts.length !== 2 || parsedAmounts.some(a => a <= 0)) {
        setError('Please enter two valid, positive deposit amounts.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
    //   await axios.post(`/api/external_accounts/${externalAccount.id}/complete_verification`, {
    //     amounts: parsedAmounts,
    //   });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('success');
      // Delay closing to show success message, then call success callback
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (e: any) {
       setError(e.response?.data?.errors?.message || 'Verification failed. Please double-check the amounts and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (index: number, value: string) => {
    const newAmounts = [...amounts];
    // Allow only numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
        newAmounts[index] = value;
        setAmounts(newAmounts);
    }
  };

  const renderContent = () => {
    if (!externalAccount) return <Spinner />;

    switch (step) {
      case 'initiate':
        return (
          <VStack>
            <Text>
              To verify your account, we will send two small deposits (less than $1.00) to{' '}
              <strong>{externalAccount.party_name}</strong>.
            </Text>
            <Text>
              These should appear in your bank account in 1-2 business days. Once you see them, come back here to enter the amounts.
            </Text>
            <FormControl>
                <FormLabel>Originate Deposits From</FormLabel>
                 {internalAccounts.length > 0 ? (
                    <Select value={selectedInternalAccountId} onChange={(e: any) => setSelectedInternalAccountId(e.target.value)}>
                        {internalAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.currency})
                            </option>
                        ))}
                    </Select>
                 ) : <Text>No internal accounts found.</Text>}
                {!selectedInternalAccountId && <FormErrorMessage>An originating account must be selected.</FormErrorMessage>}
            </FormControl>
          </VStack>
        );
      case 'confirm':
        return (
          <VStack>
            <Text>
              Check your bank account for two small deposits from Modern Treasury. Enter the amounts below in USD to complete the verification.
            </Text>
            <HStack>
              <FormControl>
                <FormLabel>First Deposit Amount</FormLabel>
                <Input
                  type="text"
                  placeholder="0.21"
                  value={amounts[0]}
                  onChange={(e: any) => handleAmountChange(0, e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Second Deposit Amount</FormLabel>
                <Input
                  type="text"
                  placeholder="0.45"
                  value={amounts[1]}
                  onChange={(e: any) => handleAmountChange(1, e.target.value)}
                />
              </FormControl>
            </HStack>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </VStack>
        );
      case 'success':
          return (
            <VStack>
                <AlertIcon />
                <Text>Account Verified!</Text>
                <Text>Your account has been successfully verified and is ready for use.</Text>
            </VStack>
          )
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
        case 'initiate':
            return (
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleStartVerification}
                        disabled={!selectedInternalAccountId || isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Micro-Deposits'}
                    </Button>
                </>
            );
        case 'confirm':
            return (
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCompleteVerification} disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify Account'}
                    </Button>
                </>
            );
        case 'success':
            return null;
        default:
            return <Button onClick={onClose}>Close</Button>;
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Verify Bank Account</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {error && (
            <Alert>
              <AlertIcon />
              {error}
            </Alert>
          )}
          {isLoading && step !== 'confirm' && <Spinner />}
          {!isLoading || step === 'confirm' ? renderContent() : null}
        </ModalBody>
        <ModalFooter>
          {renderFooter()}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
