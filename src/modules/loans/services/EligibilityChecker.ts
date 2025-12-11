import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
    BalanceTransferEligibilityResponse,
    BalanceTransferEligibilityDetails,
    ErrorResponse
} from '../models/BalanceTransferEligibility';
import { ServiceError } from '../../../common/errors/ServiceError';

/**
 * Configuration structure for the EligibilityChecker.
 */
interface EligibilityCheckerConfig {
    baseUrl: string;
    clientId: string;
}

/**
 * Service dedicated to querying the balance transfer eligibility API to find actionable offers.
 */
export class EligibilityChecker {
    private readonly http: AxiosInstance;
    private readonly config: EligibilityCheckerConfig;

    constructor(config: EligibilityCheckerConfig) {
        this.config = config;
        this.http = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'client_id': config.clientId,
            },
        });
    }

    /**
     * Generates a UUID for request headers.
     * Note: In a real application, this should use a reliable UUID library.
     * @returns A 128 bit random UUID string.
     */
    private generateUuid(): string {
        // Simple implementation for demonstration. Use 'uuid' package in production.
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Checks the balance transfer eligibility for a customer.
     * @param accessToken The authorization token (Bearer {token}).
     * @param btSupportedAccountGroup Optional query parameter for specific account groups.
     * @returns A promise resolving to an array of BalanceTransferEligibilityDetails.
     * @throws ServiceError if the API returns an error response (4xx, 5xx).
     */
    public async checkEligibility(
        accessToken: string,
        btSupportedAccountGroup?: string
    ): Promise<BalanceTransferEligibilityDetails[]> {
        const headers = {
            'Authorization': accessToken,
            'uuid': this.generateUuid(),
            'Accept': 'application/json',
        };

        const params = btSupportedAccountGroup ? { btSupportedAccountGroup } : {};

        try {
            const response: AxiosResponse<BalanceTransferEligibilityResponse> = await this.http.get('/', {
                headers,
                params,
            });

            if (response.status === 204) {
                // No Content, return empty array
                return [];
            }

            return response.data.balanceTransferEligibilityDetails || [];
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data as ErrorResponse;
                const statusCode = error.response.status;

                let errorMessage = `API Error: ${statusCode}`;

                if (responseData && responseData.type && responseData.code) {
                    errorMessage = `${responseData.type} Error (${responseData.code}): ${responseData.details || responseData.error_description || 'Unknown API Error'}`;
                } else {
                    errorMessage = `API Error (${statusCode}): ${error.response.statusText}`;
                }
                
                throw new ServiceError(errorMessage, statusCode, responseData);
            }
            throw new ServiceError('Network or unexpected error occurred during eligibility check.', 500, { details: (error as Error).message });
        }
    }
}
