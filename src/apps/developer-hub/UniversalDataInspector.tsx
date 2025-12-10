```tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Code,
  Divider,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
} from '@chakra-ui/react';
import ReactJson from 'react-json-view';

interface DataInspectorProps {
  initialRawData?: any;
  initialNormalizedData?: any;
}

const UniversalDataInspector: React.FC<DataInspectorProps> = ({
  initialRawData,
  initialNormalizedData,
}) => {
  const [searchParams] = useSearchParams();
  const [rawData, setRawData] = useState<any>(initialRawData || null);
  const [normalizedData, setNormalizedData] = useState<any>(
    initialNormalizedData || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchDataFromParams = async () => {
      const rawDataParam = searchParams.get('rawData');
      const normalizedDataParam = searchParams.get('normalizedData');

      if (rawDataParam && !rawData) {
        try {
          const parsedRawData = JSON.parse(decodeURIComponent(rawDataParam));
          setRawData(parsedRawData);
        } catch (error) {
          console.error('Error parsing rawData from URL:', error);
          toast({
            title: 'Error',
            description: 'Failed to parse raw data from URL.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }

      if (normalizedDataParam && !normalizedData) {
        try {
          const parsedNormalizedData = JSON.parse(
            decodeURIComponent(normalizedDataParam)
          );
          setNormalizedData(parsedNormalizedData);
        } catch (error) {
          console.error('Error parsing normalizedData from URL:', error);
          toast({
            title: 'Error',
            description: 'Failed to parse normalized data from URL.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };
    fetchDataFromParams();
  }, [searchParams, toast, rawData, normalizedData]); // dependencies to re-run effect

  const handleRawDataChange = (newData: any) => {
    setRawData(newData);
  };

  const handleNormalizedDataChange = (newData: any) => {
    setNormalizedData(newData);
  };


  return (
    <Box p={4}>
      <Heading mb={4}>Universal Data Inspector</Heading>

      <Text mb={2}>
        Inspect raw and normalized data payloads. Data can be passed via
        URL parameters: <Code>rawData</Code> and{' '}
        <Code>normalizedData</Code>.
      </Text>

      <Divider mb={4} />

      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          <Tab>Raw Data</Tab>
          <Tab>Normalized Data</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {rawData ? (
              <ReactJson
                src={rawData}
                name="rawData"
                enableClipboard={false}
                collapsed={1}
                onEdit={handleRawDataChange}
                onAdd={handleRawDataChange}
                onDelete={handleRawDataChange}
              />
            ) : (
              <Text>No raw data to display.</Text>
            )}
          </TabPanel>
          <TabPanel>
            {normalizedData ? (
              <ReactJson
                src={normalizedData}
                name="normalizedData"
                enableClipboard={false}
                collapsed={1}
                onEdit={handleNormalizedDataChange}
                onAdd={handleNormalizedDataChange}
                onDelete={handleNormalizedDataChange}
              />
            ) : (
              <Text>No normalized data to display.</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default UniversalDataInspector;
```