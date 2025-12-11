```tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Text,
  VStack,
  useToast,
  Flex,
  Heading,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getFigmaFile,
  getFigmaFileNodes,
  postFigmaWebhook,
  deleteFigmaWebhook,
} from '../../../utils/figmaApi';
import { WebhookV2Event } from '../../../types/figmaTypes';

interface AssetExportRuleFormProps {
  onRuleCreated: () => void;
}

const AssetExportRuleForm: React.FC<AssetExportRuleFormProps> = ({
  onRuleCreated,
}) => {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [fileKey, setFileKey] = useState<string>('');
  const [fileKeyError, setFileKeyError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [nodeIds, setNodeIds] = useState<string>('');
  const [selectedNodes, setSelectedNodes] = useState<
    { nodeId: string; name: string }[]
  >([]);
  const [availableNodes, setAvailableNodes] = useState<
    { nodeId: string; name: string }[]
  >([]);
  const [webhookEndpoint, setWebhookEndpoint] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [selectedEventType, setSelectedEventType] =
    useState<WebhookV2Event>('FILE_UPDATE');
  const [isCreatingWebhook, setIsCreatingWebhook] = useState<boolean>(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [context, setContext] = useState<'TEAM' | 'PROJECT' | 'FILE'>('FILE');
  const [contextId, setContextId] = useState<string>('');

  useEffect(() => {
    const fetchWebhooks = async () => {
      if (!accessToken) return;
      try {
        // Replace with appropriate context and context_id when implementing team/project functionality
        const response = await fetch(
          `https://api.figma.com/v2/webhooks?context=FILE&context_id=${fileKey}`,
          {
            headers: {
              'X-Figma-Token': accessToken,
            },
          }
        );

        if (!response.ok) {
          console.error('Failed to fetch webhooks', response);
          return;
        }

        const data = await response.json();
        setWebhooks(data.webhooks || []);
      } catch (error) {
        console.error('Error fetching webhooks', error);
      }
    };

    if (accessToken && fileKey) {
      fetchWebhooks();
    }
  }, [accessToken, fileKey]);

  const handleFileKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileKey(e.target.value);
    setFileKeyError(null);
  };

  const handleNodeIdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodeIds(e.target.value);
  };

  const handleWebhookEndpointChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWebhookEndpoint(e.target.value);
  };

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasscode(e.target.value);
  };

  const handleEventTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEventType(e.target.value as WebhookV2Event);
  };

  const handleTeamIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamId(e.target.value);
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setContext(e.target.value as 'TEAM' | 'PROJECT' | 'FILE');
  };

  const handleContextIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContextId(e.target.value);
  };

  const fetchFileDetails = async () => {
    if (!accessToken || !fileKey) {
      setFileKeyError('Please enter a file key.');
      return;
    }
    try {
      const fileData = await getFigmaFile(fileKey, accessToken);
      if (fileData && fileData.name) {
        setFileName(fileData.name);
        await fetchNodes();
        toast({
          title: 'File Details Fetched',
          description: `Successfully fetched file: ${fileData.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        setFileKeyError('File not found or access denied.');
        setFileName('');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      setFileKeyError('Failed to fetch file details. Please check your file key.');
      setFileName('');
      toast({
        title: 'Error',
        description: 'Failed to fetch file details.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchNodes = async () => {
    if (!accessToken || !fileKey) {
      return;
    }

    try {
      const nodeResponse = await getFigmaFileNodes(
        fileKey,
        nodeIds,
        accessToken
      );

      if (!nodeResponse || !nodeResponse.nodes) {
        setAvailableNodes([]);
        setSelectedNodes([]);
        toast({
          title: 'No matching nodes found.',
          description: 'Could not find nodes matching the provided IDs.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const nodes = Object.entries(nodeResponse.nodes).map(
        ([nodeId, nodeData]) => ({
          nodeId: nodeId,
          name: nodeData.document.name,
        })
      );

      setAvailableNodes(nodes);
    } catch (error) {
      console.error('Error fetching nodes', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch node details.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNodeSelection = (nodeId: string, name: string) => {
    if (selectedNodes.some((node) => node.nodeId === nodeId)) {
      setSelectedNodes(selectedNodes.filter((node) => node.nodeId !== nodeId));
    } else {
      setSelectedNodes([...selectedNodes, { nodeId, name }]);
    }
  };

  const handleCreateWebhook = async () => {
    if (isCreatingWebhook || !accessToken || !fileKey) {
      return;
    }
    setIsCreatingWebhook(true);

    try {
      const webhookData = {
        event_type: selectedEventType,
        context: context,
        context_id: fileKey, // Use fileKey as contextId
        endpoint: webhookEndpoint,
        passcode: passcode,
      };

      const response = await postFigmaWebhook(webhookData, accessToken);

      if (response) {
        toast({
          title: 'Webhook Created',
          description: 'Successfully created webhook.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onRuleCreated();
        // Refetch webhooks after creation
        // Refetch webhooks after creation
        const fetchWebhooks = async () => {
          try {
            const response = await fetch(
              `https://api.figma.com/v2/webhooks?context=FILE&context_id=${fileKey}`,
              {
                headers: {
                  'X-Figma-Token': accessToken,
                },
              }
            );

            if (!response.ok) {
              console.error('Failed to fetch webhooks');
              return;
            }

            const data = await response.json();
            setWebhooks(data.webhooks || []);
          } catch (error) {
            console.error('Error fetching webhooks', error);
          }
        };

        await fetchWebhooks();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create webhook.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error',
        description:
          'Failed to create webhook. Please check your endpoint and passcode.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!accessToken) return;

    try {
      const response = await deleteFigmaWebhook(webhookId, accessToken);
      if (response && response.status === 200) {
        toast({
          title: 'Webhook Deleted',
          description: 'Successfully deleted webhook.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Refetch webhooks after deletion
        const fetchWebhooks = async () => {
          try {
            const response = await fetch(
              `https://api.figma.com/v2/webhooks?context=FILE&context_id=${fileKey}`,
              {
                headers: {
                  'X-Figma-Token': accessToken,
                },
              }
            );

            if (!response.ok) {
              console.error('Failed to fetch webhooks');
              return;
            }

            const data = await response.json();
            setWebhooks(data.webhooks || []);
          } catch (error) {
            console.error('Error fetching webhooks', error);
          }
        };

        await fetchWebhooks();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete webhook.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting webhook', error);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Asset Export Rule</Heading>
      <Text>
        Create rules to automatically export nodes as assets when a file is
        updated.
      </Text>
      <Divider />

      <Box>
        <FormControl isInvalid={!!fileKeyError} mb={4}>
          <FormLabel>Figma File Key</FormLabel>
          <Input
            type="text"
            value={fileKey}
            onChange={handleFileKeyChange}
            placeholder="Enter Figma file key"
          />
          {fileKeyError && (
            <Text color="red.500" fontSize="sm">
              {fileKeyError}
            </Text>
          )}
          <Button mt={2} onClick={fetchFileDetails} isDisabled={!fileKey}>
            Fetch File Details
          </Button>
        </FormControl>

        {fileName && (
          <Text mb={2}>
            <b>File Name:</b> {fileName}
          </Text>
        )}
      </Box>

      <Box>
        {/* Node selection */}
        {availableNodes.length > 0 && (
          <>
            <Text fontWeight="bold" mb={2}>
              Select Nodes to Export
            </Text>
            <VStack spacing={2} align="stretch" mb={4}>
              {availableNodes.map((node) => (
                <Button
                  key={node.nodeId}
                  onClick={() => handleNodeSelection(node.nodeId, node.name)}
                  colorScheme={
                    selectedNodes.some((selected) => selected.nodeId === node.nodeId)
                      ? 'blue'
                      : 'gray'
                  }
                  variant={
                    selectedNodes.some((selected) => selected.nodeId === node.nodeId)
                      ? 'solid'
                      : 'outline'
                  }
                >
                  {node.name}
                </Button>
              ))}
            </VStack>
          </>
        )}
      </Box>

      <Box>
        <FormControl>
          <FormLabel>Webhook Endpoint</FormLabel>
          <Input
            type="text"
            value={webhookEndpoint}
            onChange={handleWebhookEndpointChange}
            placeholder="Enter webhook endpoint URL"
          />
        </FormControl>
      </Box>

      <Box>
        <FormControl>
          <FormLabel>Passcode</FormLabel>
          <Input
            type="text"
            value={passcode}
            onChange={handlePasscodeChange}
            placeholder="Enter passcode"
          />
        </FormControl>
      </Box>

      <Box>
        <FormControl>
          <FormLabel>Event Type</FormLabel>
          <Select value={selectedEventType} onChange={handleEventTypeChange}>
            <option value="FILE_UPDATE">File Update</option>
            <option value="FILE_VERSION_UPDATE">File Version Update</option>
            <option value="FILE_DELETE">File Delete</option>
            <option value="LIBRARY_PUBLISH">Library Publish</option>
            <option value="FILE_COMMENT">File Comment</option>
            <option value="DEV_MODE_STATUS_UPDATE">Dev Mode Status Update</option>
          </Select>
        </FormControl>
      </Box>

      {/*  Team and Project selection  */}
      {/*  These fields are currently not functional. Implemented for future functionality  */}
      {/*
      <Box>
        <FormControl>
          <FormLabel>Context</FormLabel>
          <Select value={context} onChange={handleContextChange}>
            <option value="FILE">File</option>
            <option value="TEAM" disabled>Team (Coming Soon)</option>
            <option value="PROJECT" disabled>Project (Coming Soon)</option>
          </Select>
        </FormControl>
      </Box>

      {context !== 'FILE' && (
        <Box>
          <FormControl>
            <FormLabel>{context === 'TEAM' ? 'Team ID' : 'Project ID'}</FormLabel>
            <Input
              type="text"
              value={contextId}
              onChange={handleContextIdChange}
              placeholder={`Enter ${context === 'TEAM' ? 'Team' : 'Project'} ID`}
              isDisabled
            />
          </FormControl>
        </Box>
      )}
      */}

      <Button
        colorScheme="teal"
        onClick={handleCreateWebhook}
        isLoading={isCreatingWebhook}
        isDisabled={!webhookEndpoint || !passcode || !fileKey}
      >
        Create Rule
      </Button>

      {webhooks.length > 0 && (
        <Box mt={4}>
          <Heading size="sm" mb={2}>
            Active Rules
          </Heading>
          {webhooks.map((webhook) => (
            <Flex key={webhook.id} alignItems="center" justifyContent="space-between" py={2}>
              <Text>{webhook.endpoint}</Text>
              <IconButton
                aria-label="Delete"
                icon={<DeleteIcon />}
                onClick={() => handleDeleteWebhook(webhook.id)}
                colorScheme="red"
              />
            </Flex>
          ))}
        </Box>
      )}
    </VStack>
  );
};

export default AssetExportRuleForm;
```