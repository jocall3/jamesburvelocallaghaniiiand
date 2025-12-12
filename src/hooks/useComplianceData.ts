import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

/**
 * Custom hook to access compliance and licensing data from the global DataContext.
 * This hook ensures that the component using it is wrapped within a DataProvider.
 * 
 * @returns The context value containing licenses, user data, and other global state.
 * @throws Error if used outside of a DataProvider.
 */
export const useComplianceData = () => {
    const context = useContext(DataContext);

    if (!context) {
        throw new Error("useComplianceData must be used within a DataProvider");
    }

    return context;
};