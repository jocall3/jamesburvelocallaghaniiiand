import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Text,
} from '@chakra-ui/react';

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: string; // Assuming a 'role' field for admin checks
  createdAt: Date;
  updatedAt: Date;
}

const AdminUsersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Check if the user is an admin
      // This is a simplified check. In a real app, you'd likely fetch user role from API
      // or have a more robust authentication/authorization mechanism.
      // For demonstration, assuming 'admin' role is available in session or fetched.
      // If you don't have a role field, you'd need to implement it.
      // Example: if (session.user.role !== 'admin') { router.push('/unauthorized'); }
      fetchUsers();
    }
  }, [status, router]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view this page.');
          router.push('/unauthorized'); // Redirect to an unauthorized page
          return;
        }
        throw new Error('Failed to fetch users');
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    onClose();
  };

  if (status === 'loading') {
    return (
      <Box textAlign="center" pt={20}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={5}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error loading users!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  // If authenticated but not an admin (assuming role check above failed or wasn't implemented)
  // This part might need adjustment based on your actual admin role check.
  if (session && session.user?.role !== 'admin') {
    return (
      <Box p={5}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have administrative privileges to view this page.</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={6}>
        User Management
      </Heading>

      <FormControl mb={6}>
        <FormLabel htmlFor="search">Search Users</FormLabel>
        <Input
          id="search"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </FormControl>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Table variant="striped" colorScheme="teal">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Created At</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name || 'N/A'}</Td>
                  <Td>{user.email}</Td>
                  <Td>{user.role}</Td>
                  <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <Button size="sm" colorScheme="blue" onClick={() => handleViewDetails(user)}>
                      Details
                    </Button>
                    {/* Add other actions like Edit, Delete, Change Role here */}
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} textAlign="center">
                  No users found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}

      {/* User Details Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>User Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser ? (
              <>
                <Text mb={2}><strong>ID:</strong> {selectedUser.id}</Text>
                <Text mb={2}><strong>Name:</strong> {selectedUser.name || 'N/A'}</Text>
                <Text mb={2}><strong>Email:</strong> {selectedUser.email}</Text>
                <Text mb={2}><strong>Role:</strong> {selectedUser.role}</Text>
                <Text mb={2}><strong>Email Verified:</strong> {selectedUser.emailVerified ? new Date(selectedUser.emailVerified).toLocaleString() : 'No'}</Text>
                <Text mb={2}><strong>Created At:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</Text>
                <Text mb={2}><strong>Updated At:</strong> {new Date(selectedUser.updatedAt).toLocaleString()}</Text>
                {selectedUser.image && (
                  <Box mt={4}>
                    <Text mb={2}><strong>Profile Image:</strong></Text>
                    <img src={selectedUser.image} alt={selectedUser.name || 'User'} style={{ maxWidth: '100px', borderRadius: '8px' }} />
                  </Box>
                )}
              </>
            ) : (
              <Text>Loading user details...</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={handleCloseModal}>
              Close
            </Button>
            {/* Add Edit/Delete buttons here if needed */}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminUsersPage;