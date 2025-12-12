import { useState } from 'react';

export const usePlaidClient = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [data, setData] = useState<any>({ apiVersion: '2020-09-14' });

    const fetchItemGet = async (args?: any) => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = { item: { id: 'item_123', institution_id: 'inst_456', access_token: 'access_token_abc' } };
            setData(mockData);
            return mockData;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConsentEventsGet = async (args?: any) => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = { consent_events: [{ id: 'consent_event_1', type: 'GRANT', timestamp: new Date().toISOString() }] };
            setData(mockData);
            return mockData;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchItemActivityList = async (args?: any) => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = { activities: [{ id: 'activity_1', type: 'LOGIN', timestamp: new Date().toISOString() }] };
            setData(mockData);
            return mockData;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        data,
        fetchItemGet,
        fetchConsentEventsGet,
        fetchItemActivityList,
    };
};