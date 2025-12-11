import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Button,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  Input,
  Flex,
  Spacer,
  Tag,
  TagLabel,
  useToast,
} from '@chakra-ui/react';
import {
  DataflowClient,
  DataflowJob,
  DataflowJobMessage,
  DataflowJobState,
  DataflowJobType,
} from '../../../types/cloud/DataflowTypes';
import { CloudProjectSelector } from '../core/CloudProjectSelector';
import { DataflowConfig } from '../../../types/cloud/CloudConfig';
import { getAuthClient } from '../../../utils/gcp/auth';
import { defaultDataflowConfig } from '../../../config/cloudConfig';

interface DataflowPipelineMonitorProps {
  initialProject?: string;
  initialRegion?: string;
}

const POLL_INTERVAL_MS = 10000; // Poll every 10 seconds for job status and messages

const DataflowPipelineMonitor: React.FC<DataflowPipelineMonitorProps> = ({
  initialProject,
  initialRegion,
}) => {
  const [project, setProject] = useState<string | undefined>(initialProject);
  const [region, setRegion] = useState<string | undefined>(initialRegion);
  const [jobs, setJobs] = useState<DataflowJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [selectedJob, setSelectedJob] = useState<DataflowJob | null>(null);
  const [jobMessages, setJobMessages] = useState<DataflowJobMessage[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataflowConfig, setDataflowConfig] = useState<DataflowConfig>(defaultDataflowConfig);
  const toast = useToast();

  const dataflowClient = useCallback((): DataflowClient | null => {
    if (!project || !region || !dataflowConfig.version) return null;
    const auth = getAuthClient();
    if (!auth) {
      setError("Google authentication client not initialized.");
      return null;
    }
    return new DataflowClient(auth, project, region, dataflowConfig.version);
  }, [project, region, dataflowConfig.version]);

  const fetchJobs = useCallback(async () => {
    if (!project || !region) {
      setJobs([]);
      setSelectedJob(null);
      setSelectedJobId(undefined);
      setJobMessages([]);
      return;
    }

    setLoadingJobs(true);
    setError(null);
    try {
      const client = dataflowClient();
      if (!client) {
        throw new Error("Dataflow client not initialized.");
      }
      const fetchedJobs = await client.listJobs();
      setJobs(fetchedJobs);
      if (selectedJobId && !fetchedJobs.some(job => job.id === selectedJobId)) {
        // If selected job no longer exists, clear selection
        setSelectedJobId(undefined);
        setSelectedJob(null);
        setJobMessages([]);
      } else if (selectedJobId) {
        // Update selected job with latest data
        setSelectedJob(fetchedJobs.find(job => job.id === selectedJobId) || null);
      }
    } catch (err: any) {
      setError(`Failed to fetch Dataflow jobs: ${err.message}`);
      toast({
        title: "Error fetching jobs",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingJobs(false);
    }
  }, [project, region, selectedJobId, dataflowClient, toast]);

  const fetchJobMessages = useCallback(async () => {
    if (!project || !region || !selectedJobId) {
      setJobMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError(null);
    try {
      const client = dataflowClient();
      if (!client) {
        throw new Error("Dataflow client not initialized.");
      }
      const fetchedMessages = await client.getJobMessages(selectedJobId);
      setJobMessages(fetchedMessages);
    } catch (err: any) {
      setError(`Failed to fetch job messages: ${err.message}`);
      toast({
        title: "Error fetching job messages",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [project, region, selectedJobId, dataflowClient, toast]);

  useEffect(() => {
    fetchJobs();
    const jobPollInterval = setInterval(fetchJobs, POLL_INTERVAL_MS);
    return () => clearInterval(jobPollInterval);
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobMessages();
    const messagePollInterval = setInterval(fetchJobMessages, POLL_INTERVAL_MS);
    return () => clearInterval(messagePollInterval);
  }, [fetchJobMessages]);

  const handleProjectChange = (newProject: string) => {
    setProject(newProject);
    setSelectedJobId(undefined);
    setSelectedJob(null);
    setJobMessages([]);
  };

  const handleRegionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRegion(event.target.value);
    setSelectedJobId(undefined);
    setSelectedJob(null);
    setJobMessages([]);
  };

  const handleJobSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const jobId = event.target.value;
    setSelectedJobId(jobId === '' ? undefined : jobId);
    setSelectedJob(jobs.find(job => job.id === jobId) || null);
    setJobMessages([]); // Clear messages when a new job is selected
  };

  const getStatusColor = (status: DataflowJobState): string => {
    switch (status) {
      case DataflowJobState.JOB_STATE_RUNNING:
        return 'blue';
      case DataflowJobState.JOB_STATE_DONE:
        return 'green';
      case DataflowJobState.JOB_STATE_FAILED:
      case DataflowJobState.JOB_STATE_CANCELLED:
      case DataflowJobState.JOB_STATE_UPDATED: // Updated could be a temporary state or lead to a new job
        return 'red';
      case DataflowJobState.JOB_STATE_DRAINING:
      case DataflowJobState.JOB_STATE_DRAINED:
        return 'orange';
      case DataflowJobState.JOB_STATE_PENDING:
      case DataflowJobState.JOB_STATE_STOPPED: // Stopped could be intentional or due to an issue
      case DataflowJobState.JOB_STATE_UNSPECIFIED:
      default:
        return 'gray';
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
      <Heading as="h2" size="xl" mb={4}>
        Dataflow Pipeline Monitor
      </Heading>

      <VStack spacing={4} align="stretch" mb={6}>
        <HStack spacing={4}>
          <FormControl flex="1">
            <FormLabel htmlFor="project-selector">Cloud Project</FormLabel>
            <CloudProjectSelector
              projectId={project}
              onProjectChange={handleProjectChange}
              placeholder="Select a project"
            />
          </FormControl>

          <FormControl flex="1">
            <FormLabel htmlFor="region-select">Region</FormLabel>
            <Select id="region-select" placeholder="Select region" value={region || ''} onChange={handleRegionChange}>
              {dataflowConfig.availableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormControl>
        </HStack>

        <FormControl>
          <FormLabel htmlFor="job-select">Select Dataflow Job</FormLabel>
          <Select id="job-select" placeholder="Select a job" value={selectedJobId || ''} onChange={handleJobSelect}>
            {loadingJobs ? (
              <option disabled>Loading jobs...</option>
            ) : (
              jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name} ({job.id}) - {job.currentState.replace('JOB_STATE_', '').replace(/_/g, ' ')}
                </option>
              ))
            )}
          </Select>
          {loadingJobs && <Spinner size="sm" mt={2} />}
        </FormControl>
      </VStack>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {project && region && !selectedJobId && !loadingJobs && jobs.length === 0 && (
        <Alert status="info" mb={4}>
          <AlertIcon />
          No Dataflow jobs found in project "{project}" in region "{region}".
        </Alert>
      )}

      {selectedJob && (
        <Box p={4} borderWidth="1px" borderRadius="md" mb={6} bg="gray.50">
          <Heading as="h3" size="lg" mb={3}>
            Job Details
          </Heading>
          <VStack align="flex-start" spacing={1}>
            <Text>
              <b>Name:</b> {selectedJob.name}
            </Text>
            <Text>
              <b>ID:</b> {selectedJob.id}
            </Text>
            <Text>
              <b>Type:</b> {selectedJob.type ? selectedJob.type.replace('JOB_TYPE_', '').replace(/_/g, ' ') : 'N/A'}
            </Text>
            <HStack>
              <Text>
                <b>Current State:</b>
              </Text>
              <Tag size="md" variant="solid" colorScheme={getStatusColor(selectedJob.currentState)}>
                <TagLabel>{selectedJob.currentState.replace('JOB_STATE_', '').replace(/_/g, ' ')}</TagLabel>
              </Tag>
            </HStack>
            <Text>
              <b>Create Time:</b> {new Date(selectedJob.createTime).toLocaleString()}
            </Text>
            {selectedJob.startTime && (
              <Text>
                <b>Start Time:</b> {new Date(selectedJob.startTime).toLocaleString()}
              </Text>
            )}
            {selectedJob.endTime && (
              <Text>
                <b>End Time:</b> {new Date(selectedJob.endTime).toLocaleString()}
              </Text>
            )}
            {selectedJob.location && (
              <Text>
                <b>Location:</b> {selectedJob.location}
              </Text>
            )}
            {selectedJob.pipelineDescription?.displayData && selectedJob.pipelineDescription.displayData.length > 0 && (
              <Box mt={2}>
                <Text fontWeight="bold">Pipeline Display Data:</Text>
                <VStack align="flex-start" pl={4} spacing={0}>
                  {selectedJob.pipelineDescription.displayData.map((data, index) => (
                    <Text key={index} fontSize="sm">
                      - {data.key}: {data.value || data.label}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
          {selectedJob.currentState === DataflowJobState.JOB_STATE_RUNNING && (
            <Button
              mt={4}
              colorScheme="red"
              onClick={async () => {
                if (!selectedJobId || !project || !region) return;
                try {
                  const client = dataflowClient();
                  if (!client) throw new Error("Dataflow client not initialized.");
                  await client.cancelJob(selectedJobId);
                  toast({
                    title: "Job Cancelled",
                    description: `Job ${selectedJob.name} (${selectedJobId}) has been requested to cancel.`,
                    status: "info",
                    duration: 5000,
                    isClosable: true,
                  });
                  fetchJobs(); // Refresh jobs to update status
                } catch (err: any) {
                  toast({
                    title: "Error cancelling job",
                    description: err.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                }
              }}
            >
              Cancel Job
            </Button>
          )}
        </Box>
      )}

      {selectedJobId && (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
          <Flex alignItems="center" mb={3}>
            <Heading as="h3" size="lg">
              Job Messages (Logs)
            </Heading>
            <Spacer />
            {loadingMessages && <Spinner size="sm" mr={2} />}
            <Button size="sm" onClick={fetchJobMessages} isDisabled={loadingMessages}>
              Refresh Logs
            </Button>
          </Flex>
          <Box
            maxHeight="500px"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
            p={3}
            bg="blackAlpha.800"
            color="whiteAlpha.900"
            fontFamily="monospace"
            fontSize="sm"
          >
            {jobMessages.length === 0 && !loadingMessages ? (
              <Text>No messages found for this job or still loading...</Text>
            ) : (
              jobMessages.map((msg, index) => (
                <HStack key={index} spacing={2} align="flex-start">
                  <Text minWidth="150px" color="gray.400">
                    {new Date(msg.time).toLocaleTimeString()}
                  </Text>
                  <Tag size="sm" variant="outline" colorScheme={getStatusColor(msg.messageImportance as DataflowJobState)}>
                    {msg.messageImportance?.replace('JOB_MESSAGE_IMPORTANCE_', '') || 'UNKNOWN'}
                  </Tag>
                  <Text flex="1">{msg.messageText}</Text>
                </HStack>
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DataflowPipelineMonitor;