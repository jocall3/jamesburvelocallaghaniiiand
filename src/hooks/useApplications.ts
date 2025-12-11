
import { useState, useEffect } from 'react';

export interface Application {
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

const rawCsvData = `id,displayName,appId,createdDateTime,applicationType,accountEnabled,applicationVisibility,assignmentRequired,isAppProxy
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
0b052270-067f-4a8b-a73e-01afa1594928,Lif