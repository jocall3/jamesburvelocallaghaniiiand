
import React, { createContext, useContext, ReactNode } from 'react';
import { MoneyMovementAPI } from './CitibankMoneyMovementSDK';

interface MoneyMovementContextType {
    api: MoneyMovementAPI | null;
    accessToken: string | null;
    uuid: string;
    generateNewUuid: () => void;
}

const MoneyMovementContext = createContext<MoneyMovementContextType>({
    api: null,
    accessToken: null,
    uuid: '',
    generateNewUuid: () => {},
});

export const useMoneyMovement = () => useContext(MoneyMovementContext);

// Mock provider - in real app this would wrap the app
export const MoneyMovementProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    return (
        <MoneyMovementContext.Provider value={{
            api: new MoneyMovementAPI('https://mock.api', 'client'),
            accessToken: 'mock_access_token',
            uuid: 'mock_uuid',
            generateNewUuid: () => console.log('New UUID')
        }}>
            {children}
        </MoneyMovementContext.Provider>
    );
}
