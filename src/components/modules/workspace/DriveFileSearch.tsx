```typescript
import React, { useState, useCallback } from 'react';
import { TextField, Button, List, ListItem, ListItemText, ListItemIcon, IconButton, Typography, Box, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
}

const DriveFileSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const { isSignedIn, googleApiClient } = useGoogleDrive();


  const handleSearch = useCallback(async () => {
    if (!isSignedIn || !googleApiClient) {
      console.warn("Not signed in or Google API client not initialized.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await googleApiClient.client.drive.files.list({
        q: `fullText contains '${query}' and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink, iconLink)',
      });

      const files = response.result.files as DriveFile[] || [];
      setSearchResults(files);
    } catch (error) {
      console.error('Error searching Drive files:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, isSignedIn, googleApiClient]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handlePreview = (file: DriveFile) => {
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };


  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <TextField
          label="Search Drive"
          variant="outlined"
          size="small"
          value={query}
          onChange={handleInputChange}
          fullWidth
          disabled={!isSignedIn}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          disabled={!isSignedIn || isLoading}
          sx={{ ml: 1 }}
        >
          Search
        </Button>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          <CircularProgress />
        </Box>
      )}

      {isSignedIn ? (
        searchResults.length > 0 ? (
          <List>
            {searchResults.map((file) => (
              <ListItem key={file.id} secondaryAction={
                <IconButton edge="end" aria-label="preview" onClick={() => handlePreview(file)}>
                  <VisibilityIcon />
                </IconButton>
              }>
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
          </List>
        ) : (
          !isLoading && query.length > 0 && (
            <Typography variant="body2" color="textSecondary">
              No files found matching "{query}".
            </Typography>
          )
        )
      ) : (
        <Typography variant="body2" color="textSecondary">
          Sign in to Google to search your Drive.
        </Typography>
      )}

      {previewFile && (
        <Box position="fixed" top={0} left={0} width="100%" height="100%" bgcolor="rgba(0,0,0,0.5)" display="flex" justifyContent="center" alignItems="center" zIndex={1000}>
          <Box bgcolor="white" p={2} borderRadius={4} maxWidth="80%" maxHeight="80%" overflow="auto" position="relative">
            <IconButton aria-label="close" onClick={handleClosePreview} sx={{ position: 'absolute', top: 8, right: 8 }}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" gutterBottom>
              {previewFile.name}
            </Typography>
            <iframe src={previewFile.webViewLink} title={previewFile.name} width="100%" height="600px" />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DriveFileSearch;
```