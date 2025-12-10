import { useContext } from 'react';
import { SettingsContext, SettingsContextType } from '../context/SettingsContext'; // Adjust path as necessary

/**
 * A custom React hook for accessing and updating user or application settings
 * from the SettingsContext.
 *
 * This hook provides direct access to the current application settings and
 * a function to update them. It ensures that the component using it is
 * wrapped within a `SettingsProvider`.
 *
 * @returns An object containing:
 *   - `settings`: The current application settings object.
 *   - `updateSettings`: A function to update a subset of the application settings.
 * @throws {Error} If `useSettings` is called outside of a `SettingsProvider`.
 *
 * @example
 * ```tsx
 * import useSettings from '../hooks/useSettings';
 *
 * function MyComponent() {
 *   const { settings, updateSettings } = useSettings();
 *
 *   const toggleTheme = () => {
 *     updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
 *   };
 *
 *   return (
 *     <div>
 *       <p>Current Theme: {settings.theme}</p>
 *       <button onClick={toggleTheme}>Toggle Theme</button>
 *     </div>
 *   );
 * }
 * ```
 */
const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};

export default useSettings;