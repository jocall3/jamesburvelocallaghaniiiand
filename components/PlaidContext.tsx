
import React, { createContext, useContext } from 'react';
import { PlaidApi } from 'plaid';

interface PlaidContextType {
    plaidClient: any; // Mocking the type for simplicity
}

const PlaidContext = createContext<PlaidContextType>({
    plaidClient: {
        identityGet: async () => ({ data: { accounts: [] } }),
        identityMatch: async () => ({ data: { accounts: [] } })
    }
});

export const usePlaid = () => useContext(PlaidContext);
