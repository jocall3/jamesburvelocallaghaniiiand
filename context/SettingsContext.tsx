import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// 1. Define the interface for the application settings state
interface AppSettings {
  theme: 'light' | 'dark';
  integrationsEnabled: boolean;
  googleApiKey: string | null;
  microsoftClientId: string | null;
  appleDeveloperId: string | null;
  // Add more application-wide settings here as needed
  // e.g., language, notification preferences, feature flags
}

// 2. Define the interface for the context value, including state and actions
interface SettingsContextType {
  settings: AppSettings;
  setTheme: (theme: 'light' | 'dark') => void;
  setIntegrationsEnabled: (enabled: boolean) => void;
  setGoogleApiKey: (key: string | null) => void;
  setMicrosoftClientId: (id: string | null) => void;
  setAppleDeveloperId: (id: string | null) => void;
  // A generic update function for flexibility
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Initial default settings for the application
const defaultSettings: AppSettings = {
  theme: 'light',
  integrationsEnabled: true,
  googleApiKey: null,
  microsoftClientId: null,
  appleDeveloperId: null,
};

// 3. Create the React Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 4. Define the props for the SettingsProvider component
interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * SettingsProvider component
 * Manages and provides application-wide settings to its children.
 * It uses React's useState hook to manage the settings state and
 * useCallback to memoize the setter functions for performance.
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Memoized setter for the theme setting
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  // Memoized setter for the integrationsEnabled setting
  const setIntegrationsEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, integrationsEnabled: enabled }));
  }, []);

  // Memoized setter for the Google API Key
  const setGoogleApiKey = useCallback((key: string | null) => {
    setSettings(prev => ({ ...prev, googleApiKey: key }));
  }, []);

  // Memoized setter for the Microsoft Client ID
  const setMicrosoftClientId = useCallback((id: string | null) => {
    setSettings(prev => ({ ...prev, microsoftClientId: id }));
  }, []);

  // Memoized setter for the Apple Developer ID
  const setAppleDeveloperId = useCallback((id: string | null) => {
    setSettings(prev => ({ ...prev, appleDeveloperId: id }));
  }, []);

  // Generic update function for any setting key
  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // The value provided to the context consumers
  const contextValue = {
    settings,
    setTheme,
    setIntegrationsEnabled,
    setGoogleApiKey,
    setMicrosoftClientId,
    setAppleDeveloperId,
    updateSetting,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Custom hook to consume the SettingsContext.
 * Provides convenient access to application settings and their setters.
 * Throws an error if used outside of a SettingsProvider.
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};