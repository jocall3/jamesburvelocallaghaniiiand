import { useState, useEffect } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Flex,
  Heading,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Text,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  createdAt: string;
}

const AdminTenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSubdomain, setNewTenantSubdomain] = useState('');
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // In a real application, you would fetch this data from an API
    const mockTenants: Tenant[] = [
      {
        id: 'tenant-1',
        name: 'App Alpha',
        subdomain: 'alpha',
        isActive: true,
        createdAt: '2023-01-15T10:00:00Z',
      },
      {
        id: 'tenant-2',
        name: 'App Beta',
        subdomain: 'beta',
        isActive: false,
        createdAt: '2023-02-20T11:30:00Z',
      },
      {
        id: 'tenant-3',
        name: 'App Gamma',
        subdomain: 'gamma',
        isActive: true,
        createdAt: '2023-03-10T09:15:00Z',
      },
    ];
    setTenants(mockTenants);
  }, []);

  const handleAddTenant = () => {
    if (!newTenantName || !newTenantSubdomain) {
      toast({
        title: 'Error',
        description: 'Tenant name and subdomain are required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`, // Simple ID generation for mock
      name: newTenantName,
      subdomain: newTenantSubdomain,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setTenants([...tenants, newTenant]);
    setNewTenantName('');
    setNewTenantSubdomain('');
    toast({
      title: 'Success',
      description: `Tenant "${newTenant.name}" created successfully.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setNewTenantName(tenant.name);
    setNewTenantSubdomain(tenant.subdomain);
    setIsModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTenant || !newTenantName || !newTenantSubdomain) {
      toast({
        title: 'Error',
        description: 'Tenant name and subdomain are required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setTenants(
      tenants.map((t) =>
        t.id === editingTenant.id
          ? { ...t, name: newTenantName, subdomain: newTenantSubdomain }
          : t
      )
    );

    toast({
      title: 'Success',
      description: `Tenant "${newTenantName}" updated successfully.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    handleCloseModal();
  };

  const handleDeleteTenant = (tenantId: string) => {
    // In a real app, you'd have a confirmation modal here
    setTenants(tenants.filter((t) => t.id !== tenantId));
    toast({
      title: 'Success',
      description: 'Tenant deleted successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleToggleActive = (tenantId: string) => {
    setTenants(
      tenants.map((t) =>
        t.id === tenantId ? { ...t, isActive: !t.isActive } : t
      )
    );
    toast({
      title: 'Success',
      description: 'Tenant status updated.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
    setNewTenantName('');
    setNewTenantSubdomain('');
  };

  return (
    <Flex direction="column" p={8} minH="100vh" bg="gray.50">
      <Heading as="h1" size="xl" mb={6} color="gray.700">
        Manage Tenants
      </Heading>

      <Flex mb={6} align="center" justify="space-between">
        <Flex gap={4}>
          <Input
            placeholder="New Tenant Name"
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            bg="white"
          />
          <Input
            placeholder="New Tenant Subdomain"
            value={newTenantSubdomain}
            onChange={(e) => setNewTenantSubdomain(e.target.value)}
            bg="white"
          />
          <Button
            leftIcon={<FaPlus />}
            colorScheme="teal"
            onClick={handleAddTenant}
          >
            Add Tenant
          </Button>
        </Flex>
      </Flex>

      <Table variant="simple" bg="white" boxShadow="sm" borderRadius="md">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Subdomain</Th>
            <Th>Status</Th>
            <Th>Created At</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tenants.map((tenant) => (
            <Tr key={tenant.id}>
              <Td>{tenant.name}</Td>
              <Td>{tenant.subdomain}</Td>
              <Td>
                <Button
                  size="sm"
                  colorScheme={tenant.isActive ? 'green' : 'red'}
                  onClick={() => handleToggleActive(tenant.id)}
                >
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </Button>
              </Td>
              <Td>{new Date(tenant.createdAt).toLocaleDateString()}</Td>
              <Td>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<FaEdit />}
                    onClick={() => handleEditTenant(tenant)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    leftIcon={<FaTrash />}
                    onClick={() => handleDeleteTenant(tenant.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Edit Tenant Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Tenant: {editingTenant?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Tenant Name</FormLabel>
              <Input
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="Tenant Name"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Tenant Subdomain</FormLabel>
              <Input
                value={newTenantSubdomain}
                onChange={(e) => setNewTenantSubdomain(e.target.value)}
                placeholder="Tenant Subdomain"
              />
            </FormControl>
            <Text fontSize="sm" color="gray.500">
              Tenant ID: {editingTenant?.id}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Created At: {editingTenant?.createdAt ? new Date(editingTenant.createdAt).toLocaleString() : ''}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default AdminTenantsPage;