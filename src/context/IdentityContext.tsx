import React, { createContext, useState, useEffect, useMemo, ReactNode, useContext } from 'react';

// Define the structure of a single application entry
export interface Application {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: string;
    applicationType: string;
    accountEnabled: boolean;
    applicationVisibility: 'Visible' | 'Hidden' | string;
    assignmentRequired: boolean;
    isAppProxy: boolean;
}

// Define the shape of the context data
interface IdentityContextType {
    applications: Application[];
    isLoading: boolean;
    error: string | null;
}

// Create the context with a default undefined value
const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

// Raw CSV data provided for the project
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
12b545be-d2e9-4bc4-b0e4-1968c484abae,Microsoft.IntelligentITDigitalTwin,dfbed8b2-492a-414e-b2f0-482534e87bc5,2022-04-15T14:47:47Z,Microsoft Application,True,Visible,False,False
130ede23-676b-45d9-b736-27cd080bf4be,Azure AD Identity Governance - Entitlement Management,810dcf14-1858-4bf2-8134-4c369fa3235b,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
13514513-58d0-4871-b35f-b8fd83508e0c,NFV Resource Provider,328fd23b-de6e-462c-9433-e207470a5727,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
1360ee7c-fb69-4381-8579-adc83ab89360,Bot Framework Dev Portal,f3723d34-6ff5-4ceb-a148-d99dcd2511fc,2022-04-15T14:45:53Z,Microsoft Application,True,Visible,False,False
14308268-af8f-466e-a692-97b53fe29981,IAMTenantCrawler,66244124-575c-4284-92bc-fdd00e669cea,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
1477288c-22ec-4ddf-9327-ed004a6b8d4f,VideoIndexer-BE-ARM,d9794ed7-bfec-42d8-ba8d-4d7df2a1f6dc,2022-04-15T14:50:12Z,Microsoft Application,True,Visible,False,False
15262a46-e017-4019-a536-638a7ae1e86f,Microsoft Rights Management Services,00000012-0000-0000-c000-000000000000,2022-04-13T22:24:35Z,Microsoft Application,True,Visible,False,False
153a25be-5772-4561-b6a9-acdf39a8e2db,Azure Backup NRP Application,9bdab391-7bbe-42e8-8132-e4491dc29cc0,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
15517c29-83b5-4e03-ae00-8f523f01e292,Office 365 Configure,aa9ecb1e-fd53-4aaa-a8fe-7a54de2c1334,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
156b02da-0a13-449e-a44e-1757cb167015,Azure Monitor Control Service,e933bd07-d2ee-4f1d-933c-3752b819567b,2022-03-28T03:49:01Z,Microsoft Application,True,Visible,False,False
1625ae7c-2b6f-49e2-92c4-c7aa10788501,Azure HPC Workbench,5bd9995f-b6f8-4c7a-a024-e8c5eab9c85d,2022-04-15T14:48:04Z,Microsoft Application,True,Visible,False,False
172fb8fe-7fa5-4ef2-80d5-78b758fe0ce9,Test Base for M365 - Resource Provider,f3625a3e-6360-4580-968d-fae4cabc75a0,2022-04-12T01:04:42Z,Microsoft Application,True,Visible,False,False
1795e77a-f5c8-4f83-90b0-247f8239467a,Microsoft.ServiceBus,80a10ef9-8168-493d-abf9-3297c4ef6e3c,2022-04-15T14:49:16Z,Microsoft Application,True,Visible,False,False
17c537b0-f0b8-4888-9e9a-346e78542549,Azure Traffic Manager and DNS,2cf9eb86-36b5-49dc-86ae-9a63135dfa8c,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
186792d2-41c3-4a08-8fc0-9318aa54508e,Custom Locations RP,bc313c14-388c-4e7d-a58e-70017303ee3b,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
18fdd139-6e86-44b3-a08a-30acbf7316f4,LexisNexis Law Schools,e5d38734-8683-4c09-9e0d-73a883c2d83d,2022-05-04T08:23:45Z,Enterprise Application,True,Visible,True,False
1943495f-346f-4b82-a67a-0e24db869828,MarketplaceAPI ISV,20e940b3-4c77-4b0b-9a53-9e16a1b010a7,2022-04-12T00:39:13Z,Microsoft Application,True,Visible,False,False
19562460-4a11-484d-8b82-619c7ef29112,Diagnostic Services Trusted Storage Access,562db366-1b96-45d2-aa4a-f2148cef2240,2022-03-28T03:49:01Z,Microsoft Application,True,Visible,False,False
195ff216-c783-4ebb-99a7-7fd7520cdc45,Microsoft Azure Container Apps - Control Plane,7e3bc4fd-85a3-4192-b177-5b8bfc87f42c,2022-04-06T19:33:33Z,Microsoft Application,True,Visible,False,False
19acdbb9-f64f-4a7c-9c88-4aaae2d82ee5,DoNotDelete-DataBoxEdgeNGatewayManagedApp,2368d027-f996-4edb-bf48-928f98f2ab8c,2022-04-15T14:46:41Z,Microsoft Application,True,Visible,False,False
19fbbfe7-8bd8-4273-86d3-501319e749ce,Defender for Containers provisioning ARC k8s Enabled,f6ec9458-aa91-4c6e-bb3f-7b7c946c1b44,2022-04-13T05:11:00Z,Managed Identity,True,Visible,False,False
19ffe6f1-6d63-4ae5-a1da-c535e39d3544,Intune CMDeviceService,14452459-6fa6-4ec0-bc50-1528a1a06bf0,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
1af7a79a-0d3a-450f-89e9-5bde0db7aa6e,Attestation Service,c61423b7-1d1f-430d-b444-0eee53298103,2022-04-15T14:45:21Z,Microsoft Application,True,Visible,False,False
1b526e38-3849-48ca-bb79-8ca2c4b41ec6,Azure Cost Management XCloud,3184af01-7a88-49e0-8b55-8ecdce0aa950,2022-04-13T04:47:48Z,Microsoft Application,True,Visible,False,False
1bccd68e-a562-46eb-bfb9-8ddae9f004c7,SSO Extension Intune,163b648b-025e-455b-9937-a7f39a65d171,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
1c9a3113-5bbb-46fd-b649-ae429cc84e9f,Signup,b4bddae8-ab25-483e-8670-df09b9f1d0ea,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
1ca99c82-51f8-4e9e-b0cf-51f6a09392a1,Azure Data Lake,e9f49c6b-5ce5-44c8-925d-015017e9f7ad,2022-04-15T14:47:10Z,Microsoft Application,True,Visible,False,False
1cae7670-eef7-4b9d-bef8-6771c6842d6b,Azure API Management,8602e328-9b72-4f2d-a4ae-1387d013a2b3,2022-04-12T05:19:22Z,Microsoft Application,True,Visible,False,False
1d71164d-0926-44f1-abc3-e569c40c501c,Microsoft Intune API,c161e42e-d4df-4a3d-9b42-e7a3c31f59d4,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
1e5de125-9a51-420f-b11f-ae2b2372d772,Microsoft Azure App Service,abfa0a7c-a6b6-4736-8310-5855508787cd,2022-04-06T19:33:33Z,Microsoft Application,True,Visible,False,False
1e6225b5-895e-4acf-8cac-ca9cc8bc5620,"Capacity ",fbc197b7-9e9c-4f98-823f-93cb1cb554e6,2022-04-13T04:47:30Z,Microsoft Application,True,Visible,False,False
1ed6f684-c34c-4ea0-be4f-4ce36894a75b,O365 Secure Score,8b3391f4-af01-4ee8-b4ea-9871b2499735,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
1fbb5b00-9c09-46a8-a2de-4d53949c910b,Azure Iot Hub,89d10474-74af-4874-99a7-c23c2f643083,2022-04-07T10:01:27Z,Microsoft Application,True,Visible,False,False
1fbdf34d-ee3e-4005-991f-e6ec2297ce2c,Network Watcher,7c33bfcb-8d33-48d6-8e60-dc6404003489,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
1fca18d3-3900-467e-a775-465f7c4fa2f1,Office 365 Information Protection,2f3f02c9-5679-4a5c-a605-0de55b07d135,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
2054d9bc-67b1-448f-898b-bd70978f3809,Oracle Fusion ERP,65b0413c-6b56-4536-a2ea-1929dfe5e81c,2022-05-02T21:18:51Z,Enterprise Application,True,Visible,True,False
217d77eb-d9e3-493c-b50e-3de6b77c1d66,myAKSCluster-agentpool,6d49f6be-5347-432d-b9b4-64ac938c1bd2,2022-04-18T08:56:39Z,Managed Identity,True,Visible,False,False
2195918b-b9ec-47d4-ae1a-2f141637c1d0,MaintenanceResourceProvider,f18474f2-a66a-4bb0-a3c9-9b8d892092fa,2022-04-06T19:36:55Z,Microsoft Application,True,Visible,False,False
21b25ad1-4caf-4dd8-b9c1-1ec356bc071e,Azure Management Groups,f2c304cf-8e7e-4c3f-8164-16299ad9d272,2022-04-15T14:48:13Z,Microsoft Application,True,Visible,False,False
2235a64a-3b37-4157-997b-609a84b1767e,ECP Billing Service,359431ad-ece5-496b-8768-be4bbfd82f36,2022-04-12T01:09:05Z,Microsoft Application,True,Visible,False,False
22440caf-d99f-497e-8001-9e041cd34ef7,Microsoft Device Management Enrollment,709110f7-976e-4284-8851-b537e9bcb187,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
225c3ed6-2a24-4676-a5a4-53b2e05dbd56,Azure SQL Database Backup To Azure Backup Vault,e4ab13ed-33cb-41b4-9140-6e264582cf85,2022-04-06T19:34:54Z,Microsoft Application,True,Visible,False,False
230a234f-b99b-4e68-b4e2-a4cd26fec99f,Microsoft Graph Change Tracking,0bf30f3b-4a52-48df-9a82-234910c4a086,2022-03-04T02:36:01Z,Microsoft Application,True,Visible,False,False
23296fdc-9163-4e44-a3b7-6724f5773cd7,AzureDataCollaboration,2cc451ba-a8ec-496f-bdff-591f5ae2876c,2022-04-15T14:47:16Z,Microsoft Application,True,Visible,False,False
2381765d-aca4-4542-b479-d214b2a7d56f,Liftr-LZ-FPA-WW1-AME,0ecb6dbc-7807-4951-9a69-b5d3dfa5a0b5,2022-04-15T14:48:12Z,Microsoft Application,True,Visible,False,False
24106f44-d9f0-4607-be05-800e30ffcd00,Azure Bastion,79d7fb34-4bef-4417-8184-ff713af7a679,2022-04-06T19:41:41Z,Microsoft Application,True,Visible,False,False
2451f331-3e6f-4f11-9cae-dc1a643d0cd9,Azure Data Factory,5d13f7d7-0567-429c-9880-320e9555e5fc,2022-04-15T14:47:15Z,Microsoft Application,True,Visible,False,False
246df0ff-d7e4-4df0-a9bd-4067df77888a,Azure Digital Twins,0b07f429-9f4b-4714-9392-cc5e8e80c8b0,2022-04-13T21:58:42Z,Microsoft Application,True,Visible,False,False
258ddc05-19c7-4e18-96d1-9bea72675228,Microsoft Visual Studio Codespaces API - Dev,48ef7923-268f-473d-bcf1-07f0997961f4,2022-04-15T14:46:16Z,Microsoft Application,True,Visible,False,False
26058c54-feeb-4394-950d-ac29c421c889,Microsoft Intune Web Company Portal,74bcdadc-2fdc-4bb3-8459-76d06952a0e9,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
2612aa48-e9bc-47ff-8b68-cd5a9e8bd2cb,Cortana Runtime Service,81473081-50b9-469a-b9d8-303109583ecb,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
268df2dd-80d8-4c60-877c-4a9a429df01c,Microsoft Graph Connectors Core,f8f7a2aa-e116-4ba6-8aea-ca162cfa310d,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
27149c02-78d0-4e66-97e2-ee022a3e1fa0,My Apps,2793995e-0a7d-40d7-bd35-6968ba142197,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
27b0cbd8-8a1a-4b6d-85ec-6601787d4365,O365 Demeter,982bda36-4632-4165-a46a-9863b1bbcf7d,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
27c588d9-6443-40e3-a610-df23fce6b653,Microsoft Intune,0000000a-0000-0000-c000-000000000000,2022-04-13T22:24:35Z,Microsoft Application,True,Visible,False,False
285689e9-335d-4d7b-8ac5-ef604b295397,billgates666,a3f23ff7-be0d-49a0-b535-f5fb0f5f8039,2022-04-15T07:59:34Z,Managed Identity,True,Visible,False,False
28c8f26c-2e09-43e6-9a67-ad7585ec09c2,Microsoft Monitoring Account Management,e158b4a5-21ab-442e-ae73-2e19f4e7d763,2022-04-15T14:48:23Z,Microsoft Application,True,Visible,False,False
298f5b49-900a-4a67-8cd9-af8c47154952,Application Assessment,f9c691e6-93b3-4d57-944c-afcc737f9abf,2022-04-15T14:45:16Z,Microsoft Application,True,Visible,False,False
29cb2e64-674f-4ab5-af4b-7ab0d96173b2,Spool-Resource-Provider,632ec9eb-fad7-4cbd-993a-e72973ba2acc,2022-04-15T14:46:33Z,Microsoft Application,True,Visible,False,False
2a51792f-1fdf-46da-bfc0-38d2189159a8,Liftr-DT-FPA-WW1-AME,95c8b18b-3ed0-4299-88e6-31a12c4b4092,2022-04-15T14:44:52Z,Microsoft Application,True,Visible,False,False
2ac3afdb-2aae-47a3-9492-dd416f61aa7d,Azure VMware Solution by CloudSimple,d96199e7-4674-4bbf-a1c6-ddf93682f5ee,2022-04-15T14:50:17Z,Microsoft Application,True,Visible,False,False
2b10364b-0557-48ca-b811-216b22956652,Microsoft Power Platform Service,e64bd61e-5424-451f-b666-e02ee2878437,2022-04-15T14:48:57Z,Microsoft Application,True,Visible,False,False
2b34938a-a1e0-440b-93d0-417846df681a,Marketplace Reviews,a4c1cdb3-88ab-4d13-bc99-1c46106f0727,2022-04-07T08:41:27Z,Microsoft Application,True,Visible,False,False
2b35eb35-6e47-4dd7-bc6e-b30d31e85d9b,Azure Spring Cloud Marketplace Integration,86adf623-eea3-4453-9f4a-18134ac1410d,2022-04-12T08:29:48Z,Microsoft Application,True,Visible,False,False
2c3af762-d999-4a01-b20e-1439b1512c95,Microsoft Intune SCCM Connector,63e61dc2-f593-4a6f-92b9-92e4d2c03d4f,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
2c437bd4-d692-4016-939f-9a74cdf45b1e,WindowsUpdate-Service,6f0478d5-61a3-4897-a2f2-de09a5a90c7f,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
2c4715ab-b55a-414f-80f3-f6e5756b475b,IPSubstrate,4c8f074c-e32b-4ba7-b072-0f39d71daf51,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
2c82ee8a-afbf-4389-924f-a2b525c6ed39,Azure Portal,c44b4083-3bb0-49c1-b47d-974e53cbdf3c,2022-03-04T02:59:26Z,Microsoft Application,True,Visible,False,False
2ca942c0-b652-4222-8fd2-f5e9eb4795d3,Compute Artifacts Publishing Service,a8b6bf88-1d1a-4626-b040-9a729ea93c65,2022-03-28T03:48:58Z,Microsoft Application,True,Visible,False,False
2dacd264-2416-401f-bbed-6651d9627b6a,DWEngineV2,441509e5-a165-4363-8ee7-bcf0b7d26739,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
2df6fb48-fbf0-4b55-b6e0-8c1c1d7b55c5,Microsoft Intune IW Service,b8066b99-6e67-41be-abfa-75db1a2c8809,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
2e60b665-15dd-4e5d-a2fa-c6063c6151ad,Azure Machine Learning Services Asset Notification,b8cf62f3-7cc7-4e32-ab3a-41370ef0cfcf,2022-04-24T00:25:20Z,Microsoft Application,True,Visible,False,False
2e6fa0e5-d738-4db9-bfb5-5605f1f823b6,Windows Azure Active Directory,00000002-0000-0000-c000-000000000000,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
2ed90af3-3256-4cec-a5ab-97570c7627ff,MS-PIM,01fc33a7-78ba-4d2f-a4b7-768e336e890e,2022-04-13T05:11:07Z,Microsoft Application,True,Visible,False,False
2f94bfa3-dacb-4a86-8cf7-bcbc1e9be1c9,AzureAutomation,fc75330b-179d-49af-87dd-3b1acf6827fa,2022-04-15T07:59:17Z,Microsoft Application,True,Visible,False,False
2fb4c2e2-98f8-438b-a90a-1d455a79b097,Azure Marketplace Datadog,0c6620df-7b29-44de-8ba4-688a56a20f9f,2022-04-13T22:57:45Z,Microsoft Application,True,Visible,False,False
2fe9a51a-7f56-4597-8cb0-7134ce936909,DeploymentScheduler,8bbf8725-b3ca-4468-a217-7c8da873186e,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
306d6825-8401-4d91-93ef-b9a0249365aa,Identity Scenario Monitoring,8d5683a1-43b9-4f38-8906-504eae3c36c9,2022-04-15T14:44:59Z,Microsoft Application,True,Visible,False,False
309d70a7-8f3a-48f4-bb66-aab3e8a354a6,Bot Service Resource Provider,e6650347-047f-4e51-9386-839384472ea5,2022-04-15T14:45:53Z,Microsoft Application,True,Visible,False,False
30c7eeaa-5d50-4e86-aa85-b4b28afb5a45,gongo,74b0b707-6e48-48c5-a6f8-6ad47db27678,2022-04-07T09:37:10Z,Managed Identity,True,Visible,False,False
311cd154-e076-4913-9ff1-8d9908f4b536,ConnectedClusterIdentityForHIS,de742ffc-b441-4542-8646-7e805426b824,2022-04-15T14:47:56Z,Microsoft Application,True,Visible,False,False
3141817b-2623-4b33-aba7-5af46eee1775,HPC Cache Resource Provider,4392ab71-2ce2-4b0d-8770-b352745c73f5,2022-04-15T14:49:59Z,Microsoft Application,True,Visible,False,False
3217a396-619b-4c9a-8e52-cb4fd278a99f,Azure Orbital Resource Provider,4fa46669-56c9-44e7-a69b-182480b952a8,2022-04-15T14:43:23Z,Microsoft Application,True,Visible,False,False
3225ed0c-1c2d-40c1-af0d-6500279089b7,CABProvisioning,5da7367f-09c8-493e-8fd4-638089cddec3,2022-04-07T04:54:48Z,Microsoft Application,True,Visible,False,False
3276b696-6859-48a6-a381-176e9db745d3,Microsoft Azure AD Identity Protection,a3dfc3c6-2c7d-4f42-aeec-b2877f9bce97,2022-04-13T09:02:22Z,Microsoft Application,True,Visible,False,False
32abefb4-9005-425f-a9dc-b1e063801f96,Azure Media Services,374b2a64-3b6b-436b-934c-b820eacca870,2022-04-09T01:12:08Z,Microsoft Application,True,Visible,False,False
330affbf-4505-46ea-a7df-1a8fc8c42cd4,Geneva Alert RP,6bccf540-eb86-4037-af03-7fa058c2db75,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
33f057eb-9b2a-44f5-8876-23cbd3981a54,Microsoft Account (Windows Live),6e110594-2adf-49c8-8d37-41eee81c0359,2022-05-04T08:26:24Z,Enterprise Application,True,Visible,False,False
3493bc44-b8e9-43ae-83e9-522eba7dbc95,5,30b7f32a-8115-4e12-883b-1fd99dd0efd9,2022-04-06T19:39:32Z,Managed Identity,True,Visible,False,False
34a5521b-d43f-4199-802a-fc9eab992258,Azure AD Identity Protection,fc68d9e5-1f76-45ef-99aa-214805418498,2022-04-28T03:20:05Z,Microsoft Application,True,Visible,False,False
34e3f389-8d4c-4178-9f3e-3d56fff1e78b,console-m365d,f18b59c9-5926-4a65-8605-c23ec8c7e074,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
352c6952-d2cd-4c9a-bc08-70351c1eb04d,Office Change Management,601d4e27-7bb3-4dee-8199-90d47d527e1c,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
3581eb77-e419-4bb5-91e4-878950a386ac,Knvhu,52aa7af2-7031-4163-a511-b1ca35c43c6e,2022-04-07T10:14:24Z,Managed Identity,True,Visible,False,False
35d58ab2-c7a3-4ea6-bc14-320c0a3865d9,ACR-Tasks-Prod,d2fa1650-4805-4a83-bcb9-cf41fe63539c,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
35e154d0-b6f6-44b2-aed2-d6de96e5967a,SQLVMResourceProviderAuth,bd93b475-f9e2-476e-963d-b2daf143ffb9,2022-04-15T14:49:57Z,Microsoft Application,True,Visible,False,False
35f2087f-446c-4434-881b-e803090d84f4,Bot Service CMEK Prod,27a762be-14e7-4f92-899c-151877d6d497,2022-04-15T14:45:53Z,Microsoft Application,True,Visible,False,False
372d493d-daf0-4e57-91f8-602eb44afb6f,Microsoft.CustomProviders RP,bf8eb16c-7ba7-4b47-86be-ac5e4b2007a5,2022-04-15T14:46:48Z,Microsoft Application,True,Visible,False,False
3766e4e7-70f4-4fd9-8166-ea8e21040136,Microsoft Services,9ed4cd8c-9a98-405f-966b-38ab1b0c24a3,2022-04-15T14:49:48Z,Microsoft Application,True,Visible,False,False
39412005-c4f1-476b-8628-ff77467f60ac,Microsoft.SCOM Resource Provider,d3315f6c-968a-40bb-94d2-a6a9503b05f5,2022-04-15T14:49:10Z,Microsoft Application,True,Visible,False,False
39846f61-98a8-4a3e-8769-022e29c0c05e,Autonomous Development Platform Resource Provider,dad37da6-229d-4bc0-8b94-fee8600589db,2022-04-15T14:45:27Z,Microsoft Application,True,Visible,False,False
3b28925f-f0c2-47dd-8878-ccbe5b1cd06a,Citrix ShareFile,f49e6313-6c53-4ec8-918f-2dd9f1980342,2022-05-04T07:58:46Z,Enterprise Application,True,Visible,True,False
3b5dab64-bc1a-4b98-bcde-f98f9fb1117a,Audit GraphAPI Application,4bfd5d66-9285-44a1-bb14-14953e8cdf5e,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
3bf946a3-b119-4d23-bb96-78b07ec008dc,Microsoft.ExtensibleRealUserMonitoring,e3583ad2-c781-4224-9b91-ad15a8179ba0,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
3c41b3ae-fe78-4824-8e73-9f3c82aebfb4,RPSaaS Meta RP,f77c2a8f-8a0a-4776-8e0a-bcb2549610ca,2022-04-15T14:48:58Z,Microsoft Application,True,Visible,False,False
3d4c4664-7211-4ef9-851b-07210d580f10,Azure Synapse Studio,ec52d13d-2e85-410e-a89a-8c79fb6a32ac,2022-04-07T09:27:48Z,Microsoft Application,True,Visible,False,False
3ec83641-ef02-4af2-88a1-2b249cc9ba09,Microsoft Azure Log Search Alerts,f6b60513-f290-450e-a2f3-9930de61c5e7,2022-03-28T03:49:01Z,Microsoft Application,True,Visible,False,False
40e78765-8267-408a-92f5-c6d747937d5a,ClassicToARMIaaSMigration,5e5abe2b-83cd-4786-826a-a05653ebb103,2022-04-15T14:46:05Z,Microsoft Application,True,Visible,False,False
41173766-4438-4620-bbcd-8c91152c5c61,Office365DirectorySynchronizationService,18af356b-c4fd-4f52-9899-d09d21397ab7,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
411b4296-f282-4fb3-8884-47c8aceff327,Azure Advanced Threat Protection,7b7531ad-5926-4f2d-8a1d-38495ad33e17,2022-04-13T22:24:35Z,Microsoft Application,True,Visible,False,False
41728631-ee7b-4287-bf6c-c326c12fee14,Microsoft Graph,00000003-0000-0000-c000-000000000000,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
428a76d1-8e7b-4ae0-852a-063ba8db3f80,azurepolicy-myakscluster,5e89db78-b7c2-42c9-91f3-12ee3bc42550,2022-04-18T09:06:55Z,Managed Identity,True,Visible,False,False
42a58958-18ae-4a1d-83cc-b509b457d93b,Azure Machine Learning Authorization App 2,bf283ae6-5efd-44a8-b56a-2a7939982d60,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
42ebbd73-1341-4bc5-9260-dc6fa2a5f4a4,Business AI Service,a967240f-810b-4f79-85e5-25870cc69cbb,2022-04-07T09:35:45Z,Microsoft Application,True,Visible,False,False
42ebe334-1bef-4c96-a8ef-6152dd994acb,assets,f69cfde7-4247-48a2-a54d-1501570d8233,2022-03-28T04:00:24Z,Managed Identity,True,Visible,False,False
43cb5411-cefc-4c51-a271-154054ec097b,Hybrid Connectivity RP,e18cedde-9458-482f-9dd1-558c597ac42e,2022-04-15T14:47:56Z,Microsoft Application,True,Visible,False,False
44beb137-e79d-4572-8606-bf6e96a451e8,Jarvis Transaction Service,bf9fc203-c1ff-4fd4-878b-323642e462ec,2022-03-28T03:40:07Z,Microsoft Application,True,Visible,False,False
44d84639-a339-4bd2-ac06-39e8024109c8,Exchange Office Graph Client for AAD - Noninteractive,765fe668-04e7-42ba-aec0-2c96f1d8b652,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
4530751d-e651-435b-ad84-66cc8f0ab189,AzureSupportCenter,37182072-3c9c-4f6a-a4b3-b3f91cacffce,2022-03-04T02:36:00Z,Microsoft Application,True,Visible,False,False
453615ec-8759-417e-a1ab-243f3fb3b0f7,SAP Analytics Cloud,3b5c2f38-d6e7-4b96-944c-872d4fe64fe6,2022-05-02T21:24:32Z,Enterprise Application,True,Visible,True,False
4561aa3c-3bc3-4b25-934d-eb815877ae60,MicrosoftOffAzureApp,728a93e3-065d-4678-93b1-3cc281223341,2022-04-14T13:28:43Z,Microsoft Application,True,Visible,False,False
457e73b4-6ab2-4ac1-a7b9-b123d5794d83,Microsoft Azure Synapse Gateway,1ac05c7e-12d2-4605-bf9d-549d7041c6b3,2022-04-07T09:27:48Z,Microsoft Application,True,Visible,False,False
4590bd32-0874-4112-86f2-c93d5098adbc,Azure Digital Twins Resource Provider,91ff567f-bb4f-4719-91d7-d983057bc0d6,2022-04-13T21:58:42Z,Microsoft Application,True,Visible,False,False
464ae86b-6ec8-47bc-9fb1-66e451e63758,Microsoft.SMIT,8fca0a66-c008-4564-a876-ab3ae0fd5cff,2022-03-04T02:36:01Z,Microsoft Application,True,Visible,False,False
46f9d342-e6c7-48c5-9f36-3b74f939bdc4,MicrosoftAzureRedisCache,96231a05-34ce-4eb4-aa6a-70759cbb5e83,2022-04-15T14:45:55Z,Microsoft Application,True,Visible,False,False
4801e6c2-bcd6-4ccb-903c-fb0eb8d1a861,Vault,0ac71e58-8aec-485e-a4ec-6b24af1b962a,2022-04-20T02:19:08Z,Managed Identity,True,Visible,False,False
48301288-b007-4a23-860b-16caf9fd3bd8,CosmosDB Dedicated Instance,36e2398c-9dd3-4f29-9a72-d9f2cfc47ad9,2022-04-12T17:47:08Z,Microsoft Application,True,Visible,False,False
483ad593-a63e-46bf-a9db-3936a0f99ac2,Autog,7a08d6a2-494e-48eb-85cd-8c245104a6fd,2022-04-07T09:59:47Z,Managed Identity,True,Visible,False,False
49ff99b7-a475-410f-b0d8-ccd2bdeeb1ee,Azure Healthcare APIs Resource Provider,894b1496-c6e0-4001-b69c-81b327564ca4,2022-04-15T14:48:00Z,Microsoft Application,True,Visible,False,False
4a4b8af3-d3f2-45c5-8694-c5de6c7fde57,Azure Virtual Machine Image Builder,cf32a0cc-373c-47c9-9156-0db11f6a6dfc,2022-04-15T14:50:21Z,Microsoft Application,True,Visible,False,False
4a6bb532-3e70-4b5f-bfc1-688f6d575f04,LexisNexis Corporate Affiliations,c6932912-e55b-494c-b080-de9a35ce410c,2022-05-04T08:22:10Z,Enterprise Application,True,Visible,True,False
4bc79072-e72e-4a52-88b6-9b12fdbd831b,Azure ExP,e00d2f8a-f6c8-46e4-b379-e66082e28ca8,2022-04-15T14:47:28Z,Microsoft Application,True,Visible,False,False
4cbb3354-396a-4ae8-83d4-c7f8535db0f5,"The NEW GLOBAL NETWORK ",e1b4ed32-0aea-4286-88bf-5df97be96abc,2022-05-04T08:15:52Z,Enterprise Application,True,Visible,True,False
4ce07296-7d16-4714-83de-e8cc99901ae1,ASA Curation Web Tool,a15bc1de-f777-408f-9d2b-a27ed19c72ba,2022-04-07T09:59:17Z,Microsoft Application,True,Visible,False,False
4d7be0f1-ce2b-4310-8686-280797ee0f02,Citrix ADC SAML Connector for Azure AD,db559737-c65c-4c91-b5d2-c51a55c9e22b,2022-05-04T07:59:59Z,Enterprise Application,True,Visible,True,False
4df22592-201d-4984-8dce-bec24d872fb7,Azure Spring Cloud Service Runtime Auth,366cbfa5-46b3-47fb-9d70-55fb923b4833,2022-04-12T08:29:48Z,Microsoft Application,True,Visible,False,False
4e4398fa-10c4-4f05-a4ae-2ede1b96436d,AzureBackupReporting,3b2fa68d-a091-48c9-95be-88d572e08fb7,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
4eac9dc5-2cf3-48b5-808a-66ad0be70071,Lexis.com,9c012f45-4a09-4f90-9cb9-5dea81f53a9e,2022-05-04T08:10:44Z,Enterprise Application,True,Visible,True,False
4eb9645b-7f0c-4b6e-b14a-c2d04f4a7ab9,MicrosoftStorageExpressPodAADApp,5613cb5c-a7c9-4099-8034-511fd7616cb2,2022-04-15T14:46:42Z,Microsoft Application,True,Visible,False,False
4fab2996-8d9e-4b5f-99d2-fa2a2c3afb57,O365 Customer Monitoring,3aa5c166-136f-40eb-9066-33ac63099211,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
4fb6e44c-7400-4b85-8858-8372caf7b881,ASE-Arc-Integration,0000dab9-8b21-4ba2-807f-1743968cef00,2022-04-12T01:09:05Z,Microsoft Application,True,Visible,False,False
4ff32095-50ec-463b-84de-00339fda0cdc,Azure Cosmos DB Virtual Network To Network Resource Provider,57c0fc58-a83a-41d0-8ae9-08952659bdfd,2022-04-12T17:47:08Z,Microsoft Application,True,Visible,False,False
50bfed9b-fa58-400c-b19a-528c769e28c4,Data Classification Service,7c99d979-3b9c-4342-97dd-3239678fb300,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
50d7ad0e-aec6-4410-8b1e-4467ca6dcc78,Microsoft Solution Providers,87df0fbf-e22d-4d7c-bc30-f59ca7460837,2022-04-15T14:48:21Z,Microsoft Application,True,Visible,False,False
515a5848-516e-4396-bb40-e70c5d17bdd9,Linkedin,56e5be3f-8703-4fe3-936b-8599b606b8fc,2022-05-04T08:25:33Z,Enterprise Application,True,Visible,True,False
5170c7ca-9d59-434e-a64f-204cfe9a3019,Liftr Datadog RPaaS,ae11f5fb-c627-4eec-b4a0-f7b5969426e5,2022-04-13T22:57:45Z,Microsoft Application,True,Visible,False,False
51e64549-0fbe-47af-a524-cfeebc2ce495,Microsoft.EventHubs,80369ed6-5f11-4dd9-bef3-692475845e77,2022-04-15T14:47:30Z,Microsoft Application,True,Visible,False,False
520b5e54-62d8-493a-8b51-82f79a32e604,myAKSCluster,b121a960-2b39-48d2-a3ed-9efe1b7f8992,2022-04-18T08:56:10Z,Managed Identity,True,Visible,False,False
529e535b-d7f6-4b9a-a383-e364b9cb059b,SubscriptionRP,e3335adb-5ca0-40dc-b8d3-bedc094e523b,2022-04-07T04:54:48Z,Microsoft Application,True,Visible,False,False
534cd20f-8efd-4c7c-9e9a-45e8021b0201,Accuit (iFACS),3ae55346-4fae-430e-96f8-e26e8315f27e,2022-05-04T08:12:17Z,Enterprise Application,True,Visible,True,False
53c0229f-b27c-4ee8-898f-1fa649ba0302,Microsoft.CodeSigning,71af9eaf-3a7b-43eb-bc59-c504bfe12240,2022-04-15T14:46:15Z,Microsoft Application,True,Visible,False,False
54c10dda-6b31-4ab3-8c79-217934b83cbe,Azure Sphere Resource Provider,e7d5afaf-5e93-4aad-b546-878812ff572c,2022-04-15T14:45:40Z,Microsoft Application,True,Visible,False,False
54f9ee55-c45c-4e25-a407-ba1c8e15bc82,Azure Blueprints,f71766dc-90d9-4b7d-bd9d-4499c4331c3f,2022-04-15T14:43:08Z,Microsoft Application,True,Visible,False,False
55620c3b-6fe8-439a-92fc-271ef925a9c6,Quickbooks Other Intuit Service QuickBooks Online,91f2f07a-57ac-44c9-89e6-c9e872cb470e,2022-05-04T08:30:06Z,Enterprise Application,True,Visible,True,False
557eb834-0f75-42af-9508-2e08cb2924cb,Azure Addons Application,24d3987b-be4a-48e0-a3e7-11c186f39e41,2022-04-15T14:45:05Z,Microsoft Application,True,Visible,False,False
55b32cfa-4615-4114-983a-b34837ffdb66,fidelitynetbenefits,00a571e7-e41d-4ed4-8eef-36ee2632264d,2022-05-04T08:20:10Z,Enterprise Application,True,Visible,True,False
560f18cd-5977-4053-a1bb-eb4826c633cc,ConfidentialLedgerDataPlane,c9e0b461-3515-4a03-b576-ede91ed4336d,2022-04-06T19:41:52Z,Microsoft Application,True,Visible,False,False
5621f3cc-f374-4140-bb2e-cddd97a01a1c,Microsoft Azure Synapse Resource Provider,9e09aefc-b2e5-4d19-9f74-3e3e8b11a57b,2022-04-07T09:27:48Z,Microsoft Application,True,Visible,False,False
563c5dac-bf5c-48ff-a2ad-43baf63f860f,Microsoft.AzureStackHCI Resource Provider,1412d89f-b8a8-4111-b4fd-e82905cbd85d,2022-04-15T14:45:43Z,Microsoft Application,True,Visible,False,False
566b54b5-f29a-4821-9470-10788f68e658,Bank American 🇺🇸,af50c6e1-9fa7-4512-8e63-33d5541d2b9d,2022-04-15T11:37:54Z,Enterprise Application,True,Hidden,False,False
5680479b-d043-4449-aa65-212e757d40bf,Afdx Resource Provider,92b61450-2139-4e4a-a0cc-898eced7a779,2022-04-09T01:12:05Z,Microsoft Application,True,Visible,False,False
568385ca-1e36-4b30-8f64-a997aadaeddb,Domain Controller Services,abba844e-bc0e-44b0-947a-dc74e5d09022,2022-04-15T14:44:57Z,Microsoft Application,True,Visible,False,False
56a8c3cd-bcbe-4f7f-b93b-5320e06c8d97,Microsoft Azure Stack HCI Service,1322e676-dee7-41ee-a874-ac923822781c,2022-04-15T14:45:43Z,Microsoft Application,True,Visible,False,False
56fec152-b6ba-40af-8c8a-6422afab0d32,Azure Managed Grafana,ce34e7e5-485f-4d76-964f-b3d2b16d1e4f,2022-04-15T14:46:43Z,Microsoft Application,True,Visible,False,False
58c62d40-8450-4145-930a-e986ca3e684c,Azure SQL Virtual Network to Network Resource Provider,76cd24bf-a9fc-4344-b1dc-908275de6d6d,2022-04-06T19:34:54Z,Microsoft Application,True,Visible,False,False
5958db8b-c90b-4a1f-9a6b-54bc80e27aa2,MCVP Resource Provider,070fc472-7cef-4d53-9b65-34464c4d5f4a,2022-04-15T14:46:30Z,Microsoft Application,True,Visible,False,False
5983a51f-17b2-47c6-9887-40d7386ff3ae,Groupies Web Service,925eb0d0-da50-4604-a19f-bd8de9147958,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
599ba50d-f370-4d39-8c33-d90b075b2251,Microsoft.PlayFab,ce52bcbe-f669-4cfd-9866-d64472d3e13e,2022-04-15T14:48:52Z,Microsoft Application,True,Visible,False,False
5a031465-f878-48e6-abc0-dffda659e523,R and D Tax Credit Services : 10-wk Implementation,a0df4d2c-64a4-4e93-8f8e-4c8d721b5b77,2022-05-04T08:06:30Z,Enterprise Application,True,Visible,True,False
5ab36467-4004-4e92-88e4-dc04e43caedf,MileIQ Admin Center,de096ee1-dae7-4ee1-8dd5-d88ccc473815,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
5af5afdd-fe29-4137-b077-e3261f2ad83f,Atlas,d10de03d-5ba3-497a-90e6-7ff8c9736059,2022-04-15T14:49:20Z,Microsoft Application,True,Visible,False,False
5b3cafe9-6812-498f-a8a0-e882047f0708,Azure Monitor Restricted,035f9e1d-4f00-4419-bf50-bf2d87eb4878,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
5b51f49d-1317-460c-8cc4-93e28688b3ce,Azure AD Identity Governance - SPO Management,396e7f4b-41ea-4851-b04d-65de6cf1b4a3,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
5bd8aefe-fe6a-4f29-864a-84b2fdcf2d5a,Azure Cost Management Scheduled Actions,6b3368c6-61d2-4a72-854c-42d1c4e71fed,2022-04-13T04:47:48Z,Microsoft Application,True,Visible,False,False
5c0f2149-1209-4091-bab8-3144fecf8848,Azure Lab Services,1a14be2a-e903-4cec-99cf-b2e209259a0f,2022-04-14T06:09:13Z,Microsoft Application,True,Visible,False,False
5c430488-f2c5-41c0-b59e-70c7d1ee3089,Microsoft AppSource,a0e1e353-1a3e-42cf-a8ea-3a9746eec58c,2022-04-15T14:48:21Z,Microsoft Application,True,Visible,False,False
5c94d201-2a29-48b0-b024-6cf72959b52b,ClusterConfigResourceSync,bd9b7cd5-dac1-495f-b013-ac871e98fa5f,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
5e0c70fe-c198-43d0-8d86-f73f8576ab47,MicrosoftMigrateProject,e3bfd6ac-eace-4438-9dc1-eed439e738de,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
5e51d555-bb17-46dd-a79c-c5e8cd521c06,Liftr-LZ-FPA-ARM-AME,a5472e16-e1d2-4bbe-81b3-ecdcd459b536,2022-04-15T14:48:12Z,Microsoft Application,True,Visible,False,False
5eb0b1af-97ee-4b64-8ab3-8b210ba58621,Azure Cognitive Search,880da380-985e-4198-81b9-e05b1cc53158,2022-04-07T09:38:56Z,Microsoft Application,True,Visible,False,False
5ecee076-2865-4633-836a-a76a80167d4a,Bot Service Token Store,5b404cf4-a79d-4cfe-b866-24bf8e1a4921,2022-04-15T14:45:53Z,Microsoft Application,True,Visible,False,False
5f099a83-764f-4e05-a98d-3f31ab793e5c,Dynamics CRM Online Administration,637fcc9f-4a9b-4aaa-8713-a2a3cfda1505,2022-04-14T13:13:06Z,Microsoft Application,True,Visible,False,False
5fa2d8c6-1174-4780-a77f-a47b9457e15a,Microsoft.Azure.DomainRegistration,ea2f600a-4980-45b7-89bf-d34da487bda1,2022-04-14T16:06:53Z,Microsoft Application,True,Visible,False,False
5fdfc284-87fa-4804-9a87-3922c2d5fb8e,Azure Dedicated HSM,0eb690b7-d23e-4fb0-b43e-cd161ac80cc3,2022-04-15T14:47:19Z,Microsoft Application,True,Visible,False,False
60b85128-323b-4392-9340-aff33d35bdb4,Microsoft Intune Enrollment,d4ebce55-015a-49b5-a083-c84d1797ae8c,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
60ecd2b7-dc5a-4aa9-87fb-a0ae36b59c57,ClusterConfigToConnectedCluster,c699bf69-fb1d-4eaf-999b-99e6b2ae4d85,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
6126c324-313e-4dff-adab-6210c6353962,Azure Container Scale Sets,63ea3c01-7483-456e-8073-d3fed34fbdda,2022-04-07T09:35:44Z,Microsoft Application,True,Visible,False,False
6126e735-e3b6-4469-b07a-5c8f4b168e91,Azure Key Vault,cfa8b339-82a2-471a-a3c9-0fc0be7a4093,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
6194a015-9c88-4d5c-a1f9-779149556deb,asmcontainerimagescanner,918d0db8-4a38-4938-93c1-9313bdfe0272,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
61b0aa1e-034a-4044-890a-42e15495da10,Azure Arc Data Services Billing,a12e8ccb-0fcd-46f8-b6a1-b9df7a9d7231,2022-04-12T04:58:57Z,Microsoft Application,True,Visible,False,False
627bca6b-e8af-4c64-9f1d-b4634ca95c44,Azure Database for PostgreSQL Marlin,5ed8fe41-c1bc-4c06-a531-d91e1f1c2fac,2022-04-12T04:22:35Z,Microsoft Application,True,Visible,False,False
62f9b434-2e49-495a-9155-f5bec93189f8,WindowsDefenderATP,fc780465-2017-40d4-a0c5-307022471b92,2022-04-07T02:51:12Z,Microsoft Application,True,Visible,False,False
630a4060-5b73-4c5b-85c9-0113276e496c,Bing Search APIs,c19490b5-c092-426f-b1a2-674b279d4975,2022-04-15T14:45:50Z,Microsoft Application,True,Visible,False,False
63204f27-dde8-4f30-b1db-3ff13f8585a6,EventGrid Data API,823c0a78-5de0-4445-a7f5-c2f42d7dc89b,2022-04-09T01:12:05Z,Microsoft Application,True,Visible,False,False
634767c2-e4ea-4120-a7e6-9b0c5f7505aa,AADReporting,1b912ec3-a9dd-4c4d-a53e-76aa7adb28d7,2022-04-15T12:33:00Z,Microsoft Application,True,Visible,False,False
65fd7c60-1bc2-4b70-92cf-6955195accc2,spring-boot-complete-1649734694672,a466b239-e85b-439c-a3b5-f0ee6ce3b7b5,2022-04-17T03:48:14Z,Managed Identity,True,Visible,False,False
6651ee16-7dad-4cfa-886c-10c954a90fae,Quantumiot,02069796-fdae-431f-832d-06f03bd0ccf6,2022-04-13T19:40:00Z,Managed Identity,True,Visible,False,False
6699875c-c2ae-423e-9335-89c2dbf9ca80,MAPG,cc46c2aa-d508-409b-aeb7-df7cd1e07aaa,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
66c04776-6d86-4366-a87f-24147eab3773,Azure Container Registry Application,76c92352-c057-4cc2-9b1e-f34c32bc58bd,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
66e9b7bc-d5dc-4834-817b-7ddac84b6dd5,CloudNativeTesting DP,847bd4c1-7486-4241-a783-f9bda69241c1,2022-04-15T14:48:09Z,Microsoft Application,True,Visible,False,False
6709e987-2370-4db1-b804-733439714dd7,K8 Bridge,319f651f-7ddb-4fc6-9857-7aef9250bd05,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
6735df02-ac5d-4056-a4b0-65f4fcf84e51,Azure Multi-Factor Auth Client,981f26a1-7f43-403b-a875-f8b09b8cd720,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
679ec0ed-b99e-4437-840e-3acbc3f1f58b,Azure Container Registry,6a0ec4d3-30cb-4a83-91c0-ae56bc0e3d26,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
680ee73e-15b1-4342-ac15-9340e0a6af05,microsoft.connectedopenstack,432d3ac8-d6b9-43b9-9ef5-236ea50a049a,2022-04-15T14:46:27Z,Microsoft Application,True,Visible,False,False
681f1855-9fb0-4cfd-8f40-ce9fe876d0f5,DNC,1efe5bbf-d5b1-4fe9-99fa-f55ce1c88679,2022-04-15T14:46:55Z,Microsoft Application,True,Visible,False,False
6826bc07-d476-4a65-818e-5d602dc8da4e,ClusterConfigToArcZone,a0f92522-89de-4c5e-9a75-0044ccf66efd,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
687077b3-dde9-477c-bdbf-ffe35e45f233,AzureUpdateCenter,8c420feb-03df-47cc-8a05-55df0cf3064b,2022-04-12T01:26:47Z,Microsoft Application,True,Visible,False,False
68ab15e1-55b1-45b6-93b1-95eea7b076df,Microsoft Modern Contact Master,224a7b82-46c9-4d6b-8db0-7360fb444681,2022-03-28T04:10:35Z,Microsoft Application,True,Visible,False,False
69057ab9-d906-4619-83d9-f851303b3a41,AzureContainerService,7319c514-987d-4e9b-ac3d-d38c4f427f4c,2022-04-12T00:26:07Z,Microsoft Application,True,Visible,False,False
69acf548-4f00-41f5-b268-acd68476bb20,Azure Cosmos DB,a232010e-820c-4083-83bb-3ace5fc29d0b,2022-04-12T17:47:08Z,Microsoft Application,True,Visible,False,False
6a671b16-5211-4f22-88e3-4e5fb0521ed0,Azure SAP Workloads Management,ea21b132-560f-4b0b-9876-903b6bca7b9d,2022-04-15T14:44:34Z,Microsoft Application,True,Visible,False,False
6a72fdd5-f84e-44ac-a070-2ddc38910a06,Azure Arc Appliance Resource Provider,585fc3c3-9a59-4720-8319-53cce041a605,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
6ab9ac97-0a3c-4607-998c-82a4b593cf3a,Azure Search Management,408992c7-2af6-4ff1-92e3-65b73d2b5092,2022-04-07T09:38:56Z,Microsoft Application,True,Visible,False,False
6b335947-4a25-447f-945e-b19df043c3e2,Azure AI Supercomputer,349e15d0-1c96-4829-95e5-7fc8fb358ff3,2022-04-15T14:49:50Z,Microsoft Application,True,Visible,False,False
6bb7379e-202b-4920-bcf8-c8d97794ea00,AzureDataCatalog,213f5f78-fb30-46c7-9e98-91c720a1c026,2022-04-15T14:46:39Z,Microsoft Application,True,Visible,False,False
6c1df9f9-eada-445b-a023-67e80d9d738a,Azure Machine Learning OpenAI,61c50b89-703d-431d-8d80-1e8618748775,2022-03-28T03:48:58Z,Microsoft Application,True,Visible,False,False
6c6b133d-85f7-476d-9ad8-ae368e2621e6,Zapier,f661c70c-c136-49d2-9b94-a2033c5874f8,2022-05-04T08:34:59Z,Enterprise Application,True,Visible,True,False
6d081357-547c-4601-a31b-562dda4f61b7,Intune DeviceCheckIn ConfidentialClient,4c1a3aed-b389-4824-99b0-514c07906851,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
6d1183c7-0bcd-4a71-bb8e-128ad304c78b,Asset Bank,6e10398e-57ba-4077-9027-e54a38dbc6dd,2022-05-04T07:45:48Z,Enterprise Application,True,Visible,True,False
6f95d0fc-af16-44c2-a576-d457b7b9dcde,CCM TAGS,997dc448-eeab-4c93-8811-6b2c80196a16,2022-04-13T04:47:49Z,Microsoft Application,True,Visible,False,False
6fa6fa7a-27a3-46bc-9dd8-9a2253162018,Exchange Office Graph Client for AAD - Interactive,6da466b6-1d13-4a2c-97bd-51a99e8d4d74,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
71465c86-8fa8-4214-a335-8da9e9641896,Salesforce Sandbox,1212c1c8-6a34-4cfb-8ecb-1ffa5cbb9a39,2022-05-04T08:31:57Z,Enterprise Application,True,Visible,True,False
72239b42-911e-4d16-8414-6ba5d31ea9c7,Azure Device Update,6ee392c4-d339-4083-b04d-6b7947c6cf78,2022-04-15T14:47:34Z,Microsoft Application,True,Visible,False,False
72596cd0-1729-48e0-9c7a-cad4d64e9719,DevAI RP,3efe2b8f-32eb-4c7a-ae9a-b43f17de36eb,2022-04-15T14:46:52Z,Microsoft Application,True,Visible,False,False
73032a8d-3ba1-4de7-81fb-6eb297581410,Microsoft Office 365 Portal,00000006-0000-0ff1-ce00-000000000000,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
74384c76-83e5-45f6-898b-00842b307f01,GatewayRP,486c78bf-a0f7-45f1-92fd-37215929e116,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
7657bb80-3a4e-4bf2-902c-f941552e1732,Azure Support - Network Watcher,341b7f3d-69b3-47f9-9ce7-5b7f4945fdbd,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
77cb82cb-f130-485a-bff6-06f42003b40d,IAM Supportability,a57aca87-cbc0-4f3c-8b9e-dc095fdc8978,2022-03-04T02:36:01Z,Microsoft Application,True,Visible,False,False
7805739c-b099-4843-8e03-08ddd3e61d37,Marketplace Caps API,184909ca-69f1-4368-a6a7-c558ee6eb0bd,2022-03-28T03:48:58Z,Microsoft Application,True,Visible,False,False
7a9cfaca-fc1f-4ee9-bd7b-34e1ca203f90,KCS-UserRP,64b12d6e-6549-484c-8cc6-6281839ba394,2022-04-12T01:09:05Z,Microsoft Application,True,Visible,False,False
7b13d558-29d8-4f92-b49b-e331eafe3d36,Microsoft Azure Batch,ddbf3205-c6bd-46ae-8127-60eb93363864,2022-04-07T07:54:15Z,Microsoft Application,True,Visible,False,False
7b626d31-912e-4d71-b5df-2ce145daa83f,Log Analytics API,ca7f3f0b-7d91-482c-8e09-c5d840d0eac5,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
7b84892d-e596-4dd9-8392-ec8ee229e274,Cortana at Work Service,2a486b53-dbd2-49c0-a2bc-278bdfc30833,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
7bb72900-c8ca-4cea-b4c8-a3c24cc0d0d8,Office 365 Client Admin,3cf6df92-2745-4f6f-bbcf-19b59bcdb62a,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
7d1a755a-2dce-43a9-8a2d-e98188c89541,eTrade,f98181d0-e16e-497c-9ac7-8c8e119ab8b5,2022-05-04T08:19:37Z,Enterprise Application,True,Visible,True,False
7d8a524b-176a-4aa1-9a47-36638d4855ee,1ES Resource Management PPE,9fc8264d-0a40-4790-86e1-e7b73a2d2298,2022-04-15T14:46:10Z,Microsoft Application,True,Visible,False,False
7d9a6e83-22da-4d04-8c9c-647c16316c10,Windows Azure Service Management API,797f4846-ba00-4fd7-ba43-dac1f8f63013,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
7e2b390b-4549-432d-8220-dc566e7af1da,DiscoverOrg,0426b777-1c7e-47f1-bdc1-e686dd0aedf1,2022-05-04T08:18:19Z,Enterprise Application,True,Visible,True,False
7eb36795-dce5-41f1-9ff4-72a5a9abcf50,Azure Reserved Instance Application,4d0ad6c7-f6c3-46d8-ab0d-1406d5e6c86b,2022-04-13T04:47:29Z,Microsoft Application,True,Visible,False,False
7ef85fff-0109-4dfc-9b7a-1540ef7f2296,Azure Region Move Orchestrator Application,51df634f-ddb4-4901-8a2d-52f6393a796b,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
7ef97ac2-c169-4054-a82c-ef50e67b691b,Autonomous Development Platform,150c8903-2280-4ab6-8708-b080044d94c6,2022-04-15T14:45:27Z,Microsoft Application,True,Visible,False,False
7f4d5447-8c91-4141-90dd-474cc042a6d5,12,c7f7c435-4759-4a66-8981-13dc508936ba,2022-04-13T22:58:10Z,Managed Identity,True,Visible,False,False
80d44253-34bc-4990-9feb-eff2bd394221,MDATPNetworkScanAgent,04687a56-4fc2-4e36-b274-b862fb649733,2022-04-07T02:51:12Z,Microsoft Application,True,Visible,False,False
80d7e40b-5fee-4994-b527-4aafcb3efc90,ConfidentialLedger,4353526e-1c33-4fcf-9e82-9683edf52848,2022-04-06T19:41:52Z,Microsoft Application,True,Visible,False,False
8136a9fa-ee2d-4d75-a457-5d4bb703b082,Liftr-DT-FPA-ARM-AME,dba650ed-9577-4bc0-9b5f-ef73e2d5bdfc,2022-04-15T14:44:52Z,Microsoft Application,True,Visible,False,False
813ca939-207c-40bb-9b7e-a7cb575ee83d,Quickbooks Other Intuit Services TurboTax,992ddfc7-4a57-44ca-aeb5-ce7846062e10,2022-05-04T08:30:55Z,Enterprise Application,True,Visible,True,False
82124d6e-af2a-4c49-8ed2-4aabeef58d31,Azure Security for IoT,cfbd4387-1a16-4945-83c0-ec10e46cd4da,2022-04-15T14:47:42Z,Microsoft Application,True,Visible,False,False
8294148f-ed9a-4fbd-96a0-4644818d8a29,Microsoft Developer Network (MSDN),d84904f1-cfbf-46a4-a8ed-6229ba95e220,2022-05-04T08:26:42Z,Enterprise Application,True,Visible,True,False
82abe9ad-c066-4e62-9fe0-234f9f394e60,Microsoft.Azure.ActiveDirectoryIUX,bb8f18b0-9c38-48c9-a847-e1ef3af0602d,2022-04-14T21:28:38Z,Microsoft Application,True,Visible,False,False
82e970ec-0291-4e5c-bb1c-6f0d2d43ca8f,Automanage API Access,d828acde-4b48-47f5-a6e8-52460104a052,2022-04-15T14:45:25Z,Microsoft Application,True,Visible,False,False
82f4ea7d-2124-4e1d-a038-f41596294316,Verifiable Credentials Issuer Service,603b8c59-ba28-40ff-83d1-408eee9a93e5,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
831172eb-05ee-4ee0-a9dd-439a90291938,Microsoft.HybridCompute Agent Service,eec53b1f-b9a4-4479-acf5-6b247c6a49f2,2022-04-12T01:26:47Z,Microsoft Application,True,Visible,False,False
833118ea-aca4-4779-afaa-57dc5dc2bf1f,Microsoft.Relay,91bb937c-29c2-4275-982f-9465f0caf03d,2022-04-15T14:48:43Z,Microsoft Application,True,Visible,False,False
8354f0cf-1571-4940-bfbf-99f93e65b274,Azure SQL Managed Instance to Microsoft.Network,76c7f279-7959-468f-8943-3954880e0d8c,2022-04-06T19:34:54Z,Microsoft Application,True,Visible,False,False
837b4944-cf2a-4a6c-9de4-b38feb460290,Azure Managed DNC,a91b1853-4403-4f54-b5cb-d1ea19d90c37,2022-04-15T14:46:55Z,Microsoft Application,True,Visible,False,False
839660c7-5124-4325-b7a8-05053abbeae1,Atlassian Cloud,93ac0ec6-05eb-4bed-94b2-4e955ebc01d3,2022-05-02T21:20:53Z,Enterprise Application,True,Visible,True,False
848fbadd-0bb3-414d-9347-109493099aa5,Microsoft Invoicing,b6b84568-6c01-4981-a80f-09da9a20bbed,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
84cbfea6-8bef-4f57-a30e-34d3ece7930b,Azure Logic Apps,7cd684f4-8a78-49b0-91ec-6a35d38739ba,2022-04-07T10:09:18Z,Microsoft Application,True,Visible,False,False
85836ad6-c0a2-403d-83ee-8757266590b2,Azure AD Application Proxy,47ee738b-3f1a-4fc7-ab11-37e4822b007e,2022-03-04T03:01:34Z,Microsoft Application,True,Visible,False,False
85b9f2b2-0ee5-41ca-9ae5-fdbfc66e4cc1,Monitoring Account API,be14bf7e-8ab4-49b0-9dc6-a0eddd6fa73e,2022-04-15T14:48:23Z,Microsoft Application,True,Visible,False,False
8777d7fb-c1c9-49c9-b5ef-54b78962b7c4,Meru19 MySQL First Party App,e6f9f783-1fdb-4755-acaf-abed6c642885,2022-04-15T14:47:05Z,Microsoft Application,True,Visible,False,False
8853d7b1-bae2-44a5-83cc-d6a1299288b2,Microsoft Mixed Reality,c7ddd9b4-5172-4e28-bd29-1e0792947d18,2022-04-07T09:59:17Z,Microsoft Application,True,Visible,False,False
88addaf1-e627-4bd2-9c87-87a80b770fb0,Microsoft Intune Advanced Threat Protection Integration,794ded15-70c6-4bcd-a0bb-9b7ad530a01a,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
895fd8f6-624f-4c62-a493-f2c0f1d4d3a4,Liftr-Monitoring-First-Party,055caf97-1b4f-4730-9f5d-acc24b707b06,2022-04-13T22:57:45Z,Microsoft Application,True,Visible,False,False
89920f88-dfe0-41cf-9109-ac1a23172f27,Intelligent Recommendations Service,c5b731db-1b0a-43f6-bcf6-757667d9cdc6,2022-04-15T14:49:06Z,Microsoft Application,True,Visible,False,False
8999df79-f591-4874-87ae-f1b54fb66381,AzureBackup_Fabric_Service,e81c7467-0fc3-4866-b814-c973488361cd,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
89b4fa73-91df-40b9-a259-dec056d45a58,Microsoft Cognitive Services,7d312290-28c8-473c-a0ed-8e53749b6d6d,2022-04-07T09:18:13Z,Microsoft Application,True,Visible,False,False
8a11928f-5d76-4ecf-8bcd-8459ac8cdbcd,AAD Terms Of Use,d52792f4-ba38-424d-8140-ada5b883f293,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
8b493585-9e4d-4c2d-9708-1d3c549684fc,Microsoft.Azure.SyncFabric,00000014-0000-0000-c000-000000000000,2022-04-15T11:38:37Z,Microsoft Application,True,Visible,False,False
8bf692cb-a343-40fe-b697-e2a2eb7020b7,Now,8e3a7976-45be-4e5c-a34f-3adb97828d00,2022-04-11T19:57:34Z,Managed Identity,True,Visible,False,False
8ca312cd-b232-458a-8d15-0ba12b80359e,Active Directory for GitHub Enterprise,e572cafa-59db-4a44-badf-c3747f054c60,2022-05-04T08:12:54Z,Enterprise Application,True,Visible,True,False
8d9a13c3-0c56-4c52-8c96-601a8dff4f8e,Azure Virtual Desktop,9cdead84-a844-4324-93f2-b2e6bb768d07,2022-04-07T03:10:19Z,Microsoft Application,True,Visible,False,False
8e7beaae-1f6d-4914-adac-49b351d434f1,Windows 365,0af06dc6-e4b5-4f28-818e-e78e62d137a5,2022-04-15T14:47:24Z,Microsoft Application,True,Visible,False,False
8f28b14e-64e8-483b-bc5a-895de6d379a2,Bing,9ea1ad79-fdb6-4f9a-8bc3-2b70f96e34c7,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
90055c59-bb86-4785-bfa0-e42154b07c65,Office365 Zoom,0d38933a-0bbd-41ca-9ebd-28c4b5ba7cb7,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
90271aac-78da-4813-bb30-301eaf5aa2eb,Quickbooks Online Backup,6b95a49c-1c54-4c1a-8cfa-838cfff6ebd7,2022-05-04T08:29:20Z,Enterprise Application,True,Visible,True,False
91af4d1d-ad49-41a7-8a58-232c59a0ef8d,Microsoft.EventGrid,4962773b-9cdb-44cf-a8bf-237846a00ab7,2022-04-09T01:12:05Z,Microsoft Application,True,Visible,False,False
91c68fd6-1a24-4fcc-ae1d-3adbd4de6a23,Azure Key Vault Managed HSM,589d5083-6f11-4d30-a62a-a4b316a14abf,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
927b830e-6cee-40be-b8c5-b063aa91ea12,Azure AD Identity Governance - Dynamics 365 Management,c495cfdc-814f-46a1-89f0-657921c9fbe0,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
92a9cdd8-ea45-4029-9da3-cf77b4d27d9b,AnyBuild Service,16f9e0a0-ac78-4c2c-a55a-f3855317a63a,2022-04-15T14:45:13Z,Microsoft Application,True,Visible,False,False
92ae6ca3-bd71-4304-b44b-395e079aa094,Microsoft Remote Desktop,a4a365df-50f1-4397-bc59-1a1564b8bb9c,2022-04-17T01:48:06Z,Microsoft Application,True,Visible,False,False
9304179e-8e48-46e2-93d9-ddffccfd4e03,Mobile Edge Compute and Mobile Networking,b8ed041c-aa91-418e-8f47-20c70abc2de1,2022-04-15T14:47:52Z,Microsoft Application,True,Visible,False,False
96c4070c-2e08-4b0f-aa23-a614c7050ff9,AzureLockbox,a0551534-cfc9-4e1f-9a7a-65093b32bb38,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
96f85762-0d07-4b09-85aa-f7c027131070,OfficeClientService,0f698dd4-f011-4d23-a33e-b36416dcb1e6,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
97f3f5b8-f519-44f2-b939-a89eb389f236,Azure Monitor System,11c174dc-1945-4a9a-a36b-c79a0f246b9b,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
9808c1fe-9105-4dfe-b6c8-9939ccccda3a,Microsoft Azure Policy Insights,1d78a85d-813d-46f0-b496-dd72f50a3ec0,2022-04-07T04:42:31Z,Microsoft Application,True,Visible,False,False
980ab915-ae86-44e4-8989-5cc6d13c7350,Azure AD Notification,fc03f97a-9db0-4627-a216-ec98ce54e018,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
988693b8-38d5-4d60-b7ff-92080e4f1765,Azure Storage,e406a681-f3d4-42a8-90b6-c2b029497af1,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
9902d369-dd4e-4e46-81ca-e6ab1f3b371c,Azure Diagnostics Resource Provider,fd225045-a727-45dc-8caa-77c8eb1b9521,2022-04-11T20:23:32Z,Microsoft Application,True,Visible,False,False
99bc521a-9d7a-4264-806a-7c153fa592fa,Azure Compute,579d9c9d-4c83-4efc-8124-7eba65ed3356,2022-03-28T03:48:58Z,Microsoft Application,True,Visible,False,False
99e1f628-7cca-40cf-83a0-c32ff6e9e456,Azure Healthcare APIs,4f6778d8-5aef-43dc-a1ff-b073724b9495,2022-04-15T14:48:00Z,Microsoft Application,True,Visible,False,False
9a0db821-4138-41b6-a3b9-7b7fda16cb1d,Azure OSSRDBMS Database,123cd850-d9df-40bd-94d5-c9f07b7fa203,2022-04-12T04:22:35Z,Microsoft Application,True,Visible,False,False
9a31754e-80b5-46c7-9ff3-b54f11f9e54d,Microsoft People Cards Service,394866fc-eedb-4f01-8536-3ff84b16be2a,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
9b0ef9ac-4791-4ce3-b9e7-dc2516bff94a,Azure Maps,ba1ea022-5807-41d5-bbeb-292c7e1cf5f6,2022-04-15T14:48:16Z,Microsoft Application,True,Visible,False,False
9bdc063b-dde2-465e-aa38-895ca5fc23d7,jocall3-Stupid-cash-c8a8be03-2ddc-44de-bc47-41013fb3aea2,8511a82b-10b4-43fb-b3bc-e621d8bdb532,2022-04-12T09:17:48Z,,True,Visible,False,False
9c6b1fdf-57b7-4d0f-a24e-bdbb6ff362b4,Backup Management Service,262044b1-e2ce-469f-a196-69ab7ada62d3,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
9c7c6bdc-1fd9-4dce-98ab-dbdcc4beb8d9,Azure VMware Solution RP,608f9929-9737-432e-860f-4e1c1821052f,2022-04-07T10:22:09Z,Microsoft Application,True,Visible,False,False
9d2f6c2a-6784-42f0-b473-b267c23e9826,Azure Machine Learning Authorization App 1,fb9de05a-fecc-4642-b3ca-66b9d4434d4d,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
9d3cbfcc-7cfc-4977-9b57-ba38be899d50,Azure Application Change Service,3edcf11f-df80-41b2-a5e4-7e213cca30d1,2022-04-15T14:45:58Z,Microsoft Application,True,Visible,False,False
9d818808-df3e-4a52-a4dc-de683c3ed00c,Microsoft Intune Service Discovery,9cb77803-d937-493e-9a3b-4b49de3f5a74,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
9daf1795-5d53-4b56-8731-9f173808f5d4,Azure DevOps,499b84ac-1321-427f-aa17-267ca6975798,2022-04-07T10:19:07Z,Microsoft Application,True,Visible,False,False
9e017d52-25f5-4be8-95ee-7526f7b8a5a7,"Citibank ",2d696fb1-e862-4e01-ade3-2cf07c587ffd,2022-05-04T07:56:12Z,Enterprise Application,True,Visible,True,False
9e34bed2-bc31-434b-a2bf-131a62cee0a2,Azure Logistics,3bc3fbf6-023a-4d86-bd09-bac559ccc9cc,2022-04-15T14:48:39Z,Microsoft Application,True,Visible,False,False
9e99f284-7348-48b3-952a-e0157f9dfb2a,azurequantum,07e1e85b-cfc5-4c4e-b7a6-3b4e315bd4e7,2022-04-07T07:56:11Z,Managed Identity,True,Visible,False,False
a05711f2-26b5-4fdb-af40-325eb39b6c89,Connectors,48af08dc-f6d2-435f-b2a7-069abd99c086,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
a0cc0454-28d2-42ca-9102-753ba23c85b9,Azure HDInsight Service,9191c4da-09fe-49d9-a5f1-d41cbe92ad95,2022-04-15T14:42:45Z,Microsoft Application,True,Visible,False,False
a2b66a5b-cb1c-44fe-aa9c-acd943575a2a,Event Hub MSI App,6201d19e-14fb-4472-a2d6-5634a5c97568,2022-04-15T14:47:30Z,Microsoft Application,True,Visible,False,False
a2e7ace0-c88c-48d9-bfd8-14a16ee4b308,Microsoft.AgFoodPlatform,e420dc86-d66f-4069-a2d0-be2f937bd272,2022-04-15T14:45:08Z,Microsoft Application,True,Visible,False,False
a35c45d0-958d-47d7-86c2-c78051508941,Azure App Configuration,35ffadb3-7fc1-497e-b61b-381d28e744cc,2022-04-15T14:45:17Z,Microsoft Application,True,Visible,False,False
a3930197-3eb0-4eec-bba1-046254ff0080,Intune DiagnosticService,7f0d9978-eb2a-4974-88bd-f22a3006fe17,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
a457ca31-42a6-47c8-9689-535937ff6c2e,Billing RP,80dbdb39-4f33-4799-8b6f-711b5e3e61b6,2022-04-06T19:32:35Z,Microsoft Application,True,Visible,False,False
a4988b59-b389-4e3d-b1c9-bc7e78f4168a,ComplianceAuthServer,9e5d84af-8971-422f-968a-354cd675ae5b,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
a4ed0a1b-de80-4696-8f9a-406d5760fb85,AzureBackup_WBCM_Service,c505e273-0ba0-47e7-a0bd-f48042b4524d,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
a55dfa54-3b67-4aab-a4d5-067714c24e6f,Microsoft.MileIQ,a25dbca8-4e60-48e5-80a2-0664fdb5c9b6,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
a5ad0c8a-6eae-4c56-934f-cba248448918,DirectoryLookupService,9cd0f7df-8b1a-4e54-8c0c-0ef3a51116f6,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
a62629fe-5858-4273-831f-72a7d9f59493,Azure SignalR Service Resource Provider,cdad765c-f191-43ba-b9f5-7aef392f811d,2022-04-15T14:49:51Z,Microsoft Application,True,Visible,False,False
a65b73a6-246c-488b-a195-3e953fb0e575,Marketplace Catalog,a5ce81bb-67c7-4043-952a-22004782adb5,2022-04-15T14:48:21Z,Microsoft Application,True,Visible,False,False
a66feae3-d651-46b3-ae4f-a27e0329fd30,Dow Jones Factiva,315970ab-3fc6-4208-9312-4bd5d35d6bb7,2022-05-04T08:18:54Z,Enterprise Application,True,Visible,True,False
a673601d-28cc-491c-9155-18d21fbfb867,Hybrid File Sync Service for Test,1fcdfafe-959b-4b32-afff-84f850974e84,2022-04-15T14:49:42Z,,True,Visible,False,False
a7dc92c2-a4bc-4c46-a646-b945c5c56fe8,Microsoft Azure Authorization Private Link Provider,de926fbf-e23b-41f9-ae15-c943a9cfa630,2022-04-28T06:11:16Z,Microsoft Application,True,Visible,False,False
a80648d0-6905-4e2e-871b-5be10d76e7b8,gongo,3541691f-c69a-4464-a9c2-ec714b5c174e,2022-04-07T09:38:02Z,Managed Identity,True,Visible,False,False
aa4fba34-0964-4c27-a725-329da97dbae0,ResourceHealthRP,8bdebf23-c0fe-4187-a378-717ad86f6a53,2022-04-11T19:51:11Z,Microsoft Application,True,Visible,False,False
aad2a928-e6e0-4dfb-b462-3f6e96c16461,Azure Percept Resource Provider,5be973a1-1c81-4878-9ab6-6b261ab404e6,2022-04-15T14:45:38Z,Microsoft Application,True,Visible,False,False
ab1c7536-89f4-4887-9f99-676eb9492234,Microsoft.WindowsESU Resource Provider,e6c69915-bcc7-4335-b655-c62f949d691b,2022-04-15T14:50:08Z,Microsoft Application,True,Visible,False,False
ab3d7da1-74cd-4360-97d0-58bed0024a4e,Azure Smart Alerts,3af5a1e8-2459-45cb-8683-bcd6cccbcc13,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
acbd5e94-4a5f-4978-a55b-54ea8b4be1f6,Microsoft Information Protection Sync Service,870c4f2e-85b6-4d43-bdda-6ed9a579b725,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
acd39d83-f024-404d-8adb-323e90e6e828,WordPress.com,2db117cf-0a64-4da6-9a6d-243f08d09528,2022-05-04T08:34:20Z,Enterprise Application,True,Visible,True,False
ad59b88f-0d9c-4656-9536-aad4e0e1d654,James-ocallaghan-Private-bank,3e235f68-22ba-48f2-baf7-34bc3d1c6ad2,2022-04-10T01:22:21Z,,True,Visible,False,False
adb1a702-9d24-4e47-a61f-898f7998634f,Azure Security Insights,98785600-1bb7-4fb9-b9fa-19afe2c8a360,2022-04-15T14:49:34Z,Microsoft Application,True,Visible,False,False
ae1121e7-f4eb-4843-a030-8ef236907731,Microsoft.IndustryDataLifeCycle,3072002f-3e97-4979-91f2-09fe40da755d,2022-04-15T14:47:48Z,Microsoft Application,True,Visible,False,False
ae593d92-7449-4aad-b774-e2c35c3bab40,Defender for Containers provisioning AKS Security Profile,c9455e78-f730-4ba3-a551-cb6a1c389089,2022-04-13T05:11:01Z,Managed Identity,True,Visible,False,False
af096403-4806-498c-819e-690ff1722069,owners,51667a77-8210-49d8-b82f-8db910137ae2,2022-04-18T10:42:55Z,Managed Identity,True,Visible,False,False
af96b089-f36f-40c1-8f15-973b56d83be3,Microsoft Defender for Cloud Scanner Resource Provider,e0ccf59d-5a20-4a87-a122-f42842cdb86a,2022-04-07T02:51:12Z,Microsoft Application,True,Visible,False,False
b00026b5-65a4-4237-bd1c-ea1ad7172a6d,Microsoft Azure Alerts Management,161a339d-b9f5-41c5-8856-6a6669acac64,2022-03-28T04:10:02Z,Microsoft Application,True,Visible,False,False
b08be435-dd8c-44c5-96c5-ef295bc195d2,Azure Information Protection,5b20c633-9a48-4a5f-95f6-dae91879051f,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
b1e01268-eb2f-44f3-8652-3b082ed3b281,RPSaaS Service RP,8b5a06b3-efd5-4511-b112-5caf390d1b92,2022-04-15T14:48:58Z,Microsoft Application,True,Visible,False,False
b24ef4cd-f24a-4532-91a7-f5388656b873,Stupid,270d0f73-6132-43b9-9666-9f5e473b7e1f,2022-04-12T05:20:34Z,Managed Identity,True,Visible,False,False
b36160b4-0fc5-412d-b5e7-92ef2adecc8a,Azure Graph,dbcbd02a-d7c4-42fb-8c27-b07e5118b848,2022-03-28T04:10:00Z,Microsoft Application,True,Visible,False,False
b3809f5d-0735-4231-848e-f7a5cc53d642,Microsoft Device Directory Service,8f41dc7c-542c-4bdd-8eb3-e60543f607ca,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
b45f541c-a5ae-4fb1-b23b-95a7a0025699,ApplianceConnectAgentToDataPlane,d22ea4d1-2678-4a7b-aa5e-f340c2a7d993,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
b46b6cb5-fd61-4b77-bb89-4695f15c26c4,Meru19 First Party App,93efed00-6552-4119-833a-422b297199f9,2022-04-12T04:22:35Z,Microsoft Application,True,Visible,False,False
b4ae0878-b3f1-42c0-aabf-50a2edcc3955,Group Configuration Processor,1690c5aa-925a-4d0e-836b-722c795bd0d0,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
b5006d96-0e37-4e08-b920-235889df4f76,Microsoft Policy Insights Provider Data Plane,8cae6e77-e04e-42ce-b5cb-50d82bce26b1,2022-04-07T04:42:31Z,Microsoft Application,True,Visible,False,False
b562b976-f002-479b-b7ea-a4124965286c,Azure Kubernetes Service AAD Server,6dae42f8-4368-4678-94ff-3960e28e3630,2022-04-12T00:26:06Z,Microsoft Application,True,Visible,False,False
b57dd6ba-e37e-4b30-aa1c-ecacd88559a1,Adobe Identity Management,324395f8-e27f-48a8-8b0b-6338c76ce949,2022-05-02T21:20:21Z,Enterprise Application,True,Visible,True,False
b5c0caaf-4e78-4b0d-9a13-f5deb76349e2,AAD App Management,f0ae4899-d877-4d3c-ae25-679e38eea492,2022-04-15T11:38:21Z,Microsoft Application,True,Visible,False,False
b6280fac-78cf-48fe-8aae-a649b4c8c48a,Hyper-V Recovery Manager,b8340c3b-9267-498f-b21a-15d5547fd85e,2022-04-10T03:05:23Z,Microsoft Application,True,Visible,False,False
b65d2e06-2631-46d6-963b-23a6d6698695,Defender for Containers provisioning Azure Policy Addon for Kub,09cf45fc-b312-44eb-a287-e6582ea20ae0,2022-04-13T05:11:00Z,Managed Identity,True,Visible,False,False
b6763cec-9224-40e4-905f-3cab2e2c06c1,AD Hybrid Health,6ea8091b-151d-447a-9013-6845b83ba57b,2022-04-15T18:17:38Z,Microsoft Application,True,Visible,False,False
b6ccbad6-1c3d-4b83-a753-2c6c8071278e,Outlook Lite,e9b154d0-7658-433b-bb25-6b8e0a8a7c59,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
b7eff990-1cb4-4c80-9630-e52e5837487f,xml,d5f39c4e-4b59-4b22-88cc-a70c399ba1cd,2022-04-07T09:44:20Z,Managed Identity,True,Visible,False,False
b8d5d672-ac89-4437-852d-64e1521ff085,Azure Spring Cloud Domain-Management,03b39d0f-4213-4864-a245-b1476ec03169,2022-04-12T08:29:48Z,Microsoft Application,True,Visible,False,False
b915682f-b4de-447b-9b05-5ff21b50f621,Liftr Nginx RP Auth,d3244f1e-56a7-4819-80e9-a30a7a83dde8,2022-04-15T14:44:28Z,Microsoft Application,True,Visible,False,False
b9443388-9516-42f5-a306-b4a27f9c6025,Intune DeviceActionService,18a4ad1e-427c-4cad-8416-ef674e801d32,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
b9b4f748-e9be-442e-b754-f4d2f955ce09,AADPremiumService,bf4fa6bf-d24c-4d1c-8cfd-12063dd646b2,2022-04-13T22:24:35Z,Microsoft Application,True,Visible,False,False
b9fbc9fc-da87-4dfe-a9ad-d42ba300e19d,Azure Container Registry - Dataplane,a3747411-ce7c-4888-9ddc-3a230786ca19,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
ba0d00c9-b91f-452f-b900-22f41cecec8f,Microsoft App Access Panel,0000000c-0000-0000-c000-000000000000,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
ba50d330-a720-475d-bb53-82611b4b0e61,Microsoft Windows AutoPilot Service API,cbfda01c-c883-45aa-aedc-e7a484615620,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
bc0c9681-2ac7-4ea4-a8cd-5cb03499a1c9,Azure Linux VM Sign-In,ce6ff14a-7fdc-4685-bbe0-f6afdfcfa8e0,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
bc1dfc1f-f9a0-4f5d-ac8b-27566fc15c99,Azure Gallery RP,b28ec8e1-950e-4bd0-b3d0-c1e93074b88b,2022-04-07T07:05:16Z,Microsoft Application,True,Visible,False,False
bcb20626-2ccf-412d-a508-55379ffa7675,Yggdrasil,78e7bc61-0fab-4d35-8387-09a8d2f5a59d,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
bce3a2a8-f447-4e83-b89e-994afb3c7f6c,One Outlook Web,9199bf20-a13f-4107-85dc-02114787ef48,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
bd516df2-4618-4b64-a2cc-ab5cd838e3f9,Managed Service,66c6d0d1-f2e7-4a18-97a9-ed10f3347016,2022-04-14T17:49:58Z,Microsoft Application,True,Visible,False,False
be5baedb-469d-4ac6-945e-1bae6867dab5,Azure Singularity - Stage,17724442-aa9a-46cc-bf09-c47bb1a98518,2022-04-15T14:49:50Z,Microsoft Application,True,Visible,False,False
bed91583-db08-4f48-b650-1f3f8186a893,Office 365 Import Service,3eb95cef-b10f-46fe-94e0-969a3d4c9292,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
bee79396-a56a-44ca-a9b4-0f3fa5c34d8b,Microsoft Mobile Application Management,0a5f63c0-b750-4f38-a71c-4fc0d58b89e2,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
bf233bc4-25f6-4003-a54d-8d725634c5ab,Domain Controller Services,443155a6-77f3-45e3-882b-22b3a8d431fb,2022-04-15T14:44:57Z,Microsoft Application,True,Visible,False,False
bf6ec951-e55b-4bdf-9212-620778dcb342,Managed Service Identity,ef5d5c69-a5df-46bb-acaf-426f161a21a2,2022-03-28T04:00:23Z,Microsoft Application,True,Visible,False,False
c007b620-4290-4cea-9e28-cab0d66bfdca,Azure Data Explorer,2746ea77-4702-4b45-80ca-3c97e680e8b7,2022-04-07T09:27:48Z,Microsoft Application,True,Visible,False,False
c04cad6c-7fda-418d-acd1-86d9676b4979,Azure Container Instance Service,6bb8e274-af5d-4df2-98a3-4fd78b4cafd9,2022-03-28T04:00:29Z,Microsoft Application,True,Visible,False,False
c06384b5-f8cf-4c42-88a8-90a34c4cef8f,OCALLAGHAN State Net,22b71bf7-6952-44c8-8b92-893ca3b117d2,2022-05-04T08:24:42Z,Enterprise Application,True,Visible,True,False
c094d9e2-15c6-4850-a069-500b94a1523e,Project Fidalgo,2dc3760b-4713-48b1-a383-1dfe3e449ec2,2022-04-15T14:47:24Z,Microsoft Application,True,Visible,False,False
c0ba24ab-5874-48b0-a3f9-a40dafb28ba2,Azure PHP Workloads Management,b3d7adc8-6b92-4061-b47d-fc1419774ccc,2022-04-15T14:44:34Z,Microsoft Application,True,Visible,False,False
c0de57f4-a854-4093-b68b-87d1e8727765,Azure API for DICOM,75e725bf-66ce-4cea-9b9a-5c4caae57f33,2022-04-15T14:48:00Z,Microsoft Application,True,Visible,False,False
c126a8da-455f-4007-a2d4-a84709b42366,Azure Lab Services,c7bb12bf-0b39-4f7f-9171-f418ff39b76a,2022-04-15T14:48:08Z,Microsoft Application,True,Visible,False,False
c13038db-6a1d-4fbf-ab0d-f93480b93190,1ES Resource Management,3cbcded7-0049-4401-9e00-5f4f10f75efe,2022-04-15T14:46:10Z,Microsoft Application,True,Visible,False,False
c132747b-7848-4ad3-8766-9032511cc2f8,ExP Studio,b998f6f8-79d0-4b6a-8c25-5791dbe49ad0,2022-04-15T14:47:28Z,Microsoft Application,True,Visible,False,False
c13f70b5-ba00-4535-a364-0ca47db1c2ce,Azure Marketplace Container Management API,737d58c1-397a-46e7-9d12-7d8c830883c2,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
c151751e-b8d8-41c5-9073-b5859006a06d,Microsoft Intune Checkin,26a4ae64-5862-427f-a9b0-044e62572a4f,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
c1694358-144c-4e56-8ae7-ef3e9403d8d4,Bot Framework Composer,ce48853e-0605-4f77-8746-d70ac63cc6bc,2022-04-15T14:45:54Z,Microsoft Application,True,Visible,False,False
c2e7ee7c-f7bf-4ca7-a441-adcd41fccf01,ViewPoint,8338dec2-e1b3-48f7-8438-20c30a534458,2022-04-30T07:42:45Z,Microsoft Application,True,Visible,False,False
c333426c-ef01-4852-9d37-9c4e51f7a9b1,AzureEnergyRpaaSAppProd,5bfdc2bf-507b-4413-8f15-f1fcf1c15475,2022-04-15T14:48:31Z,Microsoft Application,True,Visible,False,False
c41f659b-bc08-4767-b752-7b9c882919f0,Azure SQL Database,022907d3-0f1b-48f7-badc-1ba6abab6d66,2022-04-06T19:34:54Z,Microsoft Application,True,Visible,False,False
c45e13ba-d4ec-4ee7-bf24-64cb9aec49e2,Azure Service Deploy,5b306cba-9c71-49db-96c3-d17ca2379c4d,2022-04-15T14:46:53Z,Microsoft Application,True,Visible,False,False
c4979bf8-6c17-4eb5-a0df-2efeddd46aa9,Microsoft.BareBoneClusterService,2e458d69-0892-4655-b713-4f7b182315dd,2022-04-07T09:27:48Z,Microsoft Application,True,Visible,False,False
c55c0295-6e15-441a-8ecb-587c56362f57,Azure Virtual Desktop Client,a85cf173-4192-42f8-81fa-777a763e6e2c,2022-04-07T03:10:19Z,Microsoft Application,True,Visible,False,False
c61df850-9015-4efa-ba3a-fe44e6d47d0a,Azure Spring Cloud DiagSettings App,b61cc489-e138-4a69-8bf3-c2c5855c8784,2022-04-12T08:29:47Z,Microsoft Application,True,Visible,False,False
c6a11e27-7a8c-4067-b1d1-53ca898993d5,Microsoft OneDrive,959ddb6c-47bf-4db5-bb68-6d77b88a1250,2022-05-04T08:27:30Z,Enterprise Application,True,Visible,True,False
c6c15632-704c-411f-a38f-e58648b29f2c,Quickbooks Other Intuit Service Intuit App Center,990ba54a-28b0-4603-9345-b23f426585c4,2022-05-04T08:29:34Z,Enterprise Application,True,Visible,True,False
c73ff76c-9c71-478b-a0ed-10d509038f29,Microsoft.ConnectedVMwarevSphere Resource Provider,ac9dc5fe-b644-4832-9d03-d9f1ab70c5f7,2022-04-12T01:09:05Z,Microsoft Application,True,Visible,False,False
c757e191-0017-4d89-8c15-f42f9b294960,Policy Administration Service,0469d4cd-df37-4d93-8a61-f8c75b809164,2022-03-28T03:40:28Z,Microsoft Application,True,Visible,False,False
c7ae95e7-8940-40ed-aeee-d0f7962000ac,Configuration Manager Microservice,557c67cf-c916-4293-8373-d584996f60ae,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
c80e28ed-14d9-4d80-bca6-347e8fe1bb6c,Microsoft Device Management EMM API,8ae6a0b1-a07f-4ec9-927a-afb8d39da81c,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
c84dede4-963a-4582-9437-31c8bc42cb0c,AzureQuantum,a77d91dc-971b-4cf7-90c8-f183194249bc,2022-04-07T07:41:14Z,Microsoft Application,True,Visible,False,False
c87f8220-874d-4116-8297-c39ccdd10189,Azure Windows VM Sign-In,372140e0-b3b7-4226-8ef9-d57986796201,2022-03-28T03:48:58Z,Microsoft Application,True,Visible,False,False
c9c91020-496e-41a8-b1e8-3d3310b5b8c0,OneProfile Service,b2cc270f-563e-4d8a-af47-f00963a71dcd,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
c9db1c56-e9cd-468f-9cfa-a4e90ec0b7ce,AAD Request Verification Service - PROD,c728155f-7b2a-4502-a08b-b8af9b269319,2022-03-04T02:36:00Z,Microsoft Application,True,Visible,False,False
ca03a4b7-5519-454e-b99e-2cb6bbb9d782,Outlook Web App Widgets,87223343-80b1-4097-be13-2332ffa1d666,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
ca0b84a5-0846-4d60-a6b1-a8d885e28120,Azure Arc Data Services,bb55177b-a7d9-4939-a257-8ab53a3b2bc6,2022-04-12T04:58:57Z,Microsoft Application,True,Visible,False,False
ca28c22a-48c1-4786-bb11-d903baf4699f,Marketplace SaaS v2,5b712e99-51a3-41ce-86ff-046e0081c5c0,2022-04-12T00:39:13Z,Microsoft Application,True,Visible,False,False
ca7ba7a4-5fd6-440a-b099-3baaab74102a,O365 UAP Processor,df09ff61-2178-45d8-888c-4210c1c7b0b2,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
cacb87ec-7b2b-48df-8c1e-1f2bed429c50,Azure DNS Managed Resolver,b4ca0290-4e73-4e31-ade0-c82ecfaabf6a,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
cd8124ad-8dad-434c-9372-84be735dc74c,Skype for Business Online,00000004-0000-0ff1-ce00-000000000000,2022-04-13T22:24:35Z,Microsoft Application,False,Visible,False,False
cdaee88b-4c3c-419e-b1b1-c72fec387e3c,Azure Hilo cluster API access,d3d1a4fe-edb2-4b09-bc39-e41d342323d6,2022-04-15T14:42:45Z,Microsoft Application,True,Visible,False,False
ce041557-b2fa-4149-a04d-e7fe46d79bab,AML Inferencing Frontdoor,6608bce8-e060-4e82-bfd2-67ed4f60262f,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
ce3580fb-d936-432f-99b1-1e03c32417f7,Targeted Messaging Service,4c4f550b-42b2-4a16-93f9-fdb9e01bb6ed,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
cead864d-c22b-4005-a073-5a1a80decae4,Microsoft Cloud App Security,05a65629-4c1b-48c1-a78b-804c4abdd4af,2022-04-13T22:24:35Z,Microsoft Application,True,Visible,False,False
ceb3d906-4e85-4039-9ef8-3dca7976b64e,Branch Connect Web Service,57084ef3-d413-4087-a28f-f6f3b1ad7786,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
cedaa407-3ca3-4933-befe-a51cb12b4989,Quickbooks Other Intuit Service QuickBooks Payments,884e625b-d232-4ca3-88ae-fd138b5084ac,2022-05-04T08:30:34Z,Enterprise Application,True,Visible,True,False
cef1c4f6-cde2-4c83-b658-1da539874db8,Microsoft.IoTFirmwareDefense,cb082ace-8a09-486a-9d02-c15739683b01,2022-04-15T14:47:45Z,Microsoft Application,True,Visible,False,False
cf43678e-33d2-4e7b-9da8-0434b88098d6,Microsoft Azure Container Apps - Data Plane,3734c1a4-2bed-4998-a37a-ff1a9e7bf019,2022-04-06T19:33:33Z,Microsoft Application,True,Visible,False,False
cf70eed5-c890-4f43-abbd-b1ba6d3e7bf9,Microsoft Exchange Online Protection,00000007-0000-0ff1-ce00-000000000000,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
cfbb305d-4c10-4685-b765-5c0e93fe5262,Microsoft Approval Management,65d91a3d-ab74-42e6-8a2f-0add61688c74,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
cfe1a313-d72d-4449-8966-8bb38b12b269,Azure Singularity,9581bc0e-c952-4fd3-8d99-e777877718b1,2022-04-15T14:49:50Z,Microsoft Application,True,Visible,False,False
cfec6afc-a56f-4771-82d1-502a1f211f0d,Azure Resource Graph,509e4652-da8d-478d-a730-e9d4a1996ca4,2022-03-28T03:40:30Z,Microsoft Application,True,Visible,False,False
cffa3f76-08a3-4952-ba80-f68b936ffb8c,Marketplace Api,f738ef14-47dc-4564-b53b-45069484ccc7,2022-04-12T00:39:13Z,Microsoft Application,True,Visible,False,False
d01d210e-2371-45b5-aee7-166a7ce0a2b9,Cortana Experience with O365,0a0a29f9-0a25-49c7-94bf-c53c3f8fa69d,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
d01ebd3b-a3a3-4934-ad94-e07a37784018,My Staff,ba9ff945-a723-4ab5-a977-bd8c9044fe61,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
d0a1de0e-84a3-45d1-9593-4dd1472023e9,Mew2,c321abdf-8dc2-4906-a0c7-2daaf7af298c,2022-04-14T13:28:49Z,Managed Identity,True,Visible,False,False
d1cae50d-eec8-4f56-bb4b-a488630cd06b,M365 Pillar Diagnostics Service,58ea322b-940c-4d98-affb-345ec4cccb92,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
d1e99043-5a6c-498b-a557-037e75719de1,Netsuite,60fff137-909f-4cdc-8e13-3e11f583788a,2022-05-04T08:09:46Z,Enterprise Application,True,Visible,True,False
d30806e3-414b-40c4-86d6-76c79badcb35,Azure NetApp Files,12fb057d-b751-47cd-857c-f2934bb677b4,2022-04-07T10:22:09Z,Microsoft Application,True,Visible,False,False
d40662c8-b58c-413e-81f9-f40db3f8ca5e,Power BI Premium,cb4dc29f-0bf4-402a-8b30-7511498ed654,2022-04-15T14:48:53Z,Microsoft Application,True,Visible,False,False
d52304c2-25df-4921-81d3-89edd6201855,Azure Machine Learning,0736f41a-0425-4b46-bdb5-1563eff02385,2022-03-28T03:48:58Z,Microsoft Application,True,Visible,False,False
d5303b12-756a-4541-8729-5203072fec60,Azure Key Vault Managed HSM Key Governance Service,a1b76039-a76c-499f-a2dd-846b4cc32627,2022-04-14T13:36:45Z,Microsoft Application,True,Visible,False,False
d5359fc7-931d-430c-a882-ee38c98dfb05,Windows Azure Security Resource Provider,8edd93e1-2103-40b4-bd70-6e34e586362d,2022-04-07T02:51:12Z,Microsoft Application,True,Visible,False,False
d5460606-6a8e-4860-adda-dc73283a5065,Azns AAD Webhook,461e8683-5575-4561-ac7f-899cc907d62a,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
d57f0010-db6c-42a2-846b-c5b080316118,Appliance Resource Provider,ba4bc2bd-843f-4d61-9d33-199178eae34e,2022-04-07T07:42:24Z,Microsoft Application,True,Visible,False,False
d659dd18-956f-4b58-9084-53012054f1af,Liftr Nginx Network,faf1f7e1-8522-498c-a7f9-6a7f1a17f873,2022-04-15T14:44:28Z,Microsoft Application,True,Visible,False,False
d8bcd1c2-95e0-45e0-bca1-ed75ab9990a8,Service Encryption,dbc36ae1-c097-4df9-8d94-343c3d091a76,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
d942064b-802c-497e-a2ba-533d290fd8e2,Demeter.WorkerRole,3c31d730-a768-4286-a972-43e9b83601cd,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
d9f44c00-da4c-4551-bf0c-0d18f3b2cd06,SonarDaaSAPI,29820072-374d-49b8-945a-3941d7e9b468,2022-04-15T14:49:11Z,Microsoft Application,True,Visible,False,False
dc5aac66-951d-40a5-9c4b-14b60000bd31,AzureQuantum,b5615b95-29f3-4ea5-bce3-50a07b952601,2022-04-07T10:10:27Z,Managed Identity,True,Visible,False,False
dc7294e7-eb92-40d6-9c0c-679f09f0bd81,Microsoft Support Diagnostics,5b534afd-fdc0-4b38-a77f-af25442e3149,2022-04-11T20:23:32Z,Microsoft Application,True,Visible,False,False
dcc6f31e-9889-4396-b6db-d2a91bc3ecab,Azure HDInsight Cluster API,7865c1d2-f040-46cc-875f-831a1ef6a28a,2022-04-15T14:42:45Z,Microsoft Application,True,Visible,False,False
dd30a9f0-635d-4711-844b-ab8bcdee2a2a,Liftr Elastic RPaaS,9d777fa9-b417-43b8-8991-12f8ee2161d2,2022-04-15T14:47:31Z,Microsoft Application,True,Visible,False,False
dde7d961-3866-4fec-8686-5b79c19c6c2e,Azure Deployments,3b990c8b-9607-4c2a-8b04-1d41985facca,2022-04-18T10:43:27Z,Microsoft Application,True,Visible,False,False
deba0d89-7627-4379-b008-cc4e42f0b6dd,Microsoft Operations Management Suite,d2a0a418-0aac-4541-82b2-b3142c89da77,2022-04-07T09:35:45Z,Microsoft Application,True,Visible,False,False
df040dd7-d4f0-4f78-a0b3-c2f088079dba,Azure Healthcare APIs RBAC,3274406e-4e0a-4852-ba4f-d7226630abb7,2022-04-15T14:48:00Z,Microsoft Application,True,Visible,False,False
dfca1fe8-8ce2-4356-b855-d1b0293c41ae,Azure Time Series Insights,120d688d-1518-4cf7-bd38-182f158850b6,2022-04-15T14:51:07Z,Microsoft Application,True,Visible,False,False
e015cf49-84ab-4af0-9599-4558e0fcd359,Office 365 Management APIs,c5393580-f805-4401-95e8-94b7a6ef2fc2,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
e054365b-8364-4b5c-98d9-04c49c8385f9,Azure Data Warehouse Polybase,0130cc9f-7ac5-4026-bd5f-80a08a54e6d9,2022-04-06T19:34:54Z,Microsoft Application,True,Visible,False,False
e12179c2-d8e3-4232-a77e-5f8d23adcd82,Azure Hilo Service,c4b6c9c7-e308-48f1-83b3-04076f680ea0,2022-04-17T01:48:07Z,Microsoft Application,True,Visible,False,False
e16423af-5ef2-4bba-8bd1-c40facf475b0,AzNS EventHub Action,58ef1dbd-684c-47d6-8ffc-61ea7a197b95,2022-03-28T03:49:01Z,Microsoft Application,True,Visible,False,False
e22935ee-6e70-4bce-9ed1-58e58fc29644,Defender for Containers provisioning Policy extension for Arc-e,525036f0-a5e3-4a2b-bba7-440d8d71647f,2022-04-13T05:11:00Z,Managed Identity,True,Visible,False,False
e30212af-d8f6-4d45-ac40-9b2d4da76622,AzureDnsFrontendApp,a0be0c72-870e-46f0-9c49-c98333a996f7,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
e33de340-8289-4ddc-903f-dc46aff99d50,Microsoft.SecurityDevOps Resource Provider,7bf610f7-ecaf-43a2-9dbc-33b14314d6fe,2022-04-15T14:49:15Z,Microsoft Application,True,Visible,False,False
e4355453-1f82-48ea-970a-18d79dac5fe9,Microsoft IoT Central,9edfcdd9-0bc5-4bd4-b287-c3afc716aac7,2022-04-07T10:05:43Z,Microsoft Application,True,Visible,False,False
e4434950-c435-4322-861f-7ec24630aee9,Microsoft Azure Signup Portal,8e0e8db5-b713-4e91-98e6-470fed0aa4c2,2022-03-18T06:39:52Z,Microsoft Application,True,Visible,False,False
e4d11fdc-c80e-4f49-a0aa-336e673bd3ee,Phznk,3030ef2a-57cd-4c9b-9490-badf0d0cf3ff,2022-04-18T10:21:07Z,Managed Identity,True,Visible,False,False
e52f6b63-1039-4975-b9a8-c4c8d74f4298,O365SBRM Service,9d06afd9-66c9-49a6-b385-ea7509332b0b,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
e59dfb35-8513-4994-8fcf-c2ee8230cbc4,Request Approvals Read Platform,d8c767ef-3e9a-48c4-aef9-562696539b39,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
e5d30c9a-667a-45af-8298-8b347351bb31,Microsoft Discovery Service,6f82282e-0070-4e78-bc23-e6320c5fa7de,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
e64e6ba8-4ccd-494f-98ce-031b118d4e64,Microsoft Outlook,5d661950-3475-41cd-a2c3-d671a3162bc1,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
e675fef5-a0e3-478f-8c85-b0b5559596a7,Azure AD Identity Governance,bf26f092-3426-4a99-abfb-97dad74e661a,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
e6bb8d08-29a7-4435-b8c8-d9b997a02cb6,Fidalgo Dev Portal Public,0140a36d-95e1-4df5-918c-ca7ccd1fafc9,2022-04-15T14:47:24Z,Microsoft Application,True,Visible,False,False
e6e66fac-b3b9-4f34-b9fc-8d79ad047b82,James-122,9f0e9e2d-6525-4eb8-b2e0-da2314d017b5,2022-04-07T07:43:40Z,Managed Identity,True,Visible,False,False
e6f1d961-685f-4454-95ae-959d5db14b49,Compute Recommendation Service,b9a92e36-2cf8-4f4e-bcb3-9d99e00e14ab,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
e714d132-6702-4cee-873b-7d5e8ab6b0ef,Microsoft_Azure_Support,959678cf-d004-4c22-82a6-d2ce549a58b8,2022-04-11T20:22:45Z,Microsoft Application,True,Visible,False,False
e755b77f-46a0-4332-81bf-30daa01b6db2,Power BI Service,00000009-0000-0000-c000-000000000000,2022-04-15T14:48:51Z,Microsoft Application,True,Visible,False,False
e78a228a-8d5e-41d6-b8b1-0fdea93f1e24,HanaOnAzureResourceProvider,cc5476ec-3074-44d1-8461-711f5d9b0e39,2022-04-15T14:45:45Z,Microsoft Application,True,Visible,False,False
e819d0ba-62db-4a5d-b156-bc5024daeed3,ASC Contracts,7cd01e22-2632-4b54-ad19-a260969ba7ff,2022-05-04T08:03:38Z,Enterprise Application,True,Visible,True,False
e81d3345-8f10-4019-9821-4831613ad4ad,Azure Service Connector Resource Provider,c4288165-6698-45ba-98a5-48ea7791fed3,2022-04-15T14:43:56Z,Microsoft Application,True,Visible,False,False
e82a15de-6914-4911-aa4e-d0e91af34e5b,M365DataAtRestEncryption,c066d759-24ae-40e7-a56f-027002b5d3e4,2022-04-13T22:24:44Z,Microsoft Application,True,Visible,False,False
e921c83c-a127-40c4-9c8e-e4880f0a3d4a,Azure Red Hat OpenShift RP,f1dd0a37-89c6-4e07-bcd1-ffd3d43d8875,2022-04-15T14:48:44Z,Microsoft Application,True,Visible,False,False
ea0f105b-6a15-4287-9ae3-8cdcdb3aa8e1,Azure ESTS Service,00000001-0000-0000-c000-000000000000,2022-03-04T02:35:55Z,Microsoft Application,True,Visible,False,False
ea975396-f29a-438c-a79f-3d94f9052d90,Google Cloud / G Suite Connector by Microsoft,a23667b4-c8cf-42c1-86d6-25a4f46525f8,2022-04-15T11:38:22Z,Enterprise Application,True,Visible,True,False
ebd73046-9c42-4f16-a1e4-808c56061a2f,CMAT,64a7b174-5779-4506-b54c-fbb0d80f1c9b,2022-04-18T12:35:54Z,Microsoft Application,True,Visible,False,False
ec5a23b2-4317-4922-924c-66aa9ee599bc,Azure Service Fabric Resource Provider,74cb6831-0dbb-4be1-8206-fd4df301cdc2,2022-04-15T14:49:32Z,Microsoft Application,True,Visible,False,False
ecaaace1-513b-404b-bad1-a05faa74aa77,Metrics Monitor API,12743ff8-d3de-49d0-a4ce-6c91a4245ea0,2022-03-28T03:49:01Z,Microsoft Application,True,Visible,False,False
ed199611-8a22-4664-8bfa-e7236548aeec,Domain Controller Services,d87dcbc6-a371-462e-88e3-28ad15ec4e64,2022-04-15T14:44:57Z,Microsoft Application,True,Visible,False,False
ed1c7865-3d3b-44b9-865e-7cc2d2c651e0,FRPGatewayProd,a48bbb4a-8f73-478e-b492-5e1f05694d54,2022-04-15T14:45:34Z,Microsoft Application,True,Visible,False,False
ed27827c-a7ae-4ce2-b128-6fe5a7321a2e,Az,2bceb21e-ead7-46f2-a187-10ab2e65f34e,2022-04-07T10:00:35Z,Managed Identity,True,Visible,False,False
ed5e9fc7-f609-4813-84f8-7402a917e81f,Microsoft.MileIQ.Dashboard,f7069a8d-9edc-4300-b365-ae53c9627fc4,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
ed740ef4-3fff-4604-ae9f-1a85da741fc5,Microsoft Service Trust,d6fdaa33-e821-4211-83d0-cf74736489e1,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
eddf3af6-5a33-4eba-bbd8-0b691ecd62ef,Azure SQL Managed Instance to Azure AD Resource Provider,9c8b80bc-6887-42d0-b1af-d0c40f9bf1fa,2022-04-06T19:34:54Z,Microsoft Application,True,Visible,False,False
ee1f49b9-16e9-4aff-8a8e-cb9d701a726f,Substrate Instant Revocation Pipeline,eace8149-b661-472f-b40d-939f89085bd4,2022-04-13T22:24:43Z,Microsoft Application,True,Visible,False,False
ee4a7176-1a0a-4546-b074-1674bb9b9d25,Intuit,aafac111-b9f0-439b-bbe3-1839c672ac8e,2022-05-04T08:21:13Z,Enterprise Application,True,Visible,True,False
ee5eea8e-0a0d-4064-996b-1d99457341de,Azuresicks,cf6163c2-70e2-4a66-ba08-0d46eb68dcf9,2022-04-12T02:28:38Z,Managed Identity,True,Visible,False,False
eebbf2c7-0dc1-4d14-87ae-2bd97f3bebc4,Azure Digital Twins Authorization PDP,c115998b-3d59-49b4-b55b-042a9ba1dbfe,2022-04-13T21:58:42Z,Microsoft Application,True,Visible,False,False
efdd0a23-f592-404b-8025-131c8bc947d5,Microsoft Device Management Checkin,ca0a114d-6fbc-46b3-90fa-2ec954794ddb,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
f006d610-c616-46d5-a802-1b765bdfb22f,Microsoft Defender for Cloud Servers Scanner Resource Provider,0c7668b5-3260-4ad0-9f53-34ed54fa19b2,2022-04-12T02:22:12Z,Microsoft Application,True,Visible,False,False
f0e4a1dc-93f3-4491-87cc-0d8f8b910e94,Azure Iot Hub Publisher App,29f411f1-b2cf-4043-8ac8-2185d7316811,2022-04-07T10:01:27Z,Microsoft Application,True,Visible,False,False
f0f64f73-1f75-4663-9c8f-e1cb0f490369,App Protection,c6e44401-4d0a-4542-ab22-ecd4c90d28d7,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
f1b484a5-be8f-41e5-8008-5183b35e617d,StoragePool Resource Provider,5741a1ff-751d-4ad7-bcd1-dfe3c998fd11,2022-04-15T14:50:00Z,Microsoft Application,True,Visible,False,False
f210c37b-6bd9-47cf-a31e-c7f12c853efa,ConnectionsService,b7912db9-aa33-4820-9d4f-709830fdd78f,2022-04-13T22:24:42Z,Microsoft Application,True,Visible,False,False
f22c5e8e-91a8-4bf8-b6d2-077c3dd3f44a,Azure Application Change Service,2cfc91a4-7baa-4a8f-a6c9-5f3d279060b8,2022-04-15T14:45:58Z,Microsoft Application,True,Visible,False,False
f278ead3-ecac-446e-a1e1-ac3c3f4d5d3c,Microsoft.StorageSync,9469b9f5-6722-4481-a2b2-14ed560b706f,2022-04-15T14:49:42Z,Microsoft Application,True,Visible,False,False
f2b870f6-1a57-47af-a69a-4ebee8514437,Microsoft Azure Authorization Resource Provider,1dcb1bc7-c721-498e-b2fa-bcddcea44171,2022-04-28T06:11:16Z,Microsoft Application,True,Visible,False,False
f2deff4b-82f2-4b39-af79-236c60772e4e,Private Mobile Network,54b9b9be-c365-4548-95c6-d2f2011f48f4,2022-04-15T14:48:26Z,Microsoft Application,True,Visible,False,False
f2ea4254-a887-4dd3-9676-9958a83d5142,Azure Monitor for VMs,ddc728e9-153d-4032-ab80-80e57af7a56f,2022-04-15T14:44:37Z,Microsoft Application,True,Visible,False,False
f3074d1a-e71b-48c0-9892-fd01e8b35566,Azure AD Identity Governance Insights,58c746b0-a0b0-4647-a8f6-12dde5981638,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
f3f66968-d78b-4525-b5d6-118ce7251959,Azure DNS,19947cfd-0303-466c-ac3c-fcc19a7a1570,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
f4047865-a4d3-4ea7-878d-a3cbc5c9e2d5,ideaIU-213.6777.52 (2022_03_10 08_50_24 UTC),abcdbe4b-4a26-4340-a0bd-04aed964e8af,2022-05-02T21:26:48Z,Enterprise Application,True,Hidden,False,False
f4268a7b-0e0b-458b-bb07-4145b609854d,Azure Import Export,7de4d5c5-5b32-4235-b8a9-33b34d6bcd2a,2022-04-15T14:47:51Z,Microsoft Application,True,Visible,False,False
f469ee86-fa36-42dc-8be2-de5f6d6a3fe4,AAD Lifecycle Management,ce79fdc4-cd1d-4ea5-8139-e74d7dbe0bb7,2022-04-13T22:24:48Z,Microsoft Application,True,Visible,False,False
f46fb89f-c527-4b22-af6e-8c3cbd6b2174,Centralized Deployment,257601fd-462f-4a21-b623-7f719f0f90f4,2022-04-13T22:24:41Z,Microsoft Application,True,Visible,False,False
f5302e1f-5841-45b9-989a-4e30ae0142a3,Microsoft Threat Protection,8ee8fdad-f234-4243-8f3b-15c294843740,2022-04-07T02:51:12Z,Microsoft Application,True,Visible,False,False
f5b0aa9b-7577-4b29-9054-731d2610a05b,Track em,3480ae63-e100-432c-92c8-4aee777c5671,2022-05-04T08:32:56Z,Enterprise Application,True,Visible,True,False
f64c5f55-3245-4503-aacc-0daa679c9d96,Hybrid RP Application,d2a590e7-6906-4a45-8f41-cecfdca9bca1,2022-04-12T01:09:05Z,Microsoft Application,True,Visible,False,False
f6b4f57c-2b35-4b14-a2fb-21a9267f2d94,Microsoft Container Registry,a4c95b9e-3994-40cc-8953-5dc66d48348d,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
f7b2840c-6e48-4b50-b1f1-5db9fdccd567,Dynamic Alerts,707be275-6b9d-4ee7-88f9-c0c2bd646e0f,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
f7b2aaef-7979-4444-a651-62cdfa08cb05,MicrosoftGuestConfiguration,e935b4a5-8968-416d-8414-caed51c782a9,2022-04-07T04:42:30Z,Microsoft Application,True,Visible,False,False
f7d81543-79f6-43c3-855d-a47db42176e7,Azure AD Identity Governance - Directory Management,ec245c98-4a90-40c2-955a-88b727d97151,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
f82469d0-31ee-4773-a330-2ab4fef2caaf,Azure Maps Resource Provider,608f6f31-fed0-4f7b-809f-90f6c9b3de78,2022-04-15T14:48:16Z,Microsoft Application,True,Visible,False,False
f8aaead6-47f1-4bf0-bd21-76f8f0274053,Networking-MNC,6d057c82-a784-47ae-8d12-ca7b38cf06b4,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
f8c6f197-e654-4ac9-a9b5-7d8b503ced24,Azure Spring Cloud Resource Provider,e8de9221-a19c-4c81-b814-fd37c6caf9d2,2022-04-12T08:29:48Z,Microsoft Application,True,Visible,False,False
f90c9f6a-9298-4642-a4d6-bbb111f1c87e,SAP Concur Travel and Expense,5e99b34c-2ea8-49d4-b205-1c8bb56114d8,2022-05-02T21:23:04Z,Enterprise Application,True,Visible,True,False
f97b8d96-4575-4ea9-afbf-ec3c7d3ce2df,MicrosoftAutomanaged,9ae330ab-d710-466b-851c-c828e7340846,2022-04-15T14:45:26Z,Microsoft Application,True,Visible,False,False
fb0f9426-71cc-4e6a-9291-b43005301565,oo,aae1f723-e3f6-4223-a7cd-0a590e2247bc,2022-04-07T09:19:20Z,Managed Identity,True,Visible,False,False
fb7956a2-40aa-49f4-949a-2d7811c16519,Microsoft Information Protection API,40775b29-2688-46b6-a3b5-b256bd04df9f,2022-04-13T22:24:45Z,Microsoft Application,True,Visible,False,False
fb7cb90e-47d8-455e-af73-b42d102bb4be,Microsoft Intune AAD BitLocker Recovery Key Integration,ccf4d8df-75ce-4107-8ea5-7afd618d4d8a,2022-04-13T22:24:47Z,Microsoft Application,True,Visible,False,False
fb9fa99b-baa3-4c31-b7ab-d7bea164e01c,Device Registration Service,01cb2876-7ebd-4aa4-9cc9-d28bd4d359a9,2022-04-13T22:25:31Z,Microsoft Application,True,Visible,False,False
fba2986c-688c-4960-b0bc-521eb59b356f,Azure Advisor,c39c9bac-9d1f-4dfb-aa29-27f6365e5cb7,2022-04-07T02:51:12Z,Microsoft Application,True,Visible,False,False
fbc1d505-6a87-4db6-90dc-81ecd783e772,Data Migration Service,a4bad4aa-bf02-4631-9f78-a64ffdba8150,2022-04-15T14:47:08Z,,True,Visible,False,False
fcd55bac-faeb-4687-a46c-c4dcddf1ff83,Application Insights Configuration Service,6a0a243c-0886-468a-a4c2-eff52c7445da,2022-03-28T03:48:59Z,Microsoft Application,True,Visible,False,False
fd11775d-fc4e-4a85-b968-8a56bdd7f784,Azure Chaos Studio,ecad3f28-c75d-4414-94e0-a5e1de4df79e,2022-04-15T14:46:02Z,Microsoft Application,True,Visible,False,False
fd71ba7d-8514-4b29-8648-be8524c601c9,Intuit Online Payroll,42bb5b6c-1300-4c06-b3ef-bdadc9571ec9,2022-05-04T08:21:34Z,Enterprise Application,True,Visible,True,False
fd8f8c84-25c0-4161-a6a7-1b0144ea8911,Databricks Resource Provider,d9327919-6775-4843-9037-3fb0fb0473cb,2022-04-07T09:52:32Z,Microsoft Application,True,Visible,False,False
fda1f971-bb96-41fa-913a-0ab3e4b4625e,Microsoft Visual Studio Services API,9bd5ab7f-4031-4045-ace9-6bebbad202f6,2022-04-15T14:46:16Z,Microsoft Application,True,Visible,False,False
fdd7624d-1e97-4323-a7fb-adfff040a4d2,Workload Builder RP App,63c2c773-89fe-4164-a02f-b8c7fc1772ae,2022-04-15T14:50:04Z,Microsoft Application,True,Visible,False,False
fe865e8d-f271-4a46-8fd0-7fba768b4b9e,NetworkTrafficAnalyticsService,1e3e4475-288f-4018-a376-df66fd7fac5f,2022-04-06T19:41:40Z,Microsoft Application,True,Visible,False,False
fe8d6ec4-94fb-482c-9930-6916afb424c1,Azure Cost Management Exports,e5408ad0-c4e2-43aa-b6f2-3b4951286d99,2022-04-10T07:37:35Z,Microsoft Application,True,Visible,False,False
fed48d56-86e3-4e28-aa4c-a4625e89ffeb,Quickbooks Online Accountant,a8399344-a951-4537-8cf2-444aede33ff2,2022-05-04T08:28:44Z,Enterprise Application,True,Visible,True,False
fee99df4-4fb6-431c-b36c-670049121be4,Microsoft Intune AndroidSync,d8877f27-09c0-43aa-8113-40151dae8b14,2022-04-13T22:24:46Z,Microsoft Application,True,Visible,False,False
fef4153a-8c84-488a-956c-d894faa22cb5,Fidalgo Dataplane Public,e526e72f-ffae-44a0-8dac-cf14b8bd40e2,2022-04-15T14:47:25Z,Microsoft Application,True,Visible,False,False
fefefbb4-5f46-4dda-837b-1dc751bf9ea2,Salesforce,35274a02-4c3a-4878-9c89-7b9f1b09644f,2022-05-04T07:43:28Z,Enterprise Application,True,Visible,True,False
ff16bd6f-686a-42a2-8696-87bfda4010aa,PowerApps Service,475226c6-020e-4fb2-8a90-7a972cbfc1d4,2022-04-14T13:13:03Z,Microsoft Application,True,Visible,False,False
ff249d09-c032-4d0f-baa3-5eef5c48ad20,ClusterConfigToAKS,03db181c-e9d3-4868-9097-f0b728327182,2022-04-12T01:09:04Z,Microsoft Application,True,Visible,False,False
ff791a79-8377-4d5e-95b9-0bd82e674308,Azure HDInsight Surrogate Service,5a543d7c-9c4a-4f90-8cc7-6ae082a5b65b,2022-04-15T14:42:45Z,Microsoft Application,True,Visible,False,False
ff8b3a8e-da32-4e9c-909a-b9a149ef11e3,Liftr Elastic Whale Worker,5b81a823-5f67-4fb3-8d0f-4c92b5044fe4,2022-04-15T14:47:31Z,Microsoft Application,True,Visible,False,False
fff88d6c-ae9c-4ceb-9306-d2cc2cc7af53,VMwareVMIdentityForHIS,157638eb-a5cb-4c10-af42-2d6759eb1871,2022-04-12T01:09:05Z,Microsoft Application,True,Visible,False,False
`;

// Helper function to parse the CSV data into an array of Application objects
const parseCsvData = (csvText: string): Application[] => {
    try {
        const lines = csvText.trim().split('\n');
        const headerLine = lines.shift();
        if (!headerLine) return [];

        const headers = headerLine.split(',') as (keyof Application)[];
        const booleanFields: (keyof Application)[] = ['accountEnabled', 'assignmentRequired', 'isAppProxy'];

        return lines.map(line => {
            // Regex to split by comma, but ignore commas inside double quotes
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            const entry = headers.reduce((obj, header, index) => {
                let value: any = (values[index] || '').trim();

                // Remove quotes from start and end
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1).trim();
                }

                // Convert string 'True'/'False' to boolean
                if (booleanFields.includes(header)) {
                    obj[header] = value.toLowerCase() === 'true';
                } else {
                    obj[header] = value;
                }
                
                return obj;
            }, {} as { [key in keyof Application]: any });

            return entry as Application;
        }).filter(app => app.id); // Filter out any potentially empty/malformed lines
    } catch (e) {
        console.error("Failed to parse CSV data:", e);
        return [];
    }
};

// The provider component
export const IdentityProvider = ({ children }: { children: ReactNode }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate async data fetching/parsing
            setTimeout(() => {
                const parsedData = parseCsvData(rawCsvData);
                setApplications(parsedData);
                setIsLoading(false);
            }, 50); // Small delay to simulate async operation
        } catch (e) {
            setError("An error occurred while loading application data.");
            console.error(e);
            setIsLoading(false);
        }
    }, []);

    const value = useMemo(() => ({
        applications,
        isLoading,
        error,
    }), [applications, isLoading, error]);

    return (
        <IdentityContext.Provider value={value}>
            {children}
        </IdentityContext.Provider>
    );
};

// Custom hook to use the IdentityContext
export const useIdentity = (): IdentityContextType => {
    const context = useContext(IdentityContext);
    if (context === undefined) {
        throw new Error('useIdentity must be used within an IdentityProvider');
    }
    return context;
};
