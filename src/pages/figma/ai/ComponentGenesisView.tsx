```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getFile,
  getFileComponents,
  getComponent,
  getImages,
} from '../../../api/figmaApi'; // Assuming API calls are in this file
import {
  Node,
  Component,
  Document,
  ImageResponse,
} from '../../../types/figma'; // Assuming Figma types are defined here
import { Button, Typography, CircularProgress, Box, Grid, Card, CardContent, CardMedia } from '@mui/material';

const ComponentGenesisView = () => {
  const { fileKey } = useParams<{ fileKey: string }>();
  const [file, setFile] = useState<Document | null>(null);
  const [components, setComponents] = useState<{ [key: string]: Component } | null>(null);
  const [selectedComponentKey, setSelectedComponentKey] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [componentImageUrls, setComponentImageUrls] = useState<{ [key: string]: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!fileKey) {
        setError('No file key provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fileData = await getFile(fileKey);
        setFile(fileData.document);

        const componentsData = await getFileComponents(fileKey);
        const componentsMap: { [key: string]: Component } = {};
        componentsData.meta.components.forEach(component => {
          componentsMap[component.key] = component;
        });
        setComponents(componentsMap);


      } catch (err: any) {
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileKey]);


  useEffect(() => {
    const fetchSelectedComponentData = async () => {
      if (!selectedComponentKey || !components) {
        setSelectedComponent(null);
        setComponentImageUrls(null);
        return;
      }
      setLoading(true);
      setError(null);

      try {

        const component = components[selectedComponentKey];
        setSelectedComponent(component);

        if (!component) {
          setError("Component not found");
          return;
        }
        const imageResponse = await getImages(fileKey!, component.node_id, { scale: 2, format: 'png' });

        if (imageResponse.images) {
          setComponentImageUrls(imageResponse.images);
        } else {
          setComponentImageUrls(null);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch component data.');
        setSelectedComponent(null);
        setComponentImageUrls(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedComponentData();
  }, [selectedComponentKey, fileKey, components]);


  const handleComponentSelect = (key: string) => {
    setSelectedComponentKey(key);
  };

  const handleGenerateCode = async () => {
    if (!selectedComponentKey || !selectedComponent) {
        alert("Please select a component first.");
        return;
    }
    // TODO: Implement code generation logic using AI and the selectedComponent data
    // For example:
    // const generatedCode = await generateCodeFromComponent(selectedComponent);
    // setGeneratedCode(generatedCode); // Assuming you have a state for generated code
    alert(`Code generation triggered for component: ${selectedComponent.name}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error" align="center">Error: {error}</Typography>;
  }

  if (!file || !components) {
    return <Typography align="center">No data available.</Typography>;
  }



  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Component Genesis Engine</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>Select a Component</Typography>
          {components && Object.values(components).length > 0 ? (
            Object.values(components).map((component) => (
              <Card
                key={component.key}
                sx={{ mb: 2, cursor: 'pointer', borderColor: selectedComponentKey === component.key ? 'primary.main' : 'grey.200', borderWidth: selectedComponentKey === component.key ? 2 : 1, borderStyle: 'solid'}}
                onClick={() => handleComponentSelect(component.key)}
              >
                <CardContent>
                  <Typography variant="subtitle1">{component.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{component.description}</Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body1" color="text.secondary">No components found in this file.</Typography>
          )}
        </Grid>


        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>Selected Component Details</Typography>
          {selectedComponent ? (
            <Box>
              <Typography variant="h6">{selectedComponent.name}</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>{selectedComponent.description}</Typography>

              {componentImageUrls && Object.keys(componentImageUrls).length > 0 ? (
                <Card sx={{ maxWidth: 345, mb: 2 }}>
                  <CardMedia
                    component="img"
                    alt={selectedComponent.name}
                    height="140"
                    image={Object.values(componentImageUrls)[0]} // Assuming one image per component for now.
                  />
                </Card>
              ) : (
                <Typography variant="body2" color="text.secondary">No image available for this component.</Typography>
              )}

              <Button variant="contained" color="primary" onClick={handleGenerateCode}>Generate Code</Button>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">Select a component to view details.</Typography>
          )}
        </Grid>
      </Grid>


    </Box>
  );
};

export default ComponentGenesisView;
```