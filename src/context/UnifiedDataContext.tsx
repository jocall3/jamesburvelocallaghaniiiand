import React, { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';

// --- Type Definitions based on OpenAPI Schemas ---

// Auth Types (Token Authorization API)
interface AuthTokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

// Customer Profile Types (Customers Profiles API)
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

interface CustomerProfile {
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  localName?: string;
  title?: string;
  suffix?: string;
  maidenName?: string;
  companyName?: string;
  emails?: Email[];
  addressList?: Address[];
  phones?: Phone[];
}

// Product Types (Products_Partner_View API)
interface Product {
  accountId: string;
  status: 'ACTIVE' | string;
  productName: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | string;
  accountNumberDisplay: string;
}

// Reward Types (RewardLinkageShopWithPoints_OpenAPI)
interface RewardLinkage {
  rewardLinkCode: string;
}

// --- State Structure ---

interface UnifiedState {
  auth: {
    data: AuthTokenData | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  customerProfile: {
    data: CustomerProfile | null;
    loading: boolean;
    error: string | null;
  };
  products: {
    list: Product[];
    lastUpdated: number | null;
    loading: boolean;
    error: string | null;
  };
  rewards: {
    linkage: RewardLinkage | null;
    loading: boolean;
    error: string | null;
  };
  // Identity Provider Metadata State (derived from XML config concept)
  idpConfig: {
    entityId: string;
    ssoUrl: string;
  };

  // Citibankdemobusinessinc Branches
  Citibankdemobusinessinc?: {
    viewit?: {
      movieplayform?: any;
    };
    // Add other branches here as needed
  };
}

// --- Initial State ---

const initialState: UnifiedState = {
  auth: {
    data: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  customerProfile: {
    data: null,
    loading: false,
    error: null,
  },
  products: {
    list: [],
    lastUpdated: null,
    loading: false,
    error: null,
  },
  rewards: {
    linkage: null,
    loading: false,
    error: null,
  },
  idpConfig: {
    entityId: "https://accounts.google.com/o/saml2?idpid=C01esbeng",
    ssoUrl: "https://accounts.google.com/o/saml2/idp?idpid=C01esbeng"
  },
  Citibankdemobusinessinc: {}, // Initialize the Citibankdemobusinessinc branch
};

// --- Actions ---

type Action =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthTokenData }
  | { type: 'AUTH_FAIL'; payload: string }
  | { type: 'AUTH_REVOKE' }
  | { type: 'PROFILE_FETCH_START' }
  | { type: 'PROFILE_FETCH_SUCCESS'; payload: CustomerProfile }
  | { type: 'PROFILE_FETCH_FAIL'; payload: string }
  | { type: 'PRODUCTS_FETCH_START' }
  | { type: 'PRODUCTS_FETCH_SUCCESS'; payload: Product[] }
  | { type: 'PRODUCTS_FETCH_FAIL'; payload: string }
  | { type: 'REWARD_LINK_START' }
  | { type: 'REWARD_LINK_SUCCESS'; payload: RewardLinkage }
  | { type: 'REWARD_LINK_FAIL'; payload: string }
  // Add actions for Citibankdemobusinessinc branches here
  | { type: 'CITIBANKDEMOBUSINESSINC_VIEWIT_MOVIEPLAYFORM_UPDATE'; payload: any };

// --- Reducer ---

function unifiedReducer(state: UnifiedState, action: Action): UnifiedState {
  switch (action.type) {
    // Auth
    case 'AUTH_START':
      return { ...state, auth: { ...state.auth, loading: true, error: null } };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        auth: {
          data: action.payload,
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        auth: { ...state.auth, loading: false, error: action.payload, isAuthenticated: false, data: null },
      };
    case 'AUTH_REVOKE':
      return {
        ...state,
        auth: initialState.auth,
        customerProfile: initialState.customerProfile, // Clear profile on logout
        products: initialState.products, // Clear products on logout
      };

    // Profile
    case 'PROFILE_FETCH_START':
      return { ...state, customerProfile: { ...state.customerProfile, loading: true, error: null } };
    case 'PROFILE_FETCH_SUCCESS':
      return {
        ...state,
        customerProfile: { data: action.payload, loading: false, error: null },
      };
    case 'PROFILE_FETCH_FAIL':
      return {
        ...state,
        customerProfile: { ...state.customerProfile, loading: false, error: action.payload },
      };

    // Products
    case 'PRODUCTS_FETCH_START':
      return { ...state, products: { ...state.products, loading: true, error: null } };
    case 'PRODUCTS_FETCH_SUCCESS':
      return {
        ...state,
        products: { list: action.payload, lastUpdated: Date.now(), loading: false, error: null },
      };
    case 'PRODUCTS_FETCH_FAIL':
      return {
        ...state,
        products: { ...state.products, loading: false, error: action.payload },
      };

    // Rewards
    case 'REWARD_LINK_START':
      return { ...state, rewards: { ...state.rewards, loading: true, error: null } };
    case 'REWARD_LINK_SUCCESS':
      return {
        ...state,
        rewards: { linkage: action.payload, loading: false, error: null },
      };
    case 'REWARD_LINK_FAIL':
      return {
        ...state,
        rewards: { ...state.rewards, loading: false, error: action.payload },
      };

    // Citibankdemobusinessinc Branch Reducers
    case 'CITIBANKDEMOBUSINESSINC_VIEWIT_MOVIEPLAYFORM_UPDATE':
      return {
        ...state,
        Citibankdemobusinessinc: {
          ...state.Citibankdemobusinessinc,
          viewit: {
            ...state.Citibankdemobusinessinc?.viewit,
            movieplayform: action.payload,
          },
        },
      };

    default:
      return state;
  }
}

// --- Context ---

interface UnifiedContextProps {
  state: UnifiedState;
  dispatch: Dispatch<Action>;
}

const UnifiedDataContext = createContext<UnifiedContextProps | undefined>(undefined);

// --- Provider ---

interface UnifiedDataProviderProps {
  children: ReactNode;
}

export const UnifiedDataProvider: React.FC<UnifiedDataProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(unifiedReducer, initialState);

  return (
    <UnifiedDataContext.Provider value={{ state, dispatch }}>
      {children}
    </UnifiedDataContext.Provider>
  );
};

// --- Hook ---

export const useUnifiedData = (): UnifiedContextProps => {
  const context = useContext(UnifiedDataContext);
  if (!context) {
    throw new Error('useUnifiedData must be used within a UnifiedDataProvider');
  }
  return context;
};