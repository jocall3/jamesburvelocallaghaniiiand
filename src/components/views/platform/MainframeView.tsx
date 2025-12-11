```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View } from '../../../types'; // Ensure correct path to types
import FeatureGuard from '../../FeatureGuard';

// A simple function to generate mock AI responses
const generateMainframeResponse = async (command: string) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500)); // Simulate AI processing time

    command = command.trim().toLowerCase();

    if (command === 'help') {
        return `
Available commands:
  help                    - Display this help message.
  clear                   - Clear the terminal screen.
  dir                     - List simulated datasets/programs.
  query <natural language>  - AI: Translate natural language to mainframe query and execute.
  runjob <description>    - AI: Orchestrate a mainframe job from description.
  exit                    - Log out of the mainframe.
`;
    } else if (command === 'dir') {
        return `
DATASETS:
  BANK.CUSTMASTER.V01
  BANK.TRANSACT.DAILY.V01
  BANK.ACCTLEDGER.MONTHLY
  BANK.PAYROLL.Q3
PROGRAMS:
  P.CICS.GETBAL
  P.BATCH.EODPROC
  P.BATCH.PAYGEN
`;
    } else if (command.startsWith('query ')) {
        const nlQuery = command.substring(6).trim();
        let simulatedQuery = '';
        let simulatedResponse = '';

        if (nlQuery.includes('account balance') && nlQuery.includes('123')) {
            simulatedQuery = "CICS EXEC LINK PROGRAM('GETBAL') COMMAREA('CUST123')";
            simulatedResponse = `
CUSTOMER 'CUST123' ACCOUNT BALANCE: $12,345.67
LAST TRANSACTION: 2024-07-21, Type: DEBIT, Amount: $500.00, Desc: ATM Withdrawal
`;
        } else if (nlQuery.includes('transactions') && nlQuery.includes('last month')) {
            simulatedQuery = "SQL SELECT * FROM BANK.TRANSACT.DAILY.V01 WHERE DATE BETWEEN '2024-06-01' AND '2024-06-30'";
            simulatedResponse = `
AI Interpreter: Query executed successfully.
1000+ records found. Displaying first 5:
--------------------------------------------------------------------------------------------------
TXN_ID    ACCT_ID  DATE       TYPE     AMOUNT    DESCRIPTION
--------------------------------------------------------------------------------------------------
TRX0001   CUST123  2024-06-05 DEBIT    125.00    ONLINE_PURCHASE
TRX0002   CUST456  2024-06-07 CREDIT   2000.00   SALARY_DEPOSIT
TRX0003   CUST123  2024-06-08 DEBIT    45.50     DINING
TRX0004   CUST789  2024-06-10 DEBIT    300.00    UTILITY_BILL
TRX0005   CUST456  2024-06-12 CREDIT   50.00     REFUND
--------------------------------------------------------------------------------------------------
`;
        } else {
            simulatedQuery = `COBOL CALL 'GENERIC_QUERY' USING '${nlQuery}'`;
            simulatedResponse = `
AI Interpreter: Query executed successfully.
No specific data found for "${nlQuery}". Please refine your request or try 'dir'.
`;
        }
        return `AI Interpreter: Translating natural language to mainframe query...
> ${simulatedQuery}
${simulatedResponse}`;

    } else if (command.startsWith('runjob ')) {
        const jobDesc = command.substring(7).trim();
        let simulatedJCL = '';
        let jobStatus = '';

        if (jobDesc.includes('payroll') && jobDesc.includes('Q3')) {
            simulatedJCL = `
//Q3PAYROL JOB (BANKACCT),'Q3 PAYROLL',CLASS=A,MSGCLASS=A
//STEP1    EXEC PGM=PAYGEN,REGION=4M
//STEPLIB  DD DSN=BANK.PROGLIB,DISP=SHR
//SYSIN    DD DSN=BANK.PAYROLL.Q3.INPUT,DISP=SHR
//SYSOUT   DD SYSOUT=*
//SYSUDUMP DD SYSOUT=*
//REPORT   DD DSN=BANK.PAYROLL.Q3.REPORT,DISP=(NEW,CATLG),
//         UNIT=SYSDA,SPACE=(TRK,(10,5)),DCB=(RECFM=FB,LRECL=132,BLKSIZE=0)
//SYSABEND DD SYSOUT=*
`;
            jobStatus = 'Job Q3PAYROL submitted. ID: JOB00123. Status: RUNNING';
        } else if (jobDesc.includes('end-of-day') || jobDesc.includes('eod')) {
            simulatedJCL = `
//EODPROC  JOB (BANKACCT),'EOD PROCESS',CLASS=A,MSGCLASS=A
//STEP1    EXEC PGM=EODPROC,COND=(0,LT)
//STEPLIB  DD DSN=BANK.PROGLIB,DISP=SHR
//SYSUT1   DD DSN=BANK.TRANSACT.DAILY.V01,DISP=SHR
//SYSUT2   DD DSN=BANK.ACCTLEDGER.MONTHLY,DISP=MOD
//SYSPRINT DD SYSOUT=*
`;
            jobStatus = 'Job EODPROC submitted. ID: JOB00124. Status: PENDING';
        } else {
            simulatedJCL = `//GENERIC  JOB (UNKNOWN),'${jobDesc}',CLASS=A,MSGCLASS=A`;
            jobStatus = `AI Orchestrator: No specific job defined for "${jobDesc}". Generic job created. Status: HOLD`;
        }

        return `AI Orchestrator: Generating JCL for mainframe job...
> ${simulatedJCL}
${jobStatus}`;
    } else if (command === 'exit') {
        return 'Logging off... Session terminated.';
    }

    return `ERROR: Unknown command '${command}'. Type 'help' for available commands.`;
};


/**
 * @description Renders a retro-styled terminal interface acting as the gateway
 * to simulated legacy mainframe data and operations. It features a command line
 * interface with AI-powered interactions for querying and job orchestration.
 */
const MainframeView: React.FC = () => {
    const [history, setHistory] = useState<string[]>([]);
    const [command, setCommand] = useState<string>('');
    const [processing, setProcessing] = useState<boolean>(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on load and when history updates
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history, processing]);

    const handleCommand = useCallback(async () => {
        if (!command.trim() || processing) return;

        const currentCommand = command.trim();
        setHistory(prev => [...prev, `MAINFRAME:> ${currentCommand}`]);
        setCommand('');
        setProcessing(true);

        if (currentCommand.toLowerCase() === 'clear') {
            setHistory([]);
            setProcessing(false);
            return;
        }

        const response = await generateMainframeResponse(currentCommand);
        setHistory(prev => [...prev, response]);
        setProcessing(false);

        if (currentCommand.toLowerCase() === 'exit') {
            // Optionally, disable further interaction or navigate away
            // For now, just show the message and keep the terminal open.
        }
    }, [command, processing]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCommand();
        }
    }, [handleCommand]);

    const welcomeMessage = `
  __  __          _           _                                 
 |  \\/  | ___ __ | | ___ __ _| |_ __ _ _ __ ___   ___  ___  ___ 
 | |\\/| |/ _ \\ '_ \\|/ _ \\/ _\` | __/ _\` | '_ \` _ \\ / _ \\/ __|/ _ \\
 | |  | |  __/ | | |  __/ (_| | || (_| | | | | | |  __/\\__ \\  __/
 |_|  |_|\\___|_| |_|\\___|\\__,_|\\__\\__,_|_| |_| |_|\\___||___/\\___|
                                                               
  (C) 2024 DEMO BANK. ALL RIGHTS RESERVED.
  
  ACCESS GRANTED.
  TYPE 'help' FOR ASSISTANCE.
`;

    // Render the output history
    const renderHistory = () => {
        return history.map((line, index) => (
            <pre key={index} className="whitespace-pre-wrap font-mono text-green-400">
                {line}
            </pre>
        ));
    };

    return (
        <FeatureGuard view={View.Mainframe}>
            <div className="flex flex-col h-full bg-black bg-opacity-80 p-4 rounded-lg shadow-lg terminal-shadow overflow-hidden">
                <style jsx>{`
                    .terminal-shadow {
                        box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
                    }
                    .terminal-input::before {
                        content: 'MAINFRAME:> ';
                        color: #a7f3d0; /* green-200 */
                    }
                    .cursor {
                        animation: blink 1s step-end infinite;
                    }
                    @keyframes blink {
                        from, to { visibility: hidden; }
                        50% { visibility: visible; }
                    }
                    /* Subtle scanline effect for retro feel */
                    .scanlines {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: repeating-linear-gradient(
                            to bottom,
                            transparent 0px,
                            transparent 1px,
                            rgba(0, 255, 0, 0.05) 1px,
                            rgba(0, 255, 0, 0.05) 2px
                        );
                        pointer-events: none;
                        opacity: 0.1;
                    }
                    /* Optional CRT screen curve */
                    .crt-effect {
                        border-radius: 10px;
                        box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.4);
                    }
                `}</style>

                <div className="flex-1 overflow-y-auto font-mono text-green-400 text-sm p-2 bg-gray-900 border border-green-700 rounded-md mb-2 relative crt-effect" ref={terminalRef}>
                    <div className="scanlines"></div> {/* Scanline overlay */}
                    <pre className="whitespace-pre-wrap">{welcomeMessage}</pre>
                    {renderHistory()}
                    {processing && (
                        <pre className="font-mono text-green-400">
                            MAINFRAME:> {command}
                            <span className="cursor text-green-200">█</span> {/* Processing cursor */}
                        </pre>
                    )}
                </div>

                <div className="flex items-center text-green-400 mt-2">
                    {!processing && (
                        <>
                            <span className="font-mono terminal-input"></span>
                            <input
                                ref={inputRef}
                                type="text"
                                className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono caret-green-200"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={processing}
                                spellCheck="false"
                            />
                            <span className="cursor text-green-200">█</span>
                        </>
                    )}
                </div>
            </div>
        </FeatureGuard>
    );
};

export default MainframeView;
```