import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Center,
  VStack,
  HStack,
  Button,
  Select,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, InstallIcon, LinkIcon } from '@chakra-ui/icons';
import { AppCard } from './components/AppCard';
import { AppDetailModal } from './components/AppDetailModal';
import { AppStatusTag } from './components/AppStatusTag';
import { App, AppStatus, Category } from '../../types/marketplace';
import { useMarketplaceService } from '../../services/useMarketplaceService';

// --- Mock Data (Replace with real API calls) ---
const MOCK_APPS: App[] = [
  {
    id: 'sovereign-wallet',
    name: 'Sovereign Wallet',
    description: 'A robust, self-custodial wallet for managing digital assets.',
    category: 'Finance',
    publisher: 'Sovereign Labs',
    version: '1.2.0',
    status: AppStatus.INSTALLED,
    iconUrl: '/icons/wallet.svg',
    installCount: 5200,
    rating: 4.8,
  },
  {
    id: 'data-vault',
    name: 'Encrypted Data Vault',
    description: 'Securely store and manage your personal data on the sovereign network.',
    category: 'Security',
    publisher: 'PrivacyGuard Inc.',
    version: '2.0.1',
    status: AppStatus.AVAILABLE,
    iconUrl: '/icons/vault.svg',
    installCount: 3100,
    rating: 4.5,
  },
  {
    id: 'identity-manager',
    name: 'Decentralized Identity Manager',
    description: 'Manage your DIDs and verifiable credentials easily.',
    category: 'Utility',
    publisher: 'Veritas Protocol',
    version: '1.0.5',
    status: AppStatus.UPDATE_AVAILABLE,
    iconUrl: '/icons/identity.svg',
    installCount: 890,
    rating: 4.2,
  },
  {
    id: 'social-feed',
    name: 'Decentralized Social Feed',
    description: 'Connect with friends and share updates without corporate surveillance.',
    category: 'Social',
    publisher: 'OpenConnect DAO',
    version: '0.9.3',
    status: AppStatus.AVAILABLE,
    iconUrl: '/icons/social.svg',
    installCount: 1500,
    rating: 4.0,
  },
  {
    id: 'file-storage',
    name: 'P2P File Storage',
    description: 'Store and share files directly using peer-to-peer technology.',
    category: 'Utility',
    publisher: 'StorageMesh',
    version: '3.1.0',
    status: AppStatus.AVAILABLE,
    iconUrl: '/icons/storage.svg',
    installCount: 450,
    rating: 4.6,
  },
];

const CATEGORIES: Category[] = ['All', 'Finance', 'Security', 'Utility', 'Social', 'Tools', 'Gaming'];

export const AppMarketplaceView: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  const toast = useToast();
  const { installApp, updateApp, uninstallApp, getApps } = useMarketplaceService();

  // --- Data Fetching Simulation ---
  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      // In a real application, this would call `getApps()` from the service.
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      setApps(MOCK_APPS);
      setLoading(false);
    };
    fetchApps();
  }, []);

  // --- Filtering Logic ---
  const filteredApps = useMemo(() => {
    let result = apps;

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(app => app.category === selectedCategory);
    }

    // 2. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        app =>
          app.name.toLowerCase().includes(lowerQuery) ||
          app.description.toLowerCase().includes(lowerQuery) ||
          app.publisher.toLowerCase().includes(lowerQuery)
      );
    }

    return result.sort((a, b) => b.installCount - a.installCount); // Sort by popularity
  }, [apps, selectedCategory, searchQuery]);

  // --- App Interaction Handlers ---
  const handleInstall = useCallback(async (appId: string) => {
    toast({
      title: 'Installation Initiated',
      description: `Installing ${appId}...`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });

    try {
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setApps(prev =>
        prev.map(app =>
          app.id === appId ? { ...app, status: AppStatus.INSTALLED } : app
        )
      );
      setSelectedApp(prev =>
        prev && prev.id === appId ? { ...prev, status: AppStatus.INSTALLED } : prev
      );

      toast({
        title: 'Installed Successfully',
        description: `${appId} is now available in your launcher.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Installation Failed',
        description: 'Could not complete installation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleUninstall = useCallback(async (appId: string) => {
    toast({
      title: 'Uninstallation Initiated',
      description: `Uninstalling ${appId}...`,
      status: 'warning',
      duration: 3000,
      isClosable: true,
    });

    try {
      // Simulate uninstallation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApps(prev =>
        prev.map(app =>
          app.id === appId ? { ...app, status: AppStatus.AVAILABLE } : app
        )
      );
      setSelectedApp(prev =>
        prev && prev.id === appId ? { ...prev, status: AppStatus.AVAILABLE } : prev
      );

      toast({
        title: 'Uninstalled Successfully',
        description: `${appId} has been removed.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Uninstallation Failed',
        description: 'Could not complete uninstallation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleUpdate = useCallback(async (appId: string) => {
    toast({
      title: 'Update Initiated',
      description: `Updating ${appId}...`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });

    try {
      // Simulate update
      await new Promise(resolve => setTimeout(resolve, 1500));
      setApps(prev =>
        prev.map(app =>
          app.id === appId ? { ...app, status: AppStatus.INSTALLED, version: '2.1.0' } : app
        )
      );
      setSelectedApp(prev =>
        prev && prev.id === appId ? { ...prev, status: AppStatus.INSTALLED, version: '2.1.0' } : prev
      );

      toast({
        title: 'Updated Successfully',
        description: `${appId} is now running the latest version.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not complete update.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);


  const renderContent = () => {
    if (loading) {
      return (
        <Center height="300px">
          <VStack>
            <Spinner size="xl" color="sovereign.500" />
            <Text mt={4}>Loading Sovereign Apps...</Text>
          </VStack>
        </Center>
      );
    }

    if (filteredApps.length === 0) {
      return (
        <Center height="300px">
          <VStack p={10} borderWidth="1px" borderRadius="lg" bg="gray.700">
            <SearchIcon boxSize={8} color="gray.400" />
            <Heading size="md" mt={4}>No Apps Found</Heading>
            <Text color="gray.400">Try adjusting your filters or search query.</Text>
          </VStack>
        </Center>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
        {filteredApps.map(app => (
          <AppCard
            key={app.id}
            app={app}
            onViewDetails={() => setSelectedApp(app)}
            onInstall={() => handleInstall(app.id)}
            onUpdate={() => handleUpdate(app.id)}
          />
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Box p={6}>
      <HStack justifyContent="space-between" mb={8} flexWrap="wrap">
        <VStack align="start" spacing={1}>
          <Heading as="h1" size="xl">Sovereign App Marketplace</Heading>
          <Text color="gray.400">Discover and install decentralized apps built for your Sovereign OS.</Text>
        </VStack>
        <Button
            leftIcon={<LinkIcon />}
            colorScheme="sovereign"
            variant="outline"
            size="lg"
            mt={{ base: 4, md: 0 }}
        >
            Manage Installed Apps
        </Button>
      </HStack>

      <HStack mb={8} spacing={4} flexWrap="wrap">
        <Box flex={3} minW={{ base: '100%', md: '300px' }}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search apps, publishers, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="gray.800"
              borderColor="gray.700"
            />
          </InputGroup>
        </Box>

        <Box flex={1} minW={{ base: '48%', md: '150px' }}>
          <Select
            placeholder="Filter by Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category)}
            bg="gray.800"
            borderColor="gray.700"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </Box>

        <Box flex={1} minW={{ base: '48%', md: '150px' }}>
          <Select
            placeholder="Sort By"
            defaultValue="Popularity"
            bg="gray.800"
            borderColor="gray.700"
          >
            <option value="Popularity">Popularity</option>
            <option value="Newest">Newest</option>
            <option value="Rating">Highest Rating</option>
          </Select>
        </Box>
      </HStack>

      {renderContent()}

      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          onUpdate={handleUpdate}
        />
      )}
    </Box>
  );
};

export default AppMarketplaceView;