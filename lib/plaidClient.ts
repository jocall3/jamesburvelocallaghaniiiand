
// Mock implementation without 'plaid' package dependency

export enum Products {
    Assets = 'assets',
    Auth = 'auth',
    Balance = 'balance',
    Identity = 'identity',
    Investments = 'investments',
    Liabilities = 'liabilities',
    PaymentInitiation = 'payment_initiation',
    Transactions = 'transactions',
}

export enum CountryCode {
    Us = 'US',
    Gb = 'GB',
    Es = 'ES',
    Nl = 'NL',
    Fr = 'FR',
    Ie = 'IE',
    Ca = 'CA',
    De = 'DE',
    It = 'IT',
}

export interface Institution {
    institution_id: string;
    name: string;
    products: Products[];
    country_codes: CountryCode[];
    url?: string | null;
    primary_color?: string | null;
    logo?: string | null;
    routing_numbers?: string[] | null;
    oauth?: boolean;
}

export interface InstitutionsSearchRequest {
    query: string;
    products?: Products[] | null;
    country_codes: CountryCode[];
    options?: any;
}

export interface InstitutionsSearchResponse {
    institutions: Institution[];
    request_id: string;
    total: number;
}

export interface InstitutionsGetByIdRequest {
    institution_id: string;
    country_codes: CountryCode[];
    options?: any;
}

export interface InstitutionsGetByIdResponse {
    institution: Institution;
    request_id: string;
}

export class PlaidClient {
    async institutionsSearch(request: InstitutionsSearchRequest): Promise<InstitutionsSearchResponse> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockInstitutions: Institution[] = [
            {
                institution_id: 'ins_1',
                name: 'Bank of America',
                products: [Products.Auth, Products.Transactions],
                country_codes: [CountryCode.Us],
                routing_numbers: [],
                oauth: true,
            },
            {
                institution_id: 'ins_2',
                name: 'Chase',
                products: [Products.Auth, Products.Transactions, Products.Identity],
                country_codes: [CountryCode.Us],
                routing_numbers: [],
                oauth: true,
            },
             {
                institution_id: 'ins_3',
                name: 'Wells Fargo',
                products: [Products.Auth, Products.Transactions],
                country_codes: [CountryCode.Us],
                routing_numbers: [],
                oauth: false,
            }
        ].filter(inst => inst.name.toLowerCase().includes(request.query.toLowerCase()));

        return {
            institutions: mockInstitutions,
            request_id: 'mock_req_id',
            total: mockInstitutions.length,
        };
    }

    async institutionsGetById(request: InstitutionsGetByIdRequest): Promise<InstitutionsGetByIdResponse> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            institution: {
                institution_id: request.institution_id,
                name: request.institution_id === 'ins_1' ? 'Bank of America' : 'Mock Bank',
                products: [Products.Auth],
                country_codes: [CountryCode.Us],
                routing_numbers: ['123456789'],
                oauth: true,
                url: 'https://www.bankofamerica.com',
                primary_color: '#ff0000',
                logo: null,
            },
            request_id: 'mock_req_id',
        };
    }
}
