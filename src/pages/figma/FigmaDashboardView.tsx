import React from 'react';
import { Box, Heading, Text, VStack, SimpleGrid, Card, CardHeader, CardBody, Flex, Spacer, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const FigmaDashboardView: React.FC = () => {
  return (
    <Box p={8}>
      <Flex mb={8} align="center">
        <Heading as="h1" size="xl">Figma Integration Dashboard</Heading>
        <Spacer />
        <Button as={RouterLink} to="/figma/settings" colorScheme="blue">
          Settings
        </Button>
      </Flex>

      <Text fontSize="lg" mb={6}>
        Welcome to your Figma integration dashboard! Here you can manage your Figma files, projects, components, and webhooks.
      </Text>

      <VStack spacing={8} align="stretch">
        <Card>
          <CardHeader>
            <Heading as="h2" size="md">Quick Actions</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Button as={RouterLink} to="/figma/files" colorScheme="purple">Browse Files</Button>
              <Button as={RouterLink} to="/figma/projects" colorScheme="teal">View Projects</Button>
              <Button as={RouterLink} to="/figma/components" colorScheme="orange">Manage Components</Button>
              <Button as={RouterLink} to="/figma/webhooks" colorScheme="pink">Configure Webhooks</Button>
              <Button as={RouterLink} to="/figma/activity-logs" colorScheme="green">Check Activity Logs</Button>
              <Button as={RouterLink} to="/figma/variables" colorScheme="cyan">Manage Variables</Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading as="h2" size="md">Recent Files</Heading>
          </CardHeader>
          <CardBody>
            <Text>Display a list of recently accessed Figma files here. (e.g., fetch from API: `GET /v1/projects/{project_id}/files` after getting projects from `GET /v1/teams/{team_id}/projects`)</Text>
            {/* Placeholder for recent files list */}
            <Box mt={4} p={3} borderWidth="1px" borderRadius="lg" bg="gray.50">
              <Text fontSize="sm" color="gray.600">File 1: Design System v2.0</Text>
              <Text fontSize="sm" color="gray.600">File 2: Marketing Landing Page</Text>
              <Text fontSize="sm" color="gray.600">File 3: Mobile App Wireframes</Text>
            </Box>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading as="h2" size="md">Team Components Overview</Heading>
          </CardHeader>
          <CardBody>
            <Text>Summarize component usage and activity across your teams. (e.g., fetch from API: `GET /v1/teams/{team_id}/components`)</Text>
            {/* Placeholder for component overview */}
            <Box mt={4} p={3} borderWidth="1px" borderRadius="lg" bg="gray.50">
              <Text fontSize="sm" color="gray.600">Total Components: 150</Text>
              <Text fontSize="sm" color="gray.600">Recently Published: Button v3.0, Input Field</Text>
            </Box>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading as="h2" size="md">Webhook Status</Heading>
          </CardHeader>
          <CardBody>
            <Text>Monitor the status of your active webhooks and any recent failures. (e.g., fetch from API: `GET /v2/webhooks`)</Text>
            {/* Placeholder for webhook status */}
            <Box mt={4} p={3} borderWidth="1px" borderRadius="lg" bg="gray.50">
              <Text fontSize="sm" color="gray.600">Webhook "File Updates" - Active</Text>
              <Text fontSize="sm" color="gray.600">Webhook "Comment Notifications" - Active (last error: 2 days ago)</Text>
            </Box>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading as="h2" size="md">User Profile</Heading>
          </CardHeader>
          <CardBody>
            <Text>Details about the currently authenticated user. (e.g., fetch from API: `GET /v1/me`)</Text>
            {/* Placeholder for user profile */}
            <Box mt={4} p={3} borderWidth="1px" borderRadius="lg" bg="gray.50">
              <Text fontSize="sm" color="gray.600">Handle: JaneDoe</Text>
              <Text fontSize="sm" color="gray.600">Email: jane.doe@example.com</Text>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default FigmaDashboardView;