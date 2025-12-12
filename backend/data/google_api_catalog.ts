interface ApiEntry {
  name: string;
  title: string;
  // NOTE: In a real project, we would compute or define these links based on the name.
  // For this exercise, we omit the complex governance/documentation link logic.
  // governanceLink?: string;
  // documentationLink?: string;
}

const GOOGLE_API_CATALOG: ApiEntry[] = [
  {
    name: "abusiveexperiencereport.googleapis.com",
    title: "Abusive Experience Report API",
  },
  {
    name: "acceleratedmobilepageurl.googleapis.com",
    title: "Accelerated Mobile Pages (AMP) URL API",
  },
  {
    name: "accessapproval.googleapis.com",
    title: "Access Approval API",
  },
  {
    name: "accesscontextmanager.googleapis.com",
    title: "Access Context Manager API",
  },
  {
    name: "actions.googleapis.com",
    title: "Actions API",
  },
  {
    name: "adexchangebuyer-json.googleapis.com",
    title: "Ad Exchange Buyer API",
  },
  {
    name: "adexchangebuyer.googleapis.com",
    title: "Ad Exchange Buyer API II",
  },
  {
    name: "adexchangeseller.googleapis.com",
    title: "Ad Exchange Seller API",
  },
  {
    name: "adexperiencereport.googleapis.com",
    title: "Ad Experience Report API",
  },
  {
    name: "admin.googleapis.com",
    title: "Admin SDK",
  },
  {
    name: "admob.googleapis.com",
    title: "AdMob API",
  },
  {
    name: "adsense.googleapis.com",
    title: "AdSense Management API",
  },
  {
    name: "adsensehost.googleapis.com",
    title: "AdSense Host API",
  },
  {
    name: "alertcenter.googleapis.com",
    title: "G Suite Alert Center API",
  },
  {
    name: "analytics.googleapis.com",
    title: "Google Analytics API",
  },
  {
    name: "analyticsreporting.googleapis.com",
    title: "Analytics Reporting API",
  },
  {
    name: "androidcheck.googleapis.com",
    title: "Android Device Verification",
  },
  {
    name: "androiddeviceprovisioning.googleapis.com",
    title: "Android Device Provisioning Partner API",
  },
  {
    name: "androidenterprise.googleapis.com",
    title: "Google Play EMM API",
  },
  {
    name: "androidmanagement.googleapis.com",
    title: "Android Management API",
  },
  {
    name: "androidovertheair.googleapis.com",
    title: "Android Over The Air API",
  },
  {
    name: "androidpublisher.googleapis.com",
    title: "Google Play Android Developer API",
  },
  {
    name: "anthos.googleapis.com",
    title: "Anthos API",
  },
  {
    name: "anthosaudit.googleapis.com",
    title: "Anthos Audit API",
  },
  {
    name: "anthosgke.googleapis.com",
    title: "Anthos GKE API",
  },
  {
    name: "apigee.googleapis.com",
    title: "Apigee API",
  },
  {
    name: "appengine.googleapis.com",
    title: "App Engine Admin API",
  },
  {
    name: "appengineflex.googleapis.com",
    title: "Google App Engine Flexible Environment",
  },
  {
    name: "appsactivity.googleapis.com",
    title: "Apps Activity API",
  },
  {
    name: "appsmarket-component.googleapis.com",
    title: "G Suite Marketplace SDK",
  },
  {
    name: "appsmarket.googleapis.com",
    title: "G Suite Marketplace API",
  },
  {
    name: "arcorecloudanchor.googleapis.com",
    title: "ARCore Cloud Anchor API",
  },
  {
    name: "artifactregistry.googleapis.com",
    title: "Artifact Registry API",
  },
  {
    name: "audit.googleapis.com",
    title: "Audit API",
  },
  {
    name: "automl.googleapis.com",
    title: "Cloud AutoML API",
  },
  {
    name: "bigquery.googleapis.com",
    title: "BigQuery API",
  },
  {
    name: "bigqueryconnection.googleapis.com",
    title: "BigQuery Connection API",
  },
  {
    name: "bigquerydatatransfer.googleapis.com",
    title: "BigQuery Data Transfer API",
  },
  {
    name: "bigqueryreservation.googleapis.com",
    title: "BigQuery Reservation API",
  },
  {
    name: "bigquerystorage.googleapis.com",
    title: "BigQuery Storage API",
  },
  {
    name: "bigtable.googleapis.com",
    title: "Cloud Bigtable API",
  },
  {
    name: "bigtableadmin.googleapis.com",
    title: "Cloud Bigtable Admin API",
  },
  {
    name: "bigtabletableadmin.googleapis.com",
    title: "Cloud Bigtable Table Admin API",
  },
  {
    name: "billingbudgets.googleapis.com",
    title: "Cloud Billing Budget API",
  },
  {
    name: "binaryauthorization.googleapis.com",
    title: "Binary Authorization API",
  },
  {
    name: "blogger.googleapis.com",
    title: "Blogger API v3",
  },
  {
    name: "books.googleapis.com",
    title: "Books API",
  },
  {
    name: "bookstore.endpoints.endpoints-portal-demo.cloud.goog",
    title: "Bookstore gRPC API",
  },
  {
    name: "caldav.googleapis.com",
    title: "CalDAV API",
  },
  {
    name: "calendar-json.googleapis.com",
    title: "Google Calendar API",
  },
  {
    name: "carddav.googleapis.com",
    title: "Google Contacts CardDAV API",
  },
  {
    name: "chat.googleapis.com",
    title: "Hangouts Chat API",
  },
  {
    name: "chromewebstore.googleapis.com",
    title: "Chrome Web Store API",
  },
  {
    name: "civicinfo.googleapis.com",
    title: "Civic Information API",
  },
  {
    name: "classroom.googleapis.com",
    title: "Google Classroom API",
  },
  {
    name: "cloudapis.googleapis.com",
    title: "Google Cloud APIs",
  },
  {
    name: "cloudasset.googleapis.com",
    title: "Cloud Asset API",
  },
  {
    name: "cloudbilling.googleapis.com",
    title: "Cloud Billing API",
  },
  {
    name: "cloudbuild.googleapis.com",
    title: "Cloud Build API",
  },
  {
    name: "clouddebugger.googleapis.com",
    title: "Cloud Debugger API",
  },
  {
    name: "clouderrorreporting.googleapis.com",
    title: "Error Reporting API",
  },
  {
    name: "cloudfunctions.googleapis.com",
    title: "Cloud Functions API",
  },
  {
    name: "cloudidentity.googleapis.com",
    title: "Cloud Identity API",
  },
  {
    name: "cloudiot.googleapis.com",
    title: "Cloud IoT API",
  },
  {
    name: "cloudkms.googleapis.com",
    title: "Cloud Key Management Service (KMS) API",
  },
  {
    name: "cloudlatencytest.googleapis.com",
    title: "Cloud Network Performance Monitoring API",
  },
  {
    name: "cloudprivatecatalog.googleapis.com",
    title: "Cloud Private Catalog API",
  },
  {
    name: "cloudprofiler.googleapis.com",
    title: "Stackdriver Profiler API",
  },
  {
    name: "cloudresourcemanager.googleapis.com",
    title: "Cloud Resource Manager API",
  },
  {
    name: "cloudscheduler.googleapis.com",
    title: "Cloud Scheduler API",
  },
  {
    name: "cloudsearch.googleapis.com",
    title: "Cloud Search API",
  },
  {
    name: "cloudshell.googleapis.com",
    title: "Cloud Shell API",
  },
  {
    name: "cloudtasks.googleapis.com",
    title: "Cloud Tasks API",
  },
  {
    name: "cloudtrace.googleapis.com",
    title: "Cloud Trace API",
  },
  {
    name: "cloudvolumesgcp-api.netapp.com",
    title: "NetApp Cloud Volumes API",
  },
  {
    name: "composer.googleapis.com",
    title: "Cloud Composer API",
  },
  {
    name: "compute.googleapis.com",
    title: "Compute Engine API",
  },
  {
    name: "computescanning.googleapis.com",
    title: "Compute Scanning API",
  },
  {
    name: "contacts.googleapis.com",
    title: "Contacts API",
  },
  {
    name: "container.googleapis.com",
    title: "Kubernetes Engine API",
  },
  {
    name: "containeranalysis.googleapis.com",
    title: "Container Analysis API",
  },
  {
    name: "containerregistry.googleapis.com",
    title: "Container Registry API",
  },
  {
    name: "containerscanning.googleapis.com",
    title: "Container Scanning API",
  },
  {
    name: "containerthreatdetection.googleapis.com",
    title: "Container Threat Detection API",
  },
  {
    name: "copresence.googleapis.com",
    title: "Nearby Messages API",
  },
  {
    name: "customsearch.googleapis.com",
    title: "Custom Search API",
  },
  {
    name: "datacatalog.googleapis.com",
    title: "Google Cloud Data Catalog API",
  },
  {
    name: "dataflow.googleapis.com",
    title: "Dataflow API",
  },
  {
    name: "datafusion.googleapis.com",
    title: "Cloud Data Fusion API",
  },
  {
    name: "datalabeling.googleapis.com",
    title: "Data Labeling API",
  },
  {
    name: "dataproc.googleapis.com",
    title: "Cloud Dataproc API",
  },
  {
    name: "datastore.googleapis.com",
    title: "Cloud Datastore API",
  },
  {
    name: "datastudio.googleapis.com",
    title: "Data Studio API",
  },
  {
    name: "deploymentmanager.googleapis.com",
    title: "Cloud Deployment Manager V2 API",
  },
  {
    name: "dfareporting.googleapis.com",
    title: "DCM/DFA Reporting And Trafficking API",
  },
  {
    name: "dialogflow.googleapis.com",
    title: "Dialogflow API",
  },
  {
    name: "digitalassetlinks.googleapis.com",
    title: "Digital Asset Links API",
  },
  {
    name: "directions-backend.googleapis.com",
    title: "Directions API",
  },
  {
    name: "discovery.googleapis.com",
    title: "API Discovery Service",
  },
  {
    name: "displayvideo.googleapis.com",
    title: "Display & Video 360 API",
  },
  {
    name: "distance-matrix-backend.googleapis.com",
    title: "Distance Matrix API",
  },
  {
    name: "dlp.googleapis.com",
    title: "Cloud Data Loss Prevention (DLP) API",
  },
  {
    name: "dns.googleapis.com",
    title: "Cloud DNS API",
  },
  {
    name: "docs.googleapis.com",
    title: "Google Docs API",
  },
  {
    name: "documentai.googleapis.com",
    title: "Cloud Document AI API",
  },
  {
    name: "domainsrdap.googleapis.com",
    title: "Domains RDAP API",
  },
  {
    name: "doubleclickbidmanager.googleapis.com",
    title: "DoubleClick Bid Manager API",
  },
  {
    name: "doubleclicksearch.googleapis.com",
    title: "Search Ads 360 API",
  },
  {
    name: "drive.googleapis.com",
    title: "Google Drive API",
  },
  {
    name: "driveactivity.googleapis.com",
    title: "Drive Activity API",
  },
  {
    name: "echo-api.endpoints.endpoints-portal-demo.cloud.goog",
    title: "Endpoints Example",
  },
  {
    name: "elasticsearch-service.gcpmarketplace.elastic.co",
    title: "Elasticsearch Service on Elastic Cloud - Standard",
  },
  {
    name: "elevation-backend.googleapis.com",
    title: "Maps Elevation API",
  },
  {
    name: "embeddedassistant.googleapis.com",
    title: "Google Assistant API",
  },
  {
    name: "endpoints.googleapis.com",
    title: "Google Cloud Endpoints",
  },
  {
    name: "endpointsportal.googleapis.com",
    title: "Cloud Endpoints Portal",
  },
  {
    name: "factchecktools.googleapis.com",
    title: "Fact Check Tools API",
  },
  {
    name: "fcm.googleapis.com",
    title: "Firebase Cloud Messaging API",
  },
  {
    name: "fcmregistrations.googleapis.com",
    title: "FCM Registration API",
  },
  {
    name: "file.googleapis.com",
    title: "Cloud Filestore API",
  },
  {
    name: "firebase.googleapis.com",
    title: "Firebase Management API",
  },
  {
    name: "firebaseappdistribution.googleapis.com",
    title: "Firebase App Distribution API",
  },
  {
    name: "firebaseapptesters.googleapis.com",
    title: "Firebase App Testers API",
  },
  {
    name: "firebasedynamiclinks.googleapis.com",
    title: "Firebase Dynamic Links API",
  },
  {
    name: "firebaseextensions.googleapis.com",
    title: "Firebase Extensions API",
  },
  {
    name: "firebasehosting.googleapis.com",
    title: "Firebase Hosting API",
  },
  {
    name: "firebaseinappmessaging.googleapis.com",
    title: "Firebase In-App Messaging API",
  },
  {
    name: "firebaseinstallations.googleapis.com",
    title: "Firebase Installations API",
  },
  {
    name: "firebaseml.googleapis.com",
    title: "Firebase ML API",
  },
  {
    name: "firebasemods.googleapis.com",
    title: "Firebase Mods API",
  },
  {
    name: "firebasepredictions.googleapis.com",
    title: "Firebase Predictions API",
  },
  {
    name: "firebaseremoteconfig.googleapis.com",
    title: "Firebase Remote Config API",
  },
  {
    name: "firebaserules.googleapis.com",
    title: "Firebase Rules API",
  },
  {
    name: "firebasestorage.googleapis.com",
    title: "Firebase Storage",
  },
  {
    name: "firestore.googleapis.com",
    title: "Cloud Firestore API",
  },
  {
    name: "firewallinsights.googleapis.com",
    title: "Firewall Insights API",
  },
  {
    name: "fitness.googleapis.com",
    title: "Fitness API",
  },
  {
    name: "freebase.googleapis.com",
    title: "Freebase API",
  },
  {
    name: "fusiontables.googleapis.com",
    title: "Fusion Tables API",
  },
  {
    name: "games.googleapis.com",
    title: "Google Play Game Services",
  },
  {
    name: "gamesconfiguration.googleapis.com",
    title: "Google Play Game Services Publishing API",
  },
  {
    name: "gameservices.googleapis.com",
    title: "Game Services API",
  },
  {
    name: "gamesmanagement.googleapis.com",
    title: "Google Play Game Management",
  },
  {
    name: "gcp.redisenterprise.com",
    title: "Redis Enterprise",
  },
  {
    name: "genomics.googleapis.com",
    title: "Genomics API",
  },
  {
    name: "geocoding-backend.googleapis.com",
    title: "Geocoding API",
  },
  {
    name: "geolocation.googleapis.com",
    title: "Geolocation API",
  },
  {
    name: "gkeconnect.googleapis.com",
    title: "GKE Connect API",
  },
  {
    name: "gkehub.googleapis.com",
    title: "GKE Hub",
  },
  {
    name: "gmail.googleapis.com",
    title: "Gmail API",
  },
  {
    name: "googleads.googleapis.com",
    title: "Google Ads API",
  },
  {
    name: "googlecloudmessaging.googleapis.com",
    title: "Cloud Messaging",
  },
  {
    name: "groupsmigration.googleapis.com",
    title: "Groups Migration API",
  },
  {
    name: "groupssettings.googleapis.com",
    title: "Groups Settings API",
  },
  {
    name: "healthcare.googleapis.com",
    title: "Cloud Healthcare API",
  },
  {
    name: "homegraph.googleapis.com",
    title: "HomeGraph API",
  },
  {
    name: "iam.googleapis.com",
    title: "Identity and Access Management (IAM) API",
  },
  {
    name: "iamcredentials.googleapis.com",
    title: "IAM Service Account Credentials API",
  },
  {
    name: "iap.googleapis.com",
    title: "Cloud Identity-Aware Proxy API",
  },
  {
    name: "identitytoolkit.googleapis.com",
    title: "Identity Toolkit API",
  },
  {
    name: "indexing.googleapis.com",
    title: "Indexing API",
  },
  {
    name: "invoice.googleapis.com",
    title: "Invoice",
  },
  {
    name: "jobs.googleapis.com",
    title: "Cloud Talent Solution API",
  },
  {
    name: "kgsearch.googleapis.com",
    title: "Knowledge Graph Search API",
  },
  {
    name: "language.googleapis.com",
    title: "Cloud Natural Language API",
  },
  {
    name: "libraryagent.googleapis.com",
    title: "Library Agent API",
  },
  {
    name: "licensing.googleapis.com",
    title: "Enterprise License Manager API",
  },
  {
    name: "lifesciences.googleapis.com",
    title: "Cloud Life Sciences API",
  },
  {
    name: "logging.googleapis.com",
    title: "Cloud Logging API",
  },
  {
    name: "managedidentities.googleapis.com",
    title: "Managed Service for Microsoft Active Directory API",
  },
  {
    name: "manufacturers.googleapis.com",
    title: "Manufacturer Center API",
  },
  {
    name: "maps-android-backend.googleapis.com",
    title: "Maps SDK for Android",
  },
  {
    name: "maps-backend.googleapis.com",
    title: "Maps JavaScript API",
  },
  {
    name: "maps-embed-backend.googleapis.com",
    title: "Maps Embed API",
  },
  {
    name: "maps-ios-backend.googleapis.com",
    title: "Maps SDK for iOS",
  },
  {
    name: "mediatranslation.googleapis.com",
    title: "Media Translation API",
  },
  {
    name: "memcache.googleapis.com",
    title: "Cloud Memorystore for Memcached API",
  },
  {
    name: "meshca.googleapis.com",
    title: "Anthos Service Mesh Certificate Authority API",
  },
  {
    name: "meshconfig.googleapis.com",
    title: "Mesh Configuration API",
  },
  {
    name: "meshtelemetry.googleapis.com",
    title: "Mesh Telemetry API",
  },
  {
    name: "migrate.googleapis.com",
    title: "G Suite Migrate API",
  },
  {
    name: "mirror.googleapis.com",
    title: "Mirror API",
  },
  {
    name: "ml.googleapis.com",
    title: "AI Platform Training & Prediction API",
  },
  {
    name: "mlkit.googleapis.com",
    title: "ML Kit API",
  },
  {
    name: "mobilecrashreporting.googleapis.com",
    title: "Mobile Crash Reporting API",
  },
  {
    name: "monitoring.googleapis.com",
    title: "Cloud Monitoring API",
  },
  {
    name: "moviesanywhere.googleapis.com",
    title: "Play Movies Anywhere API",
  },
  {
    name: "multiclusteringress.googleapis.com",
    title: "Multi Cluster Ingress API",
  },
  {
    name: "multiclustermetering.googleapis.com",
    title: "Multi cluster metering API",
  },
  {
    name: "networkmanagement.googleapis.com",
    title: "Network Management API",
  },
  {
    name: "networktopology.googleapis.com",
    title: "Network Topology API",
  },
  {
    name: "notebooks.googleapis.com",
    title: "Notebooks API",
  },
  {
    name: "orkut.googleapis.com",
    title: "Orkut REST API",
  },
  {
    name: "osconfig.googleapis.com",
    title: "Cloud OS Config API",
  },
  {
    name: "oslogin.googleapis.com",
    title: "Cloud OS Login API",
  },
  {
    name: "pagespeedonline.googleapis.com",
    title: "PageSpeed Insights API",
  },
  {
    name: "partners-json.googleapis.com",
    title: "Google Partners API",
  },
  {
    name: "payg-prod.gcpmarketplace.confluent.cloud",
    title: "Confluent Cloud Service Prod",
  },
  {
    name: "people.googleapis.com",
    title: "People API",
  },
  {
    name: "performanceparameters.googleapis.com",
    title: "Android Performance Parameters API",
  },
  {
    name: "photoslibrary.googleapis.com",
    title: "Photos Library API",
  },
  {
    name: "picker.googleapis.com",
    title: "Google Picker API",
  },
  {
    name: "places-backend.googleapis.com",
    title: "Places API",
  },
  {
    name: "playcustomapp.googleapis.com",
    title: "Google Play Custom App Publishing API",
  },
  {
    name: "plus.googleapis.com",
    title: "Google+ API",
  },
  {
    name: "plusdomains.googleapis.com",
    title: "Google+ Domains API",
  },
  {
    name: "plushangouts.googleapis.com",
    title: "Google+ Hangouts API",
  },
  {
    name: "policytroubleshooter.googleapis.com",
    title: "Policy Troubleshooter API",
  },
  {
    name: "poly.googleapis.com",
    title: "Poly API",
  },
  {
    name: "prod-tt-sasportal.googleapis.com",
    title: "SAS Portal API (Testing)",
  },
  {
    name: "prod.cloud.datastax.com",
    title: "DataStax Astra - Cassandra as a Service",
  },
  {
    name: "pubsub.googleapis.com",
    title: "Cloud Pub/Sub API",
  },
  {
    name: "realtime.googleapis.com",
    title: "Realtime API",
  },
  {
    name: "recommender.googleapis.com",
    title: "Recommender API",
  },
  {
    name: "redis.googleapis.com",
    title: "Google Cloud Memorystore for Redis API",
  },
  {
    name: "remotebuildexecution.googleapis.com",
    title: "Remote Build Execution API",
  },
  {
    name: "replicapool.googleapis.com",
    title: "Compute Engine Instance Group Manager API",
  },
  {
    name: "replicapoolupdater.googleapis.com",
    title: "Compute Engine Instance Group Updater API",
  },
  {
    name: "reseller.googleapis.com",
    title: "Google Apps Reseller API",
  },
  {
    name: "resourceviews.googleapis.com",
    title: "Compute Engine Instance Groups API",
  },
  {
    name: "risc.googleapis.com",
    title: "RISC API",
  },
  {
    name: "roads.googleapis.com",
    title: "Roads API",
  },
  {
    name: "run.googleapis.com",
    title: "Cloud Run API",
  },
  {
    name: "runtimeconfig.googleapis.com",
    title: "Cloud Runtime Configuration API",
  },
  {
    name: "safebrowsing-json.googleapis.com",
    title: "Safe Browsing API (Legacy)",
  },
  {
    name: "safebrowsing.googleapis.com",
    title: "Safe Browsing API",
  },
  {
    name: "sasportal.googleapis.com",
    title: "SAS Portal API",
  },
  {
    name: "script.googleapis.com",
    title: "Apps Script API",
  },
  {
    name: "searchconsole.googleapis.com",
    title: "Google Search Console URL Testing Tools API",
  },
  {
    name: "secretmanager.googleapis.com",
    title: "Secret Manager API",
  },
  {
    name: "securetoken.googleapis.com",
    title: "Token Service API",
  },
  {
    name: "securitycenter.googleapis.com",
    title: "Security Command Center API",
  },
  {
    name: "serviceconsumermanagement.googleapis.com",
    title: "Service Consumer Management API",
  },
  {
    name: "servicecontrol.googleapis.com",
    title: "Service Control API",
  },
  {
    name: "servicedirectory.googleapis.com",
    title: "Service Directory API",
  },
  {
    name: "servicemanagement.googleapis.com",
    title: "Service Management API",
  },
  {
    name: "servicenetworking.googleapis.com",
    title: "Service Networking API",
  },
  {
    name: "serviceusage.googleapis.com",
    title: "Service Usage API",
  },
  {
    name: "sheets.googleapis.com",
    title: "Google Sheets API",
  },
  {
    name: "shoppingcontent.googleapis.com",
    title: "Content API for Shopping",
  },
  {
    name: "siteverification.googleapis.com",
    title: "Site Verification API",
  },
  {
    name: "slides.googleapis.com",
    title: "Google Slides API",
  },
  {
    name: "sourcerepo.googleapis.com",
    title: "Cloud Source Repositories API",
  },
  {
    name: "spanner.googleapis.com",
    title: "Cloud Spanner API",
  },
  {
    name: "speech.googleapis.com",
    title: "Cloud Speech-to-Text API",
  },
  {
    name: "sql-component.googleapis.com",
    title: "Cloud SQL",
  },
  {
    name: "sqladmin.googleapis.com",
    title: "Cloud SQL Admin API",
  },
  {
    name: "stackdriver.googleapis.com",
    title: "Stackdriver API",
  },
  {
    name: "static-maps-backend.googleapis.com",
    title: "Maps Static API",
  },
  {
    name: "storage-api.googleapis.com",
    title: "Google Cloud Storage JSON API",
  },
  {
    name: "storage-component.googleapis.com",
    title: "Cloud Storage",
  },
  {
    name: "storagetransfer.googleapis.com",
    title: "Storage Transfer API",
  },
  {
    name: "street-view-image-backend.googleapis.com",
    title: "Street View Static API",
  },
  {
    name: "streetviewpublish.googleapis.com",
    title: "Street View Publish API",
  },
  {
    name: "subscribewithgoogle.googleapis.com",
    title: "Subscribe with Google Publication API",
  },
  {
    name: "subscribewithgoogledeveloper.googleapis.com",
    title: "Subscribe with Google Developer API",
  },
  {
    name: "surveys.googleapis.com",
    title: "Google Surveys API",
  },
  {
    name: "tagmanager.googleapis.com",
    title: "Tag Manager API",
  },
  {
    name: "tasks.googleapis.com",
    title: "Tasks API",
  },
  {
    name: "testing.googleapis.com",
    title: "Cloud Testing API",
  },
  {
    name: "texttospeech.googleapis.com",
    title: "Cloud Text-to-Speech API",
  },
  {
    name: "threatdetection.googleapis.com",
    title: "Threat Detection API",
  },
  {
    name: "timezone-backend.googleapis.com",
    title: "Time Zone API",
  },
  {
    name: "toolresults.googleapis.com",
    title: "Cloud Tool Results API",
  },
  {
    name: "tpu.googleapis.com",
    title: "Cloud TPU API",
  },
  {
    name: "trafficdirector.googleapis.com",
    title: "Traffic Director API",
  },
  {
    name: "translate.googleapis.com",
    title: "Cloud Translation API",
  },
  {
    name: "travelpartner.googleapis.com",
    title: "Travel Partner API",
  },
  {
    name: "urlshortener.googleapis.com",
    title: "URL Shortener API",
  },
  {
    name: "usercontext.googleapis.com",
    title: "Awareness API",
  },
  {
    name: "vault.googleapis.com",
    title: "G Suite Vault API",
  },
  {
    name: "verifiedaccess.googleapis.com",
    title: "Chrome Verified Access API",
  },
  {
    name: "videointelligence.googleapis.com",
    title: "Cloud Video Intelligence API",
  },
  {
    name: "vision.googleapis.com",
    title: "Cloud Vision API",
  },
  {
    name: "vmmigration.googleapis.com",
    title: "VM Migration API",
  },
  {
    name: "vpcaccess.googleapis.com",
    title: "Serverless VPC Access API",
  },
  {
    name: "walletobjects.googleapis.com",
    title: "Google Pay Passes API",
  },
  {
    name: "webfonts.googleapis.com",
    title: "Web Fonts Developer API",
  },
  {
    name: "webmasters.googleapis.com",
    title: "Google Search Console API",
  },
  {
    name: "websecurityscanner.googleapis.com",
    title: "Web Security Scanner API",
  },
  {
    name: "youtube.googleapis.com",
    title: "YouTube Data API v3",
  },
  {
    name: "youtubeadsreach.googleapis.com",
    title: "YouTube Ads Reach API",
  },
  {
    name: "youtubeanalytics.googleapis.com",
    title: "YouTube Analytics API",
  },
  {
    name: "youtubereporting.googleapis.com",
    title: "YouTube Reporting API",
  },
  {
    name: "zync.googleapis.com",
    title: "Zync Render API",
  },
];

export { GOOGLE_API_CATALOG, ApiEntry };