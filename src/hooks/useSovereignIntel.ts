import { useState, useEffect, useCallback } from 'react';
import { getCustomerProfile, getCustomerProducts, getAccountDetails } from '../api/sovereignApi';
import {
  CustomerProfileResponse,
  Product,
  ProductResponse,
  AccountDetailsResponse,
  SovereignData,
  ApiError,
} from '../types/sovereignTypes';

// Mock API functions for demonstration, replace with actual imports if available
// Mock implementations to satisfy TypeScript unless real API calls are provided
const mockGetCustomerProfile = async (): Promise<CustomerProfileResponse> => {
  // Simulate API call delay and response
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    fullName: 'Jane Doe',
    emails: [{ emailAddress: 'jane.doe@example.com', preferenceType: 'PRIMARY' }],
    addressList: [{ countryCode: 'US', postalCode: '10001', addressLine1: '123 Main St' }],
    phones: [{ phoneType: 'CELL', preferenceType: 'PRIMARY', fullPhoneNumber: '5551234567' }],
  } as CustomerProfileResponse;
};

const mockGetCustomerProducts = async (accountId: string): Promise<ProductResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (accountId === 'prod_error') {
    throw new Error('Product fetch failed for account');
  }
  return {
    customerId: 'cust123',
    products: [
      {
        accountId: 'acc1',
        status: 'ACTIVE',
        productName: 'Rewards Card',
        accountType: 'CREDIT_CARD',
        accountNumberDisplay: 'XXXXXXXXXXXX1234',
      },
      {
        accountId: 'acc2',
        status: 'ACTIVE',
        productName: 'Checking',
        accountType: 'CHECKING',
        accountNumberDisplay: 'XXXXX5678',
      },
    ],
  } as ProductResponse;
};

const mockGetAccountDetails = async (accountId: string): Promise<AccountDetailsResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (accountId === 'details_error') {
    throw new Error('Account details fetch failed');
  }
  return {
    accountId: accountId,
    availableBalance: 1500.50,
    currency: 'USD',
  } as AccountDetailsResponse;
};

// Re-map actual or mock API functions to local names for hook clarity
const apiGetCustomerProfile = mockGetCustomerProfile;
const apiGetCustomerProducts = mockGetCustomerProducts;
const apiGetAccountDetails = mockGetAccountDetails;


/**
 * Hook that aggregates state data from various customer APIs and feeds it to the 
 * AI engine for real-time analysis.
 * 
 * @param activeAccountId The ID of the account currently selected for detailed analysis.
 * @param headers Authentication headers required for API calls (e.g., Authorization, client_id)
 * @returns An object containing the aggregated data, loading state, and any errors.
 */
export const useSovereignIntel = (
  activeAccountId: string | null,
  headers: { Authorization: string; 'client_id': string }
) => {
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeAccountDetails, setActiveAccountDetails] = useState<AccountDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Aggregated data structure for the AI engine
  const sovereignData: SovereignData | null = profile ? {
    profile,
    products,
    activeAccountDetails,
  } : null;

  // Effect to fetch all necessary initial data when component mounts or headers change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Customer Profile (assuming this is static per user session)
        const profileData = await apiGetCustomerProfile();
        setProfile(profileData);

        // 2. Fetch All Products (assuming this requires headers)
        // Note: The Products API seems to require accountId in the path, but the 
        // provided OpenAPI spec for /products GET doesn't show an accountId path parameter.
        // We'll use a dummy fetch based on the structure, assuming we fetch all products 
        // linked to the customer derived from the authorization context, or we iterate if needed.
        // For this example, we'll call a dummy /products endpoint which might fetch all for the customer.
        // If the actual Products API requires a customer ID derived from the profile, we'd use that.
        // Since the mock implementation for products doesn't use headers, we'll simplify here.
        const dummyCustomerIdForProducts = 'some_derived_customer_id'; // Placeholder
        const productsData = await apiGetCustomerProducts(dummyCustomerIdForProducts); 
        setProducts(productsData.products);

      } catch (err: any) {
        console.error("Error fetching initial sovereign data:", err);
        setError({
          type: 'fatal',
          code: 'INIT_FETCH_ERROR',
          details: err.message || 'Unknown error during initial data fetch.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (headers.Authorization && headers['client_id']) {
      fetchData();
    }
  }, [headers.Authorization, headers['client_id']]);


  // Effect to fetch active account details when activeAccountId changes
  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!activeAccountId) {
        setActiveAccountDetails(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Account details fetch requires headers/context which should be passed
        const details = await apiGetAccountDetails(activeAccountId);
        setActiveAccountDetails(details);
      } catch (err: any) {
        console.error(`Error fetching details for account ${activeAccountId}:`, err);
        setError({
          type: 'error',
          code: 'DETAIL_FETCH_ERROR',
          details: err.message || `Failed to load details for account ${activeAccountId}.`,
        });
        setActiveAccountDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [activeAccountId]);

  const refreshSovereignData = useCallback(async () => {
    // Re-run the initial data fetch logic without resetting loading state if already loading
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
        // Re-fetch Profile and Products if necessary for a full refresh
        const profileData = await apiGetCustomerProfile();
        setProfile(profileData);
        const dummyCustomerIdForProducts = 'some_derived_customer_id_refresh';
        const productsData = await apiGetCustomerProducts(dummyCustomerIdForProducts);
        setProducts(productsData.products);

        // Re-fetch active account details if an account is selected
        if (activeAccountId) {
            const details = await apiGetAccountDetails(activeAccountId);
            setActiveAccountDetails(details);
        } else {
            setActiveAccountDetails(null);
        }

    } catch (err: any) {
        console.error("Error during sovereign data refresh:", err);
        setError({
            type: 'fatal',
            code: 'REFRESH_ERROR',
            details: err.message || 'Unknown error during data refresh.',
        });
    } finally {
        setLoading(false);
    }
  }, [activeAccountId, loading]);

  return {
    sovereignData,
    loading,
    error,
    refreshSovereignData,
  };
};
