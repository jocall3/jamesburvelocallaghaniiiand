import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ForceGraph2D from 'react-force-graph-2d';

// Mock data and API functions for demonstration
interface QuantumAsset {
  id: string;
  name: string;
  type: 'qubit' | 'register' | 'circuit';
  state: string; // e.g., |0>, |1>, superposition
  entanglementLinks: string[]; // IDs of other quantum assets
}

interface QuantumEntanglementLink {
  source: string;
  target: string;
  strength: number; // e.g., 0 to 1
}

const mockQuantumAssets: QuantumAsset[] = [
  { id: 'q1', name: 'Qubit Alpha', type: 'qubit', state: '0.707|0> + 0.707i|1>', entanglementLinks: ['q2', 'q3'] },
  { id: 'q2', name: 'Qubit Beta', type: 'qubit', state: '0.707|0> - 0.707i|1>', entanglementLinks: ['q1'] },
  { id: 'q3', name: 'Qubit Gamma', type: 'qubit', state: '1|0>', entanglementLinks: ['q1'] },
  { id: 'r1', name: 'Register 1', type: 'register', state: 'Superposition', entanglementLinks: ['q1', 'q2', 'c1'] },
  { id: 'c1', name: 'Circuit Omega', type: 'circuit', state: 'Entangled', entanglementLinks: ['r1'] },
];

const mockGetQuantumAssets = async (): Promise<QuantumAsset[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockQuantumAssets), 500);
  });
};

const mockCreateQuantumAsset = async (asset: Omit<QuantumAsset, 'id'>): Promise<QuantumAsset> => {
  const newAsset: QuantumAsset = { ...asset, id: `q_new_${Date.now()}` };
  mockQuantumAssets.push(newAsset);
  return new Promise((resolve) => {
    setTimeout(() => resolve(newAsset), 300);
  });
};

const mockCreateEntanglementLink = async (sourceId: string, targetId: string): Promise<QuantumEntanglementLink> => {
  const sourceAsset = mockQuantumAssets.find(a => a.id === sourceId);
  const targetAsset = mockQuantumAssets.find(a => a.id === targetId);

  if (!sourceAsset || !targetAsset) {
    throw new Error('Source or target asset not found.');
  }

  if (!sourceAsset.entanglementLinks.includes(targetId)) {
    sourceAsset.entanglementLinks.push(targetId);
  }
  if (!targetAsset.entanglementLinks.includes(sourceId)) {
    targetAsset.entanglementLinks.push(sourceId);
  }

  const link: QuantumEntanglementLink = {
    source: sourceId,
    target: targetId,
    strength: Math.random(), // Simulate entanglement strength
  };

  return new Promise((resolve) => {
    setTimeout(() => resolve(link), 300);
  });
};

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const GraphContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  position: 'relative',
  height: '600px', // Fixed height for the graph
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const QuantumAssetManager: React.FC = () => {
  const [assets, setAssets] = useState<QuantumAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<QuantumAsset | null>(null);
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState<boolean>(false);
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetType, setNewAssetType] = useState<'qubit' | 'register' | 'circuit'>('qubit');
  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState<boolean>(false);
  const [linkSourceId, setLinkSourceId] = useState<string>('');
  const [linkTargetId, setLinkTargetId] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedAssets = await mockGetQuantumAssets();
      setAssets(fetchedAssets);
    } catch (err) {
      setError('Failed to load quantum assets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetClick = (asset: QuantumAsset) => {
    setSelectedAsset(asset);
  };

  const handleCloseAssetDetail = () => {
    setSelectedAsset(null);
  };

  const handleOpenCreateAssetModal = () => {
    setNewAssetName('');
    setNewAssetType('qubit');
    setIsCreateAssetModalOpen(true);
  };

  const handleCloseCreateAssetModal = () => {
    setIsCreateAssetModalOpen(false);
  };

  const handleCreateAsset = async () => {
    if (!newAssetName) return;
    setLoading(true); // Use loading state for creation feedback
    setError(null);
    try {
      await mockCreateQuantumAsset({ name: newAssetName, type: newAssetType, state: 'Unknown', entanglementLinks: [] });
      await fetchAssets(); // Refresh list after creation
      setIsCreateAssetModalOpen(false);
    } catch (err) {
      setError('Failed to create quantum asset.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateLinkModal = () => {
    if (!selectedAsset) return;
    setLinkSourceId(selectedAsset.id);
    setLinkTargetId('');
    setLinkError(null);
    setIsCreateLinkModalOpen(true);
  };

  const handleCloseCreateLinkModal = () => {
    setIsCreateLinkModalOpen(false);
  };

  const handleCreateLink = async () => {
    if (!linkSourceId || !linkTargetId) return;
    setIsLinking(true);
    setLinkError(null);
    try {
      await mockCreateEntanglementLink(linkSourceId, linkTargetId);
      await fetchAssets(); // Refresh list to show new link
      setIsCreateLinkModalOpen(false);
    } catch (err: any) {
      setLinkError(err.message || 'Failed to create entanglement link.');
      console.error(err);
    } finally {
      setIsLinking(false);
    }
  };

  const nodes = assets.map(asset => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    state: asset.state,
  }));

  const links: QuantumEntanglementLink[] = [];
  assets.forEach(asset => {
    asset.entanglementLinks.forEach(targetId => {
      // Avoid duplicate links (e.g., q1->q2 and q2->q1)
      if (!links.some(link => (link.source === asset.id && link.target === targetId) || (link.source === targetId && link.target === asset.id))) {
        links.push({ source: asset.id, target: targetId, strength: Math.random() }); // Strength is simulated
      }
    });
  });

  const graphData = { nodes, links };

  const nodeLabel = (node: any) => `${node.name} (${node.type})`;

  const nodeColor = (node: any) => {
    switch (node.type) {
      case 'qubit': return 'rgba(255, 0, 0, 0.8)'; // Red for qubits
      case 'register': return 'rgba(0, 255, 0, 0.8)'; // Green for registers
      case 'circuit': return 'rgba(0, 0, 255, 0.8)'; // Blue for circuits
      default: return 'rgba(128, 128, 128, 0.8)'; // Grey for unknown
    }
  };

  const linkColor = (link: QuantumEntanglementLink) => {
    // Could use link.strength to vary color or thickness
    return 'rgba(255, 165, 0, 0.5)'; // Orange for entanglement
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quantum Asset Manager
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardHeader title="Quantum Assets" />
            <CardContent sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {loading && <CircularProgress />}
              {error && <Alert severity="error">{error}</Alert>}
              {!loading && !error && assets.length === 0 && (
                <Typography>No quantum assets found.</Typography>
              )}
              {!loading && !error && assets.map((asset) => (
                <Box
                  key={asset.id}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    border: `1px solid ${selectedAsset?.id === asset.id ? 'primary.main' : theme.palette.divider}`,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    backgroundColor: theme.palette.background.default,
                  }}
                  onClick={() => handleAssetClick(asset)}
                >
                  <Typography variant="subtitle1">{asset.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {asset.type} | State: {asset.state}
                  </Typography>
                </Box>
              ))}
            </CardContent>
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button variant="contained" onClick={handleOpenCreateAssetModal} fullWidth sx={{ mb: 1 }}>
                Create New Asset
              </Button>
              <Button
                variant="outlined"
                onClick={handleOpenCreateLinkModal}
                disabled={!selectedAsset || loading}
                fullWidth
              >
                Create Entanglement Link
              </Button>
            </Box>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardHeader title="Quantum Entanglement Visualization" />
            <CardContent>
              <GraphContainer>
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                )}
                {!loading && !error && (
                  <ForceGraph2D
                    graphData={graphData}
                    nodeId="id"
                    nodes={nodes}
                    links={links}
                    nodeLabel={nodeLabel}
                    nodeColor={nodeColor}
                    linkColor={linkColor}
                    linkWidth={link => link.strength ? link.strength * 3 : 1}
                    onNodeClick={(node: any) => handleAssetClick(assets.find(a => a.id === node.id)!)}
                    width={window.innerWidth * 0.6} // Adjust width based on container or screen size
                    height={600} // Match container height
                    backgroundColor="#1a1a2e" // Dark background for visualization
                    nodeAutoColorBy='type'
                  />
                )}
              </GraphContainer>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onClose={handleCloseAssetDetail} maxWidth="sm" fullWidth>
        <DialogTitle>Quantum Asset Details: {selectedAsset?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <strong>ID:</strong> {selectedAsset?.id}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Type:</strong> {selectedAsset?.type}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Current State:</strong> {selectedAsset?.state}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Entanglement Links:</strong>
          </Typography>
          {selectedAsset?.entanglementLinks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No entanglement links.
            </Typography>
          ) : (
            <Box component="ul" sx={{ pl: 2 }}>
              {selectedAsset?.entanglementLinks.map((linkId) => (
                <Box component="li" key={linkId}>
                  <Typography variant="body2">
                    <Button size="small" onClick={() => handleAssetClick(assets.find(a => a.id === linkId)!)}>
                      {assets.find(a => a.id === linkId)?.name || linkId}
                    </Button>
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssetDetail}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Asset Dialog */}
      <Dialog open={isCreateAssetModalOpen} onClose={handleCloseCreateAssetModal} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Quantum Asset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Asset Name"
            fullWidth
            variant="outlined"
            value={newAssetName}
            onChange={(e) => setNewAssetName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Asset Type"
            fullWidth
            variant="outlined"
            value={newAssetType}
            onChange={(e) => setNewAssetType(e.target.value as 'qubit' | 'register' | 'circuit')}
            SelectProps={{
              native: true,
            }}
            sx={{ mb: 2 }}
          >
            <option value="qubit">Qubit</option>
            <option value="register">Register</option>
            <option value="circuit">Circuit</option>
          </TextField>
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateAssetModal}>Cancel</Button>
          <Button onClick={handleCreateAsset} variant="contained" disabled={!newAssetName || loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Link Dialog */}
      <Dialog open={isCreateLinkModalOpen} onClose={handleCloseCreateLinkModal} maxWidth="sm" fullWidth>
        <DialogTitle>Create Entanglement Link</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Source Asset ID"
            fullWidth
            variant="outlined"
            value={linkSourceId}
            onChange={(e) => setLinkSourceId(e.target.value)}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Target Asset"
            fullWidth
            variant="outlined"
            value={linkTargetId}
            onChange={(e) => setLinkTargetId(e.target.value)}
            SelectProps={{
              native: true,
            }}
            sx={{ mb: 2 }}
          >
            <option value="">Select Target Asset</option>
            {assets
              .filter(asset => asset.id !== linkSourceId) // Don't link to self
              .map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.type})
                </option>
              ))}
          </TextField>
          {linkError && <Alert severity="error">{linkError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateLinkModal}>Cancel</Button>
          <Button onClick={handleCreateLink} variant="contained" disabled={!linkTargetId || isLinking}>
            {isLinking ? <CircularProgress size={24} /> : 'Create Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuantumAssetManager;