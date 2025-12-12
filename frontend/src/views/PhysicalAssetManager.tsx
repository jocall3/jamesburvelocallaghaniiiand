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

// --- Citibankdemobusinessinc.assetmanagement.physicalassetmanager ---

// Internal data generation functions
const generateAssetId = () => `asset_${Math.random().toString(36).substr(2, 9)}`;
const generateAssetName = () => `Generated Asset ${Math.floor(Math.random() * 1000)}`;
const generateAssetDescription = () => `A dynamically generated asset description for ${generateAssetName()}`;
const generateTimestamp = () => new Date(Date.now() - Math.random() * 1000000000);
const generateTemperature = () => 20 + Math.random() * 10;
const generateHumidity = () => 50 + Math.random() * 20;
const generatePressure = () => 1000 + Math.random() * 50;
const generateFlowRate = () => 5 + Math.random() * 5;

// Mock API simulation for initial data
const fetchInitialAssets = async (): Promise<PhysicalAsset[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network latency
  return [
    { id: generateAssetId(), name: generateAssetName(), description: generateAssetDescription() },
    { id: generateAssetId(), name: generateAssetName(), description: generateAssetDescription() },
  ];
};

const fetchInitialTelemetry = async (assets: PhysicalAsset[]): Promise<TelemetryData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network latency
  const telemetryData: TelemetryData[] = [];
  assets.forEach(asset => {
    const numReadings = Math.floor(Math.random() * 5);
    for (let i = 0; i < numReadings; i++) {
      const timestamp = generateTimestamp();
      const isTemperatureSensor = Math.random() > 0.5;
      if (isTemperatureSensor) {
        telemetryData.push({
          assetId: asset.id,
          timestamp: timestamp,
          temperature: generateTemperature(),
          humidity: generateHumidity(),
        });
      } else {
        telemetryData.push({
          assetId: asset.id,
          timestamp: timestamp,
          pressure: generatePressure(),
          flowRate: generateFlowRate(),
        });
      }
    }
  });
  return telemetryData;
};

const PhysicalAssetManager = () => {
  const [assets, setAssets] = useState<PhysicalAsset[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [editAsset, setEditAsset] = useState<PhysicalAsset | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- Initialization and Data Fetching ---
  useEffect(() => {
    const loadData = async () => {
      const fetchedAssets = await fetchInitialAssets();
      setAssets(fetchedAssets);
      const fetchedTelemetry = await fetchInitialTelemetry(fetchedAssets);
      setTelemetry(fetchedTelemetry);
    };
    loadData();
  }, []);

  // --- Asset Management Functions ---
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
      alert('Asset name is required.'); // Human-readable error
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
        id: generateAssetId(),
        name: newAssetName || generateAssetName(), // Use generated if empty
        description: newAssetDescription || generateAssetDescription(), // Use generated if empty
      };
      setAssets([...assets, newAsset]);
    }

    setOpenDialog(false);
    setEditAsset(null); // Clear edit state
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
    setEditAsset(null); // Clear edit state
  };

  // --- Telemetry Handling ---
  const getTelemetryForAsset = (assetId: string): TelemetryData[] => {
    return telemetry.filter((data) => data.assetId === assetId);
  };

  // --- Rendering Logic ---
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
                      {data.temperature !== undefined && `Temp: ${data.temperature.toFixed(1)}°C, Humidity: ${data.humidity?.toFixed(0)}%`}
                      {data.pressure !== undefined && `Pressure: ${data.pressure.toFixed(0)} Pa, Flow Rate: ${data.flowRate?.toFixed(1)} L/s`}
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
// --- End Citibankdemobusinessinc.assetmanagement.physicalassetmanager ---