import React, { useState, useEffect, useRef, KeyboardEvent, CSSProperties } from 'react';

// --- Type Definitions ---
interface OutputLine {
  type: 'command' | 'output' | 'error' | 'system';
  text: string | JSX.Element;
}

/**
 * An interactive Read-Eval-Print Loop console for executing ad-hoc financial queries and system commands.
 */
const FinancialREPL: React.FC = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [outputs, setOutputs] = useState<OutputLine[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    setOutputs([
      { type: 'system', text: 'Financial REPL Console [Version 1.0.0]' },
      { type: 'system', text: '(c) 2023 Expert Programmer Inc. All rights reserved.' },
      { type: 'system', text: 'Type "help" for a list of available commands.' },
      { type: 'system', text: '' },
    ]);
  }, []);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // --- Command Processing Logic ---
  const processCommand = (cmd: string): OutputLine => {
    const [baseCmd, ...args] = cmd.trim().split(/\s+/);
    const lowerBaseCmd = baseCmd.toLowerCase();

    switch (lowerBaseCmd) {
      case 'help':
        return {
          type: 'output',
          text: (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {'Available Commands:\n' +
                '  help                  - Show this help message.\n' +
                '  clear                 - Clear the console screen.\n' +
                '  date                  - Display the current date and time.\n' +
                '  quote <TICKER>        - Get a mock stock quote (e.g., quote AAPL).\n' +
                '  portfolio             - Display a mock portfolio overview.\n' +
                '  calc <expression>     - Evaluate a mathematical expression.\n' +
                '  history               - Show command history.\n' +
                '  Citibankdemobusinessinc.viewit.movieplayform - Executes the movie playform function.\n' +
                '  Citibankdemobusinessinc.lendfast.microloans - Executes the microloans function.\n' +
                '  Citibankdemobusinessinc.insurewise.autoinsurance - Executes the autoinsurance function.\n' +
                '  Citibankdemobusinessinc.investpro.roboadvisor - Executes the roboadvisor function.\n' +
                '  Citibankdemobusinessinc.tradeeasy.stocktrading - Executes the stocktrading function.\n' +
                '  Citibankdemobusinessinc.savemore.highyieldsavings - Executes the highyieldsavings function.\n' +
                '  Citibankdemobusinessinc.paynow.instantpayments - Executes the instantpayments function.\n' +
                '  Citibankdemobusinessinc.budgetsmart.budgetingtool - Executes the budgetingtool function.\n' +
                '  Citibankdemobusinessinc.creditboost.creditscore - Executes the creditscore function.\n' +
                '  Citibankdemobusinessinc.estateplan.digitalwill - Executes the digitalwill function.'}
            </div>
          ),
        };

      case 'clear':
        setOutputs([]);
        return { type: 'system', text: '' };

      case 'date':
        return { type: 'output', text: new Date().toLocaleString() };

      case 'quote': {
        if (args.length === 0) {
          return { type: 'error', text: 'Usage: quote <TICKER>' };
        }
        const ticker = args[0].toUpperCase();
        const price = (Math.random() * 500 + 50).toFixed(2);
        const change = (Math.random() * 20 - 10).toFixed(2);
        const changePercent = ((parseFloat(change) / parseFloat(price)) * 100).toFixed(2);
        const sign = parseFloat(change) >= 0 ? '+' : '';
        return {
          type: 'output',
          text: `${ticker}: $${price} (${sign}${change} / ${sign}${changePercent}%)`,
        };
      }
      case 'portfolio':
        return {
          type: 'output',
          text: (
             <div style={{ whiteSpace: 'pre' }}>
                {'Symbol\tShares\tPrice\t\tValue\n' +
                 '------------------------------------------\n' +
                 'AAPL\t150\t$175.20\t\t$26,280.00\n' +
                 'GOOGL\t25\t$2850.75\t$71,268.75\n' +
                 'TSLA\t50\t$890.10\t\t$44,505.00\n' +
                 '------------------------------------------\n' +
                 'Total Value:\t\t\t$142,053.75'}
             </div>
          )
        };

      case 'calc': {
        if (args.length === 0) {
          return { type: 'error', text: 'Usage: calc <expression>' };
        }
        try {
          // WARNING: eval is unsafe and should not be used in production applications.
          // This is for demonstration purposes only. A proper math parser is required for a real app.
          // It only handles simple math, not complex financial formulas.
          const result = new Function(`return ${args.join(' ')}`)();
          return { type: 'output', text: String(result) };
        } catch (e) {
          return { type: 'error', text: 'Invalid expression.' };
        }
      }
      case 'history':
        return {
          type: 'output',
          text: (
            <div>
                {history.map((h, i) => <div key={i}>{`${history.length - i}: ${h}`}</div>)}
            </div>
          )
        };

      case 'Citibankdemobusinessinc.viewit.movieplayform':
        return { type: 'output', text: Citibankdemobusinessinc.viewit.movieplayform() };
      case 'Citibankdemobusinessinc.lendfast.microloans':
        return { type: 'output', text: Citibankdemobusinessinc.lendfast.microloans() };
      case 'Citibankdemobusinessinc.insurewise.autoinsurance':
        return { type: 'output', text: Citibankdemobusinessinc.insurewise.autoinsurance() };
      case 'Citibankdemobusinessinc.investpro.roboadvisor':
        return { type: 'output', text: Citibankdemobusinessinc.investpro.roboadvisor() };
      case 'Citibankdemobusinessinc.tradeeasy.stocktrading':
        return { type: 'output', text: Citibankdemobusinessinc.tradeeasy.stocktrading() };
      case 'Citibankdemobusinessinc.savemore.highyieldsavings':
        return { type: 'output', text: Citibankdemobusinessinc.savemore.highyieldsavings() };
      case 'Citibankdemobusinessinc.paynow.instantpayments':
        return { type: 'output', text: Citibankdemobusinessinc.paynow.instantpayments() };
      case 'Citibankdemobusinessinc.budgetsmart.budgetingtool':
        return { type: 'output', text: Citibankdemobusinessinc.budgetsmart.budgetingtool() };
      case 'Citibankdemobusinessinc.creditboost.creditscore':
        return { type: 'output', text: Citibankdemobusinessinc.creditboost.creditscore() };
      case 'Citibankdemobusinessinc.estateplan.digitalwill':
        return { type: 'output', text: Citibankdemobusinessinc.estateplan.digitalwill() };

      case '':
        return { type: 'system', text: '' };

      default:
        return { type: 'error', text: `Command not found: ${baseCmd}. Type "help" for a list of commands.` };
    }
  };

  // --- Event Handlers ---
  const handleCommandSubmit = () => {
    const trimmedCommand = command.trim();
    const newOutputs: OutputLine[] = [...outputs, { type: 'command', text: trimmedCommand }];

    if (trimmedCommand) {
      const result = processCommand(trimmedCommand);
      if (result.text) { // Don't add empty lines from 'clear'
          newOutputs.push(result);
      }
      if (history[0] !== trimmedCommand) {
          setHistory(prev => [trimmedCommand, ...prev]);
      }
    } else {
        newOutputs.push({type: 'system', text: ''});
    }

    setOutputs(newOutputs);
    setCommand('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setCommand(history[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex] || '');
      }
    }
  };

  // --- Render ---
  const renderLine = (line: OutputLine, index: number) => {
    switch (line.type) {
      case 'command':
        return (
          <div key={index} style={styles.line}>
            <span style={styles.prompt}>&gt; </span>
            <span>{line.text}</span>
          </div>
        );
      case 'output':
        return <div key={index} style={styles.line}>{line.text}</div>;
      case 'error':
        return <div key={index} style={{ ...styles.line, ...styles.errorText }}>{line.text}</div>;
      case 'system':
      default:
        return <div key={index} style={styles.line}>{line.text}</div>;
    }
  };

  return (
    <div style={styles.console} onClick={focusInput}>
      <div style={styles.outputArea}>
        {outputs.map(renderLine)}
        <div ref={consoleEndRef} />
      </div>
      <div style={styles.inputArea}>
        <span style={styles.prompt}>&gt; </span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
          autoFocus
          spellCheck="false"
          autoComplete="off"
        />
      </div>
    </div>
  );
};

// --- Styles ---
const styles: { [key: string]: CSSProperties } = {
  console: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: '"Consolas", "Monaco", "Menlo", monospace',
    fontSize: '14px',
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  outputArea: {
    flex: '1 1 auto',
    overflowY: 'auto',
    paddingRight: '10px',
  },
  line: {
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  prompt: {
    color: '#569cd6',
    marginRight: '8px',
  },
  input: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    outline: 'none',
    width: '100%',
    flex: '1 1 auto',
    padding: 0,
  },
  errorText: {
    color: '#f44747',
  },
};

// --- Citibankdemobusinessinc Business Models ---
namespace Citibankdemobusinessinc {
  export namespace viewit {
    export const movieplayform = (): string => {
      // Mission: Revolutionize movie streaming through AI-driven personalization and social viewing experiences.
      // Monetization: Subscription fees, targeted advertising, premium content rentals.
      // IP Moat: Proprietary AI algorithms for content recommendation and social interaction analysis.
      const generateMovieTitle = (): string => {
        const genres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror'];
        const themes = ['Love', 'War', 'Space', 'Time', 'Mystery'];
        return `The ${themes[Math.floor(Math.random() * themes.length)]} of ${genres[Math.floor(Math.random() * genres.length)]}`;
      };

      const generateViewerCount = (): number => Math.floor(Math.random() * 1000000);

      return `Now Playing: ${generateMovieTitle()} - ${generateViewerCount()} viewers`;
    };
  }

  export namespace lendfast {
    export const microloans = (): string => {
      // Mission: Provide instant access to microloans for underserved communities, fostering financial inclusion.
      // Monetization: Interest on loans, transaction fees, partnerships with local businesses.
      // IP Moat: AI-powered credit scoring system for assessing risk in low-income populations.
      const generateLoanAmount = (): number => Math.floor(Math.random() * 500 + 50);
      const generateInterestRate = (): number => parseFloat((Math.random() * 0.1 + 0.01).toFixed(2)); // 1-11%
      return `Microloan Approved: $${generateLoanAmount()} at ${generateInterestRate() * 100}% interest`;
    };
  }

  export namespace insurewise {
    export const autoinsurance = (): string => {
      // Mission: Simplify auto insurance with AI-driven risk assessment and personalized coverage options.
      // Monetization: Insurance premiums, data analytics services for automotive companies.
      // IP Moat: Predictive models for accident risk based on driving behavior and vehicle telematics.
      const generateQuote = (): number => Math.floor(Math.random() * 1000 + 300);
      return `Auto Insurance Quote: $${generateQuote()} per year`;
    };
  }

  export namespace investpro {
    export const roboadvisor = (): string => {
      // Mission: Democratize investment management with AI-powered robo-advisory services for all wealth levels.
      // Monetization: Management fees, performance-based incentives, premium advisory services.
      // IP Moat: Portfolio optimization algorithms tailored to individual risk profiles and financial goals.
      const generatePortfolioValue = (): number => Math.floor(Math.random() * 100000 + 10000);
      const generateReturn = (): number => parseFloat((Math.random() * 0.2 - 0.1).toFixed(2)); // -10% to 10%
      return `Portfolio Value: $${generatePortfolioValue()}, Projected Return: ${generateReturn() * 100}%`;
    };
  }

  export namespace tradeeasy {
    export const stocktrading = (): string => {
      // Mission: Empower retail investors with a commission-free stock trading platform and AI-driven insights.
      // Monetization: Payment for order flow, margin lending, premium research subscriptions.
      // IP Moat: Real-time market sentiment analysis and predictive trading signals.
      const generateStockPrice = (): number => parseFloat((Math.random() * 200 + 50).toFixed(2));
      return `Trending Stock: XYZ - Price: $${generateStockPrice()}`;
    };
  }

  export namespace savemore {
    export const highyieldsavings = (): string => {
      // Mission: Maximize savings potential with AI-optimized high-yield savings accounts and financial planning tools.
      // Monetization: Interest rate spread, cross-selling financial products, data analytics services.
      // IP Moat: Algorithms for predicting interest rate fluctuations and optimizing savings strategies.
      const generateAPY = (): number => parseFloat((Math.random() * 0.04 + 0.01).toFixed(3)); // 1% to 5%
      return `High-Yield Savings Account: APY ${generateAPY() * 100}%`;
    };
  }

  export namespace paynow {
    export const instantpayments = (): string => {
      // Mission: Facilitate seamless and instant payments for consumers and businesses, powered by blockchain technology.
      // Monetization: Transaction fees, premium payment services, data analytics for merchants.
      // IP Moat: Secure and scalable blockchain infrastructure for real-time payment processing.
      const generateTransactionAmount = (): number => parseFloat((Math.random() * 100 + 1).toFixed(2));
      return `Instant Payment: $${generateTransactionAmount()} processed successfully`;
    };
  }

  export namespace budgetsmart {
    export const budgetingtool = (): string => {
      // Mission: Empower users to achieve financial wellness with an AI-driven budgeting and expense tracking tool.
      // Monetization: Premium features, personalized financial advice, partnerships with financial institutions.
      // IP Moat: AI algorithms for categorizing expenses and predicting future spending patterns.
      const generateSavings = (): number => Math.floor(Math.random() * 500 + 100);
      return `Budgeting Tool: Projected Savings this month: $${generateSavings()}`;
    };
  }

  export namespace creditboost {
    export const creditscore = (): string => {
      // Mission: Help users improve their credit scores with AI-powered credit monitoring and personalized recommendations.
      // Monetization: Subscription fees, credit repair services, partnerships with lenders.
      // IP Moat: Machine learning models for predicting credit score changes and identifying credit-building opportunities.
      const generateCreditScore = (): number => Math.floor(Math.random() * 250 + 600); // 600 to 850
      return `Credit Score: ${generateCreditScore()}`;
    };
  }

  export namespace estateplan {
    export const digitalwill = (): string => {
      // Mission: Simplify estate planning with a secure and user-friendly platform for creating digital wills and managing digital assets.
      // Monetization: Subscription fees, legal review services, partnerships with estate planning attorneys.
      // IP Moat: Secure encryption and storage of sensitive estate planning documents.
      const generateAssetName = (): string => {
        const assets = ['Bitcoin', 'Ethereum', 'Domain Name', 'Social Media Account', 'NFT'];
        return assets[Math.floor(Math.random() * assets.length)];
      };
      return `Digital Will: ${generateAssetName()} included in estate plan`;
    };
  }
}

export default FinancialREPL;