import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  TextField,
  Grid,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportGeneratorProps {
  // Add any props needed from the parent component
}

const ReportGenerator: React.FC<ReportGeneratorProps> = () => {
  const [reportType, setReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [customQuery, setCustomQuery] = useState<string>('');

  const handleReportTypeChange = (event: any) => {
    setReportType(event.target.value);
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date);
  };

  const handleStatusChange = (event: any) => {
    setStatus(event.target.value);
  };

  const handleIncludeHeadersChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeHeaders(event.target.checked);
  };

  const generateReportData = async () => {
    setIsLoading(true);
    setError(null);
    setReportData([]);

    // Simulate API call and data processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // Replace this with actual API call and data fetching logic
      const mockData = [
        { id: 1, name: 'Item A', value: 10, status: 'Active', date: dayjs().format('YYYY-MM-DD') },
        { id: 2, name: 'Item B', value: 20, status: 'Inactive', date: dayjs().format('YYYY-MM-DD') },
        { id: 3, name: 'Item C', value: 30, status: 'Active', date: dayjs().format('YYYY-MM-DD') },
      ];

      // Apply filters based on user input
      let filteredData = mockData;

      if (reportType) {
        filteredData = filteredData.filter((item) => item.name.includes(reportType)); // Example filter
      }

      if (startDate) {
        filteredData = filteredData.filter((item) => dayjs(item.date).isSameOrAfter(startDate, 'day'));
      }

      if (endDate) {
        filteredData = filteredData.filter((item) => dayjs(item.date).isSameOrBefore(endDate, 'day'));
      }

      if (status) {
        filteredData = filteredData.filter((item) => item.status === status);
      }

      setReportData(filteredData);
    } catch (e: any) {
      setError(e.message || 'Failed to generate report.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData || reportData.length === 0) {
      setError('No data to download.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData, { header: includeHeaders ? Object.keys(reportData[0]) : [], skipHeader: !includeHeaders });
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, 'compliance_report.xlsx');
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Compliance Report Generator
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="report-type-label">Report Type</InputLabel>
            <Select
              labelId="report-type-label"
              id="report-type"
              value={reportType}
              label="Report Type"
              onChange={handleReportTypeChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Audit">Audit Report</MenuItem>
              <MenuItem value="Security">Security Report</MenuItem>
              <MenuItem value="Compliance">Compliance Report</MenuItem>
              <MenuItem value="Custom">Custom Report</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={status}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Custom Query (Optional)"
            multiline
            rows={4}
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Enter a custom query to filter the data"
            helperText="This field allows you to specify a custom query for advanced filtering."
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox checked={includeHeaders} onChange={handleIncludeHeadersChange} />}
            label="Include Headers in Report"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={generateReportData} disabled={isLoading}>
          Generate Report
          {isLoading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} />}
        </Button>

        {reportData.length > 0 && (
          <Button variant="contained" color="success" onClick={downloadReport} sx={{ ml: 2 }} disabled={isLoading}>
            Download Report
          </Button>
        )}
      </Box>

      {reportData.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Report Preview:</Typography>
          <pre>{JSON.stringify(reportData, null, 2)}</pre>
        </Box>
      )}
    </Box>
  );
};

export default ReportGenerator;