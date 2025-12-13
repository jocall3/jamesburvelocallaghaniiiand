import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Flex,
  Tooltip,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import {
  MdEvent,
  MdPlayArrow,
  MdPause,
  MdCancel,
  MdUpdate,
  MdRefresh,
  MdPayment,
  MdCheckCircle,
  MdError,
  MdInfo,
} from 'react-icons/md';
import { FaStripeS } from 'react-icons/fa';
import moment from 'moment';

// Define the structure for a subscription event
interface SubscriptionEvent {
  id: string;
  type: string; // e.g., 'subscription.created', 'subscription.updated', 'invoice.payment_succeeded'
  timestamp: number; // Unix timestamp
  description?: string;
  details?: Record<string, any>; // Raw event data or relevant details
}

// Define the props for the component
interface SubscriptionLifecycleProps {
  subscriptionId: string;
  events: SubscriptionEvent[];
  isLoading?: boolean;
  error?: string | null;
}

const getEventIcon = (eventType: string) => {
  if (eventType.startsWith('subscription.created')) return MdPlayArrow;
  if (eventType.startsWith('subscription.updated')) return MdUpdate;
  if (eventType.startsWith('subscription.deleted') || eventType.startsWith('subscription.canceled')) return MdCancel;
  if (eventType.startsWith('subscription.paused')) return MdPause;
  if (eventType.startsWith('subscription.resumed')) return MdRefresh;
  if (eventType.startsWith('invoice.payment_succeeded')) return MdPayment;
  if (eventType.startsWith('invoice.payment_failed')) return MdError;
  if (eventType.startsWith('customer.subscription.trial_will_end')) return MdInfo;
  if (eventType.startsWith('charge.succeeded')) return MdCheckCircle;
  return MdEvent; // Default icon
};

const getEventColor = (eventType: string) => {
  if (eventType.startsWith('subscription.created')) return 'green.500';
  if (eventType.startsWith('subscription.deleted') || eventType.startsWith('subscription.canceled')) return 'red.500';
  if (eventType.startsWith('invoice.payment_succeeded') || eventType.startsWith('charge.succeeded')) return 'teal.500';
  if (eventType.startsWith('invoice.payment_failed')) return 'orange.500';
  return 'blue.500'; // Default color
};

const getEventDescription = (event: SubscriptionEvent) => {
  if (event.description) return event.description;

  switch (event.type) {
    case 'subscription.created':
      return `Subscription created. Plan: ${event.details?.items?.data?.[0]?.plan?.nickname || 'N/A'}`;
    case 'subscription.updated':
      return `Subscription updated. Status: ${event.details?.status || 'N/A'}`;
    case 'subscription.deleted':
    case 'subscription.canceled':
      return `Subscription cancelled. Reason: ${event.details?.cancellation_details?.reason || 'N/A'}`;
    case 'subscription.paused':
      return `Subscription paused.`;
    case 'subscription.resumed':
      return `Subscription resumed.`;
    case 'invoice.payment_succeeded':
      return `Payment succeeded for invoice ${event.details?.id}. Amount: ${event.details?.amount_due ? `$${(event.details.amount_due / 100).toFixed(2)}` : 'N/A'}`;
    case 'invoice.payment_failed':
      return `Payment failed for invoice ${event.details?.id}. Reason: ${event.details?.last_payment_error?.message || 'N/A'}`;
    case 'customer.subscription.trial_will_end':
      return `Trial period ending soon.`;
    case 'charge.succeeded':
      return `Charge succeeded for amount: ${event.details?.amount ? `$${(event.details.amount / 100).toFixed(2)}` : 'N/A'}`;
    default:
      return event.type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }
};

const SubscriptionLifecycle: React.FC<SubscriptionLifecycleProps> = ({
  subscriptionId,
  events,
  isLoading,
  error,
}) => {
  const timelineBg = useColorModeValue('white', 'gray.700');
  const timelineBorder = useColorModeValue('gray.200', 'gray.600');
  const eventBg = useColorModeValue('gray.50', 'gray.600');
  const eventBorder = useColorModeValue('gray.100', 'gray.500');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
        <Text ml={4} fontSize="lg">Loading subscription events...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.100" color="red.700" borderRadius="md">
        <Text fontWeight="bold">Error loading events:</Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Box p={4} bg={eventBg} borderRadius="md" textAlign="center">
        <Text fontSize="lg" color={secondaryTextColor}>No events found for this subscription yet.</Text>
      </Box>
    );
  }

  // Sort events by timestamp in ascending order
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Box
      p={6}
      bg={timelineBg}
      borderRadius="lg"
      boxShadow="lg"
      borderWidth="1px"
      borderColor={timelineBorder}
      maxW="container.md"
      mx="auto"
    >
      <HStack mb={6} spacing={3} alignItems="center">
        <Icon as={FaStripeS} w={8} h={8} color="purple.500" />
        <Text fontSize="2xl" fontWeight="bold" color={textColor}>
          Subscription Lifecycle
        </Text>
        <Badge colorScheme="purple" variant="solid" px={3} py={1} borderRadius="full">
          ID: {subscriptionId}
        </Badge>
      </HStack>

      <VStack spacing={0} align="stretch" position="relative">
        {/* Vertical line for the timeline */}
        <Box
          position="absolute"
          left="20px"
          top="0"
          bottom="0"
          width="2px"
          bg={timelineBorder}
          zIndex={0}
        />

        {sortedEvents.map((event, index) => {
          const EventIcon = getEventIcon(event.type);
          const eventColor = getEventColor(event.type);
          const eventDescription = getEventDescription(event);

          return (
            <HStack key={event.id} spacing={4} align="flex-start" position="relative" zIndex={1} py={3}>
              {/* Timeline dot */}
              <Flex
                flexShrink={0}
                w="40px"
                h="40px"
                borderRadius="full"
                bg={eventColor}
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
                border="2px solid"
                borderColor={timelineBg}
              >
                <Icon as={EventIcon} color="white" w={5} h={5} />
              </Flex>

              {/* Event details */}
              <Box
                flexGrow={1}
                p={4}
                bg={eventBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={eventBorder}
                boxShadow="sm"
                _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s ease-in-out"
              >
                <HStack justifyContent="space-between" mb={1}>
                  <Text fontWeight="bold" fontSize="md" color={textColor}>
                    {eventDescription}
                  </Text>
                  <Tooltip label={moment.unix(event.timestamp).format('LLL')} placement="top">
                    <Text fontSize="sm" color={secondaryTextColor}>
                      {moment.unix(event.timestamp).fromNow()}
                    </Text>
                  </Tooltip>
                </HStack>
                <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                  Type: <Badge colorScheme="blue" variant="outline">{event.type}</Badge>
                </Text>
                {event.details && Object.keys(event.details).length > 0 && (
                  <Tooltip label={<pre>{JSON.stringify(event.details, null, 2)}</pre>} placement="bottom" hasArrow>
                    <Text fontSize="xs" color={secondaryTextColor} cursor="help" textDecoration="underline dotted">
                      View raw details...
                    </Text>
                  </Tooltip>
                )}
              </Box>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default SubscriptionLifecycle;