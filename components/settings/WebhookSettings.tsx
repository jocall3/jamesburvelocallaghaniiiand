import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Text,
  Box,
  Flex,
  Spacer,
  IconButton,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
}

const WebhookSettings: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState('');
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Simulate fetching webhooks from an API
  useEffect(() => {
    // In a real application, you would fetch this data from your backend
    const fetchedWebhooks: Webhook[] = [
      { id: 'wh_123', url: 'https://example.com/webhook/ad90/1', events: ['user.created', 'user.updated'], isActive: true },
      { id: 'wh_456', url: 'https://example.com/webhook/ad90/2', events: ['subscription.created'], isActive: false },
    ];
    setWebhooks(fetchedWebhooks);
  }, []);

  const handleAddWebhook = () => {
    if (!newWebhookUrl.trim()) return;

    const newWebhook: Webhook = {
      id: `wh_${Date.now()}`, // Simple ID generation for demo
      url: newWebhookUrl,
      events: newWebhookEvents.split(',').map(e => e.trim()).filter(e => e),
      isActive: true, // Default to active
    };

    setWebhooks([...webhooks, newWebhook]);
    setNewWebhookUrl('');
    setNewWebhookEvents('');
    onClose();
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setNewWebhookUrl(webhook.url);
    setNewWebhookEvents(webhook.events.join(', '));
    onOpen();
  };

  const handleUpdateWebhook = () => {
    if (!editingWebhook || !newWebhookUrl.trim()) return;

    const updatedWebhooks = webhooks.map(wh =>
      wh.id === editingWebhook.id
        ? {
            ...wh,
            url: newWebhookUrl,
            events: newWebhookEvents.split(',').map(e => e.trim()).filter(e => e),
          }
        : wh
    );
    setWebhooks(updatedWebhooks);
    setEditingWebhook(null);
    setNewWebhookUrl('');
    setNewWebhookEvents('');
    onClose();
  };

  const handleDeleteWebhook = (id: string) => {
    // In a real app, you'd confirm deletion and call an API
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks(webhooks.filter(wh => wh.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    const updatedWebhooks = webhooks.map(wh =>
      wh.id === id ? { ...wh, isActive: !wh.isActive } : wh
    );
    setWebhooks(updatedWebhooks);
    // In a real app, you'd call an API to update the status
  };

  const handleModalClose = () => {
    setEditingWebhook(null);
    setNewWebhookUrl('');
    setNewWebhookEvents('');
    onClose();
  };

  return (
    <Card>
      <CardHeader>
        <Flex alignItems="center">
          <Text fontSize="xl" fontWeight="bold">Webhook Settings (AD90)</Text>
          <Spacer />
          <Button colorScheme="blue" onClick={() => { setEditingWebhook(null); setNewWebhookUrl(''); setNewWebhookEvents(''); onOpen(); }}>
            Add New Webhook
          </Button>
        </Flex>
      </CardHeader>
      <CardBody>
        {webhooks.length === 0 ? (
          <Text>No webhooks configured yet. Click "Add New Webhook" to get started.</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>URL</Th>
                <Th>Events</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {webhooks.map(webhook => (
                <Tr key={webhook.id}>
                  <Td>{webhook.url}</Td>
                  <Td>
                    {webhook.events.length > 0 ? (
                      <Box>
                        {webhook.events.map((event, index) => (
                          <Text key={index} as="span" mr={2} fontSize="sm" color="gray.600">{event}</Text>
                        ))}
                      </Box>
                    ) : (
                      <Text fontSize="sm" color="gray.500">None</Text>
                    )}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme={webhook.isActive ? 'green' : 'gray'}
                      onClick={() => handleToggleActive(webhook.id)}
                    >
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Button>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Edit webhook"
                      icon={<EditIcon />}
                      size="sm"
                      mr={2}
                      onClick={() => handleEditWebhook(webhook)}
                      colorScheme="yellow"
                    />
                    <IconButton
                      aria-label="Delete webhook"
                      icon={<DeleteIcon />}
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      colorScheme="red"
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>

      <Modal isOpen={isOpen} onClose={handleModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Webhook URL (e.g., https://your-domain.com/api/webhook)"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              mb={4}
            />
            <Input
              placeholder="Events (comma-separated, e.g., user.created, subscription.updated)"
              value={newWebhookEvents}
              onChange={(e) => setNewWebhookEvents(e.target.value)}
              mb={4}
            />
            <Text fontSize="sm" color="gray.500">
              Common events include: user.created, user.updated, subscription.created, subscription.cancelled, payment.succeeded.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={editingWebhook ? handleUpdateWebhook : handleAddWebhook}
              isLoading={isModalLoading}
              isDisabled={!newWebhookUrl.trim()}
            >
              {editingWebhook ? 'Update Webhook' : 'Add Webhook'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default WebhookSettings;