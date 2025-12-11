
import React from 'react';
import { Box, Container, Typography, Tabs, Tab, Chip, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams, GridToolbar } from '@mui/x-data-grid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const csvData = `id,displayName,appId,createdDateTime,applicationType,accountEnabled,applicationVisibility,assignmentRequired,isAppProxy
00a67483-ea0d-4bfa-a19b-17ae35e97fe3,ADP,3f18b202-a866-4c1f-b9c0-6598390a2092,2022-05-04T08:14:29Z,Enterprise Application,True,Visible,True,False
00b4db41-9f4b-4f95-96df-8a8436aee693,Terraform Enterprise,fd681d32-9e97-4876-a58f-05269cf838e4,2022-05-04T08:02:58Z,Enterprise Application,True,Visible,True,False
00f21adf-4610-4184-b930-c5c5b0bd5f8a,jocall3-13-325f9500-3bd3-48fe-b130-806f56e2e7cc,2e8265ff-5066-4e5d-ae61-dbcc32816115,2022-04-10T03:23:21Z,,True,Visible,False,False
012b9292-17c5-4ed1-a899-e831b1088a22,Microsoft Substrate Management,98db8bd6-0cc0-4e67-9de5-f187f1cd1b41,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
18fdd139-6e86-44b3-a08a-30acbf7316f4,LexisNexis Law Schools,e5d38734-8683-4c09-9e0d-73a883c2d83d,2022-05-04T08:23:45Z,Enterprise Application,True,Visible,True,False
195ff216-c783-4ebb-99a7-7fd7520cdc45,Microsoft Azure Container Apps - Control Plane,7e3bc4fd-85a3-4192-b177-5b8bfc87f42c,2022-04-06T19:33:33Z,Microsoft Application,True,Visible,False,False
19fbbfe7-8bd8-4273-86d3-501319e749ce,Defender for Containers provisioning ARC k8s Enabled,f6ec9458-aa91-4c6e-bb3f-7b7c946c1b44,2022-04-13T05:11:00Z,Managed Identity,True,Visible,False,False
1e6225b5-895e-4acf-8cac-ca9cc8bc5620,"Capacity ",fbc197b7-9e9c-4f98-823f-93cb1cb554e6,2022-04-13T04:47:30Z,Microsoft Application,True,Visible,False,False
2054d9bc-67b1-448f-898b-bd70978f3809,Oracle Fusion ERP,65b0413c-6b56-4536-a2ea-1929dfe5e81c,2022-05-02T21:18:51Z,Enterprise Application,True,Visible,True,False
2c82ee8a-afbf-4389-924f-a2b525c6ed39,Azure Portal,c44b4083-3bb0-49c1-b47d-974e53cbdf3c,2022-03-04T02:59:26Z,Microsoft Application,True,Visible,False,False
2e6fa0e5-d738-4db9-bfb5-5605f1f823b6,Windows Azure Active Directory,00000002-0000-0000-c000-000000000000,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
41728631-ee7b-4287-bf6c-c326c12fee14,Microsoft Graph,00000003-0000-0000-c000-000000000000,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
4cbb3354-396a-4ae8-83d4-c7f8535db0f5,"The NEW GLOBAL NETWORK ",e1b4ed32-0aea-4286-88bf-5df97be96abc,2022-05-04T08:15:52Z,Enterprise Application,True,Visible,True,False
8ca312cd-b232-458a-8d15-0ba12b80359e,Active Directory for GitHub Enterprise,e572cafa-59db-4a44-badf-c3747f054c60,2022-05-04T08:12:54Z,Enterprise Application,True,Visible,True,False
9daf1795-5d53-4b56-8731-9f173808f5d4,Azure DevOps,499b84ac-1321-427f-aa17-267ca6975798,2022-04-07T10:19:07Z,Microsoft Application,True,Visible,False,False
9e017d52-25f5-4be8-95ee-7526f7b8a5a7,"Citibank ",2d696fb1-e862-4e01-ade3-2cf07c587ffd,2022-05-04T07:56:12Z,Enterprise Application,True,Visible,True,False
ba0d00c9-b91f-452f-b900-22f41cecec8f,Microsoft App Access Panel,0000000c-0000-0000-c000-000000000000,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
ea975396-f29a-438c-a79f-3d94f9052d90,Google Cloud / G Suite Connector by Microsoft,a23667b4-c8cf-42c1-86d6-25a4f46525f8,2022-04-15T11:38:22Z,Enterprise Application,True,Visible,True,False
fefefbb4-5f46-4dda-837b-1dc751bf9ea2,Salesforce,35274a02-4c3a-4878-9c89-7b9f1b09644f,2022-05-04T07:43:28Z,Enterprise Application,True,Visible,True,False
`;

interface ServicePrincipal {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: Date | null;
  applicationType: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

const parseCSV = (csv: string): ServicePrincipal[] => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const regex = /(?:,|^)("(?:[^"]|"")*"|[^,]*)/g;
    let match;
    const values = [];
    while ((match = regex.exec(line))) {
      let value = match[1];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1).replace(/""/g, '"');
      }
      values.push(value);
    }

    const obj = headers.reduce((acc, header, index) => {
      acc[header] = values[index] || '';
      return acc;
    }, {} as any);

    const createdDate = obj.createdDateTime ? new Date(obj.createdDateTime) : null;

    return {
      id: obj.id,
      displayName: obj.displayName,
      appId: obj.appId,
      createdDateTime: createdDate && !isNaN(createdDate.getTime()) ? createdDate : null,
      applicationType: obj.applicationType || 'Unknown',
      accountEnabled: obj.accountEnabled === 'True',
      applicationVisibility: obj.applicationVisibility,
      assignmentRequired: obj.assignmentRequired === 'True',
      isAppProxy: obj.isAppProxy === 'True',
    };
  });
};

const ServicePrincipalsDashboard: React.FC = () => {
    const servicePrincipals = React.useMemo(()