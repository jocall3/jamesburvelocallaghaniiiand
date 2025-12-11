```typescript
import { useState, useEffect } from 'react';
import {
    GetLibraryAnalyticsComponentActionsResponse,
    GetLibraryAnalyticsComponentUsagesResponse,
    GetLibraryAnalyticsStyleActionsResponse,
    GetLibraryAnalyticsStyleUsagesResponse,
    GetLibraryAnalyticsVariableActionsResponse,
    GetLibraryAnalyticsVariableUsagesResponse,
} from '../../types/api';

const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';

interface UseLibraryAnalyticsProps {
    fileKey: string;
    accessToken: string;
}

interface LibraryAnalyticsHookResult {
    componentActions: GetLibraryAnalyticsComponentActionsResponse | null;
    componentUsages: GetLibraryAnalyticsComponentUsagesResponse | null;
    styleActions: GetLibraryAnalyticsStyleActionsResponse | null;
    styleUsages: GetLibraryAnalyticsStyleUsagesResponse | null;
    variableActions: GetLibraryAnalyticsVariableActionsResponse | null;
    variableUsages: GetLibraryAnalyticsVariableUsagesResponse | null;
    isLoading: boolean;
    error: string | null;
    fetchData: () => Promise<void>;
}

const useLibraryAnalytics = ({ fileKey, accessToken }: UseLibraryAnalyticsProps): LibraryAnalyticsHookResult => {
    const [componentActions, setComponentActions] = useState<GetLibraryAnalyticsComponentActionsResponse | null>(null);
    const [componentUsages, setComponentUsages] = useState<GetLibraryAnalyticsComponentUsagesResponse | null>(null);
    const [styleActions, setStyleActions] = useState<GetLibraryAnalyticsStyleActionsResponse | null>(null);
    const [styleUsages, setStyleUsages] = useState<GetLibraryAnalyticsStyleUsagesResponse | null>(null);
    const [variableActions, setVariableActions] = useState<GetLibraryAnalyticsVariableActionsResponse | null>(null);
    const [variableUsages, setVariableUsages] = useState<GetLibraryAnalyticsVariableUsagesResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const headers = {
                'X-Figma-Token': accessToken,
            };

            const componentActionsUrl = `${FIGMA_API_BASE_URL}/analytics/libraries/${fileKey}/component/actions?group_by=component`;
            const componentUsagesUrl = `${FIGMA_API_BASE_URL}/analytics/libraries/${fileKey}/component/usages?group_by=component`;
            const styleActionsUrl = `${FIGMA_API_BASE_URL}/analytics/libraries/${fileKey}/style/actions?group_by=style`;
            const styleUsagesUrl = `${FIGMA_API_BASE_URL}/analytics/libraries/${fileKey}/style/usages?group_by=style`;
            const variableActionsUrl = `${FIGMA_API_BASE_URL}/analytics/libraries/${fileKey}/variable/actions?group_by=variable`;
            const variableUsagesUrl = `${FIGMA_API_BASE_URL}/analytics/libraries/${fileKey}/variable/usages?group_by=variable`;

            const [
                componentActionsResponse,
                componentUsagesResponse,
                styleActionsResponse,
                styleUsagesResponse,
                variableActionsResponse,
                variableUsagesResponse,
            ] = await Promise.all([
                fetch(componentActionsUrl, { headers }).then(res => res.json()),
                fetch(componentUsagesUrl, { headers }).then(res => res.json()),
                fetch(styleActionsUrl, { headers }).then(res => res.json()),
                fetch(styleUsagesUrl, { headers }).then(res => res.json()),
                fetch(variableActionsUrl, { headers }).then(res => res.json()),
                fetch(variableUsagesUrl, { headers }).then(res => res.json()),
            ]);

            setComponentActions(componentActionsResponse as GetLibraryAnalyticsComponentActionsResponse);
            setComponentUsages(componentUsagesResponse as GetLibraryAnalyticsComponentUsagesResponse);
            setStyleActions(styleActionsResponse as GetLibraryAnalyticsStyleActionsResponse);
            setStyleUsages(styleUsagesResponse as GetLibraryAnalyticsStyleUsagesResponse);
            setVariableActions(variableActionsResponse as GetLibraryAnalyticsVariableActionsResponse);
            setVariableUsages(variableUsagesResponse as GetLibraryAnalyticsVariableUsagesResponse);


        } catch (err: any) {
            setError(err.message || 'Failed to fetch library analytics data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (fileKey && accessToken) {
            fetchData();
        }
    }, [fileKey, accessToken]);

    return {
        componentActions,
        componentUsages,
        styleActions,
        styleUsages,
        variableActions,
        variableUsages,
        isLoading,
        error,
        fetchData
    };
};

export default useLibraryAnalytics;
```