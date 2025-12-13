import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Stack,
  Text,
  Heading,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Modal,
  TextField,
  Select,
  SelectItem,
  CodeEditor,
  IconButton,
  Icon,
  Spinner,
  Pagination,
  Alert,
  Tooltip,
  useToast,
} from '@stripe/ui-extension-sdk/ui';
import { useStripe } from '@stripe/ui-extension-sdk/sdk'; // Assuming we might need this for future API calls

// --- Mock Data & Types ---
interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  enabledEvents: string[];
  secret: string;
  status: 'enabled' | 'disabled';
  createdAt: number;
  lastUpdated: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  timestamp: number;
  status: 'succeeded' | 'failed' | 'pending';
  endpointId: string;
  endpointUrl: string;
  deliveryAttempts: {
    timestamp: number;
    status: 'succeeded' | 'failed' | 'pending';
    responseCode?: number;
    responseBody?: string;
    requestBody?: string;
  }[];
  payload: Record<string, any>;
}

const MOCK_WEBHOOK_ENDPOINTS: WebhookEndpoint[] = [
  {
    id: 'wh_1',
    url: 'https://example.com/webhook-listener-1',
    description: 'Main production webhook',
    enabledEvents: ['charge.succeeded', 'customer.created'],
    secret: 'whsec_test_secret_1',
    status: 'enabled',
    createdAt: Date.now() - 86400000 * 5,
    lastUpdated: Date.now() - 86400000 * 2,
  },
  {
    id: 'wh_2',
    url: 'https://example.com/dev-webhook',
    description: 'Development environment webhook',
    enabledEvents: ['*'],
    secret: 'whsec_test_secret_2',
    status: 'disabled',
    createdAt: Date.now() - 86400000 * 10,
    lastUpdated: Date.now() - 86400000 * 7,
  },
];

const MOCK_WEBHOOK_EVENTS: WebhookEvent[] = [
  {
    id: 'evt_1',
    type: 'charge.succeeded',
    timestamp: Date.now() - 3600000,
    status: 'succeeded',
    endpointId: 'wh_1',
    endpointUrl: 'https://example.com/webhook-listener-1',
    deliveryAttempts: [
      {
        timestamp: Date.now() - 3600000,
        status: 'succeeded',
        responseCode: 200,
        responseBody: 'OK',
        requestBody: JSON.stringify({ id: 'ch_1', amount: 1000, currency: 'usd' }, null, 2),
      },
    ],
    payload: { id: 'ch_1', object: 'charge', amount: 1000, currency: 'usd', status: 'succeeded' },
  },
  {
    id: 'evt_2',
    type: 'customer.created',
    timestamp: Date.now() - 7200000,
    status: 'failed',
    endpointId: 'wh_1',
    endpointUrl: 'https://example.com/webhook-listener-1',
    deliveryAttempts: [
      {
        timestamp: Date.now() - 7200000,
        status: 'failed',
        responseCode: 500,
        responseBody: 'Internal Server Error',
        requestBody: JSON.stringify({ id: 'cus_1', email: 'test@example.com' }, null, 2),
      },
      {
        timestamp: Date.now() - 7100000,
        status: 'failed',
        responseCode: 400,
        responseBody: 'Bad Request',
        requestBody: JSON.stringify({ id: 'cus_1', email: 'test@example.com' }, null, 2),
      },
    ],
    payload: { id: 'cus_1', object: 'customer', email: 'test@example.com' },
  },
  {
    id: 'evt_3',
    type: 'charge.failed',
    timestamp: Date.now() - 10800000,
    status: 'succeeded',
    endpointId: 'wh_2',
    endpointUrl: 'https://example.com/dev-webhook',
    deliveryAttempts: [
      {
        timestamp: Date.now() - 10800000,
        status: 'succeeded',
        responseCode: 200,
        responseBody: 'OK',
        requestBody: JSON.stringify({ id: 'ch_2', amount: 500, currency: 'usd' }, null, 2),
      },
    ],
    payload: { id: 'ch_2', object: 'charge', amount: 500, currency: 'usd', status: 'failed' },
  },
  {
    id: 'evt_4',
    type: 'payment_intent.succeeded',
    timestamp: Date.now() - 1200000,
    status: 'pending',
    endpointId: 'wh_1',
    endpointUrl: 'https://example.com/webhook-listener-1',
    deliveryAttempts: [],
    payload: { id: 'pi_1', object: 'payment_intent', amount: 2000, currency: 'usd' },
  },
];

const ALL_STRIPE_EVENTS = [
  'account.updated', 'charge.succeeded', 'charge.failed', 'customer.created',
  'customer.deleted', 'customer.updated', 'invoice.paid', 'payment_intent.succeeded',
  'payment_intent.failed', 'checkout.session.completed', '*'
];

// --- Helper Functions ---
const formatTimestamp = (timestamp: number) => new Date(timestamp).toLocaleString();
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'enabled':
    case 'succeeded':
      return 'green';
    case 'disabled':
    case 'failed':
      return 'red';
    case 'pending':
      return 'yellow';
    default:
      return 'gray';
  }
};

// --- Main Page Component ---
const WebhooksPage: React.FC = () => {
  const stripe = useStripe(); // Initialize Stripe SDK (if needed for future API calls)
  const toast = useToast();

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  // Pagination for events
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10); // Number of events per page

  useEffect(() => {
    // Simulate fetching data
    setLoading(true);
    setTimeout(() => {
      setEndpoints(MOCK_WEBHOOK_ENDPOINTS);
      setEvents(MOCK_WEBHOOK_EVENTS.sort((a, b) => b.timestamp - a.timestamp)); // Sort by newest first
      setLoading(false);
    }, 500);
  }, []);

  // Calculate current events for pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(events.length / eventsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleAddEndpoint = () => {
    setEditingEndpoint(null);
    setShowAddEditModal(true);
  };

  const handleEditEndpoint = (endpoint: WebhookEndpoint) => {
    setEditingEndpoint(endpoint);
    setShowAddEditModal(true);
  };

  const handleDeleteEndpoint = (endpointId: string) => {
    if (window.confirm('Are you sure you want to delete this webhook endpoint?')) {
      setEndpoints(prev => prev.filter(ep => ep.id !== endpointId));
      toast({
        title: 'Endpoint Deleted',
        description: `Webhook endpoint ${endpointId} has been deleted.`,
        type: 'success',
      });
    }
  };

  const handleSaveEndpoint = (endpoint: WebhookEndpoint) => {
    if (editingEndpoint) {
      setEndpoints(prev => prev.map(ep => (ep.id === endpoint.id ? endpoint : ep)));
      toast({
        title: 'Endpoint Updated',
        description: `Webhook endpoint ${endpoint.url} has been updated.`,
        type: 'success',
      });
    } else {
      setEndpoints(prev => [...prev, { ...endpoint, id: `wh_${Date.now()}`, createdAt: Date.now(), lastUpdated: Date.now() }]);
      toast({
        title: 'Endpoint Created',
        description: `New webhook endpoint ${endpoint.url} has been created.`,
        type: 'success',
      });
    }
    setShowAddEditModal(false);
    setEditingEndpoint(null);
  };

  const handleViewEventDetails = (event: WebhookEvent) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const handleResendEvent = (eventId: string) => {
    if (window.confirm(`Are you sure you want to resend event ${eventId}?`)) {
      // Simulate resend logic
      setEvents(prev =>
        prev.map(evt =>
          evt.id === eventId
            ? {
                ...evt,
                status: 'pending', // Set to pending, then simulate success/failure
                deliveryAttempts: [
                  ...evt.deliveryAttempts,
                  {
                    timestamp: Date.now(),
                    status: 'pending',
                    responseCode: undefined,
                    responseBody: undefined,
                    requestBody: evt.deliveryAttempts[0]?.requestBody || JSON.stringify(evt.payload, null, 2),
                  },
                ],
              }
            : evt
        )
      );
      toast({
        title: 'Event Resent',
        description: `Event ${eventId} has been queued for resending.`,
        type: 'info',
      });

      // Simulate delivery attempt after a short delay
      setTimeout(() => {
        setEvents(prev =>
          prev.map(evt => {
            if (evt.id === eventId) {
              const lastAttempt = evt.deliveryAttempts[evt.deliveryAttempts.length - 1];
              if (lastAttempt && lastAttempt.status === 'pending') {
                const success = Math.random() > 0.3; // 70% chance of success
                return {
                  ...evt,
                  status: success ? 'succeeded' : 'failed',
                  deliveryAttempts: evt.deliveryAttempts.map((attempt, index) =>
                    index === evt.deliveryAttempts.length - 1
                      ? {
                          ...attempt,
                          status: success ? 'succeeded' : 'failed',
                          responseCode: success ? 200 : 500,
                          responseBody: success ? 'OK' : 'Simulated Error',
                        }
                      : attempt
                  ),
                };
              }
            }
            return evt;
          })
        );
        toast({
          title: 'Resend Complete',
          description: `Event ${eventId} resend attempt finished.`,
          type: 'success', // or 'error' based on actual result
        });
      }, 2000);
    }
  };

  if (loading) {
    return (
      <Box padding="xl" align="center">
        <Spinner />
        <Text>Loading webhook data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="xl">
        <Alert type="critical" title="Error loading data">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box padding="xl">
      <Stack spacing="xl">
        <Heading level={1}>Webhook Endpoints</Heading>

        <Box>
          <Stack direction="row" justify="space-between" align="center" spacing="md">
            <Text variant="body">Manage your webhook endpoints to receive real-time event notifications from Stripe.</Text>
            <Button type="primary" onClick={handleAddEndpoint}>
              <Icon name="add" /> Add Endpoint
            </Button>
          </Stack>

          {endpoints.length === 0 ? (
            <Alert type="info" title="No Webhook Endpoints Configured">
              Click "Add Endpoint" to get started.
            </Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>URL</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Events</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Last Updated</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {endpoints.map(endpoint => (
                  <TableRow key={endpoint.id}>
                    <TableCell>
                      <Text>{endpoint.url}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{endpoint.description || '-'}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{endpoint.enabledEvents.includes('*') ? 'All events' : endpoint.enabledEvents.join(', ')}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusBadgeColor(endpoint.status)}>{endpoint.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Text>{formatTimestamp(endpoint.lastUpdated)}</Text>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing="sm" justify="flex-end">
                        <Tooltip content="Edit Endpoint">
                          <IconButton onClick={() => handleEditEndpoint(endpoint)}>
                            <Icon name="edit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Delete Endpoint">
                          <IconButton onClick={() => handleDeleteEndpoint(endpoint.id)} variant="destructive">
                            <Icon name="delete" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>

        <Heading level={2}>Event Delivery History</Heading>
        <Text variant="body">View the history of events delivered to your webhook endpoints and resend failed events.</Text>

        {events.length === 0 ? (
          <Alert type="info" title="No Event Delivery History">
            Events will appear here once they are sent to your configured endpoints.
          </Alert>
        ) : (
          <Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Event ID</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Endpoint</TableHeaderCell>
                  <TableHeaderCell>Timestamp</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Text>{event.id}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{event.type}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{event.endpointUrl}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatTimestamp(event.timestamp)}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusBadgeColor(event.status)}>{event.status}</Badge>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing="sm" justify="flex-end">
                        <Tooltip content="View Details">
                          <IconButton onClick={() => handleViewEventDetails(event)}>
                            <Icon name="eye" />
                          </IconButton>
                        </Tooltip>
                        {event.status === 'failed' && (
                          <Tooltip content="Resend Event">
                            <IconButton onClick={() => handleResendEvent(event.id)}>
                              <Icon name="refresh" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box marginTop="md" align="center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </Box>
          </Box>
        )}
      </Stack>

      {/* Add/Edit Webhook Endpoint Modal */}
      <AddEditWebhookEndpointModal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        onSave={handleSaveEndpoint}
        initialData={editingEndpoint}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={showEventDetailsModal}
        onClose={() => setShowEventDetailsModal(false)}
        event={selectedEvent}
        onResend={handleResendEvent}
      />
    </Box>
  );
};

// --- Add/Edit Webhook Endpoint Modal Component ---
interface AddEditWebhookEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (endpoint: WebhookEndpoint) => void;
  initialData: WebhookEndpoint | null;
}

const AddEditWebhookEndpointModal: React.FC<AddEditWebhookEndpointModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [url, setUrl] = useState(initialData?.url || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(initialData?.enabledEvents || ['*']);
  const [secret, setSecret] = useState(initialData?.secret || '');
  const [status, setStatus] = useState<'enabled' | 'disabled'>(initialData?.status || 'enabled');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setUrl(initialData?.url || '');
      setDescription(initialData?.description || '');
      setSelectedEvents(initialData?.enabledEvents || ['*']);
      setSecret(initialData?.secret || '');
      setStatus(initialData?.status || 'enabled');
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!url.trim()) {
      newErrors.url = 'URL is required.';
    } else if (!/^https?:\/\/.+/.test(url)) {
      newErrors.url = 'Please enter a valid URL (must start with http:// or https://).';
    }
    if (!secret.trim()) {
      newErrors.secret = 'Secret is required.';
    }
    if (selectedEvents.length === 0) {
      newErrors.events = 'At least one event must be selected.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const newEndpoint: WebhookEndpoint = {
      id: initialData?.id || '', // ID will be generated by parent if new
      url,
      description: description || undefined,
      enabledEvents: selectedEvents,
      secret,
      status,
      createdAt: initialData?.createdAt || Date.now(),
      lastUpdated: Date.now(),
    };
    onSave(newEndpoint);
  };

  const handleEventSelectChange = (value: string[]) => {
    if (value.includes('*') && selectedEvents.includes('*')) {
      // If '*' was already selected and is still selected, do nothing
      setSelectedEvents(['*']);
    } else if (value.includes('*') && !selectedEvents.includes('*')) {
      // If '*' is newly selected, clear others
      setSelectedEvents(['*']);
    } else if (!value.includes('*') && selectedEvents.includes('*')) {
      // If '*' was selected but is now deselected, remove it
      setSelectedEvents(value.filter(e => e !== '*'));
    } else {
      setSelectedEvents(value);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Webhook Endpoint' : 'Add New Webhook Endpoint'}
      actions={
        <Stack direction="row" spacing="md">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} type="primary">
            {initialData ? 'Save Changes' : 'Add Endpoint'}
          </Button>
        </Stack>
      }
    >
      <Stack spacing="lg">
        <TextField
          label="Endpoint URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="e.g., https://your-domain.com/stripe-webhook"
          required
          error={errors.url}
          description="Stripe will send event notifications to this URL."
        />
        <TextField
          label="Description (Optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g., Production server webhook"
          description="A short description to help you identify this endpoint."
        />
        <Select
          label="Events to send"
          value={selectedEvents}
          onValueChange={handleEventSelectChange}
          placeholder="Select events"
          multiple
          required
          error={errors.events}
          description="Choose which events Stripe should send to this endpoint. Select '*' for all events."
        >
          {ALL_STRIPE_EVENTS.map(event => (
            <SelectItem key={event} value={event}>
              {event}
            </SelectItem>
          ))}
        </Select>
        <TextField
          label="Signing Secret"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          placeholder="e.g., whsec_..."
          required
          error={errors.secret}
          description="Used to verify that events are from Stripe. Keep this secret secure."
          type="password"
        />
        <Select
          label="Status"
          value={status}
          onValueChange={value => setStatus(value as 'enabled' | 'disabled')}
          required
          description="Enable or disable this webhook endpoint."
        >
          <SelectItem value="enabled">Enabled</SelectItem>
          <SelectItem value="disabled">Disabled</SelectItem>
        </Select>
      </Stack>
    </Modal>
  );
};

// --- Event Details Modal Component ---
interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: WebhookEvent | null;
  onResend: (eventId: string) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onResend,
}) => {
  if (!event) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Event Details: ${event.id}`}
      actions={
        <Stack direction="row" spacing="md">
          {event.status === 'failed' && (
            <Button onClick={() => { onResend(event.id); onClose(); }} type="primary">
              Resend Event
            </Button>
          )}
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </Stack>
      }
    >
      <Stack spacing="lg">
        <Stack direction="row" spacing="xl">
          <Box>
            <Text variant="caption">Event Type</Text>
            <Text>{event.type}</Text>
          </Box>
          <Box>
            <Text variant="caption">Status</Text>
            <Badge color={getStatusBadgeColor(event.status)}>{event.status}</Badge>
          </Box>
          <Box>
            <Text variant="caption">Endpoint</Text>
            <Text>{event.endpointUrl}</Text>
          </Box>
          <Box>
            <Text variant="caption">Timestamp</Text>
            <Text>{formatTimestamp(event.timestamp)}</Text>
          </Box>
        </Stack>

        <Box>
          <Text variant="caption">Event Payload</Text>
          <CodeEditor
            language="json"
            value={JSON.stringify(event.payload, null, 2)}
            readOnly
            height="200px"
          />
        </Box>

        <Box>
          <Text variant="caption">Delivery Attempts ({event.deliveryAttempts.length})</Text>
          {event.deliveryAttempts.length === 0 ? (
            <Text variant="body">No delivery attempts recorded yet.</Text>
          ) : (
            <Stack spacing="md">
              {event.deliveryAttempts.map((attempt, index) => (
                <Box key={index} border="neutral" borderRadius="md" padding="md">
                  <Stack direction="row" spacing="lg" align="center">
                    <Text variant="bodyStrong">Attempt {index + 1}</Text>
                    <Badge color={getStatusBadgeColor(attempt.status)}>{attempt.status}</Badge>
                    <Text variant="caption">{formatTimestamp(attempt.timestamp)}</Text>
                    {attempt.responseCode && (
                      <Text variant="caption">HTTP {attempt.responseCode}</Text>
                    )}
                  </Stack>
                  {attempt.requestBody && (
                    <Box marginTop="sm">
                      <Text variant="caption">Request Body:</Text>
                      <CodeEditor
                        language="json"
                        value={attempt.requestBody}
                        readOnly
                        height="100px"
                      />
                    </Box>
                  )}
                  {attempt.responseBody && (
                    <Box marginTop="sm">
                      <Text variant="caption">Response Body:</Text>
                      <CodeEditor
                        language="json"
                        value={attempt.responseBody}
                        readOnly
                        height="100px"
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Modal>
  );
};

export default WebhooksPage;