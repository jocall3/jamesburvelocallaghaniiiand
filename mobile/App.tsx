```tsx
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NavigationContainer, useNavigation, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';

// --- Types ---

type ServiceItem = {
  id: string;
  name: string;
  title: string;
};

type RootStackParamList = {
  Home: undefined;
  Details: { service: ServiceItem };
};

// --- Data ---

const RAW_SERVICES_DATA = `abusiveexperiencereport.googleapis.com                Abusive Experience Report API
acceleratedmobilepageurl.googleapis.com               Accelerated Mobile Pages (AMP) URL API
accessapproval.googleapis.com                         Access Approval API
accesscontextmanager.googleapis.com                   Access Context Manager API
actions.googleapis.com                                Actions API
adexchangebuyer-json.googleapis.com                   Ad Exchange Buyer API
adexchangebuyer.googleapis.com                        Ad Exchange Buyer API II
adexchangeseller.googleapis.com                       Ad Exchange Seller API
adexperiencereport.googleapis.com                     Ad Experience Report API
admin.googleapis.com                                  Admin SDK
admob.googleapis.com                                  AdMob API
adsense.googleapis.com                                AdSense Management API
analytics.googleapis.com                              Google Analytics API
androidpublisher.googleapis.com                       Google Play Android Developer API
anthos.googleapis.com                                 Anthos API
apigee.googleapis.com                                 Apigee API
appengine.googleapis.com                              App Engine Admin API
bigquery.googleapis.com                               BigQuery API
bigtable.googleapis.com                               Cloud Bigtable API
cloudbilling.googleapis.com                           Cloud Billing API
cloudbuild.googleapis.com                             Cloud Build API
cloudfunctions.googleapis.com                         Cloud Functions API
cloudiot.googleapis.com                               Cloud IoT API
cloudkms.googleapis.com                               Cloud Key Management Service (KMS) API
cloudresourcemanager.googleapis.com                   Cloud Resource Manager API
cloudscheduler.googleapis.com                         Cloud Scheduler API
cloudstorage.googleapis.com                           Cloud Storage
cloudtasks.googleapis.com                             Cloud Tasks API
cloudtrace.googleapis.com                             Cloud Trace API
compute.googleapis.com                                Compute Engine API
container.googleapis.com                              Kubernetes Engine API
containerregistry.googleapis.com                      Container Registry API
dataflow.googleapis.com                               Dataflow API
dataproc.googleapis.com                               Cloud Dataproc API
datastore.googleapis.com                              Cloud Datastore API
dialogflow.googleapis.com                             Dialogflow API
dns.googleapis.com                                    Cloud DNS API
drive.googleapis.com                                  Google Drive API
file.googleapis.com                                   Cloud Filestore API
firebase.googleapis.com                               Firebase Management API
firestore.googleapis.com                              Cloud Firestore API
gmail.googleapis.com                                  Gmail API
iam.googleapis.com                                    Identity and Access Management (IAM) API
logging.googleapis.com                                Cloud Logging API
maps-backend.googleapis.com                           Maps JavaScript API
monitoring.googleapis.com                             Cloud Monitoring API
pubsub.googleapis.com                                 Cloud Pub/Sub API
run.googleapis.com                                    Cloud Run API
secretmanager.googleapis.com                          Secret Manager API
servicemanagement.googleapis.com                      Service Management API
serviceusage.googleapis.com                           Service Usage API
sheets.googleapis.com                                 Google Sheets API
spanner.googleapis.com                                Cloud Spanner API
speech.googleapis.com                                 Cloud Speech-to-Text API
sql-component.googleapis.com                          Cloud SQL
storage-component.googleapis.com                      Cloud Storage
translate.googleapis.com                              Cloud Translation API
vision.googleapis.com                                 Cloud Vision API
youtube.googleapis.com                                YouTube Data API v3`;

// Parser to convert raw string to structured data
const parseServices = (): ServiceItem[] => {
  return RAW_SERVICES_DATA.split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      // Split by multiple spaces
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 2) {
        return {
          id: parts[0].trim(),
          name: parts[0].trim(),
          title: parts[1].trim(),
        };
      }
      return null;
    })
    .filter((item): item is ServiceItem => item !== null);
};

const SERVICES = parseServices();

// --- Screens ---

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = React.useState('');
  const isDarkMode = useColorScheme() === 'dark';

  const filteredData = useMemo(() => {
    if (!search) return SERVICES;
    const lower = search.toLowerCase();
    return SERVICES.filter(
      (s) => s.name.toLowerCase().includes(lower) || s.title.toLowerCase().includes(lower)
    );
  }, [search]);

  const renderItem = ({ item }: { item: ServiceItem }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' },
      ]}
      onPress={() => navigation.navigate('Details', { service: item })}
    >
      <Text style={[styles.itemTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        {item.title}
      </Text>
      <Text style={[styles.itemSubtitle, { color: isDarkMode ? '#aaa' : '#666' }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Google Cloud Services
        </Text>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDarkMode ? '#333' : '#e0e0e0',
              color: isDarkMode ? '#fff' : '#000',
            },
          ]}
          placeholder="Search services..."
          placeholderTextColor={isDarkMode ? '#888' : '#666'}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
};

type DetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'Details'>;
};

const DetailsScreen = ({ route }: DetailsScreenProps) => {
  const { service } = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
      <View style={styles.detailContainer}>
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <Text style={[styles.detailTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            {service.title}
          </Text>
          <View style={styles.divider} />
          <Text style={[styles.label, { color: isDarkMode ? '#aaa' : '#555' }]}>
            Service Endpoint:
          </Text>
          <Text style={[styles.value, { color: isDarkMode ? '#4dabf5' : '#0066cc' }]}>
            {service.name}
          </Text>
          
          <View style={{ marginTop: 20 }}>
             <Text style={[styles.label, { color: isDarkMode ? '#aaa' : '#555' }]}>
              Status:
            </Text>
            <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={[styles.statusText, { color: isDarkMode ? '#ddd' : '#333' }]}>
                    Active
                </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Navigation ---

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  
  const theme = {
    headerStyle: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    },
    headerTintColor: isDarkMode ? '#ffffff' : '#000000',
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen}
          options={({ route }) => ({
            title: 'Service Details',
            ...theme
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  itemContainer: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    opacity: 0.3,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default App;
```