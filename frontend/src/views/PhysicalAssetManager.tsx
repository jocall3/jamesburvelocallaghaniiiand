```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { PhysicalAsset, TelemetryData } from '../types';

const PhysicalAssetManager = () => {
  const [assets, setAssets] = useState<PhysicalAsset[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [editAsset, setEditAsset] = useState<PhysicalAsset | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);


  useEffect(() => {
    // Mock API call to fetch assets (replace with your actual API)
    const fetchAssets = async () => {
      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockAssets: PhysicalAsset[] = [
        { id: 'asset1', name: 'Temperature Sensor 1', description: 'Sensor in the warehouse' },
        { id: 'asset2', name: 'Pressure Gauge 1', description: 'Gauge on the production line' },
      ];
      setAssets(mockAssets);

      // Mock telemetry data (replace with your actual data source)
      const mockTelemetry: TelemetryData[] = [
        { assetId: 'asset1', timestamp: new Date(), temperature: 25.5, humidity: 60 },
        { assetId: 'asset1', timestamp: new Date(), temperature: 26.0, humidity: 62 },
        { assetId: 'asset2', timestamp: new Date(), pressure: 1012, flowRate: 5.2 },
        { assetId: 'asset2', timestamp: new Date(), pressure: 1015, flowRate: 5.5 },
      ];
      setTelemetry(mockTelemetry);
    };

    fetchAssets();
  }, []);

  const handleAddAsset = () => {
    setOpenDialog(true);
    setIsEditing(false);
    setNewAssetName('');
    setNewAssetDescription('');
  };

  const handleEditAsset = (asset: PhysicalAsset) => {
    setEditAsset(asset);
    setOpenDialog(true);
    setIsEditing(true);
    setNewAssetName(asset.name);
    setNewAssetDescription(asset.description);

  };

  const handleSaveAsset = () => {
    if (newAssetName.trim() === '') {
      alert('Asset name is required.');
      return;
    }

    if (isEditing && editAsset) {
      // Update existing asset
      const updatedAssets = assets.map(asset =>
        asset.id === editAsset.id ? { ...asset, name: newAssetName, description: newAssetDescription } : asset
      );
      setAssets(updatedAssets);
    } else {
      // Add new asset
      const newAsset: PhysicalAsset = {
        id: `asset${assets.length + 1}`, // Generate a simple ID
        name: newAssetName,
        description: newAssetDescription,
      };
      setAssets([...assets, newAsset]);
    }

    setOpenDialog(false);
  };

  const handleDeleteAsset = (assetId: string) => {
    const updatedAssets = assets.filter((asset) => asset.id !== assetId);
    setAssets(updatedAssets);
    // Optionally also remove associated telemetry data
    const updatedTelemetry = telemetry.filter((data) => data.assetId !== assetId);
    setTelemetry(updatedTelemetry);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditAsset(null);
  };


  const getTelemetryForAsset = (assetId: string) => {
    return telemetry.filter((data) => data.assetId === assetId);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Physical Asset Management
      </Typography>

      <Box mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddAsset}
        >
          Add Asset
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell>Telemetry</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {asset.name}
                </TableCell>
                <TableCell>{asset.description}</TableCell>
                <TableCell>
                  <IconButton aria-label="edit" onClick={() => handleEditAsset(asset)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDeleteAsset(asset.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell>
                  {getTelemetryForAsset(asset.id).map((data, index) => (
                    <Typography key={index}>
                      {/* Display telemetry data based on its properties */}
                      {data.temperature !== undefined && `Temperature: ${data.temperature}°C, Humidity: ${data.humidity}%`}
                      {data.pressure !== undefined && `Pressure: ${data.pressure} Pa, Flow Rate: ${data.flowRate} L/s`}
                    </Typography>
                  ))}
                  {getTelemetryForAsset(asset.id).length === 0 && (
                    <Typography>No telemetry data available.</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Asset Name"
            type="text"
            fullWidth
            variant="standard"
            value={newAssetName}
            onChange={(e) => setNewAssetName(e.target.value)}
          />
          <TextField
            margin="dense"
            id="description"
            label="Asset Description"
            type="text"
            fullWidth
            variant="standard"
            value={newAssetDescription}
            onChange={(e) => setNewAssetDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveAsset}>{isEditing ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhysicalAssetManager;
```