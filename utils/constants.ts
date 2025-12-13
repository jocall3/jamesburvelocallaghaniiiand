export const APP_NAME = "SubscriptionApp";
export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
};

export const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "";
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
  SOMETHING_WENT_WRONG: "An unexpected error occurred. Please try again later.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  SUBSCRIPTION_ALREADY_EXISTS: "You already have an active subscription.",
  PAYMENT_FAILED: "Payment failed. Please check your details and try again.",
};

export const SUCCESS_MESSAGES = {
  SUBSCRIPTION_CREATED: "Your subscription has been created successfully!",
  SUBSCRIPTION_UPDATED: "Your subscription has been updated successfully!",
  SUBSCRIPTION_CANCELLED: "Your subscription has been cancelled successfully.",
};

export const COOKIE_NAMES = {
  AUTH_TOKEN: "authToken",
  USER_PREFERENCES: "userPreferences",
};

export const LOCAL_STORAGE_KEYS = {
  LAST_VISITED_APP: "lastVisitedApp",
};

export const ROUTE_PATHS = {
  HOME: "/",
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  DASHBOARD: "/dashboard",
  SETTINGS: "/settings",
  SUBSCRIPTIONS: "/subscriptions",
  APPS: "/apps",
  APP_DETAIL: (appId: string) => `/apps/${appId}`,
  CHECKOUT_SUCCESS: "/checkout/success",
  CHECKOUT_CANCEL: "/checkout/cancel",
};

export const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const REFETCH_INTERVAL_MS = 60000; // 1 minute

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;

export const FEATURE_FLAGS = {
  NEW_DASHBOARD_UI: process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_DASHBOARD_UI === "true",
  ENABLE_EMAIL_VERIFICATION: process.env.NEXT_PUBLIC_FEATURE_FLAG_ENABLE_EMAIL_VERIFICATION === "true",
};

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP"];
export const DEFAULT_CURRENCY = "USD";

export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

export const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const PAGINATION_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGINATION_SIZE = 20;

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export const DEFAULT_THEME_MODE = THEME_MODES.SYSTEM;

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh-token",
    ME: "/auth/me",
  },
  USERS: {
    GET_BY_ID: (userId: string) => `/users/${userId}`,
    UPDATE_PROFILE: "/users/profile",
  },
  SUBSCRIPTIONS: {
    GET_ALL: "/subscriptions",
    GET_BY_ID: (subId: string) => `/subscriptions/${subId}`,
    CREATE: "/subscriptions/create",
    CANCEL: (subId: string) => `/subscriptions/${subId}/cancel`,
    UPDATE: (subId: string) => `/subscriptions/${subId}/update`,
    WEBHOOK: "/subscriptions/webhook",
  },
  APPS: {
    GET_ALL: "/apps",
    GET_BY_ID: (appId: string) => `/apps/${appId}`,
    CREATE: "/apps",
    UPDATE: (appId: string) => `/apps/${appId}`,
    DELETE: (appId: string) => `/apps/${appId}`,
    FEATURED: "/apps/featured",
  },
  PAYMENTS: {
    CREATE_CHECKOUT_SESSION: "/payments/create-checkout-session",
    GET_PAYMENT_STATUS: (paymentId: string) => `/payments/${paymentId}/status`,
  },
  ANALYTICS: {
    OVERVIEW: "/analytics/overview",
    APP_USAGE: (appId: string) => `/analytics/apps/${appId}/usage`,
  },
};