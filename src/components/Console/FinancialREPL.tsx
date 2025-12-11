```typescript
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
                '  history               - Show command history.'}
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

export default FinancialREPL;
```