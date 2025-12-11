```typescript
import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Divider,
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';

interface LoanRequest {
  id: string;
  name: string;
  amount: number;
  description: string;
}

const PeerLending = () => {
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [newLoanRequest, setNewLoanRequest] = useState<Omit<LoanRequest, 'id'>>({
    name: '',
    amount: 0,
    description: '',
  });

  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLoanRequest((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLoanRequest.name || !newLoanRequest.amount || !newLoanRequest.description) {
      toast({
        title: 'All fields are required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newLoanRequest.amount <= 0) {
      toast({
        title: 'Loan amount must be greater than zero.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newRequest: LoanRequest = {
      id: Date.now().toString(), // Simple ID generation
      ...newLoanRequest,
    };

    setLoanRequests((prev) => [...prev, newRequest]);
    setNewLoanRequest({ name: '', amount: 0, description: '' });

    toast({
      title: 'Loan request submitted!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleLend = (id: string) => {
    // In a real application, this would involve updating state
    // or interacting with a smart contract.  Here, we just show a toast.
    toast({
      title: 'Thank you for your support!',
      description: `You have virtually contributed to loan request ${id}.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={4} maxWidth="800px" mx="auto">
      <Heading mb={4} textAlign="center">
        Peer-to-Peer Lending & Community Support
      </Heading>

      {/* Loan Request Form */}
      <Box mb={6} borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="md" mb={2}>
          Submit a Loan Request
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={3} align="stretch">
            <FormControl>
              <FormLabel>Your Name:</FormLabel>
              <Input
                type="text"
                name="name"
                value={newLoanRequest.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Loan Amount:</FormLabel>
              <Input
                type="number"
                name="amount"
                value={newLoanRequest.amount === 0 ? '' : newLoanRequest.amount}
                onChange={handleInputChange}
                placeholder="Enter loan amount"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description:</FormLabel>
              <Input
                as="textarea"
                name="description"
                value={newLoanRequest.description}
                onChange={handleInputChange}
                placeholder="Explain your needs"
                rows={3}
              />
            </FormControl>
            <Button colorScheme="blue" type="submit">
              Submit Request
            </Button>
          </VStack>
        </form>
      </Box>

      {/* Display Loan Requests */}
      {loanRequests.length > 0 ? (
        <Box>
          <Heading size="md" mb={2}>
            Active Loan Requests
          </Heading>
          {loanRequests.map((request) => (
            <Box key={request.id} borderWidth="1px" borderRadius="md" p={4} mb={4}>
              <Heading size="sm">{request.name}</Heading>
              <Text>Amount: ${request.amount}</Text>
              <Text>Description: {request.description}</Text>
              <Button colorScheme="green" size="sm" mt={2} onClick={() => handleLend(request.id)}>
                Support/Lend
              </Button>
            </Box>
          ))}
        </Box>
      ) : (
        <Text textAlign="center">No loan requests yet. Be the first to submit!</Text>
      )}
    </Box>
  );
};

export default PeerLending;
```