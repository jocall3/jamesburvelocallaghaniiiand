import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * @interface User
 * @description Defines the structure for a user's profile information and settings.
 * Includes fields relevant for a Stripe-integrated application.
 */
interface User {
  id: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  // ID of the user's customer object in Stripe, if they are a customer of our app.
  stripeCustomerId: string | null;
  // ID of the user's connected Stripe account, if they are a merchant/platform user.
  stripeAccountId: string | null;
  settings: {
    darkMode: boolean;
    notificationsEnabled: boolean;
    // Add other user-specific settings here as needed
    [key: string]: any; // Allow for flexible settings
  };
  // Any other relevant user profile fields
  [key: string]: any;
}

/**
 * @interface UserState
 * @description Defines the structure for the user slice's state.
 */
interface UserState {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * @constant initialState
 * @description The initial state for the user slice.
 */
const initialState: UserState = {
  user: {
    id: null,
    email: null,
    name: null,
    avatarUrl: null,
    stripeCustomerId: null,
    stripeAccountId: null,
    settings: {
      darkMode: false,
      notificationsEnabled: true,
    },
  },
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * @slice userSlice
 * @description A Redux Toolkit slice for managing user authentication, profile, and settings.
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * Sets the loading state.
     * @param {PayloadAction<boolean>} action - The boolean value to set `isLoading`.
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Sets an error message.
     * @param {PayloadAction<string | null>} action - The error message string or null to clear.
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false; // If an error occurs, loading should stop.
    },

    /**
     * Clears any existing error message.
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Handles successful user login. Sets user data and authentication status.
     * @param {PayloadAction<User>} action - The full user object received upon successful login.
     */
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Logs out the user. Resets user data and authentication status to initial state.
     */
    logout: (state) => {
      state.user = initialState.user; // Reset user data to default
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Updates specific fields of the user's profile.
     * @param {PayloadAction<Partial<Omit<User, 'settings'>>>} action - An object with partial user profile data to update.
     */
    updateProfile: (state, action: PayloadAction<Partial<Omit<User, 'settings'>>>) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },

    /**
     * Updates specific user settings.
     * @param {PayloadAction<Partial<User['settings']>>} action - An object with partial user settings to update.
     */
    updateSettings: (state, action: PayloadAction<Partial<User['settings']>>) => {
      state.user.settings = {
        ...state.user.settings,
        ...action.payload,
      };
    },

    /**
     * Sets the entire user object. Useful for initial data load or full profile refresh.
     * @param {PayloadAction<User>} action - The complete user object.
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload.id; // Assume authenticated if user ID exists
      state.isLoading = false;
      state.error = null;
    },
  },
});

// Export actions for use in components and thunks
export const {
  setLoading,
  setError,
  clearError,
  loginSuccess,
  logout,
  updateProfile,
  updateSettings,
  setUser,
} = userSlice.actions;

// Export the reducer to be combined with other reducers in the store
export default userSlice.reducer;

// --- Selectors ---
// These functions allow components to easily select specific pieces of state.
// They help encapsulate the state shape and make components more robust to state changes.

/**
 * Selects the entire user object from the state.
 * @param {object} state - The root Redux state.
 * @returns {User} The user object.
 */
export const selectUser = (state: { user: UserState }) => state.user.user;

/**
 * Selects the authentication status from the state.
 * @param {object} state - The root Redux state.
 * @returns {boolean} True if the user is authenticated, false otherwise.
 */
export const selectIsAuthenticated = (state: { user: UserState }) => state.user.isAuthenticated;

/**
 * Selects the loading status from the state.
 * @param {object} state - The root Redux state.
 * @returns {boolean} True if an async operation is in progress, false otherwise.
 */
export const selectIsLoading = (state: { user: UserState }) => state.user.isLoading;

/**
 * Selects the current error message from the state.
 * @param {object} state - The root Redux state.
 * @returns {string | null} The error message or null if no error.
 */
export const selectError = (state: { user: UserState }) => state.user.error;

/**
 * Selects the user's settings object from the state.
 * @param {object} state - The root Redux state.
 * @returns {User['settings']} The user's settings object.
 */
export const selectUserSettings = (state: { user: UserState }) => state.user.user.settings;

/**
 * Selects the user's Stripe Customer ID from the state.
 * @param {object} state - The root Redux state.
 * @returns {string | null} The Stripe Customer ID or null.
 */
export const selectStripeCustomerId = (state: { user: UserState }) => state.user.user.stripeCustomerId;

/**
 * Selects the user's Stripe Account ID (for merchants) from the state.
 * @param {object} state - The root Redux state.
 * @returns {string | null} The Stripe Account ID or null.
 */
export const selectStripeAccountId = (state: { user: UserState }) => state.user.user.stripeAccountId;