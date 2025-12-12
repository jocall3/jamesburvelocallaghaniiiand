import React, { useState, useEffect } from 'react';
import { Token } from '../../types';
import { useWallet } from './WalletContext';

interface TokenListProps {
  onTokenSelect: (token: Token) => void;
  selectedTokenAddress?: string;
}

const TokenList: React.FC<TokenListProps> = ({ onTokenSelect, selectedTokenAddress }) => {
  const { tokens, balances } = useWallet();
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);

  useEffect(() => {
    if (tokens && balances) {
      // Filter tokens to only include those with a balance > 0
      const available = tokens.filter(token => {
        const balance = balances[token.address];
        return balance && balance > 0;
      });
      setAvailableTokens(available);
    }
  }, [tokens, balances]);

  const handleTokenClick = (token: Token) => {
    onTokenSelect(token);
  };

  return (
    <div>
      <h3>Select an Asset</h3>
      {availableTokens.length > 0 ? (
        <ul>
          {availableTokens.map(token => (
            <li
              key={token.address}
              onClick={() => handleTokenClick(token)}
              style={{ 
                cursor: 'pointer',
                fontWeight: selectedTokenAddress === token.address ? 'bold' : 'normal' // visually indicate selection
              }}
            >
              {token.name} ({token.symbol}) - {balances[token.address]?.toString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No assets available in your wallet.</p>
      )}
    </div>
  );
};

export default TokenList;