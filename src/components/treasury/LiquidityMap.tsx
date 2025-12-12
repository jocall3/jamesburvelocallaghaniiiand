import React, { useMemo } from 'react';

// Unified Brand Namespace
namespace Citibankdemobusinessinc {

  // --- Shared Kernel ---
  export namespace Kernel {
    // Centralized Configuration
    export const config = {
      brandName: "Citibank demo business inc",
      primaryColor: "#007bff",
      secondaryColor: "#6c757d",
      dateFormat: "YYYY-MM-DD",
      currencyFormat: "en-US",
    };

    // Logging Utility
    export const log = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      console.log(`[${config.brandName}] ${level.toUpperCase()}: ${message}`);
    };

    // Error Handling
    export const handleError = (error: Error, context: string) => {
      log(`Error in ${context}: ${error.message}`, 'error');
      // Implement more sophisticated error handling, e.g., sending to monitoring services
    };

    // Data Encryption (Simplified)
    export const encryptData = (data: string): string => {
      // Replace with a real encryption algorithm
      return btoa(data);
    };

    export const decryptData = (encryptedData: string): string => {
      // Replace with the corresponding decryption algorithm
      return atob(encryptedData);
    };

    // Unique ID Generator
    export const generateId = (): string => {
      return Math.random().toString(36).substring(2, 15);
    };

    // Number Formatting
    export const formatNumber = (num: number): string => {
      return new Intl.NumberFormat(config.currencyFormat, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    // Date Formatting
    export const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  }

  // --- Data Generation Utilities ---
  export namespace DataGen {
    // Generate random currency
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    export const generateCurrency = (): string => {
      return currencies[Math.floor(Math.random() * currencies.length)];
    };

    // Generate random amount
    export const generateAmount = (min: number, max: number): number => {
      return Math.random() * (max - min) + min;
    };

    // Generate random entity name
    const entityNames = ['Alpha Corp', 'Beta Inc', 'Gamma Ltd', 'Delta Group', 'Epsilon SA'];
    export const generateEntityName = (): string => {
      return entityNames[Math.floor(Math.random() * entityNames.length)];
    };

    // Generate random date within a range
    export const generateDate = (start: Date, end: Date): Date => {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Generate random boolean
    export const generateBoolean = (): boolean => {
      return Math.random() < 0.5;
    };

    // Generate random integer
    export const generateInteger = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Generate random string
    export const generateString = (length: number): string => {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    };
  }

  // --- Compliance Automation ---
  export namespace Compliance {
    // Check regulatory compliance
    export const checkRegulatoryCompliance = (data: any, regulation: string): boolean => {
      // Implement compliance check logic based on the regulation
      Kernel.log(`Checking compliance for regulation: ${regulation}`);
      return DataGen.generateBoolean(); // Placeholder
    };

    // Generate regulatory report
    export const generateRegulatoryReport = (data: any, regulation: string): string => {
      // Implement report generation logic based on the regulation
      Kernel.log(`Generating report for regulation: ${regulation}`);
      return `Report for ${regulation}: ${JSON.stringify(data)}`; // Placeholder
    };
  }

  // --- Risk Detection Modules ---
  export namespace Risk {
    // Detect fraudulent transactions
    export const detectFraudulentTransaction = (transaction: any): boolean => {
      // Implement fraud detection logic
      Kernel.log(`Detecting fraud for transaction: ${JSON.stringify(transaction)}`);
      return DataGen.generateBoolean(); // Placeholder
    };

    // Evaluate material risk
    export const evaluateMaterialRisk = (asset: any): number => {
      // Implement risk evaluation logic
      Kernel.log(`Evaluating risk for asset: ${JSON.stringify(asset)}`);
      return DataGen.generateAmount(0, 1); // Placeholder
    };
  }

  // --- Liquidity Monitoring Logic ---
  export namespace Liquidity {
    // Monitor liquidity levels
    export const monitorLiquidityLevels = (assets: any[]): number => {
      // Implement liquidity monitoring logic
      Kernel.log(`Monitoring liquidity levels for assets`);
      return assets.reduce((sum, asset) => sum + DataGen.generateAmount(1000, 10000), 0); // Placeholder
    };

    // Simulate liquidity stress scenario
    export const simulateLiquidityStressScenario = (assets: any[]): any => {
      // Implement stress scenario simulation logic
      Kernel.log(`Simulating liquidity stress scenario`);
      return {
        stressedAssets: assets.map(asset => ({ ...asset, value: asset.value * DataGen.generateAmount(0.5, 0.9) }))
      }; // Placeholder
    };
  }

  // --- Internal Governance Tracks ---
  export namespace Governance {
    // Conduct internal audit
    export const conductInternalAudit = (data: any): boolean => {
      // Implement internal audit logic
      Kernel.log(`Conducting internal audit`);
      return DataGen.generateBoolean(); // Placeholder
    };

    // Enforce role-based access control
    export const enforceRoleBasedAccessControl = (user: any, resource: any, role: string): boolean => {
      // Implement RBAC logic
      Kernel.log(`Enforcing RBAC for user: ${user.id}, resource: ${resource.id}, role: ${role}`);
      return DataGen.generateBoolean(); // Placeholder
    };
  }

  // --- Telemetry ---
  export namespace Telemetry {
    // Collect telemetry data
    export const collectTelemetryData = (event: string, data: any): void => {
      // Implement telemetry collection logic
      Kernel.log(`Collecting telemetry data for event: ${event}`);
      // Placeholder: Send data to telemetry service
    };
  }

  // --- User Interface Components ---
  export namespace UI {
    // Generic Dashboard Component
    export const Dashboard = ({ children }: { children: React.ReactNode }) => {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
          <h1>{Kernel.config.brandName} Dashboard</h1>
          {children}
        </div>
      );
    };

    // Generic Table Component
    export const Table = ({ data, columns }: { data: any[], columns: { Header: string, accessor: string }[] }) => {
      return (
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.accessor}>{column.Header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td key={column.accessor}>{row[column.accessor]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    };
  }

  // --- Business Model 1: Citibankdemobusinessinc.openbanking.marketplace ---
  export namespace openbanking {
    export namespace marketplace {
      // Mission: To create a decentralized marketplace for financial services, connecting consumers with innovative banking solutions.
      // Monetization: Transaction fees, premium listings, data analytics subscriptions.
      // IP Moat: Proprietary matching algorithms, user behavior analysis, secure transaction protocols.

      // Data Model
      interface Service {
        id: string;
        name: string;
        description: string;
        provider: string;
        price: number;
        rating: number;
      }

      // Data Generator
      const generateService = (): Service => ({
        id: Kernel.generateId(),
        name: `Service ${DataGen.generateString(5)}`,
        description: `Description for Service ${DataGen.generateString(5)}`,
        provider: DataGen.generateEntityName(),
        price: DataGen.generateAmount(1, 100),
        rating: DataGen.generateAmount(1, 5),
      });

      // App Component
      export const MarketplaceApp = () => {
        const services = useMemo(() => Array.from({ length: 10 }, () => generateService()), []);

        const columns = useMemo(() => [
          { Header: 'Name', accessor: 'name' },
          { Header: 'Provider', accessor: 'provider' },
          { Header: 'Price', accessor: 'price' },
          { Header: 'Rating', accessor: 'rating' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Open Banking Marketplace</h2>
            <UI.Table data={services} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 2: Citibankdemobusinessinc.wealth.roboadvisor ---
  export namespace wealth {
    export namespace roboadvisor {
      // Mission: To democratize wealth management by providing personalized investment advice through an AI-powered robo-advisor.
      // Monetization: Management fees, performance fees, premium advisory services.
      // IP Moat: AI algorithms, risk assessment models, portfolio optimization techniques.

      // Data Model
      interface InvestmentPortfolio {
        id: string;
        name: string;
        assets: { asset: string; allocation: number }[];
        riskScore: number;
        returns: number;
      }

      // Data Generator
      const generateInvestmentPortfolio = (): InvestmentPortfolio => ({
        id: Kernel.generateId(),
        name: `Portfolio ${DataGen.generateString(5)}`,
        assets: Array.from({ length: 5 }, () => ({
          asset: DataGen.generateString(3),
          allocation: DataGen.generateAmount(0.05, 0.2),
        })),
        riskScore: DataGen.generateAmount(1, 10),
        returns: DataGen.generateAmount(0.01, 0.1),
      });

      // App Component
      export const RoboAdvisorApp = () => {
        const portfolios = useMemo(() => Array.from({ length: 10 }, () => generateInvestmentPortfolio()), []);

        const columns = useMemo(() => [
          { Header: 'Name', accessor: 'name' },
          { Header: 'Risk Score', accessor: 'riskScore' },
          { Header: 'Returns', accessor: 'returns' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Robo Advisor</h2>
            <UI.Table data={portfolios} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 3: Citibankdemobusinessinc.lending.p2plending ---
  export namespace lending {
    export namespace p2plending {
      // Mission: To facilitate peer-to-peer lending, connecting borrowers with individual lenders for personalized financing solutions.
      // Monetization: Loan origination fees, servicing fees, interest rate spreads.
      // IP Moat: Credit scoring algorithms, risk assessment models, secure transaction protocols.

      // Data Model
      interface Loan {
        id: string;
        borrower: string;
        amount: number;
        interestRate: number;
        term: number;
        status: 'pending' | 'funded' | 'defaulted';
      }

      // Data Generator
      const generateLoan = (): Loan => ({
        id: Kernel.generateId(),
        borrower: DataGen.generateEntityName(),
        amount: DataGen.generateAmount(1000, 10000),
        interestRate: DataGen.generateAmount(0.05, 0.15),
        term: DataGen.generateInteger(12, 60),
        status: DataGen.generateBoolean() ? 'funded' : 'pending',
      });

      // App Component
      export const P2PLendingApp = () => {
        const loans = useMemo(() => Array.from({ length: 10 }, () => generateLoan()), []);

        const columns = useMemo(() => [
          { Header: 'Borrower', accessor: 'borrower' },
          { Header: 'Amount', accessor: 'amount' },
          { Header: 'Interest Rate', accessor: 'interestRate' },
          { Header: 'Term', accessor: 'term' },
          { Header: 'Status', accessor: 'status' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Peer-to-Peer Lending</h2>
            <UI.Table data={loans} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 4: Citibankdemobusinessinc.payments.mobilewallet ---
  export namespace payments {
    export namespace mobilewallet {
      // Mission: To provide a seamless mobile payment experience, enabling users to manage their finances and make secure transactions on the go.
      // Monetization: Transaction fees, premium features, partnerships with merchants.
      // IP Moat: Secure payment protocols, user authentication methods, fraud detection algorithms.

      // Data Model
      interface Transaction {
        id: string;
        date: Date;
        amount: number;
        merchant: string;
        status: 'pending' | 'completed' | 'failed';
      }

      // Data Generator
      const generateTransaction = (): Transaction => ({
        id: Kernel.generateId(),
        date: DataGen.generateDate(new Date(2023, 0, 1), new Date()),
        amount: DataGen.generateAmount(1, 100),
        merchant: DataGen.generateEntityName(),
        status: DataGen.generateBoolean() ? 'completed' : 'pending',
      });

      // App Component
      export const MobileWalletApp = () => {
        const transactions = useMemo(() => Array.from({ length: 10 }, () => generateTransaction()), []);

        const columns = useMemo(() => [
          { Header: 'Date', accessor: 'date' },
          { Header: 'Amount', accessor: 'amount' },
          { Header: 'Merchant', accessor: 'merchant' },
          { Header: 'Status', accessor: 'status' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Mobile Wallet</h2>
            <UI.Table data={transactions} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 5: Citibankdemobusinessinc.insurance.insurtech ---
  export namespace insurance {
    export namespace insurtech {
      // Mission: To revolutionize the insurance industry by leveraging technology to provide personalized and affordable coverage options.
      // Monetization: Premiums, commissions, data analytics subscriptions.
      // IP Moat: Risk assessment models, claims processing algorithms, customer behavior analysis.

      // Data Model
      interface Policy {
        id: string;
        policyHolder: string;
        type: string;
        coverageAmount: number;
        premium: number;
        status: 'active' | 'inactive' | 'expired';
      }

      // Data Generator
      const generatePolicy = (): Policy => ({
        id: Kernel.generateId(),
        policyHolder: DataGen.generateEntityName(),
        type: 'Auto',
        coverageAmount: DataGen.generateAmount(50000, 100000),
        premium: DataGen.generateAmount(50, 200),
        status: DataGen.generateBoolean() ? 'active' : 'inactive',
      });

      // App Component
      export const InsurtechApp = () => {
        const policies = useMemo(() => Array.from({ length: 10 }, () => generatePolicy()), []);

        const columns = useMemo(() => [
          { Header: 'Policy Holder', accessor: 'policyHolder' },
          { Header: 'Type', accessor: 'type' },
          { Header: 'Coverage Amount', accessor: 'coverageAmount' },
          { Header: 'Premium', accessor: 'premium' },
          { Header: 'Status', accessor: 'status' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Insurtech</h2>
            <UI.Table data={policies} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 6: Citibankdemobusinessinc.realestate.proptech ---
  export namespace realestate {
    export namespace proptech {
      // Mission: To transform the real estate industry by providing innovative technology solutions for property management, investment, and transactions.
      // Monetization: Transaction fees, subscription fees, data analytics subscriptions.
      // IP Moat: Property valuation algorithms, market analysis tools, secure transaction platforms.

      // Data Model
      interface Property {
        id: string;
        address: string;
        value: number;
        owner: string;
        status: 'available' | 'sold' | 'rented';
      }

      // Data Generator
      const generateProperty = (): Property => ({
        id: Kernel.generateId(),
        address: `123 Main St ${DataGen.generateString(3)}`,
        value: DataGen.generateAmount(200000, 500000),
        owner: DataGen.generateEntityName(),
        status: DataGen.generateBoolean() ? 'available' : 'sold',
      });

      // App Component
      export const ProptechApp = () => {
        const properties = useMemo(() => Array.from({ length: 10 }, () => generateProperty()), []);

        const columns = useMemo(() => [
          { Header: 'Address', accessor: 'address' },
          { Header: 'Value', accessor: 'value' },
          { Header: 'Owner', accessor: 'owner' },
          { Header: 'Status', accessor: 'status' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Proptech</h2>
            <UI.Table data={properties} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 7: Citibankdemobusinessinc.healthcare.healthtech ---
  export namespace healthcare {
    export namespace healthtech {
      // Mission: To improve healthcare outcomes by providing innovative technology solutions for patient care, diagnostics, and wellness.
      // Monetization: Subscription fees, data analytics subscriptions, partnerships with healthcare providers.
      // IP Moat: Diagnostic algorithms, patient monitoring systems, data analytics platforms.

      // Data Model
      interface Patient {
        id: string;
        name: string;
        condition: string;
        treatment: string;
        status: 'active' | 'inactive' | 'discharged';
      }

      // Data Generator
      const generatePatient = (): Patient => ({
        id: Kernel.generateId(),
        name: DataGen.generateEntityName(),
        condition: `Condition ${DataGen.generateString(3)}`,
        treatment: `Treatment ${DataGen.generateString(3)}`,
        status: DataGen.generateBoolean() ? 'active' : 'discharged',
      });

      // App Component
      export const HealthtechApp = () => {
        const patients = useMemo(() => Array.from({ length: 10 }, () => generatePatient()), []);

        const columns = useMemo(() => [
          { Header: 'Name', accessor: 'name' },
          { Header: 'Condition', accessor: 'condition' },
          { Header: 'Treatment', accessor: 'treatment' },
          { Header: 'Status', accessor: 'status' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Healthtech</h2>
            <UI.Table data={patients} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 8: Citibankdemobusinessinc.education.edtech ---
  export namespace education {
    export namespace edtech {
      // Mission: To transform education by providing innovative technology solutions for learning, teaching, and assessment.
      // Monetization: Subscription fees, course fees, data analytics subscriptions.
      // IP Moat: Learning algorithms, assessment tools, content delivery platforms.

      // Data Model
      interface Course {
        id: string;
        name: string;
        instructor: string;
        duration: number;
        status: 'active' | 'inactive' | 'completed';
      }

      // Data Generator
      const generateCourse = (): Course => ({
        id: Kernel.generateId(),
        name: `Course ${DataGen.generateString(3)}`,
        instructor: DataGen.generateEntityName(),
        duration: DataGen.generateInteger(1, 12),
        status: DataGen.generateBoolean() ? 'active' : 'completed',
      });

      // App Component
      export const EdtechApp = () => {
        const courses = useMemo(() => Array.from({ length: 10 }, () => generateCourse()), []);

        const columns = useMemo(() => [
          { Header: 'Name', accessor: 'name' },
          { Header: 'Instructor', accessor: 'instructor' },
          { Header: 'Duration', accessor: 'duration' },
          { Header: 'Status', accessor: 'status' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Edtech</h2>
            <UI.Table data={courses} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 9: Citibankdemobusinessinc.energy.cleantech ---
  export namespace energy {
    export namespace cleantech {
      // Mission: To promote sustainable energy solutions by providing innovative technology for energy generation, storage, and distribution.
      // Monetization: Energy sales, subscription fees, data analytics subscriptions.
      // IP Moat: Energy storage algorithms, grid management tools, data analytics platforms.

      // Data Model
      interface EnergySource {
        id: string;
        type: string;
        output: number;
        location: string;
        status: 'active' | 'inactive';
      }

      // Data Generator
      const generateEnergySource = (): EnergySource => ({
        id: Kernel.generateId(),
        type: 'Solar',
        output: DataGen.generateAmount(100, 1000),
        location: `Location ${DataGen.generateString(3)}`,
        status: DataGen.generateBoolean() ? 'active' : 'inactive',
      });

      // App Component
      export const CleantechApp = () => {
        const energySources = useMemo(() => Array.from({ length: 10 }, () => generateEnergySource()), []);

        const columns = useMemo(() => [
          { Header: 'Type', accessor: 'type' },
          { Header: 'Output', accessor: 'output' },
          { Header: 'Location', accessor: 'location' },
          { Header: 'Status', accessor: 'status' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Cleantech</h2>
            <UI.Table data={energySources} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Business Model 10: Citibankdemobusinessinc.supplychain.logistech ---
  export namespace supplychain {
    export namespace logistech {
      // Mission: To optimize supply chain operations by providing innovative technology solutions for logistics, tracking, and inventory management.
      // Monetization: Subscription fees, transaction fees, data analytics subscriptions.
      // IP Moat: Logistics algorithms, tracking systems, data analytics platforms.

      // Data Model
      interface Shipment {
        id: string;
        origin: string;
        destination: string;
        status: string;
        deliveryDate: Date;
      }

      // Data Generator
      const generateShipment = (): Shipment => ({
        id: Kernel.generateId(),
        origin: `Origin ${DataGen.generateString(3)}`,
        destination: `Destination ${DataGen.generateString(3)}`,
        status: 'In Transit',
        deliveryDate: DataGen.generateDate(new Date(), new Date(2024, 0, 1)),
      });

      // App Component
      export const LogistechApp = () => {
        const shipments = useMemo(() => Array.from({ length: 10 }, () => generateShipment()), []);

        const columns = useMemo(() => [
          { Header: 'Origin', accessor: 'origin' },
          { Header: 'Destination', accessor: 'destination' },
          { Header: 'Status', accessor: 'status' },
          { Header: 'Delivery Date', accessor: 'deliveryDate' },
        ], []);

        return (
          <UI.Dashboard>
            <h2>Logistech</h2>
            <UI.Table data={shipments} columns={columns} />
          </UI.Dashboard>
        );
      };
    }
  }

  // --- Master Orchestration Layer ---
  export const MasterOrchestrator = () => {
    return (
      <div>
        <h1>{Kernel.config.brandName} Ecosystem</h1>
        <openbanking.marketplace.MarketplaceApp />
        <wealth.roboadvisor.RoboAdvisorApp />
        <lending.p2plending.P2PLendingApp />
        <payments.mobilewallet.MobileWalletApp />
        <insurance.insurtech.InsurtechApp />
        <realestate.proptech.ProptechApp />
        <healthcare.healthtech.HealthtechApp />
        <education.edtech.EdtechApp />
        <energy.cleantech.CleantechApp />
        <supplychain.logistech.LogistechApp />
      </div>
    );
  };
}

// --- LiquidityMap Component (Modified to use the new structure) ---
// TypeScript interfaces for our data structures
interface CurrencyHolding {
  currency: string;
  amount: number;
}

interface EntityData {
  id: string;
  name: string;
  holdings: CurrencyHolding[];
}

export interface LiquidityMapProps {
  data: EntityData[];
  title?: string;
}

/**
 * LiquidityMap is a visual component that displays a matrix of funds
 * distributed across various holding entities and currencies. It provides
 * a clear overview of global liquidity positions.
 */
const LiquidityMap: React.FC<LiquidityMapProps> = ({
  data,
  title = "Global Liquidity Map",
}) => {
  // useMemo hook to calculate derived data efficiently.
  // This avoids recalculation on every render unless the source `data` changes.
  const { uniqueCurrencies, entityTotals, currencyTotals, grandTotal } = useMemo(() => {
    const currencySet = new Set<string>();
    data.forEach(entity => {
      entity.holdings.forEach(holding => {
        currencySet.add(holding.currency);
      });
    });

    const sortedCurrencies = Array.from(currencySet).sort();
    const entityTotalsMap = new Map<string, number>();
    const currencyTotalsMap = new Map<string, number>();
    let currentGrandTotal = 0;

    // Calculate total for each entity
    data.forEach(entity => {
      const entityTotal = entity.holdings.reduce((sum, holding) => sum + holding.amount, 0);
      entityTotalsMap.set(entity.id, entityTotal);
      currentGrandTotal += entityTotal;
    });

    // Calculate total for each currency
    sortedCurrencies.forEach(currency => {
      const currencyTotal = data.reduce((sum, entity) => {
        const holding = entity.holdings.find(h => h.currency === currency);
        return sum + (holding ? holding.amount : 0);
      }, 0);
      currencyTotalsMap.set(currency, currencyTotal);
    });

    return {
      uniqueCurrencies: sortedCurrencies,
      entityTotals: entityTotalsMap,
      currencyTotals: currencyTotalsMap,
      grandTotal: currentGrandTotal,
    };
  }, [data]);

  // CSS-in-JS for styling the component.
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#ffffff',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#212529',
      marginBottom: '1.5rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'right',
      fontSize: '0.9rem',
    },
    th: {
      backgroundColor: '#f8f9fa',
      color: '#495057',
      padding: '0.75rem 1rem',
      fontWeight: 600,
      border: '1px solid #dee2e6',
      borderBottomWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    td: {
      padding: '0.75rem 1rem',
      border: '1px solid #e9ecef',
      color: '#343a40',
    },
    entityCell: {
      textAlign: 'left',
      fontWeight: 500,
      color: '#0052cc',
    },
    totalCell: {
      fontWeight: 'bold',
      backgroundColor: '#f8f9fa',
    },
    rowOdd: {
      backgroundColor: '#f8f9fa',
    },
    rowEven: {
      backgroundColor: '#ffffff',
    },
    footer: {
      backgroundColor: '#e9ecef',
      fontWeight: 'bold',
      color: '#212529',
      borderTop: '2px solid #dee2e6',
    },
    zeroAmount: {
      color: '#adb5bd',
    },
    summary: {
      marginTop: '1.5rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #dee2e6',
      textAlign: 'right',
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#212529',
    },
  };

  if (!data || data.length === 0) {
    return (
        <div style={styles.container}>
            <h2 style={styles.title}>{title}</h2>
            <p>No liquidity data available to display.</p>
        </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{title}</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, textAlign: 'left' }}>Holding Entity</th>
            {uniqueCurrencies.map(currency => (
              <th key={currency} style={styles.th}>{currency}</th>
            ))}
            <th style={{ ...styles.th, ...styles.totalCell }}>Entity Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entity, index) => {
            const rowStyle = index % 2 === 0 ? styles.rowEven : styles.rowOdd;
            return (
              <tr key={entity.id} style={rowStyle}>
                <td style={{ ...styles.td, ...styles.entityCell }}>{entity.name}</td>
                {uniqueCurrencies.map(currency => {
                  const holding = entity.holdings.find(h => h.currency === currency);
                  const amount = holding ? holding.amount : 0;
                  return (
                    <td key={currency} style={{ ...styles.td, ...(amount === 0 ? styles.zeroAmount : {}) }}>
                      {Citibankdemobusinessinc.Kernel.formatNumber(amount)}
                    </td>
                  );
                })}
                <td style={{ ...styles.td, ...styles.totalCell }}>
                  {Citibankdemobusinessinc.Kernel.formatNumber(entityTotals.get(entity.id) || 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={styles.footer}>
            <td style={{ ...styles.td, textAlign: 'left' }}>Grand Total</td>
            {uniqueCurrencies.map(currency => (
              <td key={currency} style={styles.td}>
                {Citibankdemobusinessinc.Kernel.formatNumber(currencyTotals.get(currency) || 0)}
              </td>
            ))}
            <td style={{ ...styles.td, ...styles.totalCell }}>
              {Citibankdemobusinessinc.Kernel.formatNumber(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
      <div style={styles.summary}>
        Total Global Liquidity: <strong>{Citibankdemobusinessinc.Kernel.formatNumber(grandTotal)}</strong>
      </div>
    </div>
  );
};

export default LiquidityMap;