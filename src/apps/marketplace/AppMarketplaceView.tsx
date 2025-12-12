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

// Namespace: Citibankdemobusinessinc
namespace Citibankdemobusinessinc {

  // --- Shared Kernel ---
  class Kernel {
    static generateId(): string {
      return Math.random().toString(36).substring(2, 15);
    }

    static generateRandomNumber(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static generateRandomDate(start: Date, end: Date): Date {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    static generateRandomName(prefix: string = "Item"): string {
      const randomNumber = Kernel.generateRandomNumber(1, 1000);
      return `${prefix} ${randomNumber}`;
    }
  }

  // --- Utility Functions ---
  const generateDescription = (): string => {
    const descriptions = [
      "Revolutionizing the way you manage your finances.",
      "Securely store and manage your personal data.",
      "Manage your digital identities with ease.",
      "Connect and share without surveillance.",
      "Store and share files using P2P technology.",
      "AI-powered financial insights at your fingertips.",
      "Automated compliance for open banking.",
      "Personalized investment strategies.",
      "Real-time fraud detection and prevention.",
      "Sustainable banking solutions for a better future."
    ];
    return descriptions[Kernel.generateRandomNumber(0, descriptions.length - 1)];
  };

  const generatePublisher = (): string => {
    const publishers = [
      "Sovereign Labs",
      "PrivacyGuard Inc.",
      "Veritas Protocol",
      "OpenConnect DAO",
      "StorageMesh",
      "FinTech Innovations",
      "ComplianceAI",
      "InvestSmart Solutions",
      "SecureBank Systems",
      "GreenFinance Initiative"
    ];
    return publishers[Kernel.generateRandomNumber(0, publishers.length - 1)];
  };

  const generateVersion = (): string => {
    return `${Kernel.generateRandomNumber(0, 5)}.${Kernel.generateRandomNumber(0, 10)}.${Kernel.generateRandomNumber(0, 20)}`;
  };

  const generateInstallCount = (): number => {
    return Kernel.generateRandomNumber(100, 10000);
  };

  const generateRating = (): number => {
    return parseFloat((Math.random() * (5 - 3) + 3).toFixed(1));
  };

  const generateCategory = (): Category => {
    const categories: Category[] = ['Finance', 'Security', 'Utility', 'Social', 'Tools', 'Gaming'];
    return categories[Kernel.generateRandomNumber(0, categories.length - 1)];
  };

  const generateIconUrl = (category: Category): string => {
    const iconMap: { [key in Category]: string } = {
      'Finance': '/icons/finance.svg',
      'Security': '/icons/security.svg',
      'Utility': '/icons/utility.svg',
      'Social': '/icons/social.svg',
      'Tools': '/icons/tools.svg',
      'Gaming': '/icons/gaming.svg'
    };
    return iconMap[category] || '/icons/default.svg';
  };

  // --- App Generator ---
  const generateApp = (): App => {
    const category = generateCategory();
    const name = Kernel.generateRandomName("App");
    const id = Kernel.generateId();
    return {
      id: id,
      name: name,
      description: generateDescription(),
      category: category,
      publisher: generatePublisher(),
      version: generateVersion(),
      status: AppStatus.AVAILABLE,
      iconUrl: generateIconUrl(category),
      installCount: generateInstallCount(),
      rating: generateRating(),
    };
  };

  // --- Business Models ---

  // 1. Citibankdemobusinessinc.fintech.lendingplatform
  export namespace fintech {
    export namespace lendingplatform {
      // Mission: To revolutionize lending through AI-driven risk assessment and personalized loan products.
      // Monetization: Loan origination fees, interest on loans, premium analytics services.
      // IP Moat: Proprietary AI algorithms for credit scoring and risk management.
      export function runApp(): void {
        console.log("Running Fintech Lending Platform...");
        // Add lending platform logic here
      }
    }
  }

  // 2. Citibankdemobusinessinc.security.datasafe
  export namespace security {
    export namespace datasafe {
      // Mission: To provide unbreakable data encryption and secure storage solutions for individuals and enterprises.
      // Monetization: Subscription fees for secure storage, licensing of encryption technology.
      // IP Moat: Advanced encryption algorithms and secure key management systems.
      export function runApp(): void {
        console.log("Running Security Data Safe...");
        // Add data safe logic here
      }
    }
  }

  // 3. Citibankdemobusinessinc.utility.identityvault
  export namespace utility {
    export namespace identityvault {
      // Mission: To empower users with decentralized identity management and verifiable credentials.
      // Monetization: Premium identity verification services, secure credential storage.
      // IP Moat: Decentralized identity protocol and secure credential management technology.
      export function runApp(): void {
        console.log("Running Utility Identity Vault...");
        // Add identity vault logic here
      }
    }
  }

  // 4. Citibankdemobusinessinc.social.openconnect
  export namespace social {
    export namespace openconnect {
      // Mission: To create a decentralized social network free from censorship and corporate surveillance.
      // Monetization: Premium features, decentralized advertising, content creator tools.
      // IP Moat: Decentralized social networking protocol and content moderation algorithms.
      export function runApp(): void {
        console.log("Running Social Open Connect...");
        // Add open connect logic here
      }
    }
  }

  // 5. Citibankdemobusinessinc.storage.p2pshare
  export namespace storage {
    export namespace p2pshare {
      // Mission: To provide secure and private peer-to-peer file storage and sharing solutions.
      // Monetization: Subscription fees for storage space, premium sharing features.
      // IP Moat: Peer-to-peer storage protocol and secure file sharing technology.
      export function runApp(): void {
        console.log("Running Storage P2P Share...");
        // Add p2p share logic here
      }
    }
  }

  // 6. Citibankdemobusinessinc.finance.aiadvisor
  export namespace finance {
    export namespace aiadvisor {
      // Mission: To provide personalized financial advice and insights powered by artificial intelligence.
      // Monetization: Subscription fees for financial advice, premium analytics services.
      // IP Moat: AI algorithms for financial planning and investment management.
      export function runApp(): void {
        console.log("Running Finance AI Advisor...");
        // Add ai advisor logic here
      }
    }
  }

  // 7. Citibankdemobusinessinc.compliance.autocomply
  export namespace compliance {
    export namespace autocomply {
      // Mission: To automate compliance processes for open banking and financial regulations.
      // Monetization: Subscription fees for compliance automation, regulatory reporting services.
      // IP Moat: Compliance automation engine and regulatory reporting templates.
      export function runApp(): void {
        console.log("Running Compliance Auto Comply...");
        // Add auto comply logic here
      }
    }
  }

  // 8. Citibankdemobusinessinc.investment.smartinvest
  export namespace investment {
    export namespace smartinvest {
      // Mission: To offer personalized investment strategies and automated portfolio management.
      // Monetization: Management fees, performance-based incentives.
      // IP Moat: Investment algorithms and portfolio optimization technology.
      export function runApp(): void {
        console.log("Running Investment Smart Invest...");
        // Add smart invest logic here
      }
    }
  }

  // 9. Citibankdemobusinessinc.risk.secureprotect
  export namespace risk {
    export namespace secureprotect {
      // Mission: To provide real-time fraud detection and prevention solutions for financial transactions.
      // Monetization: Subscription fees for fraud detection services, transaction monitoring.
      // IP Moat: Fraud detection algorithms and risk assessment models.
      export function runApp(): void {
        console.log("Running Risk Secure Protect...");
        // Add secure protect logic here
      }
    }
  }

  // 10. Citibankdemobusinessinc.sustainability.greenbank
  export namespace sustainability {
    export namespace greenbank {
      // Mission: To promote sustainable banking practices and environmentally responsible financial solutions.
      // Monetization: Green loan origination fees, carbon offset credits.
      // IP Moat: Sustainability metrics and environmental modeling tools.
      export function runApp(): void {
        console.log("Running Sustainability Green Bank...");
        // Add green bank logic here
      }
    }
  }

  // --- Master Orchestration Layer ---
  export class Orchestrator {
    static startAll(): void {
      console.log("Starting Citibankdemobusinessinc Ecosystem...");
      fintech.lendingplatform.runApp();
      security.datasafe.runApp();
      utility.identityvault.runApp();
      social.openconnect.runApp();
      storage.p2pshare.runApp();
      finance.aiadvisor.runApp();
      compliance.autocomply.runApp();
      investment.smartinvest.runApp();
      risk.secureprotect.runApp();
      sustainability.greenbank.runApp();
      console.log("Citibankdemobusinessinc Ecosystem is now running.");
    }
  }
}

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
      //setApps(MOCK_APPS);
      // Use the Citibankdemobusinessinc app generator
      const generatedApps: App[] = [];
      for (let i = 0; i < 5; i++) {
        generatedApps.push(Citibankdemobusinessinc.generateApp());
      }
      setApps(generatedApps);
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

// Start the Citibankdemobusinessinc ecosystem
Citibankdemobusinessinc.Orchestrator.startAll();