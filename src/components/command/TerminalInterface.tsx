import React, { useState, useRef, useEffect, useCallback } from 'react';

// Define the shape of a command entry in the history
interface HistoryEntry {
  type: 'command' | 'output' | 'error';
  content: string;
}

// Mock access token and related state
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  clientId: string | null;
  isAuthenticated: boolean;
}

const TerminalInterface: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<HistoryEntry[]>([]);
  const [commandsHistory, setCommandsHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // -1 means no history selected
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);

  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    clientId: null,
    isAuthenticated: false,
  });

  // Scroll to bottom of terminal output whenever output changes
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus the input when terminal becomes visible or on mount
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Handle global keydown for toggling visibility (e.g., `~` key)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === '`' || event.key === '~') {
        event.preventDefault(); // Prevent character from being typed
        setIsVisible(prev => !prev);
      } else if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isVisible]);

  const addOutput = useCallback((type: HistoryEntry['type'], content: string) => {
    setOutput(prev => [...prev, { type, content }]);
  }, []);

  const clearTerminal = useCallback(() => {
    setOutput([]);
  }, []);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission if input is part of a form
      const command = input.trim();
      if (command) {
        addOutput('command', `$ ${command}`);
        executeCommand(command);
        setCommandsHistory(prev => [...prev, command]);
        setHistoryIndex(-1); // Reset history index after command execution
      }
      setInput(''); // Clear input after execution
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (commandsHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandsHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandsHistory[newIndex]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (commandsHistory.length > 0) {
        const newIndex = historyIndex === -1 ? -1 : Math.min(commandsHistory.length - 1, historyIndex + 1);
        setHistoryIndex(newIndex);
        if (newIndex === -1) {
          setInput('');
        } else {
          setInput(commandsHistory[newIndex]);
        }
      }
    }
  };

  const getBearerTokenHeader = (token: string | null) => {
    if (!token) return '';
    return `Authorization: Bearer ${token}`;
  };

  // --- Command Execution Logic ---
  const executeCommand = useCallback((command: string) => {
    const [cmd, ...args] = command.split(/\s+/);

    switch (cmd.toLowerCase()) {
      case 'help':
        addOutput('output', `
Available Commands:
  help                                  - Displays this help message.
  clear                                 - Clears the terminal output.
  echo <message>                        - Prints a message to the terminal.
  login <client_id> <client_secret> <auth_code> <redirect_uri>
                                        - Simulate OAuth2 login to get access and refresh tokens.
  refresh                               - Simulate refreshing the access token. Requires prior login.
  logout                                - Simulate revoking the access token. Requires prior login.
  profile <account_id> <country_code>   - Simulate retrieving customer profile. Requires login.
  products                              - Simulate retrieving customer products. Requires login.
  link-reward <last_4_digits> <phone_number> <merchant_ref_id>
                                        - Simulate linking a reward. Requires login.
        `);
        break;

      case 'clear':
        clearTerminal();
        break;

      case 'echo':
        addOutput('output', args.join(' '));
        break;

      case 'login': {
        const [clientId, clientSecret, authCode, redirectUri] = args;
        if (!clientId || !clientSecret || !authCode || !redirectUri) {
          addOutput('error', 'Usage: login <client_id> <client_secret> <auth_code> <redirect_uri>');
          return;
        }

        // Simulate API call for Access Token
        addOutput('output', `Simulating POST /api/identity/auth/v1/oauth2/token/us/gcb`);
        addOutput('output', `  Headers: Authorization: Basic ${btoa(`${clientId}:${clientSecret}`)}, Content-Type: application/x-www-form-urlencoded`);
        addOutput('output', `  Body: grant_type=authorization_code&code=${authCode}&redirect_uri=${redirectUri}`);

        // Mock response from OpenAPI spec
        const mockAccessTokenResponse = {
          "token_type": "Bearer",
          "access_token": "AAEkYzFjMDQ0Y2UtNTBmMy00NmY4LWI4YjEtYmQ5ODJkMWZiNGZh3xGP85xjqyxoHR7pXxzQJf223kWPL-HyWHD4zrRCvHZUkeBkTgxppbmpFtmWeVmjzDOxs1wFzI4s45YDS15eYmyuxzLbVog4d8H9pYSelrvL6naDYOLL9U16EaY0iyAMPBGX1H7RhCqtmd-7u_Eanw7QshbruLaZh2stOrdq2thC5CCSwW2r0e8PM1QbWubJOcMp8UGv-zNc0I3cTSihymSCF44HJ_yeuPAcXJ7kj-iPzQqxaO6FiWPmIsIh2YSxdGYo8alTyjJfG5AQDnM0HA",
          "expires_in": 600,
          "scope": "accounts_details_transactions accounts_routing_number customers_profiles  accounts_statements accounts_tax_statements",
          "refresh_token": "AAGsyASCzlBplxGvA-5CFCkLhNinu6-0HQt-y7PuzsRLVAHok6yYs6KS2Np4t7bL0R8FMeT62wYXFxxY6F7LU_cc00QTXPfoQFFtay2tu3eGpBAGDg07ll_vNk_AEJo9l1GaEKYev7Q7drDOeRCDRqcD12zJzk36PsQEM6j1txFV2jR3snW5PLs3HVjxNRjUHWLR5IoI2qfb8zCZNahrFCRQ7T7ZVB_-E6Qk22tN3hZkZH7_kB3bZjtVoNxyjJ6qBDcrYdgtAvPvBV-xXDBmfUXD44JBYiZffHjEr2dFb_e3yA",
          "refresh_token_expires_in": 2592000,
        };
        addOutput('output', `Response (200 OK): ${JSON.stringify(mockAccessTokenResponse, null, 2)}`);
        setAuthState({
          accessToken: mockAccessTokenResponse.access_token,
          refreshToken: mockAccessTokenResponse.refresh_token,
          clientId: clientId, // Store client_id for subsequent calls
          isAuthenticated: true,
        });
        addOutput('output', 'Login successful! Access token stored.');
        break;
      }

      case 'refresh': {
        if (!authState.isAuthenticated || !authState.refreshToken || !authState.clientId) {
          addOutput('error', 'You must be logged in to refresh the token. Please use the login command first.');
          return;
        }

        // Simulate API call for Refresh Token
        addOutput('output', `Simulating POST /api/identity/auth/v1/oauth2/refresh`);
        addOutput('output', `  Headers: Authorization: Basic ${btoa(`${authState.clientId}:<client_secret>`)}, Content-Type: application/x-www-form-urlencoded`); // Client secret not truly available
        addOutput('output', `  Body: grant_type=refresh_token&refresh_token=${authState.refreshToken}`);

        // Mock response from OpenAPI spec
        const mockRefreshTokenResponse = {
          "token_type": "Bearer",
          "access_token": "NEW_AAEkYzFjMDQ0Y2UtNTBmMy00NmY4LWI4YjEtYmQ5ODJkMWZiNGZh3xGP85xjqyxoHR7pXxzQJf223kWPL-HyWHD4zrRCvHZUkeBkTgxppbmpFtmWeVmjzDOxs1wFzI4s45YDS15eYmyuxzLbVog4d8H9pYSelrvL6naDYOLL9U16EaY0iyAMPBGX1H7RhCqtmd-7u_Eanw7QshbruLaZh2stOrdq2thC5CCSwW2r0e8PM1QbWubJOcMp8UGv-zNc0I3cTSihymSCF44HJ_yeuPAcXJ7kj-iPzQqxaO6FiWPmIsIh2YSxdGYo8alTyjJfG5AQDnM0HA", // Simulating a new token
          "expires_in": 600,
          "scope": "accounts_details_transactions accounts_routing_number customers_profiles  accounts_statements accounts_tax_statements",
          "refresh_token": "NEW_AAGsyASCzlBplxGvA-5CFCkLhNinu6-0HQt-y7PuzsRLVAHok6yYs6KS2Np4t7bL0R8FMeT62wYXFxxY6F7LU_cc00QTXPfoQFFtay2tu3eGpBAGDg07ll_vNk_AEJo9l1GaEKYev7Q7drDOeRCDRqcD12zJzk36PsQEM6j1txFV2jR3snW5PLs3HVjxNRjUHWLR5IoI2qfb8zCZNahrFCRQ7T7ZVB_-E6Qk22tN3hZkZH7_kB3bZjtVoNxyjJ6qBDcrYdgtAvPvBV-xXDBmfUXD44JBYiZffHjEr2dFb_e3yA", // Simulating a new refresh token
          "refresh_token_expires_in": 2592000,
        };
        addOutput('output', `Response (200 OK): ${JSON.stringify(mockRefreshTokenResponse, null, 2)}`);
        setAuthState(prev => ({
          ...prev,
          accessToken: mockRefreshTokenResponse.access_token,
          refreshToken: mockRefreshTokenResponse.refresh_token,
        }));
        addOutput('output', 'Token refreshed successfully!');
        break;
      }

      case 'logout': {
        if (!authState.isAuthenticated || !authState.accessToken || !authState.clientId) {
          addOutput('error', 'You must be logged in to log out. Please use the login command first.');
          return;
        }

        // Simulate API call for Revoke Token
        addOutput('output', `Simulating POST /api/identity/auth/v1/oauth2/revoke`);
        addOutput('output', `  Headers: Authorization: Basic ${btoa(`${authState.clientId}:<client_secret>`)}, Content-Type: application/x-www-form-urlencoded`);
        addOutput('output', `  Body: token=${authState.accessToken}&token_type_hint=access_token`);

        // Mock response from OpenAPI spec
        const mockRevokeTokenResponse = {
          "status": "success",
        };
        addOutput('output', `Response (200 OK): ${JSON.stringify(mockRevokeTokenResponse, null, 2)}`);
        setAuthState({
          accessToken: null,
          refreshToken: null,
          clientId: null,
          isAuthenticated: false,
        });
        addOutput('output', 'Logout successful. Tokens revoked.');
        break;
      }

      case 'profile': {
        const [accountId, countryCode] = args;
        if (!authState.isAuthenticated || !authState.accessToken || !authState.clientId) {
          addOutput('error', 'You must be logged in to view your profile. Please use the login command first.');
          return;
        }
        if (!accountId || !countryCode) {
          addOutput('error', 'Usage: profile <account_id> <country_code>');
          return;
        }

        // Simulate API call for Customer Profile
        addOutput('output', `Simulating GET /api/custmgmt/profiles/v1/accounts/${accountId}/details`);
        addOutput('output', `  Headers: ${getBearerTokenHeader(authState.accessToken)}, uuid: <some-uuid>, Accept: application/json, client_id: ${authState.clientId}, countryCode: ${countryCode}`);

        // Mock response from OpenAPI spec
        const mockProfileResponse = {
          "fullName": "Marc Carlo",
          "firstName": "Marc",
          "lastName": "Carlo",
          "middleName": "david",
          "localName": "Rick",
          "title": "Mr",
          "suffix": "Jr",
          "maidenName": "PAUL",
          "companyName": "PAUL",
          "emails": [
            {
              "emailAddress": "customer123@email.com",
              "preferenceType": "PRIMARY"
            }
          ],
          "addressList": [
            {
              "addressId": "12345",
              "addressLine1": "100 Prospect St",
              "addressLine2": "Apt 203",
              "addressLine3": "Unit Number 20",
              "addressType": "MAILING",
              "city": "Irving",
              "countryCode": "US",
              "postalCode": "12356789",
              "state": "TX"
            }
          ],
          "phones": [
            {
              "areaCode": "954",
              "countryCallingCode": "1",
              "exchangeNumber": "2312",
              "extension": "123",
              "fullPhoneNumber": "1234567890",
              "localNumber": "002",
              "phoneType": "CELL",
              "preferenceType": "PRIMARY"
            }
          ]
        };
        addOutput('output', `Response (200 OK): ${JSON.stringify(mockProfileResponse, null, 2)}`);
        break;
      }

      case 'products': {
        if (!authState.isAuthenticated || !authState.accessToken || !authState.clientId) {
          addOutput('error', 'You must be logged in to view your products. Please use the login command first.');
          return;
        }

        // Simulate API call for Products
        addOutput('output', `Simulating GET /api/productDirectory/v1/products`);
        addOutput('output', `  Headers: ${getBearerTokenHeader(authState.accessToken)}, Accept: application/json, client_id: ${authState.clientId}`);

        // Mock response from OpenAPI spec
        const mockProductsResponse = {
          "customerId": "69dbca123a06bab7c10d904b338037d2e98b68535bdc3fa2ee9c1fe887659a0acb5ba0dfec210dec82c7cae6584fd35e0c9ff9d7c8cdad4707b0f8d724c9d5f9",
          "products": [
            {
              "accountId": "8035a60debb671e89bd451c9ad0f283e8f1b8868dd4dc65520ceb7bdfeb4142999f574c9db37917ef0edfae296745142543e3ad2bc034887f37212ecbde83ee0",
              "status": "ACTIVE",
              "productName": "Citi Rewards+℠ Card",
              "accountType": "CREDIT_CARD",
              "accountNumberDisplay": "XXXXXXXXXXXX7899"
            },
            {
              "accountId": "da549a7cc86472ee05272c7bd0a4483f57174f2110e7ad961a267995031fda66c6d5475de467a65739750107b621e5a01be7cc0dc085a825fa384795904293f6",
              "status": "ACTIVE",
              "productName": "Regular Checking",
              "accountType": "CHECKING",
              "accountNumberDisplay": "XXXXX7899"
            },
            {
              "accountId": "da549a7cc86472ee05272c7bd0a4483f57174f2110e7ad961a267995031fda66c6d5475de467a65739750107b621e5a01be7cc0dc085a825fa384795904293f6",
              "status": "ACTIVE",
              "productName": "Citi Savings Account",
              "accountType": "SAVINGS",
              "accountNumberDisplay": "XXXXX1035"
            }
          ]
        };
        addOutput('output', `Response (200 OK): ${JSON.stringify(mockProductsResponse, null, 2)}`);
        break;
      }

      case 'link-reward': {
        const [lastFourDigitsCardNumber, citiCardHolderPhoneNumber, merchantCustomerReferenceId] = args;
        if (!authState.isAuthenticated || !authState.accessToken || !authState.clientId) {
          addOutput('error', 'You must be logged in to link a reward. Please use the login command first.');
          return;
        }
        if (!lastFourDigitsCardNumber || !citiCardHolderPhoneNumber || !merchantCustomerReferenceId) {
          addOutput('error', 'Usage: link-reward <last_4_digits_card> <phone_number> <merchant_ref_id>');
          return;
        }

        // Simulate API call for Reward Linkage
        addOutput('output', `Simulating POST /openapi/v1/rewards/shopWithPoints/linkage`);
        addOutput('output', `  Headers: ${getBearerTokenHeader(authState.accessToken)}, uuid: <some-uuid>, Accept: application/json, Content-Type: application/json, client_id: ${authState.clientId}`);
        addOutput('output', `  Body: ${JSON.stringify({ lastFourDigitsCardNumber, citiCardHolderPhoneNumber, merchantCustomerReferenceId }, null, 2)}`);

        // Mock response from OpenAPI spec
        const mockRewardLinkageResponse = {
          "rewardLinkCode": "9035268",
        };
        addOutput('output', `Response (200 OK): ${JSON.stringify(mockRewardLinkageResponse, null, 2)}`);
        break;
      }

      default:
        addOutput('error', `Unknown command: ${cmd}. Type 'help' for a list of commands.`);
        break;
    }
  }, [addOutput, clearTerminal, authState.accessToken, authState.clientId, authState.isAuthenticated, authState.refreshToken]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#333',
          color: '#0f0',
          border: '1px solid #0f0',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        Open Terminal (`)
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#0f0',
        fontFamily: 'monospace',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={terminalOutputRef}
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '5px',
          border: '1px solid #0f0',
          marginBottom: '10px',
          backgroundColor: '#111',
          whiteSpace: 'pre-wrap', // Preserve whitespace and wrap lines
          wordBreak: 'break-word', // Break long words
        }}
        onClick={() => inputRef.current?.focus()} // Focus input on terminal click
      >
        {output.map((entry, index) => (
          <div
            key={index}
            style={{
              color: entry.type === 'error' ? '#f00' : (entry.type === 'command' ? '#0ff' : '#0f0'),
            }}
          >
            {entry.content}
          </div>
        ))}
        {output.length === 0 && (
          <div style={{ color: '#0f0' }}>Welcome to the Financial CLI. Type 'help' for commands.</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#0f0', marginRight: '5px' }}>
          {authState.isAuthenticated ? `(${authState.clientId}) ` : ''}$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          style={{
            flexGrow: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#0f0',
            fontSize: '1em',
            caretColor: '#0f0',
          }}
          autoFocus
        />
      </div>
      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '5px 10px',
          backgroundColor: '#555',
          color: '#fff',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '0.8em',
        }}
      >
        Close (Esc)
      </button>
    </div>
  );
};

export default TerminalInterface;