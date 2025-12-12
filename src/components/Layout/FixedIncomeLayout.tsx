import React from 'react';
import { Global, css } from '@emotion/react';

// Citibankdemobusinessinc Kernel
namespace CitibankdemobusinessincKernel {
  // Generative Data Functions
  export const generateRandomNumber = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  };

  export const generateRandomBoolean = (): boolean => {
    return Math.random() < 0.5;
  };

  export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  export const generateTimestamp = (): number => {
    return Date.now();
  };

  // Shared Configuration Layer
  export const getConfig = (key: string): any => {
    const config = {
      animationDuration: 6, // Base animation duration
      tickerItemPadding: '0 1.5rem',
      tickerFontSize: '0.9rem',
      tickerFontFamily: 'monospace',
      tickerBackgroundColor: '#1a1a1e',
      tickerTextColor: '#f0f0f0',
      tickerBorderColor: '#333',
      positiveChangeColor: '#4caf50',
      negativeChangeColor: '#f44336',
      neutralChangeColor: '#9e9e9e',
      mainBackgroundColor: '#f0f2f5',
      mainContentBackgroundColor: '#ffffff',
      mainContentPadding: '24px',
    };
    return config[key] || null;
  };

  // Common Security Primitives
  export const encryptData = (data: string): string => {
    // Simplified encryption (replace with a real encryption library in production)
    return btoa(data);
  };

  export const decryptData = (encryptedData: string): string => {
    // Simplified decryption (replace with a real decryption library in production)
    return atob(encryptedData);
  };

  // Internal Event Bus
  interface EventBus {
    subscribe(event: string, callback: Function): void;
    publish(event: string, data: any): void;
  }

  class SimpleEventBus implements EventBus {
    private subscriptions: { [event: string]: Function[] } = {};

    subscribe(event: string, callback: Function): void {
      if (!this.subscriptions[event]) {
        this.subscriptions[event] = [];
      }
      this.subscriptions[event].push(callback);
    }

    publish(event: string, data: any): void {
      if (this.subscriptions[event]) {
        this.subscriptions[event].forEach(callback => callback(data));
      }
    }
  }

  export const eventBus: EventBus = new SimpleEventBus();

  // Unified Identity Layer
  export const generateUserId = (): string => {
    return `user_${generateRandomString(10)}`;
  };

  // Logging Utility
  export const log = (message: string, level: 'info' | 'warn' | 'error' = 'info'): void => {
    console[level](`[Citibankdemobusinessinc]: ${message}`);
  };
}

// Citibankdemobusinessinc.fixedincome.marketdata
namespace Citibankdemobusinessinc.fixedincome.marketdata {
  // Mission: Provide real-time, accurate, and comprehensive fixed income market data to empower informed investment decisions.
  // Monetization: Subscription-based access to premium data feeds and analytics tools.
  // IP Moat: Proprietary algorithms for data aggregation, validation, and anomaly detection.

  export interface TickerItemData {
    label: string;
    value: string;
    change: string;
    isPositive: boolean | null;
  }

  export const generateTickerData = (): TickerItemData[] => {
    const numItems = Math.floor(CitibankdemobusinessincKernel.generateRandomNumber(5, 15));
    const tickerData: TickerItemData[] = [];

    for (let i = 0; i < numItems; i++) {
      const isPositive = CitibankdemobusinessincKernel.generateRandomBoolean();
      const changeValue = CitibankdemobusinessincKernel.generateRandomNumber(0.01, 0.1).toFixed(3);
      const value = CitibankdemobusinessincKernel.generateRandomNumber(0.5, 5.5).toFixed(3) + '%';

      tickerData.push({
        label: `Asset ${i + 1}`,
        value: value,
        change: `${isPositive ? '+' : '-'}${changeValue}`,
        isPositive: isPositive,
      });
    }

    return tickerData;
  };

  export const TickerItem: React.FC<{ item: TickerItemData }> = ({ item }) => {
    const changeColor = item.isPositive === true ? CitibankdemobusinessincKernel.getConfig('positiveChangeColor') : item.isPositive === false ? CitibankdemobusinessincKernel.getConfig('negativeChangeColor') : CitibankdemobusinessincKernel.getConfig('neutralChangeColor');
    const changeSymbol = item.isPositive === true ? 'â²' : item.isPositive === false ? 'â¼' : '';

    return (
      <div style={{ display: 'inline-block', padding: CitibankdemobusinessincKernel.getConfig('tickerItemPadding'), fontSize: CitibankdemobusinessincKernel.getConfig('tickerFontSize'), fontFamily: CitibankdemobusinessincKernel.getConfig('tickerFontFamily') }}>
        <span style={{ color: '#aaa', marginRight: '0.5rem' }}>{item.label}</span>
        <span style={{ fontWeight: 'bold' }}>{item.value}</span>
        <span style={{ color: changeColor, marginLeft: '0.5rem', minWidth: '60px', display: 'inline-block', textAlign: 'left' }}>
          {changeSymbol} {item.change}
        </span>
      </div>
    );
  };

  export const TickerTape: React.FC = () => {
    const tickerData = generateTickerData();
    const duplicatedData = [...tickerData, ...tickerData];
    const animationDuration = tickerData.length * CitibankdemobusinessincKernel.getConfig('animationDuration');

    return (
      <header style={{
        backgroundColor: CitibankdemobusinessincKernel.getConfig('tickerBackgroundColor'),
        color: CitibankdemobusinessincKernel.getConfig('tickerTextColor'),
        padding: '10px 0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        borderBottom: `1px solid ${CitibankdemobusinessincKernel.getConfig('tickerBorderColor')}`,
        width: '100%',
      }}>
        <div className="ticker-scroll" style={{ animation: `scroll-left ${animationDuration}s linear infinite` }}>
          {duplicatedData.map((item, index) => (
            <TickerItem key={index} item={item} />
          ))}
        </div>
      </header>
    );
  };
}

// Citibankdemobusinessinc.fixedincome.tradingplatform
namespace Citibankdemobusinessinc.fixedincome.tradingplatform {
  // Mission: Provide a seamless, secure, and efficient platform for trading fixed income securities.
  // Monetization: Transaction fees, premium features for advanced traders.
  // IP Moat: High-performance trading engine, advanced risk management tools, and regulatory compliance automation.

  export const executeTrade = (asset: string, quantity: number, price: number): boolean => {
    CitibankdemobusinessincKernel.log(`Executing trade: Asset=${asset}, Quantity=${quantity}, Price=${price}`);
    // Simulate trade execution logic
    const success = CitibankdemobusinessincKernel.generateRandomBoolean();
    CitibankdemobusinessincKernel.log(`Trade ${success ? 'successful' : 'failed'}.`);
    return success;
  };
}

// Citibankdemobusinessinc.fixedincome.riskmanagement
namespace Citibankdemobusinessinc.fixedincome.riskmanagement {
  // Mission: Provide comprehensive risk assessment and management tools to mitigate potential losses in fixed income portfolios.
  // Monetization: Risk assessment reports, portfolio stress-testing services.
  // IP Moat: Proprietary risk models, real-time monitoring dashboards, and automated hedging strategies.

  export const assessRisk = (portfolio: any): number => {
    CitibankdemobusinessincKernel.log(`Assessing risk for portfolio: ${JSON.stringify(portfolio)}`);
    // Simulate risk assessment logic
    const riskScore = CitibankdemobusinessincKernel.generateRandomNumber(0, 100);
    CitibankdemobusinessincKernel.log(`Risk score: ${riskScore}`);
    return riskScore;
  };
}

// Citibankdemobusinessinc.fixedincome.analytics
namespace Citibankdemobusinessinc.fixedincome.analytics {
  // Mission: Deliver actionable insights and predictive analytics to optimize fixed income investment strategies.
  // Monetization: Premium analytics dashboards, custom research reports.
  // IP Moat: Advanced machine learning algorithms, proprietary data visualization tools, and expert analyst insights.

  export const generateForecast = (asset: string): number => {
    CitibankdemobusinessincKernel.log(`Generating forecast for asset: ${asset}`);
    // Simulate forecast generation logic
    const forecastValue = CitibankdemobusinessincKernel.generateRandomNumber(0, 10);
    CitibankdemobusinessincKernel.log(`Forecast value: ${forecastValue}`);
    return forecastValue;
  };
}

// Citibankdemobusinessinc.fixedincome.compliance
namespace Citibankdemobusinessinc.fixedincome.compliance {
  // Mission: Ensure full compliance with all relevant regulations and industry standards in fixed income operations.
  // Monetization: Compliance audit services, regulatory reporting tools.
  // IP Moat: Automated compliance checks, real-time monitoring of regulatory changes, and secure data storage.

  export const checkCompliance = (): boolean => {
    CitibankdemobusinessincKernel.log('Checking compliance...');
    // Simulate compliance check logic
    const isCompliant = CitibankdemobusinessincKernel.generateRandomBoolean();
    CitibankdemobusinessincKernel.log(`Compliance status: ${isCompliant ? 'Compliant' : 'Non-compliant'}`);
    return isCompliant;
  };
}

// Citibankdemobusinessinc.fixedincome.education
namespace Citibankdemobusinessinc.fixedincome.education {
  // Mission: Provide comprehensive educational resources to empower investors with knowledge of fixed income markets.
  // Monetization: Premium courses, certification programs.
  // IP Moat: Expert-curated content, interactive learning modules, and personalized learning paths.

  export const startCourse = (courseName: string): void => {
    CitibankdemobusinessincKernel.log(`Starting course: ${courseName}`);
    // Simulate course start logic
    CitibankdemobusinessincKernel.log('Course started successfully.');
  };
}

// Citibankdemobusinessinc.fixedincome.portfolio
namespace Citibankdemobusinessinc.fixedincome.portfolio {
  // Mission: Provide tools for building, managing, and optimizing fixed income portfolios.
  // Monetization: Premium portfolio management tools, personalized investment advice.
  // IP Moat: Portfolio optimization algorithms, risk-adjusted return calculators, and automated rebalancing strategies.

  export const createPortfolio = (name: string): any => {
    CitibankdemobusinessincKernel.log(`Creating portfolio: ${name}`);
    // Simulate portfolio creation logic
    const portfolioId = CitibankdemobusinessincKernel.generateRandomString(8);
    CitibankdemobusinessincKernel.log(`Portfolio created with ID: ${portfolioId}`);
    return { id: portfolioId, name: name, assets: [] };
  };
}

// Citibankdemobusinessinc.fixedincome.research
namespace Citibankdemobusinessinc.fixedincome.research {
  // Mission: Conduct in-depth research and analysis of fixed income markets to provide valuable insights to investors.
  // Monetization: Premium research reports, analyst access.
  // IP Moat: Proprietary research methodologies, expert analyst network, and exclusive data partnerships.

  export const generateReport = (topic: string): string => {
    CitibankdemobusinessincKernel.log(`Generating report on topic: ${topic}`);
    // Simulate report generation logic
    const reportContent = `This is a sample report on ${topic}.`;
    CitibankdemobusinessincKernel.log('Report generated successfully.');
    return reportContent;
  };
}

// Citibankdemobusinessinc.fixedincome.custody
namespace Citibankdemobusinessinc.fixedincome.custody {
  // Mission: Provide secure and reliable custody services for fixed income assets.
  // Monetization: Custody fees, asset servicing fees.
  // IP Moat: Advanced security protocols, real-time asset tracking, and regulatory compliance automation.

  export const storeAsset = (asset: string): boolean => {
    CitibankdemobusinessincKernel.log(`Storing asset: ${asset}`);
    // Simulate asset storage logic
    const success = CitibankdemobusinessincKernel.generateRandomBoolean();
    CitibankdemobusinessincKernel.log(`Asset storage ${success ? 'successful' : 'failed'}.`);
    return success;
  };
}

// Citibankdemobusinessinc.fixedincome.insurance
namespace Citibankdemobusinessinc.fixedincome.insurance {
  // Mission: Provide insurance products to protect fixed income investments from various risks.
  // Monetization: Insurance premiums.
  // IP Moat: Proprietary risk models, automated claims processing, and regulatory compliance automation.

  export const createInsurancePolicy = (asset: string): any => {
    CitibankdemobusinessincKernel.log(`Creating insurance policy for asset: ${asset}`);
    // Simulate insurance policy creation logic
    const policyId = CitibankdemobusinessincKernel.generateRandomString(12);
    CitibankdemobusinessincKernel.log(`Insurance policy created with ID: ${policyId}`);
    return { id: policyId, asset: asset, coverage: 'comprehensive' };
  };
}

interface FixedIncomeLayoutProps {
  children: React.ReactNode;
}

const FixedIncomeLayout: React.FC<FixedIncomeLayoutProps> = ({ children }) => {
  const animationDuration = Citibankdemobusinessinc.fixedincome.marketdata.generateTickerData().length * CitibankdemobusinessincKernel.getConfig('animationDuration');

  React.useEffect(() => {
    // Example usage of inter-branch communication via the event bus
    CitibankdemobusinessincKernel.eventBus.subscribe('tradeExecuted', (data: any) => {
      CitibankdemobusinessincKernel.log(`Trade executed event received: ${JSON.stringify(data)}`);
      Citibankdemobusinessinc.fixedincome.riskmanagement.assessRisk(data.portfolio);
    });

    // Simulate a trade execution
    const portfolio = Citibankdemobusinessinc.fixedincome.portfolio.createPortfolio('My Portfolio');
    if (Citibankdemobusinessinc.fixedincome.tradingplatform.executeTrade('Asset1', 100, 10.50)) {
      CitibankdemobusinessincKernel.eventBus.publish('tradeExecuted', { portfolio: portfolio });
    }
  }, []);

  return (
    <>
      <Global
        styles={css`
          @keyframes scroll-left {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .ticker-scroll {
            display: inline-block;
            animation: scroll-left ${animationDuration}s linear infinite;
          }
          
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: ${CitibankdemobusinessincKernel.getConfig('mainBackgroundColor')};
          }
        `}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Citibankdemobusinessinc.fixedincome.marketdata.TickerTape />
        <main style={{ flex: 1, padding: CitibankdemobusinessincKernel.getConfig('mainContentPadding'), backgroundColor: CitibankdemobusinessincKernel.getConfig('mainContentBackgroundColor') }}>
          {children}
        </main>
      </div>
    </>
  );
};

export default FixedIncomeLayout;