import React, { useState, useEffect, useCallback, MouseEvent } from 'react';
import {
  Box,
  Container,
  Typography,
  Toolbar,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Google as GoogleIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// --- Type Definitions ---

type FileType = 'folder' | 'file';

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: number; // in bytes
  modifiedAt: Date;
  path: string;
}

interface DataSource {
  id: string;
  name: string;
  icon: React.ReactElement;
}

type Order = 'asc' | 'desc';
type OrderBy = keyof FileItem;

// --- Mock API Service ---
// In a real application, this would be replaced with actual API calls
// to Google Drive, GitHub, etc., using the user's OAuth token.

const MOCK_DRIVE_FILES: Record<string, FileItem[]> = {
  '/': [
    { id: '1', name: 'Projects', type: 'folder', size: 0, modifiedAt: new Date('2023-10-26T10:00:00Z'), path: '/Projects' },
    { id: '2', name: 'Documents', type: 'folder', size: 0, modifiedAt: new Date('2023-10-25T11:30:00Z'), path: '/Documents' },
    { id: '3', name: 'api-spec-v3.1.json', type: 'file', size: 15360, modifiedAt: new Date('2023-10-27T09:15:00Z'), path: '/' },
    { id: '4', name: 'README.md', type: 'file', size: 2048, modifiedAt: new Date('2023-09-01T14:00:00Z'), path: '/' },
  ],
  '/Projects': [
    { id: '5', name: 'openapi-generator', type: 'folder', size: 0, modifiedAt: new Date('2023-10-26T10:05:00Z'), path: '/Projects/openapi-generator' },
    { id: '6', name: 'project-plan.docx', type: 'file', size: 122880, modifiedAt: new Date('2023-10-26T12:00:00Z'), path: '/Projects' },
  ],
  '/Projects/openapi-generator': [
     { id: '7', name: 'src', type: 'folder', size: 0, modifiedAt: new Date('2023-10-26T10:06:00Z'), path: '/Projects/openapi-generator/src' },
     { id: '8', name: 'package.json', type: 'file', size: 1024, modifiedAt: new Date('2023-10-26T10:07:00Z'), path: '/Projects/openapi-generator' },
  ],
  '/Documents': [
    { id: '9', name: 'meeting-notes.pdf', type: 'file', size: 512000, modifiedAt: new Date('2023-10-25T11:35:00Z'), path: '/Documents' },
  ],
  '/Projects/openapi-generator/src': [],
};

const mockApi = {
  getFiles: async (dataSourceId: string, path: string): Promise<FileItem[]> => {
    console.log(`Fetching files for ${dataSourceId} at path: ${path}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    if (Math.random() < 0.05) { // Simulate random error
        throw new Error("Failed to connect to the data source.");
    }
    return MOCK_DRIVE_FILES[path] || [];
  },
  // Add mock functions for upload, delete, etc.
};

// --- Helper Functions ---

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DataLakeView: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('name');

  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; file: FileItem } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  const dataSources: DataSource[] = [
    { id: 'google-drive', name: 'Google Drive', icon: <GoogleIcon fontSize="small" /> },
    { id: 'github', name: 'GitHub Repositories', icon: <StorageIcon fontSize="small" /> },
    // Add more data sources here
  ];
  const [selectedSource, setSelectedSource] = useState<string>(dataSources[0].id);

  const fetchFiles = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedFiles = await mockApi.getFiles(selectedSource, path);
      setFiles(fetchedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath, fetchFiles]);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedFiles = React.useMemo(() => {
    const comparator = (a: FileItem, b: FileItem) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;

        if (b[orderBy] < a[orderBy]) {
            return order === 'asc' ? 1 : -1;
        }
        if (b[orderBy] > a[orderBy]) {
            return order === 'asc' ? -1 : 1;
        }
        return 0;
    };
    return [...files].sort(comparator);
  }, [files, order, orderBy]);

  const handleRowClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
    } else {
      // Potentially open a file preview modal
      console.log('Previewing file:', file.name);
    }
  };

  const handleBreadcrumbClick = (pathSegment: string, index: number) => {
    const segments = currentPath.split('/').filter(Boolean);
    const newPath = '/' + segments.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
  };

  const handleContextMenu = (event: MouseEvent<HTMLTableRowElement>, file: FileItem) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4, file }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteClick = () => {
    if (contextMenu) {
      setFileToDelete(contextMenu.file);
      setDeleteConfirmOpen(true);
    }
    handleCloseContextMenu();
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      console.log('Deleting file:', fileToDelete.name);
      // TODO: Implement actual delete API call
      setFiles(files.filter(f => f.id !== fileToDelete.id));
    }
    setDeleteConfirmOpen(false);
    setFileToDelete(null);
  };

  const handleSourceChange = (event: SelectChangeEvent<string>) => {
    setSelectedSource(event.target.value);
    setCurrentPath('/'); // Reset path when changing source
  };

  const renderBreadcrumbs = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={() => setCurrentPath('/')}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Root
        </Link>
        {pathSegments.map((segment, index) => (
          <Link
            underline="hover"
            color="inherit"
            href="#"
            key={index}
            onClick={() => handleBreadcrumbClick(segment, index)}
          >
            {segment}
          </Link>
        ))}
      </Breadcrumbs>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Data Lake
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage files and data sources for your projects.
      </Typography>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Toolbar disableGutters>
          <FormControl sx={{ m: 1, minWidth: 220 }} size="small">
            <InputLabel id="data-source-select-label">Data Source</InputLabel>
            <Select
              labelId="data-source-select-label"
              id="data-source-select"
              value={selectedSource}
              label="Data Source"
              onChange={handleSourceChange}
            >
              {dataSources.map(source => (
                <MenuItem key={source.id} value={source.id}>
                  <ListItemIcon>{source.icon}</ListItemIcon>
                  <ListItemText>{source.name}</ListItemText>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{ mr: 1 }}
            onClick={() => alert('File upload functionality to be implemented.')}
          >
            Upload File
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={() => fetchFiles(currentPath)}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>

        {renderBreadcrumbs()}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : (
          <TableContainer>
            <Table stickyHeader aria-label="file table">
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '50%' }}>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'size'}
                      direction={orderBy === 'size' ? order : 'asc'}
                      onClick={() => handleRequestSort('size')}
                    >
                      Size
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'modifiedAt'}
                      direction={orderBy === 'modifiedAt' ? order : 'asc'}
                      onClick={() => handleRequestSort('modifiedAt')}
                    >
                      Last Modified
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFiles.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} align="center">
                            <Typography color="text.secondary">This folder is empty.</Typography>
                        </TableCell>
                    </TableRow>
                ) : (
                    sortedFiles.map((file) => (
                    <TableRow
                        hover
                        key={file.id}
                        onDoubleClick={() => handleRowClick(file)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        style={{ cursor: 'pointer' }}
                    >
                        <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {file.type === 'folder' ? <FolderIcon sx={{ mr: 1.5, color: 'primary.main' }} /> : <FileIcon sx={{ mr: 1.5, color: 'text.secondary' }} />}
                            {file.name}
                        </Box>
                        </TableCell>
                        <TableCell align="right">{file.type === 'file' ? formatBytes(file.size) : '—'}</TableCell>
                        <TableCell align="right">{format(file.modifiedAt, 'PPp')}</TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.file.type === 'file' && (
            <MenuItem onClick={handleCloseContextMenu}>
                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Download</ListItemText>
            </MenuItem>
        )}
        <MenuItem onClick={handleCloseContextMenu}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to permanently delete "{fileToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DataLakeView;