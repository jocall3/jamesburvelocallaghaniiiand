
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Define types
interface Asset {
  assetId: string;
  assetType: string;
  assetName: string;
  imageUrl?: string;
  details: { [key: string]: any };
}

interface AssetCatalogProps {
  assets: Asset[];
  onAssetSelected: (asset: Asset) => void;
  getAssetDetails: (assetId: string) => Promise<any>;
}

const AssetCard = styled(Card)(({ theme }) => ({
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const AssetCatalog: React.FC<AssetCatalogProps> = ({ assets, onAssetSelected, getAssetDetails }) => {
  const theme = useTheme();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetDetails, setAssetDetails] = useState<{ [key: string]: any } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);


  const handleAssetClick = async (asset: Asset) => {
    setSelectedAsset(asset);
    setDialogOpen(true);
    setLoadingDetails(true);
    setAssetDetails(null);

    try {
      const details = await getAssetDetails(asset.assetId);
      setAssetDetails(details);
    } catch (error) {
      console.error("Error fetching asset details:", error);
      // Optionally, set an error state here to display an error message in the dialog
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedAsset(null);
    setAssetDetails(null);
  };


  const handleTogglePasswordVisibility = () => {
      setPasswordVisible(!passwordVisible);
  };


  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        Managed Assets
      </Typography>

      <Grid container spacing={2}>
        {assets.map((asset) => (
          <Grid item xs={12} sm={6} md={4} key={asset.assetId}>
            <AssetCard onClick={() => handleAssetClick(asset)} sx={{ cursor: 'pointer' }}>
              <CardMedia
                component="img"
                alt={asset.assetName}
                height="140"
                image={asset.imageUrl || 'https://via.placeholder.com/150'} // Use a placeholder if no image
              />
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {asset.assetName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {asset.assetType}
                </Typography>
              </CardContent>
            </AssetCard>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAsset?.assetName} Details
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
              <CircularProgress />
            </Box>
          ) : assetDetails ? (
            Object.entries(assetDetails).map(([key, value]) => (
              <Box key={key} sx={{ marginBottom: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {key}:
                </Typography>
                {Array.isArray(value) ? (
                  value.map((item, index) => (
                    <Typography key={index} variant="body2">
                      {JSON.stringify(item)}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">
                    {typeof value === 'string' && (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret'))
                        ? (passwordVisible ? value : '********')
                        : JSON.stringify(value)}
                  </Typography>
                )}
                  {typeof value === 'string' && (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) && (
                      <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                      >
                          {passwordVisible ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                  )}
              </Box>
            ))
          ) : (
            <Typography variant="body1">
              No details available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetCatalog;
