import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Box,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Event as EventIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// --- Type Definitions ---
interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}

// --- Internal Generative Data Functions ---

const generateRandomString = (length: number = 10): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const generateDateInFuture = (days: number): string => {
  return new Date(new Date().setDate(new Date().getDate() + days)).toISOString();
};

const generateDateInPast = (days: number): string => {
  return new Date(new Date().setDate(new Date().getDate() - days)).toISOString();
};

const generateMockCalendarEvent = (): CalendarEvent => {
  const isDateTime = Math.random() > 0.5;
  const daysToAdd = Math.floor(Math.random() * 30) + 1;
  const start = isDateTime
    ? { dateTime: generateDateInFuture(daysToAdd) }
    : { date: generateDateInFuture(daysToAdd).split('T')[0] };
  return {
    id: `cal_${generateRandomString(8)}`,
    summary: `Generated Event: ${generateRandomString(20)}`,
    start: start,
    htmlLink: 'https://calendar.citibankdemobusinessinc.com/',
  };
};

const generateMockDriveFile = (): DriveFile => {
  const mimeTypes = [
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.folder',
    'application/pdf',
    'text/plain',
  ];
  const mimeType = mimeTypes[Math.floor(Math.random() * mimeTypes.length)];
  const nameParts = mimeType.split('.');
  const extension = nameParts[nameParts.length - 1].replace('google-apps-', '');
  const fileName = `${generateRandomString(15)}.${extension}`;

  return {
    id: `drv_${generateRandomString(8)}`,
    name: fileName,
    mimeType: mimeType,
    modifiedTime: generateDateInPast(Math.floor(Math.random() * 180)),
    webViewLink: 'https://drive.citibankdemobusinessinc.com/',
  };
};

// --- Mock API Calls (Internal Generative) ---

const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
  console.log('Fetching generated calendar events...');
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const count = Math.floor(Math.random() * 5) + 3; // 3 to 7 events
  const events = Array.from({ length: count }, generateMockCalendarEvent);
  return events.sort((a, b) => new Date(a.start.dateTime || a.start.date || 0).getTime() - new Date(b.start.dateTime || b.start.date || 0).getTime());
};

const fetchDriveFiles = async (): Promise<DriveFile[]> => {
  console.log('Fetching generated Drive files...');
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay
  const count = Math.floor(Math.random() * 7) + 5; // 5 to 11 files
  const files = Array.from({ length: count }, generateMockDriveFile);
  return files.sort((a,b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
};

// --- Helper Functions ---
const formatDateTime = (dateString?: string, dateOnlyString?: string): string => {
    const aDate = dateString ? new Date(dateString) : (dateOnlyString ? new Date(`${dateOnlyString}T00:00:00`) : new Date());
    if (dateOnlyString) {
        return aDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    }
    return aDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('spreadsheet')) return <AssessmentIcon sx={{color: '#0F9D58'}} />;
    if (mimeType.includes('document')) return <DescriptionIcon sx={{color: '#4285F4'}} />;
    if (mimeType.includes('folder')) return <FolderIcon sx={{color: '#757575'}} />;
    return <DescriptionIcon color="disabled" />;
}

// --- Business Model Specific Functions ---
// These functions would be specific to the business model and its operations.
// For this example, we'll keep them generic as they are placeholders.

const createNewFinancialReport = () => {
  console.log('Action: Creating a new financial report.');
  // In a real app, this would trigger internal logic to create a new document/spreadsheet.
  alert('Action: Create a new financial report from a template.');
};

const scheduleNewMeeting = () => {
  console.log('Action: Scheduling a new meeting.');
  // In a real app, this would open a pre-populated internal scheduling interface.
  window.open('https://calendar.citibankdemobusinessinc.com/schedule', '_blank');
};

// --- Main Component ---
const ProductivityCommandCenter: React.FC = () => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [events, files] = await Promise.all([
        fetchCalendarEvents(),
        fetchDriveFiles(),
      ]);
      setCalendarEvents(events);
      setDriveFiles(files);
    } catch (err) {
      setError('Failed to load dashboard data. Please check your connection to internal services.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Syncing with Citibankdemobusinessinc services...</Typography>
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadDashboardData}>
          RETRY
        </Button>
      }>{error}</Alert>;
    }

    return (
      <Grid container spacing={4}>
        {/* Calendar Section */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Upcoming Financial Deadlines"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={scheduleNewMeeting}
                >
                  Schedule
                </Button>
              }
            />
            <CardContent sx={{pt: 0}}>
              <List dense>
                {calendarEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem
                      button
                      component="a"
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ListItemIcon>
                        <EventIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={event.summary}
                        secondary={formatDateTime(event.start.dateTime, event.start.date)}
                      />
                    </ListItem>
                    {index < calendarEvents.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Drive Section */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Financial Reporting Workspace"
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={createNewFinancialReport}
                >
                  New Report
                </Button>
              }
            />
            <CardContent sx={{pt: 0}}>
              <List dense>
                {driveFiles.map((file, index) => (
                  <React.Fragment key={file.id}>
                    <ListItem
                      button
                      component="a"
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ListItemIcon>
                        {getFileIcon(file.mimeType)}
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`Last modified: ${new Date(file.modifiedTime).toLocaleDateString()}`}
                      />
                    </ListItem>
                    {index < driveFiles.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Financial Reporting Command Center
        </Typography>
        <Tooltip title="Refresh Data">
          <span>
            <IconButton onClick={loadDashboardData} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      
      {renderContent()}
    </Container>
  );
};

export default ProductivityCommandCenter;