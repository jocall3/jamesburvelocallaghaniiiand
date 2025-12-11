```tsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Grid,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ApiEntry {
  NAME: string;
  TITLE: string;
}

const DeveloperNexusView: React.FC = () => {
  const [apiData, setApiData] = useState<ApiEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredApiData, setFilteredApiData] = useState<ApiEntry[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiEntry | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiParams, setApiParams] = useState<{[key: string]: string}>({});
  const [apiHeaders, setApiHeaders] = useState<{[key: string]: string}>({});


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate fetching API data (replace with actual data fetching)
        const mockData: ApiEntry[] = [
            { NAME: 'abusiveexperiencereport.googleapis.com', TITLE: 'Abusive Experience Report API' },
            { NAME: 'acceleratedmobilepageurl.googleapis.com', TITLE: 'Accelerated Mobile Pages (AMP) URL API' },
            { NAME: 'accessapproval.googleapis.com', TITLE: 'Access Approval API' },
            { NAME: 'actions.googleapis.com', TITLE: 'Actions API' },
            { NAME: 'analytics.googleapis.com', TITLE: 'Google Analytics API' },
            { NAME: 'bigquery.googleapis.com', TITLE: 'BigQuery API' },
            { NAME: 'cloudfunctions.googleapis.com', TITLE: 'Cloud Functions API' },
            { NAME: 'drive.googleapis.com', TITLE: 'Google Drive API' },
            { NAME: 'gmail.googleapis.com', TITLE: 'Gmail API' },
            { NAME: 'youtube.googleapis.com', TITLE: 'YouTube Data API v3' },
        ];
        setApiData(mockData);
      } catch (error) {
        console.error("Error fetching API data:", error);
        showSnackbar('error', 'Failed to load API data.');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filterData = () => {
      const filtered = apiData.filter(api =>
        api.NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.TITLE.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApiData(filtered);
    };

    filterData();
  }, [apiData, searchTerm]);


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleApiSelect = (api: ApiEntry) => {
    setSelectedApi(api);
    // Basic endpoint assignment (customize based on API)
    setApiEndpoint(`https://${api.NAME}`);
    setApiResponse(null); // Clear previous response
    setApiParams({}); // Clear previous params
    setApiHeaders({}); // Clear previous headers
  };

  const handleMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setApiMethod(event.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH');
      setApiResponse(null);
  };

  const handleParamChange = (key: string, value: string) => {
      setApiParams({...apiParams, [key]: value});
  };

  const handleHeaderChange = (key: string, value: string) => {
      setApiHeaders({...apiHeaders, [key]: value});
  };



  const handleApiCall = async () => {
    if (!apiEndpoint) {
      showSnackbar('warning', 'Please select an API.');
      return;
    }

    setIsLoading(true);
    setApiResponse(null);

    try {
      const url = apiEndpoint;
      const headers = {
        'Content-Type': 'application/json',  // Default, adjust as needed
        ...apiHeaders,
      };

      const options: RequestInit = {
        method: apiMethod,
        headers: headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(apiMethod)) {
        options.body = JSON.stringify(apiParams);
      } else if (apiParams && Object.keys(apiParams).length > 0) {
        //Handle GET params
        const queryParams = new URLSearchParams(apiParams).toString();
        options.method = apiMethod;
        if(queryParams){
          //Append params to endpoint if GET
          const urlWithParams = `${url}?${queryParams}`;
          // Set the endpoint to the one with params.
          options.method = apiMethod;
          // Set the endpoint
          apiEndpoint.includes("?") ? setApiEndpoint(`${url}&${queryParams}`) : setApiEndpoint(urlWithParams);
        }
      }

      const response = await fetch(url, options);

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
          data = await response.json();
      } else {
          data = await response.text(); // Handle text responses
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(data)}`);
      }

      setApiResponse(data);
      showSnackbar('success', 'API call successful!');

    } catch (error: any) {
        console.error("API Call Error:", error);
        setApiResponse({ error: error.message || 'An error occurred during the API call.' , details: error});
        showSnackbar('error', `API call failed: ${error.message || 'An error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (severity: 'success' | 'info' | 'warning' | 'error', message: string) => {
    setSnackbarSeverity(severity);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Developer Nexus</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search APIs"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
            <Table stickyHeader aria-label="API list">
              <TableHead>
                <TableRow>
                  <TableCell>API Name</TableCell>
                  <TableCell>Title</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApiData.map((api) => (
                  <TableRow
                    key={api.NAME}
                    hover
                    onClick={() => handleApiSelect(api)}
                    selected={selectedApi?.NAME === api.NAME}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>{api.NAME}</TableCell>
                    <TableCell>{api.TITLE}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedApi ? (
            <>
              <Typography variant="h5" gutterBottom>{selectedApi.TITLE}</Typography>
              <Typography variant="subtitle1" gutterBottom>Endpoint: {apiEndpoint}</Typography>

              <Box sx={{ mb: 2 }}>
                <Button variant="contained" color="primary" onClick={handleApiCall} disabled={isLoading}>
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Call API'}
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Method:</Typography>
                    <select value={apiMethod} onChange={handleMethodChange} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}>
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>

                </Grid>
                  {['POST', 'PUT', 'PATCH', 'GET'].includes(apiMethod) && (
                      <Grid item xs={12}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                            <Typography>Parameters</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {/* Parameter Input Fields */}
                            {Object.keys(apiParams).length === 0 && apiMethod !== 'GET' ? (
                                <Typography variant="body2">No parameters needed for this method.</Typography>
                              ) :
                              (
                                <Box>
                                    {apiMethod === 'GET' ? <Typography variant="body2">Add parameters to the URL using the format: ?param1=value1&param2=value2</Typography> : <></>}
                                    {Object.keys(apiParams).map((key) => (
                                        <TextField
                                            key={key}
                                            label={key}
                                            value={apiParams[key] || ''}
                                            onChange={(e) => handleParamChange(key, e.target.value)}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                        />
                                    ))}

                                    {!Object.keys(apiParams).length && apiMethod !== 'GET'?  <Typography variant="body2">No Parameters to configure.</Typography> : <></>}
                                </Box>
                              )}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2a-content" id="panel2a-header">
                          <Typography>Headers</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {/* Header Input Fields */}
                            {Object.keys(apiHeaders).map((key) => (
                                <TextField
                                    key={key}
                                    label={key}
                                    value={apiHeaders[key] || ''}
                                    onChange={(e) => handleHeaderChange(key, e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    variant="outlined"
                                />
                            ))}

                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                </Grid>

              {apiResponse && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Response:</Typography>
                  <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', overflowX: 'auto', borderRadius: '4px' }}>
                    {typeof apiResponse === 'object' ? JSON.stringify(apiResponse, null, 2) : apiResponse}
                  </pre>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body1">Select an API to view details and test.</Typography>
          )}
        </Grid>
      </Grid>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeveloperNexusView;
```