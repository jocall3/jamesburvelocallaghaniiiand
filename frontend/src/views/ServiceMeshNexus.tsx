import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Toolbar,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  TablePagination,
  Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import PublicIcon from '@mui/icons-material/Public';
import PrivateApiIcon from '@mui/icons-material/Lock';
import { visuallyHidden } from '@mui/utils';

// --- Citibankdemobusinessinc Namespace ---
// This file is part of the Citibankdemobusinessinc ecosystem, focusing on API service management.

// --- Data Definition ---

interface ApiService {
  name: string;
  title: string;
  status: 'Active' | 'Inactive' | 'Pending';
  version: 'v1' | 'v2' | 'beta';
  isPublic: boolean;
  securityScore: number; // 0 to 100
  latency: number; // ms
}

// --- Internal Generative Data Functions ---

/**
 * Generates a random integer within a specified range.
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A random integer.
 */
const generateRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random floating-point number within a specified range.
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A random floating-point number.
 */
const generateRandomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generates a random choice from a given array.
 * @param arr - The array to choose from.
 * @returns A random element from the array.
 */
const generateRandomChoice = <T>(arr: T[]): T => {
  return arr[generateRandomInt(0, arr.length - 1)];
};

/**
 * Generates mock API service data based on raw input.
 * This function simulates dynamic data generation for the API services.
 * @param raw_data - An array of [endpoint, title] pairs.
 * @returns An array of ApiService objects.
 */
const generateMockApiData = (raw_data: [string, string][]): ApiService[] => {
  const statuses: ApiService['status'][] = ['Active', 'Inactive', 'Pending'];
  const versions: ApiService['version'][] = ['v1', 'v2', 'beta'];

  return raw_data.map(([name, title], index) => ({
    name,
    title,
    status: generateRandomChoice(statuses),
    version: generateRandomChoice(versions),
    isPublic: generateRandomInt(0, 100) > 20, // 80% public
    securityScore: generateRandomInt(50, 100), // 50-100
    latency: generateRandomInt(20, 220), // 20-220ms
  }));
};

// Simulated Data based on the project goal list
const RAW_API_DATA: [string, string][] = [
  ['abusiveexperiencereport.googleapis.com', 'Abusive Experience Report API'],
  ['acceleratedmobilepageurl.googleapis.com', 'Accelerated Mobile Pages (AMP) URL API'],
  ['accessapproval.googleapis.com', 'Access Approval API'],
  ['accesscontextmanager.googleapis.com', 'Access Context Manager API'],
  ['actions.googleapis.com', 'Actions API'],
  ['adexchangebuyer-json.googleapis.com', 'Ad Exchange Buyer API'],
  ['adexchangebuyer.googleapis.com', 'Ad Exchange Buyer API II'],
  ['adexchangeseller.googleapis.com', 'Ad Exchange Seller API'],
  ['adexperiencereport.googleapis.com', 'Ad Experience Report API'],
  ['admin.googleapis.com', 'Admin SDK'],
  ['admob.googleapis.com', 'AdMob API'],
  ['adsense.googleapis.com', 'AdSense Management API'],
  ['adsensehost.googleapis.com', 'AdSense Host API'],
  ['alertcenter.googleapis.com', 'G Suite Alert Center API'],
  ['analytics.googleapis.com', 'Google Analytics API'],
  ['analyticsreporting.googleapis.com', 'Analytics Reporting API'],
  ['androidcheck.googleapis.com', 'Android Device Verification'],
  ['androiddeviceprovisioning.googleapis.com', 'Android Device Provisioning Partner API'],
  ['androidenterprise.googleapis.com', 'Google Play EMM API'],
  ['androidmanagement.googleapis.com', 'Android Management API'],
  ['androidovertheair.googleapis.com', 'Android Over The Air API'],
  ['androidpublisher.googleapis.com', 'Google Play Android Developer API'],
  ['anthos.googleapis.com', 'Anthos API'],
  ['anthosaudit.googleapis.com', 'Anthos Audit API'],
  ['anthosgke.googleapis.com', 'Anthos GKE API'],
  ['apigee.googleapis.com', 'Apigee API'],
  ['appengine.googleapis.com', 'App Engine Admin API'],
  ['appengineflex.googleapis.com', 'Google App Engine Flexible Environment'],
  ['appsactivity.googleapis.com', 'Apps Activity API'],
  ['appsmarket-component.googleapis.com', 'G Suite Marketplace SDK'],
  ['appsmarket.googleapis.com', 'G Suite Marketplace API'],
  ['arcorecloudanchor.googleapis.com', 'ARCore Cloud Anchor API'],
  ['artifactregistry.googleapis.com', 'Artifact Registry API'],
  ['audit.googleapis.com', 'Audit API'],
  ['automl.googleapis.com', 'Cloud AutoML API'],
  ['bigquery.googleapis.com', 'BigQuery API'],
  ['bigqueryconnection.googleapis.com', 'BigQuery Connection API'],
  ['bigquerydatatransfer.googleapis.com', 'BigQuery Data Transfer API'],
  ['bigqueryreservation.googleapis.com', 'BigQuery Reservation API'],
  ['bigquerystorage.googleapis.com', 'BigQuery Storage API'],
  ['bigtable.googleapis.com', 'Cloud Bigtable API'],
  ['bigtableadmin.googleapis.com', 'Cloud Bigtable Admin API'],
  ['bigtabletableadmin.googleapis.com', 'Cloud Bigtable Table Admin API'],
  ['billingbudgets.googleapis.com', 'Cloud Billing Budget API'],
  ['binaryauthorization.googleapis.com', 'Binary Authorization API'],
  ['blogger.googleapis.com', 'Blogger API v3'],
  ['books.googleapis.com', 'Books API'],
  ['bookstore.endpoints.endpoints-portal-demo.cloud.goog', 'Bookstore gRPC API'],
  ['caldav.googleapis.com', 'CalDAV API'],
  ['calendar-json.googleapis.com', 'Google Calendar API'],
  ['carddav.googleapis.com', 'Google Contacts CardDAV API'],
  ['chat.googleapis.com', 'Hangouts Chat API'],
  ['chromewebstore.googleapis.com', 'Chrome Web Store API'],
  ['civicinfo.googleapis.com', 'Civic Information API'],
  ['classroom.googleapis.com', 'Google Classroom API'],
  ['cloudapis.googleapis.com', 'Google Cloud APIs'],
  ['cloudasset.googleapis.com', 'Cloud Asset API'],
  ['cloudbilling.googleapis.com', 'Cloud Billing API'],
  ['cloudbuild.googleapis.com', 'Cloud Build API'],
  ['clouddebugger.googleapis.com', 'Cloud Debugger API'],
  ['clouderrorreporting.googleapis.com', 'Error Reporting API'],
  ['cloudfunctions.googleapis.com', 'Cloud Functions API'],
  ['cloudidentity.googleapis.com', 'Cloud Identity API'],
  ['cloudiot.googleapis.com', 'Cloud IoT API'],
  ['cloudkms.googleapis.com', 'Cloud Key Management Service (KMS) API'],
  ['cloudlatencytest.googleapis.com', 'Cloud Network Performance Monitoring API'],
  ['cloudprivatecatalog.googleapis.com', 'Cloud Private Catalog API'],
  ['cloudprofiler.googleapis.com', 'Stackdriver Profiler API'],
  ['cloudresourcemanager.googleapis.com', 'Cloud Resource Manager API'],
  ['cloudscheduler.googleapis.com', 'Cloud Scheduler API'],
  ['cloudsearch.googleapis.com', 'Cloud Search API'],
  ['cloudshell.googleapis.com', 'Cloud Shell API'],
  ['cloudtasks.googleapis.com', 'Cloud Tasks API'],
  ['cloudtrace.googleapis.com', 'Cloud Trace API'],
  ['cloudvolumesgcp-api.netapp.com', 'NetApp Cloud Volumes API'],
  ['composer.googleapis.com', 'Cloud Composer API'],
  ['compute.googleapis.com', 'Compute Engine API'],
  ['computescanning.googleapis.com', 'Compute Scanning API'],
  ['contacts.googleapis.com', 'Contacts API'],
  ['container.googleapis.com', 'Kubernetes Engine API'],
  ['containeranalysis.googleapis.com', 'Container Analysis API'],
  ['containerregistry.googleapis.com', 'Container Registry API'],
  ['containerscanning.googleapis.com', 'Container Scanning API'],
  ['containerthreatdetection.googleapis.com', 'Container Threat Detection API'],
  ['copresence.googleapis.com', 'Nearby Messages API'],
  ['customsearch.googleapis.com', 'Custom Search API'],
  ['datacatalog.googleapis.com', 'Google Cloud Data Catalog API'],
  ['dataflow.googleapis.com', 'Dataflow API'],
  ['datafusion.googleapis.com', 'Cloud Data Fusion API'],
  ['datalabeling.googleapis.com', 'Data Labeling API'],
  ['dataproc.googleapis.com', 'Cloud Dataproc API'],
  ['datastore.googleapis.com', 'Cloud Datastore API'],
  ['datastudio.googleapis.com', 'Data Studio API'],
  ['deploymentmanager.googleapis.com', 'Cloud Deployment Manager V2 API'],
  ['dfareporting.googleapis.com', 'DCM/DFA Reporting And Trafficking API'],
  ['dialogflow.googleapis.com', 'Dialogflow API'],
  ['digitalassetlinks.googleapis.com', 'Digital Asset Links API'],
  ['directions-backend.googleapis.com', 'Directions API'],
  ['discovery.googleapis.com', 'API Discovery Service'],
  ['displayvideo.googleapis.com', 'Display & Video 360 API'],
  ['distance-matrix-backend.googleapis.com', 'Distance Matrix API'],
  ['dlp.googleapis.com', 'Cloud Data Loss Prevention (DLP) API'],
  ['dns.googleapis.com', 'Cloud DNS API'],
  ['docs.googleapis.com', 'Google Docs API'],
  ['documentai.googleapis.com', 'Cloud Document AI API'],
  ['domainsrdap.googleapis.com', 'Domains RDAP API'],
  ['doubleclickbidmanager.googleapis.com', 'DoubleClick Bid Manager API'],
  ['doubleclicksearch.googleapis.com', 'Search Ads 360 API'],
  ['drive.googleapis.com', 'Google Drive API'],
  ['driveactivity.googleapis.com', 'Drive Activity API'],
  ['echo-api.endpoints.endpoints-portal-demo.cloud.goog', 'Endpoints Example'],
  ['elasticsearch-service.gcpmarketplace.elastic.co', 'Elasticsearch Service on Elastic Cloud - Standard'],
  ['elevation-backend.googleapis.com', 'Maps Elevation API'],
  ['embeddedassistant.googleapis.com', 'Google Assistant API'],
  ['endpoints.googleapis.com', 'Google Cloud Endpoints'],
  ['endpointsportal.googleapis.com', 'Cloud Endpoints Portal'],
  ['factchecktools.googleapis.com', 'Fact Check Tools API'],
  ['fcm.googleapis.com', 'Firebase Cloud Messaging API'],
  ['fcmregistrations.googleapis.com', 'FCM Registration API'],
  ['file.googleapis.com', 'Cloud Filestore API'],
  ['firebase.googleapis.com', 'Firebase Management API'],
  ['firebaseappdistribution.googleapis.com', 'Firebase App Distribution API'],
  ['firebaseapptesters.googleapis.com', 'Firebase App Testers API'],
  ['firebasedynamiclinks.googleapis.com', 'Firebase Dynamic Links API'],
  ['firebaseextensions.googleapis.com', 'Firebase Extensions API'],
  ['firebasehosting.googleapis.com', 'Firebase Hosting API'],
  ['firebaseinappmessaging.googleapis.com', 'Firebase In-App Messaging API'],
  ['firebaseinstallations.googleapis.com', 'Firebase Installations API'],
  ['firebaseml.googleapis.com', 'Firebase ML API'],
  ['firebasemods.googleapis.com', 'Firebase Mods API'],
  ['firebasepredictions.googleapis.com', 'Firebase Predictions API'],
  ['firebaseremoteconfig.googleapis.com', 'Firebase Remote Config API'],
  ['firebaserules.googleapis.com', 'Firebase Rules API'],
  ['firebasestorage.googleapis.com', 'Firebase Storage'],
  ['firestore.googleapis.com', 'Cloud Firestore API'],
  ['firewallinsights.googleapis.com', 'Firewall Insights API'],
  ['fitness.googleapis.com', 'Fitness API'],
  ['freebase.googleapis.com', 'Freebase API'],
  ['fusiontables.googleapis.com', 'Fusion Tables API'],
  ['games.googleapis.com', 'Google Play Game Services'],
  ['gamesconfiguration.googleapis.com', 'Google Play Game Services Publishing API'],
  ['gameservices.googleapis.com', 'Game Services API'],
  ['gamesmanagement.googleapis.com', 'Google Play Game Management'],
  ['gcp.redisenterprise.com', 'Redis Enterprise'],
  ['genomics.googleapis.com', 'Genomics API'],
  ['geocoding-backend.googleapis.com', 'Geocoding API'],
  ['geolocation.googleapis.com', 'Geolocation API'],
  ['gkeconnect.googleapis.com', 'GKE Connect API'],
  ['gkehub.googleapis.com', 'GKE Hub'],
  ['gmail.googleapis.com', 'Gmail API'],
  ['googleads.googleapis.com', 'Google Ads API'],
  ['googlecloudmessaging.googleapis.com', 'Cloud Messaging'],
  ['groupsmigration.googleapis.com', 'Groups Migration API'],
  ['groupssettings.googleapis.com', 'Groups Settings API'],
  ['healthcare.googleapis.com', 'Cloud Healthcare API'],
  ['homegraph.googleapis.com', 'HomeGraph API'],
  ['iam.googleapis.com', 'Identity and Access Management (IAM) API'],
  ['iamcredentials.googleapis.com', 'IAM Service Account Credentials API'],
  ['iap.googleapis.com', 'Cloud Identity-Aware Proxy API'],
  ['identitytoolkit.googleapis.com', 'Identity Toolkit API'],
  ['indexing.googleapis.com', 'Indexing API'],
  ['invoice.googleapis.com', 'Invoice'],
  ['jobs.googleapis.com', 'Cloud Talent Solution API'],
  ['kgsearch.googleapis.com', 'Knowledge Graph Search API'],
  ['language.googleapis.com', 'Cloud Natural Language API'],
  ['libraryagent.googleapis.com', 'Library Agent API'],
  ['licensing.googleapis.com', 'Enterprise License Manager API'],
  ['lifesciences.googleapis.com', 'Cloud Life Sciences API'],
  ['logging.googleapis.com', 'Cloud Logging API'],
  ['managedidentities.googleapis.com', 'Managed Service for Microsoft Active Directory API'],
  ['manufacturers.googleapis.com', 'Manufacturer Center API'],
  ['maps-android-backend.googleapis.com', 'Maps SDK for Android'],
  ['maps-backend.googleapis.com', 'Maps JavaScript API'],
  ['maps-embed-backend.googleapis.com', 'Maps Embed API'],
  ['maps-ios-backend.googleapis.com', 'Maps SDK for iOS'],
  ['mediatranslation.googleapis.com', 'Media Translation API'],
  ['memcache.googleapis.com', 'Cloud Memorystore for Memcached API'],
  ['meshca.googleapis.com', 'Anthos Service Mesh Certificate Authority API'],
  ['meshconfig.googleapis.com', 'Mesh Configuration API'],
  ['meshtelemetry.googleapis.com', 'Mesh Telemetry API'],
  ['migrate.googleapis.com', 'G Suite Migrate API'],
  ['mirror.googleapis.com', 'Mirror API'],
  ['ml.googleapis.com', 'AI Platform Training & Prediction API'],
  ['mlkit.googleapis.com', 'ML Kit API'],
  ['mobilecrashreporting.googleapis.com', 'Mobile Crash Reporting API'],
  ['monitoring.googleapis.com', 'Cloud Monitoring API'],
  ['moviesanywhere.googleapis.com', 'Play Movies Anywhere API'],
  ['multiclusteringress.googleapis.com', 'Multi Cluster Ingress API'],
  ['multiclustermetering.googleapis.com', 'Multi cluster metering API'],
  ['networkmanagement.googleapis.com', 'Network Management API'],
  ['networktopology.googleapis.com', 'Network Topology API'],
  ['notebooks.googleapis.com', 'Notebooks API'],
  ['orkut.googleapis.com', 'Orkut REST API'],
  ['osconfig.googleapis.com', 'Cloud OS Config API'],
  ['oslogin.googleapis.com', 'Cloud OS Login API'],
  ['pagespeedonline.googleapis.com', 'PageSpeed Insights API'],
  ['partners-json.googleapis.com', 'Google Partners API'],
  ['payg-prod.gcpmarketplace.confluent.cloud', 'Confluent Cloud Service Prod'],
  ['people.googleapis.com', 'People API'],
  ['performanceparameters.googleapis.com', 'Android Performance Parameters API'],
  ['photoslibrary.googleapis.com', 'Photos Library API'],
  ['picker.googleapis.com', 'Google Picker API'],
  ['places-backend.googleapis.com', 'Places API'],
  ['playcustomapp.googleapis.com', 'Google Play Custom App Publishing API'],
  ['plus.googleapis.com', 'Google+ API'],
  ['plusdomains.googleapis.com', 'Google+ Domains API'],
  ['plushangouts.googleapis.com', 'Google+ Hangouts API'],
  ['policytroubleshooter.googleapis.com', 'Policy Troubleshooter API'],
  ['poly.googleapis.com', 'Poly API'],
  ['prod-tt-sasportal.googleapis.com', 'SAS Portal API (Testing)'],
  ['prod.cloud.datastax.com', 'DataStax Astra - Cassandra as a Service'],
  ['pubsub.googleapis.com', 'Cloud Pub/Sub API'],
  ['realtime.googleapis.com', 'Realtime API'],
  ['recommender.googleapis.com', 'Recommender API'],
  ['redis.googleapis.com', 'Google Cloud Memorystore for Redis API'],
  ['remotebuildexecution.googleapis.com', 'Remote Build Execution API'],
  ['replicapool.googleapis.com', 'Compute Engine Instance Group Manager API'],
  ['replicapoolupdater.googleapis.com', 'Compute Engine Instance Group Updater API'],
  ['reseller.googleapis.com', 'Google Apps Reseller API'],
  ['resourceviews.googleapis.com', 'Compute Engine Instance Groups API'],
  ['risc.googleapis.com', 'RISC API'],
  ['roads.googleapis.com', 'Roads API'],
  ['run.googleapis.com', 'Cloud Run API'],
  ['runtimeconfig.googleapis.com', 'Cloud Runtime Configuration API'],
  ['safebrowsing-json.googleapis.com', 'Safe Browsing API (Legacy)'],
  ['safebrowsing.googleapis.com', 'Safe Browsing API'],
  ['sasportal.googleapis.com', 'SAS Portal API'],
  ['script.googleapis.com', 'Apps Script API'],
  ['searchconsole.googleapis.com', 'Google Search Console URL Testing Tools API'],
  ['secretmanager.googleapis.com', 'Secret Manager API'],
  ['securetoken.googleapis.com', 'Token Service API'],
  ['securitycenter.googleapis.com', 'Security Command Center API'],
  ['serviceconsumermanagement.googleapis.com', 'Service Consumer Management API'],
  ['servicecontrol.googleapis.com', 'Service Control API'],
  ['servicedirectory.googleapis.com', 'Service Directory API'],
  ['servicemanagement.googleapis.com', 'Service Management API'],
  ['servicenetworking.googleapis.com', 'Service Networking API'],
  ['serviceusage.googleapis.com', 'Service Usage API'],
  ['sheets.googleapis.com', 'Google Sheets API'],
  ['shoppingcontent.googleapis.com', 'Content API for Shopping'],
  ['siteverification.googleapis.com', 'Site Verification API'],
  ['slides.googleapis.com', 'Google Slides API'],
  ['sourcerepo.googleapis.com', 'Cloud Source Repositories API'],
  ['spanner.googleapis.com', 'Cloud Spanner API'],
  ['speech.googleapis.com', 'Cloud Speech-to-Text API'],
  ['sql-component.googleapis.com', 'Cloud SQL'],
  ['sqladmin.googleapis.com', 'Cloud SQL Admin API'],
  ['stackdriver.googleapis.com', 'Stackdriver API'],
  ['static-maps-backend.googleapis.com', 'Maps Static API'],
  ['storage-api.googleapis.com', 'Google Cloud Storage JSON API'],
  ['storage-component.googleapis.com', 'Cloud Storage'],
  ['storagetransfer.googleapis.com', 'Storage Transfer API'],
  ['street-view-image-backend.googleapis.com', 'Street View Static API'],
  ['streetviewpublish.googleapis.com', 'Street View Publish API'],
  ['subscribewithgoogle.googleapis.com', 'Subscribe with Google Publication API'],
  ['subscribewithgoogledeveloper.googleapis.com', 'Subscribe with Google Developer API'],
  ['surveys.googleapis.com', 'Google Surveys API'],
  ['tagmanager.googleapis.com', 'Tag Manager API'],
  ['tasks.googleapis.com', 'Tasks API'],
  ['testing.googleapis.com', 'Cloud Testing API'],
  ['texttospeech.googleapis.com', 'Cloud Text-to-Speech API'],
  ['threatdetection.googleapis.com', 'Threat Detection API'],
  ['timezone-backend.googleapis.com', 'Time Zone API'],
  ['toolresults.googleapis.com', 'Cloud Tool Results API'],
  ['tpu.googleapis.com', 'Cloud TPU API'],
  ['trafficdirector.googleapis.com', 'Traffic Director API'],
  ['translate.googleapis.com', 'Cloud Translation API'],
  ['travelpartner.googleapis.com', 'Travel Partner API'],
  ['urlshortener.googleapis.com', 'URL Shortener API'],
  ['usercontext.googleapis.com', 'Awareness API'],
  ['vault.googleapis.com', 'G Suite Vault API'],
  ['verifiedaccess.googleapis.com', 'Chrome Verified Access API'],
  ['videointelligence.googleapis.com', 'Cloud Video Intelligence API'],
  ['vision.googleapis.com', 'Cloud Vision API'],
  ['vmmigration.googleapis.com', 'VM Migration API'],
  ['vpcaccess.googleapis.com', 'Serverless VPC Access API'],
  ['walletobjects.googleapis.com', 'Google Pay Passes API'],
  ['webfonts.googleapis.com', 'Web Fonts Developer API'],
  ['webmasters.googleapis.com', 'Google Search Console API'],
  ['websecurityscanner.googleapis.com', 'Web Security Scanner API'],
  ['youtube.googleapis.com', 'YouTube Data API v3'],
  ['youtubeadsreach.googleapis.com', 'YouTube Ads Reach API'],
  ['youtubeanalytics.googleapis.com', 'YouTube Analytics API'],
  ['youtubereporting.googleapis.com', 'YouTube Reporting API'],
  ['zync.googleapis.com', 'Zync Render API'],
];

const initialData = generateMockApiData(RAW_API_DATA);

// --- Table Utilities ---

type Order = 'asc' | 'desc';
type HeadCellKey = keyof ApiService | 'title';

interface HeadCell {
  id: HeadCellKey;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'name', numeric: false, label: 'Service Endpoint' },
  { id: 'title', numeric: false, label: 'API Title' },
  { id: 'status', numeric: false, label: 'Status' },
  { id: 'version', numeric: false, label: 'Version' },
  { id: 'latency', numeric: true, label: 'Latency (ms)' },
  { id: 'securityScore', numeric: true, label: 'Security Score' },
  { id: 'isPublic', numeric: false, label: 'Visibility' },
];

/**
 * Sorts an array stably based on a comparator function.
 * @param array - The array to sort.
 * @param comparator - The comparison function.
 * @returns The sorted array.
 */
function stableSort<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

/**
 * Creates a comparator function for sorting table data.
 * @param order - The sort order ('asc' or 'desc').
 * @param orderBy - The key to sort by.
 * @returns A comparator function.
 */
function getComparator(order: Order, orderBy: HeadCellKey): (a: ApiService, b: ApiService) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

/**
 * Compares two ApiService objects for descending order.
 * @param a - The first ApiService object.
 * @param b - The second ApiService object.
 * @param orderBy - The key to compare.
 * @returns A number indicating the order.
 */
function descendingComparator(a: ApiService, b: ApiService, orderBy: HeadCellKey): number {
  // Special case for 'title' since it's not a direct key
  const aValue = orderBy === 'title' ? a.title : a[orderBy as keyof ApiService];
  const bValue = orderBy === 'title' ? b.title : b[orderBy as keyof ApiService];

  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: HeadCellKey) => void;
  order: Order;
  orderBy: HeadCellKey;
  rowCount: number;
}

/**
 * Renders the table header with sortable columns.
 * @param props - The table head properties.
 * @returns A React component for the table head.
 */
function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property: HeadCellKey) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          {/* Global Checkbox Placeholder */}
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding="normal"
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ fontWeight: 'bold' }}
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
}

// --- Main Component ---

/**
 * The ServiceMeshNexus component displays a table of API services,
 * allowing users to search, filter, and sort them.
 * It's a core part of the Citibankdemobusinessinc's service management suite.
 *
 * Mission Statement: To provide a transparent, secure, and efficient interface
 * for managing all provisioned API resources, fostering innovation and
 * ensuring compliance within the Citibankdemobusinessinc ecosystem.
 *
 * Monetization Path: Premium features for advanced analytics, compliance reporting,
 * and automated risk assessment.
 *
 * IP Moat: Proprietary generative data algorithms for realistic simulation and
 * advanced security scoring models.
 *
 * Auto-scaling Architecture: Leverages cloud-native infrastructure for dynamic scaling
 * based on user load and data volume.
 *
 * Regulatory Alignment: Built-in modules for GDPR, CCPA, and other relevant compliance
 * standards, with automated reporting capabilities.
 */
export const ServiceMeshNexus: React.FC = () => {
  const [data] = useState(initialData); // Using generated data
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<HeadCellKey>('name');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: HeadCellKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  const filteredData = useMemo(() => {
    let filtered = data;

    if (showActiveOnly) {
      filtered = filtered.filter(item => item.status === 'Active');
    }

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerCaseSearch) ||
          item.title.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    return stableSort(filtered, getComparator(order, orderBy));
  }, [data, order, orderBy, searchTerm, showActiveOnly]);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredData.length) : 0;

  // --- Render Helpers ---

  /**
   * Renders a status chip with appropriate color coding.
   * @param status - The API service status.
   * @returns A Box component representing the status chip.
   */
  const getStatusChip = (status: ApiService['status']) => {
    let color: string;
    switch (status) {
      case 'Active':
        color = '#4caf50'; // Green
        break;
      case 'Inactive':
        color = '#f44336'; // Red
        break;
      case 'Pending':
        color = '#ff9800'; // Orange
        break;
      default:
        color = '#9e9e9e'; // Grey for unknown
    }
    return (
      <Box
        component="span"
        sx={{
          backgroundColor: color,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
        }}
      >
        {status}
      </Box>
    );
  };

  /**
   * Renders a security score indicator with color coding.
   * @param score - The security score (0-100).
   * @returns A Typography component representing the security score.
   */
  const getSecurityScoreIndicator = (score: number) => {
    let color: string;
    if (score >= 90) color = '#4caf50'; // Green
    else if (score >= 70) color = '#ffc107'; // Amber
    else color = '#f44336'; // Red

    return (
      <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>
        {score}%
      </Typography>
    );
  };

  /**
   * Renders an icon indicating the visibility of the API service.
   * @param isPublic - Boolean indicating if the service is public.
   * @returns An Icon component.
   */
  const getVisibilityIcon = (isPublic: boolean) => {
    if (isPublic) {
      return (
        <Tooltip title="Public/External">
          <PublicIcon color="primary" fontSize="small" />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Internal/Private">
        <PrivateApiIcon color="action" fontSize="small" />
      </Tooltip>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Service Mesh Nexus
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Central inventory and control panel for {data.length} provisioned external API resources.
      </Typography>

      <Paper sx={{ width: '100%', mb: 2, mt: 3 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search API Name or Endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: '300px', mr: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                />
              }
              label="Show Active Only"
              sx={{ mr: 3 }}
            />
             {selected.length > 0 && (
                <Typography color="textSecondary" variant="body2" sx={{fontWeight: 'bold'}}>
                    {selected.length} selected
                </Typography>
            )}
          </Box>
          <Tooltip title="Manage API Configuration">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        
        <TableContainer>
          <Table stickyHeader aria-label="API Service Nexus Table">
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={filteredData.length}
            />
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.name);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.name)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.name}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                        />
                      </TableCell>
                      <TableCell component="th" id={labelId} scope="row">
                        <Tooltip title={row.name}>
                          <Box sx={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.name}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{getStatusChip(row.status)}</TableCell>
                      <TableCell>{row.version}</TableCell>
                      <TableCell align="right">{row.latency} ms</TableCell>
                      <TableCell align="right">{getSecurityScoreIndicator(row.securityScore)}</TableCell>
                      <TableCell align="left">{getVisibilityIcon(row.isPublic)}</TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
               {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No services match your current filters.
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
      </Paper>
    </Container>
  );
};

export default ServiceMeshNexus;