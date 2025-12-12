import React, { useState, useEffect, useMemo, FC } from 'react';
import {
  Box,

  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Typography,
  CircularProgress,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ServicePrincipal {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

type Order = 'asc' | 'desc';

interface HeadCell {
  disablePadding: boolean;
  id: keyof ServicePrincipal;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'displayName', numeric: false, disablePadding: true, label: 'Display Name' },
  { id: 'applicationType', numeric: false, disablePadding: false, label: 'Application Type' },
  { id: 'accountEnabled', numeric: false, disablePadding: false, label: 'Enabled' },
  { id: 'assignmentRequired', numeric: false, disablePadding: false, label: 'Assignment Required' },
  { id: 'createdDateTime', numeric: false, disablePadding: false, label: 'Created Date' },
  { id: 'appId', numeric: false, disablePadding: false, label: 'Application ID' },
  { id: 'id', numeric: false, disablePadding: false, label: 'Object ID' },
];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: number | string | boolean }, b: { [key in Key]: number | string | boolean }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof ServicePrincipal) => void;
  order: Order;
  orderBy: string;
}

const EnhancedTableHead: FC<EnhancedTableProps> = (props) => {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property: keyof ServicePrincipal) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

const parseCsvData = (csvText: string): ServicePrincipal[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      // Basic CSV parsing, assumes no commas within quoted fields
      const values = line.split(',');
      const entry = headers.reduce((obj, header, index) => {
        const key = header as keyof ServicePrincipal;
        let value: any = values[index]?.trim().replace(/^"|"$/g, '') || '';
        
        if (key === 'accountEnabled' || key === 'assignmentRequired' || key === 'isAppProxy') {
          value = value.toLowerCase() === 'true';
        }

        obj[key] = value;
        return obj;
      }, {} as any);
      return entry as ServicePrincipal;
    });
};

const convertToCSV = (data: ServicePrincipal[]) => {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(fieldName => {
                const value = (row as any)[fieldName];
                const stringValue = String(value ?? '');
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(',')
        )
    ];
    return csvRows.join('\n');
};

const downloadCSV = (data: ServicePrincipal[], filename: string) => {
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


export default function AuditReportView() {
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<ServicePrincipal[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof ServicePrincipal>('displayName');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filter, setFilter] = useState('');

  const loadData = () => {
    setLoading(true);
    setError(null);
    // Simulate API call
    setTimeout(() => {
        try {
            const data = parseCsvData(sampleCsvData);
            setReportData(data);
        } catch (e) {
            setError('Failed to parse report data.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, 1000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof ServicePrincipal) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilter(event.target.value);
      setPage(0);
  };

  const handleDownload = () => {
      downloadCSV(filteredData, 'service-principal-audit-report.csv');
  };

  const filteredData = useMemo(() => {
    if (!filter) {
      return reportData;
    }
    const lowercasedFilter = filter.toLowerCase();
    return reportData.filter((item) =>
      Object.values(item).some((value) => String(value).toLowerCase().includes(lowercasedFilter))
    );
  }, [reportData, filter]);

  const visibleRows = useMemo(
    () =>
      stableSort(filteredData, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [order, orderBy, page, rowsPerPage, filteredData],
  );

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          <Typography
            sx={{ flex: '1 1 100%', mb: {xs: 2, md: 0} }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Service Principal Audit Report
          </Typography>
          <TextField
              label="Filter Report"
              variant="outlined"
              size="small"
              value={filter}
              onChange={handleFilterChange}
              sx={{ minWidth: '250px', mr: 2 }}
          />
          <Tooltip title="Refresh Data">
              <IconButton onClick={loadData}>
                  <RefreshIcon />
              </IconButton>
          </Tooltip>
          <Tooltip title="Download CSV">
              <IconButton onClick={handleDownload}>
                  <DownloadIcon />
              </IconButton>
          </Tooltip>
        </Toolbar>

        {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        ) : error ? (
            <Typography color="error" sx={{p: 3}}>{error}</Typography>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
              <Table stickyHeader aria-labelledby="tableTitle">
                <EnhancedTableHead
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                />
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow hover tabIndex={-1} key={row.id}>
                      <TableCell component="th" scope="row" padding="none">
                        {row.displayName}
                      </TableCell>
                      <TableCell>{row.applicationType || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                            label={row.accountEnabled ? 'Enabled' : 'Disabled'}
                            color={row.accountEnabled ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                            label={row.assignmentRequired ? 'Yes' : 'No'}
                            color={row.assignmentRequired ? 'info' : 'default'}
                            size="small"
                            variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{new Date(row.createdDateTime).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.appId}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.id}</TableCell>
                    </TableRow>
                  ))}
                   {visibleRows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={headCells.length} align="center">
                                No results found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}

const sampleCsvData = `id,displayName,appId,createdDateTime,applicationType,accountEnabled,applicationVisibility,assignmentRequired,isAppProxy
00a67483-ea0d-4bfa-a19b-17ae35e97fe3,ADP,3f18b202-a866-4c1f-b9c0-6598390a2092,2022-05-04T08:14:29Z,Enterprise Application,True,Visible,True,False
00b4db41-9f4b-4f95-96df-8a8436aee693,Terraform Enterprise,fd681d32-9e97-4876-a58f-05269cf838e4,2022-05-04T08:02:58Z,Enterprise Application,True,Visible,True,False
00f21adf-4610-4184-b930-c5c5b0bd5f8a,jocall3-13-325f9500-3bd3-48fe-b130-806f56e2e7cc,2e8265ff-5066-4e5d-ae61-dbcc32816115,2022-04-10T03:23:21Z,,True,Visible,False,False
012b9292-17c5-4ed1-a899-e831b1088a22,Microsoft Substrate Management,98db8bd6-0cc0-4e67-9de5-f187f1cd1b41,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
0174c5a1-66f3-4929-913b-dfb7afe762ab,Azure Data Factory,0947a342-ab4a-43be-93b3-b8243fc161e5,2022-04-15T14:47:15Z,Microsoft Application,True,Visible,False,False
0208605f-08b1-492b-a0fd-ac6294e14b1f,Azure Machine Learning Singularity,607ece82-f922-494f-88b8-30effaf12214,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
0249afa8-c384-4bbd-ba62-51be0d7cce63,HealthBot-RP,6db4d6bb-6649-4dc2-84b7-0b5c6894031e,2022-04-15T14:47:58Z,Microsoft Application,True,Visible,False,False
028daf06-3ca2-4f3f-8b6e-442b8d945daf,Microsoft.MileIQ.RESTService,b692184e-b47f-4706-b352-84b288d2d9ee,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
029bfbeb-281e-43ea-8755-73fa84943a44,Microsoft Mobile Application Management Backend,354b5b6d-abd6-4736-9f51-1be80049b91f,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
038cb5e8-15d7-4f48-9004-e6d59f9c5dd7,AzureDatabricks,2ff814a6-3304-4ab8-85cb-cd0e6f879c1d,2022-04-07T09:52:32Z,Microsoft Application,True,Visible,False,False
039d6906-ed43-42ca-bbf4-ee91e85b4bf8,Azure Machine Learning Services,18a66f5f-dbdf-4c17-9dd7-1634712a9cbe,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
03d41fe2-06b6-43d4-b181-af146f8e3e7f,Azure Notification Service,b503eb83-1222-4dcc-b116-b98ed5216e05,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
043d80c6-801d-40db-bc46-b570b9787d6e,Application Insights API,f5c26e74-f226-4ae8-85f0-b4af0080ac9e,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
043e99f7-0f2e-4387-9b76-c970aa9791ac,CPIM Service,bb2a2e3a-c5e7-4f0a-88e0-8e01fd3fc1f4,2022-04-16T23:42:40Z,Microsoft Application,True,Visible,False,False
05211dc7-8c79-4c6b-bce0-579fc42f535f,Azure Spring Cloud Domain-Management Dogfood,584a29b4-7876-4445-921e-71e427d4f4b3,2022-04-12T08:29:48Z,Microsoft Application,True,Visible,False,False
0557f2e6-8457-4a58-becc-fe5993a105ac,Adobe Connect,d3e1650d-38f0-4a3c-8c2d-a064cc8d9893,2022-05-04T08:13:47Z,Enterprise Application,True,Visible,True,False
05966bf2-394d-49d1-8950-aa3521c54051,Microsoft.Azure.CertificateRegistration,f3c21649-0979-4721-ac85-b0216b2cf413,2022-04-07T05:26:54Z,Microsoft Application,True,Visible,False,False
07f2f721-e1f6-4d65-ae15-f6e448afea60,Outlook Online Add-in App,bc59ab01-8403-45c6-8796-ac3ef710b3e3,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
09a9d819-2ca2-41c5-acaf-97889769ee89,Compute Usage Provider,a303894e-f1d8-4a37-bf10-67aa654a0596,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
0a6d1c11-8d3d-4afd-a793-c4e8a7296c4a,Azure Managed Grafana SSO,6f2d169c-08f3-4a4c-a982-bcaf2d038c45,2022-04-15T14:46:43Z,Microsoft Application,True,Visible,False,False
0a99424f-024a-40bd-b9be-6ae12ab502e3,PlayFab,448adbda-b8d8-4f33-a1b0-ac58cf44d4c1,2022-04-15T14:48:52Z,Microsoft Application,True,Visible,False,False
0ab21449-f496-4f9c-b9c7-6294a97ef1df,Managed Disks Resource Provider,60e6cd67-9c8c-4951-9b3c-23c25a2169af,2022-03-28T03:48:58Z,Microsoft Application,True,Visible,False,False
0afd5e86-eff5-4769-9dbf-b75866d280e7,AzureDataShare,799f1985-1517-4fe1-af2b-ba3d87d4996b,2022-04-07T10:13:59Z,Microsoft Application,True,Visible,False,False
0b052270-067f-4a8b-a73e-01afa1594928,Liftr Confluent RPaaS,1448fd13-7e74-41f4-b6e3-17e485d8ac2e,2022-04-15T14:46:19Z,Microsoft Application,True,Visible,False,False
0b5f7e78-2717-4f65-8f81-59f93971fc94,Azure Regional Service Manager,5e5e43d4-54da-4211-86a4-c6e7f3715801,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
0b95e78b-c884-4a7a-9e37-ba496672fe0b,Access IoT Hub Device Provisioning Service,0cd79364-7a90-4354-9984-6e36c841418d,2022-04-07T10:01:27Z,Microsoft Application,True,Visible,False,False
0bf5fb00-4b35-481e-8c37-5d157d49fd6c,Azure Multi-Factor Auth Connector,1f5530b3-261a-47a9-b357-ded261e17918,2022-04-13T22:24:35Z,Microsoft Application,True,Visible,False,False
0c4f13f3-706d-4006-9218-6ad726249dbf,MicrosoftHybridDataAADapp,621269cf-1195-44a3-a835-c613d103dd15,2022-04-15T14:47:53Z,Microsoft Application,True,Visible,False,False
0cab0d7c-b8cc-45d4-9bff-87f3901cc131,Office 365 Exchange Online,00000002-0000-0ff1-ce00-000000000000,2022-04-13T22:24:35Z,Microsoft Application,True,Visible,False,False
0cd21db1-ab57-4b70-a942-8be945120567,Dynamics 365 Business Central,996def3d-b36c-4153-8607-a6fd3c01b89f,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
0cde9d2b-cba6-481a-bd8d-e288774d7cbd,Office 365 SharePoint Online,00000003-0000-0ff1-ce00-000000000000,2022-04-13T22:24:35Z,Microsoft Application,False,Visible,False,False
0d0e5cff-bb6a-48a6-a30a-d03f4eeacd7c,Cortana at Work Bing Services,22d7579f-06c2-4baa-89d2-e844486adb9d,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
0d2b9521-cd89-4c17-aae8-7bbf43ad94d0,aciapi,c5b17a4f-cc6f-4649-9480-684280a2af3a,2022-04-12T17:28:45Z,Microsoft Application,True,Visible,False,False
0d5d08b9-2c48-4cb4-be79-88fb8df8a256,Azure Purview,73c2949e-da2d-457a-9607-fcc665198967,2022-04-15T14:48:55Z,Microsoft Application,True,Visible,False,False
0e474b1c-b64a-4254-86d4-50b8d0f6d45b,Microsoft Office Web Apps Service,67e3df25-268a-4324-a550-0de1c7f97287,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
0eb977e2-5804-44d6-85a3-96d14a191fff,MCAPI Authorization Prod,d73f4b35-55c9-48c7-8b10-651f6f2acb2e,2022-03-04T02:36:00Z,Microsoft Application,True,Visible,False,False
0ecec5f6-db13-4b20-b9bf-88f6dc2be5c3,Service Bus MSI App,eb070ea5-bd17-41f1-ad68-5851f6e71774,2022-04-15T14:49:16Z,Microsoft Application,True,Visible,False,False
0f246e67-5ac7-4bbb-b47c-63476cdc3d30,Azure Analysis Services,4ac7d521-0382-477b-b0f8-7e1d95f85ca2,2022-04-15T14:45:11Z,Microsoft Application,True,Visible,False,False
0f3f5d84-d6eb-47b6-bc79-3be3e97f551a,HIS AAD Private Clouds App,9ddb5749-5660-445d-b859-394225a7d97d,2022-04-15T14:45:43Z,Microsoft Application,True,Visible,False,False
0f8e73e9-35eb-4c57-a681-95f96da5b49a,Fluid Relay Service,3e8f1ed5-3a6e-47d1-ad1e-b14e6b69704b,2022-04-15T14:47:23Z,Microsoft Application,True,Visible,False,False
0f9928e5-1742-4dab-a8f4-a7f9138e40d5,Storage Resource Provider,a6aa9161-5291-40bb-8c5c-923b567bee3b,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
0fa9a81f-944b-4617-861c-bc2a6c2bcbd1,Graph Connector Service,56c1da01-2129-48f7-9355-af6d59d42766,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
1000f08e-e822-4753-bb33-a994677fcd06,Microsoft.OfficeModernCalendar,ab27a73e-a3ba-4e43-8360-8bcc717114d8,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
1042613d-4f98-49e8-88bb-79aa4089365e,ACR-Tasks-Network,62c559cd-db0c-4da0-bab2-972528c65d42,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
119c2499-a11e-4d59-8a9d-76b8966a88bb,Azure Virtual Desktop ARM Provider,50e95039-b200-4007-bc97-8d5790743a63,2022-04-07T03:10:19Z,Microsoft Application,True,Visible,False,False
119cbfb8-3550-4afb-8c65-a28529769674,Azure Monitor for SAP Solutions,39495caf-cc21-4d03-b6b0-8c4a973cf213,2022-04-15T14:44:34Z,Microsoft Application,True,Visible,False,False
119dde92-597e-426d-ad19-b38a86529a01,AFOI-NC-RP-PME-PROD,05cf5e27-931d-47ad-826d-cb9028d8bd7a,2022-04-15T14:48:29Z,Microsoft Application,True,Visible,False,False