```typescript
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

// --- Mock API Calls ---
// In a real application, these would use the Google API client library
// and handle OAuth2 authentication.

const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'cal1',
    summary: 'Q3 Financial Report Deadline',
    start: { date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0] },
    htmlLink: 'https://calendar.google.com/',
  },
  {
    id: 'cal2',
    summary: 'Board Meeting: Review Q2 Performance',
    start: { dateTime: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() },
    htmlLink: 'https://calendar.google.com/',
  },
  {
    id: 'cal3',
    summary: 'Finalize Budget for Next Fiscal Year',
    start: { dateTime: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString() },
    htmlLink: 'https://calendar.google.com/',
  },
  {
    id: 'cal4',
    summary: 'Audit Committee Sync',
    start: { dateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString() },
    htmlLink: 'https://calendar.google.com/',
  },
];

const mockDriveFiles: DriveFile[] = [
  {
    id: 'drv1',
    name: 'Q3_Financial_Projections_v2.gsheet',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    modifiedTime: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    webViewLink: 'https://docs.google.com/spreadsheets/',
  },
  {
    id: 'drv2',
    name: 'Q2_Performance_Summary.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    modifiedTime: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    webViewLink: 'https://docs.google.com/document/',
  },
    {
    id: 'drv3',
    name: '2024_Budget_Planning_Draft.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    modifiedTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    webViewLink: 'https://docs.google.com/document/',
  },
  {
    id: 'drv4',
    name: 'Archived Reports Q1-2023',
    mimeType: 'application/vnd.google-apps.folder',
    modifiedTime: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString(),
    webViewLink: 'https://drive.google.com/drive/folders/',
  },
];

const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
  console.log('Fetching calendar events...');
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  // In a real app, you'd handle potential API errors here
  // if (Math.random() > 0.8) throw new Error("Failed to fetch calendar data.");
  return mockCalendarEvents.sort((a, b) => new Date(a.start.dateTime || a.start.date || 0).getTime() - new Date(b.start.dateTime || b.start.date || 0).getTime());
};

const fetchDriveFiles = async (): Promise<DriveFile[]> => {
  console.log('Fetching Drive files...');
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  // if (Math.random() > 0.8) throw new Error("Failed to fetch Drive files.");
  return mockDriveFiles.sort((a,b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
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
      setError('Failed to load dashboard data. Please check your connection to Google services.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateReport = () => {
    // In a real app, this would trigger the Google Drive API to create a new spreadsheet from a template
    alert('Action: Create a new financial report from a template.');
  };

  const handleScheduleMeeting = () => {
    // This would open a pre-populated Google Calendar event creation page
    window.open('https://calendar.google.com/calendar/r/eventedit', '_blank');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Syncing with Google Workspace...</Typography>
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
                  onClick={handleScheduleMeeting}
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
                  onClick={handleCreateReport}
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
```