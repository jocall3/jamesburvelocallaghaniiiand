
import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';

const DeveloperHubView = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Developer Hub - ISO 20022 API
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the Developer Hub for our ISO 20022-native API. This hub provides you with the
          tools and documentation you need to integrate with our platform and build powerful
          financial applications.
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          Getting Started
        </Typography>
        <Typography variant="body1" paragraph>
          To get started, please review the following resources:
        </Typography>
        <ul>
          <li>
            <Link href="/documentation/api-overview" target="_blank" rel="noopener noreferrer">
              API Overview
            </Link>
            : A high-level introduction to our API and its capabilities.
          </li>
          <li>
            <Link href="/documentation/api-endpoints" target="_blank" rel="noopener noreferrer">
              API Endpoints
            </Link>
            : Detailed information on each API endpoint, including request/response
            schemas, parameters, and examples.
          </li>
          <li>
            <Link href="/documentation/authentication" target="_blank" rel="noopener noreferrer">
              Authentication
            </Link>
            : Instructions on how to authenticate your API requests.
          </li>
          <li>
            <Link href="/documentation/code-samples" target="_blank" rel="noopener noreferrer">
              Code Samples
            </Link>
            : Ready-to-use code snippets in various programming languages to help you integrate quickly.
          </li>
        </ul>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          ISO 20022 Schema Reference
        </Typography>
        <Typography variant="body1" paragraph>
          The API adheres to the ISO 20022 standard.  Below is the full schema definition for the ISO
          20022 elements supported by the API.  This is for informational and reference purposes.
        </Typography>
        <Box sx={{ mt: 2, overflowX: 'auto' }}>
          <pre style={{
            backgroundColor: '#f0f0f0',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            overflowX: 'auto',
          }}>
            {JSON.stringify(iso20022, null, 2)}
          </pre>
        </Box>
      </Box>
    </Container>
  );
};

export default DeveloperHubView;

const iso20022 = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "$id": {
      "default": "urn:iso:std:iso:20022:tech:json:"
    },
    "ExternalAcceptedReason1Code": {
      "type": "string"
    }
  },
  "definitions": {
    "ExternalAcceptedReason1Code": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4,
      "description": "Specifies the reason for an accepted status.\n\r\nThe list of valid codes is an external code list published separately. \r\nExternal code sets can be downloaded from www.iso20022.org.\n*`ADEA`-Received after the servicer\u0027s deadline. Processed on best effort basis\n*`NSTP`-Instruction was not straight through processing and had to be processed manually\n*`SMPG`-Instruction is accepted but does not comply with the market practice rule published for the concerned market or process",
      "enum": [
        "ADEA",
        "NSTP",
        "SMPG"
      ]
    }
  }
};
