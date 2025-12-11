```typescript
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styled from 'styled-components';

interface BondIdentifierBlockProps {
    isin?: string;
    cusip?: string;
    figi?: string;
    ticker?: string;
}

const IdentifierBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: #555;
`;

const IdentifierRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IdentifierLabel = styled.span`
  font-weight: bold;
  width: 40px; /* Adjust as needed */
  display: inline-block;
`;

const IdentifierValue = styled.span`
  /* Add styling as needed */
`;

const CopyButton = styled.button`
  background-color: #eee;
  border: 1px solid #ccc;
  padding: 2px 4px;
  cursor: pointer;
  font-size: 0.7rem;

  &:hover {
    background-color: #ddd;
  }
`;

const BondIdentifierBlock: React.FC<BondIdentifierBlockProps> = ({ isin, cusip, figi, ticker }) => {
    return (
        <IdentifierBlockContainer>
            {isin && (
                <IdentifierRow>
                    <IdentifierLabel>ISIN:</IdentifierLabel>
                    <IdentifierValue>{isin}</IdentifierValue>
                    <CopyToClipboard text={isin}>
                        <CopyButton>Copy</CopyButton>
                    </CopyToClipboard>
                </IdentifierRow>
            )}
            {cusip && (
                <IdentifierRow>
                    <IdentifierLabel>CUSIP:</IdentifierLabel>
                    <IdentifierValue>{cusip}</IdentifierValue>
                    <CopyToClipboard text={cusip}>
                        <CopyButton>Copy</CopyButton>
                    </CopyToClipboard>
                </IdentifierRow>
            )}
            {figi && (
                <IdentifierRow>
                    <IdentifierLabel>FIGI:</IdentifierLabel>
                    <IdentifierValue>{figi}</IdentifierValue>
                    <CopyToClipboard text={figi}>
                        <CopyButton>Copy</CopyButton>
                    </CopyToClipboard>
                </IdentifierRow>
            )}
            {ticker && (
                <IdentifierRow>
                    <IdentifierLabel>Ticker:</IdentifierLabel>
                    <IdentifierValue>{ticker}</IdentifierValue>
                    <CopyToClipboard text={ticker}>
                        <CopyButton>Copy</CopyButton>
                    </CopyToClipboard>
                </IdentifierRow>
            )}
        </IdentifierBlockContainer>
    );
};

export default BondIdentifierBlock;
```