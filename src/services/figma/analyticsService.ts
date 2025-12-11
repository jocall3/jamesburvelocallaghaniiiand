```ts
import { FIGMA_API_BASE_URL } from "../../constants";

export class AnalyticsService {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async makeRequest<T>(
        endpoint: string,
        params?: { [key: string]: string | number | boolean }
    ): Promise<T> {
        const url = new URL(`${FIGMA_API_BASE_URL}${endpoint}`);
        if (params) {
            Object.keys(params).forEach((key) =>
                url.searchParams.append(key, String(params[key]))
            );
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "X-Figma-Token": this.accessToken,
            },
        });

        if (!response.ok) {
            throw new Error(
                `Figma API request failed with status ${response.status}`
            );
        }

        const data = await response.json();
        return data as T;
    }

    async getLibraryAnalyticsComponentActions<T>(
        fileKey: string,
        groupBy: string,
        startDate?: string,
        endDate?: string,
        cursor?: string
    ): Promise<T> {
        return this.makeRequest<T>(`/v1/analytics/libraries/${fileKey}/component/actions`, {
            group_by: groupBy,
            start_date: startDate,
            end_date: endDate,
            cursor: cursor,
        });
    }

    async getLibraryAnalyticsComponentUsages<T>(
        fileKey: string,
        groupBy: string,
    ): Promise<T> {
        return this.makeRequest<T>(`/v1/analytics/libraries/${fileKey}/component/usages`, {
            group_by: groupBy,
        });
    }

    async getLibraryAnalyticsStyleActions<T>(
        fileKey: string,
        groupBy: string,
        startDate?: string,
        endDate?: string,
        cursor?: string
    ): Promise<T> {
        return this.makeRequest<T>(`/v1/analytics/libraries/${fileKey}/style/actions`, {
            group_by: groupBy,
            start_date: startDate,
            end_date: endDate,
            cursor: cursor,
        });
    }

    async getLibraryAnalyticsStyleUsages<T>(
        fileKey: string,
        groupBy: string,
    ): Promise<T> {
        return this.makeRequest<T>(`/v1/analytics/libraries/${fileKey}/style/usages`, {
            group_by: groupBy,
        });
    }

    async getLibraryAnalyticsVariableActions<T>(
        fileKey: string,
        groupBy: string,
        startDate?: string,
        endDate?: string,
        cursor?: string
    ): Promise<T> {
        return this.makeRequest<T>(`/v1/analytics/libraries/${fileKey}/variable/actions`, {
            group_by: groupBy,
            start_date: startDate,
            end_date: endDate,
            cursor: cursor,
        });
    }

    async getLibraryAnalyticsVariableUsages<T>(
        fileKey: string,
        groupBy: string,
    ): Promise<T> {
        return this.makeRequest<T>(`/v1/analytics/libraries/${fileKey}/variable/usages`, {
            group_by: groupBy,
        });
    }
}
```