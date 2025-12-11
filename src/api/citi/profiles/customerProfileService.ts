interface Email {
  emailAddress: string;
  preferenceType: 'PRIMARY' | 'SECONDARY';
}

interface Address {
  addressId?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressType?: string;
  city?: string;
  countryCode: string;
  postalCode: string;
  state?: string;
}

interface Phone {
  areaCode?: string;
  countryCallingCode?: string;
  exchangeNumber?: string;
  extension?: string;
  fullPhoneNumber?: string;
  localNumber?: string;
  phoneType: 'HOME' | 'BUSINESS' | 'CELL' | 'MOBILE';
  preferenceType: 'PRIMARY' | 'SECONDARY';
}

export interface CustomerProfileResponse {
  fullName?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  localName?: string;
  title?: string;
  suffix?: string;
  maidenName?: string;
  companyName?: string;
  emails?: Email[];
  addressList?: Address[];
  phones?: Phone[];
}

export interface ErrorResponse {
  error?: string;
  error_description?: string;
  type: string;
  code: string;
  details?: string;
}

export interface BadResponse extends ErrorResponse {}
export interface UnAuthorizedCredentialResponse extends ErrorResponse {}
export interface ForbiddenResponse extends ErrorResponse {}
export interface NotFoundResponse extends ErrorResponse {}
export interface ServerErrorResponse extends ErrorResponse {}

export type CustomerProfileApiError =
  | { status: 400; body: BadResponse }
  | { status: 401; body: UnAuthorizedCredentialResponse }
  | { status: 403; body: ForbiddenResponse }
  | { status: 404; body: NotFoundResponse }
  | { status: 500; body: ServerErrorResponse }
  | { status: number; body: ErrorResponse }; // Catch-all for other error statuses

export interface CustomerProfileRequestHeaders {
  Authorization: string; // Bearer + {space} + {accessToken}
  uuid: string; // 128 bit random UUID
  Accept: string; // e.g., "application/json"
  client_id: string; // Client ID
  countryCode: string; // Two character ISO format Country Code
}

/**
 * Fetches customer profile details for a specific account.
 * @param accountId The ID of the account.
 * @param headers Request headers including Authorization, uuid, Accept, client_id, and countryCode.
 * @returns A promise that resolves to CustomerProfileResponse on success.
 * @throws CustomerProfileApiError for API-specific errors, or a generic Error for network/parsing issues.
 */
export async function getCustomerProfileDetails(
  accountId: string,
  headers: CustomerProfileRequestHeaders
): Promise<CustomerProfileResponse> {
  const baseUrl = 'http://localhost:3000/api/custmgmt/profiles/v1'; // Assuming a local proxy or service gateway handles the /api prefix
  const url = `${baseUrl}/accounts/${accountId}/details`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json', // Though not explicitly required for GET, good practice
      ...headers,
    },
  });

  if (!response.ok) {
    const errorBody: ErrorResponse = await response.json();
    switch (response.status) {
      case 400:
        throw { status: 400, body: errorBody as BadResponse } as CustomerProfileApiError;
      case 401:
        throw { status: 401, body: errorBody as UnAuthorizedCredentialResponse } as CustomerProfileApiError;
      case 403:
        throw { status: 403, body: errorBody as ForbiddenResponse } as CustomerProfileApiError;
      case 404:
        throw { status: 404, body: errorBody as NotFoundResponse } as CustomerProfileApiError;
      case 500:
        throw { status: 500, body: errorBody as ServerErrorResponse } as CustomerProfileApiError;
      default:
        throw { status: response.status, body: errorBody } as CustomerProfileApiError;
    }
  }

  return response.json() as Promise<CustomerProfileResponse>;
}