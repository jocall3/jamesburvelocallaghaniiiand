import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  Stack,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { Plan } from '../../types/plan'; // Assuming you have a Plan type defined
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../../api/plans'; // Assuming you have API functions
import { formatCurrency } from '../../utils/currency';

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch plans.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setSelectedPlan(plan);
      setName(plan.name);
      setPrice(plan.price.toString());
      setDescription(plan.description);
    } else {
      setSelectedPlan(null);
      setName('');
      setPrice('');
      setDescription('');
    }
    onOpen();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const planData = {
        name,
        price: parseFloat(price),
        description,
      };

      if (selectedPlan) {
        // Update existing plan
        await updatePlan(selectedPlan.id, planData);
        toast({
          title: 'Plan Updated',
          description: 'Plan updated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Create new plan
        await createPlan(planData);
        toast({
          title: 'Plan Created',
          description: 'Plan created successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }

      fetchPlans(); // Refresh plan list
      onClose();
    } catch (error) {
      console.error('Error submitting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit plan.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await deletePlan(id);
        fetchPlans();
        toast({
          title: 'Plan Deleted',
          description: 'Plan deleted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete plan.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading as="h1" size="xl">
          Subscription Plans
        </Heading>
        <Button leftIcon={<AddIcon />} colorScheme="green" onClick={() => handleOpenModal()}>
          Add New Plan
        </Button>
      </Stack>

      {isLoading ? (
        <Box padding="6" boxShadow="md" bg="bg">
          <Skeleton height="40px" />
          <SkeletonText mt="4" noOfLines={4} spacing="4" />
          <Skeleton height="40px" />
          <SkeletonText mt="4" noOfLines={4} spacing="4" />
          <Skeleton height="40px" />
          <SkeletonText mt="4" noOfLines={4} spacing="4" />
        </Box>
      ) : (
        <Table variant="simple" boxShadow="md" borderRadius="md">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Price</Th>
              <Th>Description</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {plans.map((plan) => (
              <Tr key={plan.id}>
                <Td>{plan.name}</Td>
                <Td>{formatCurrency(plan.price)}</Td>
                <Td>{plan.description}</Td>
                <Td>
                  <IconButton
                    aria-label="Edit Plan"
                    icon={<EditIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleOpenModal(plan)}
                    mr={2}
                  />
                  <IconButton
                    aria-label="Delete Plan"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedPlan ? 'Edit Plan' : 'Create Plan'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="name" mb={4} isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Plan Name"
              />
            </FormControl>
            <FormControl id="price" mb={4} isRequired>
              <FormLabel>Price</FormLabel>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Plan Price"
              />
            </FormControl>
            <FormControl id="description" mb={4}>
              <FormLabel>Description</FormLabel>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Plan Description"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={isSubmitting}>
              {selectedPlan ? 'Update' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default PlansPage;