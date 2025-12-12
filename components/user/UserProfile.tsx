import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';

// Define interfaces for profile data
interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  profilePictureUrl: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
}

interface UserAccountDetails {
  lastPasswordChange: string; // ISO date string
  twoFactorEnabled: boolean;
}

type ActiveTab = 'profile' | 'preferences' | 'account';

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [account, setAccount] = useState<UserAccountDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Internal Data Generation Functions ---
  const generateUserId = () => `user-${Math.random().toString(36).substr(2, 9)}`;
  const generateRandomName = (type: 'first' | 'last') => {
    const names = type === 'first' ? ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan'] : ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown'];
    return names[Math.floor(Math.random() * names.length)];
  };
  const generateRandomEmail = (firstName: string, lastName: string) => `${firstName.toLowerCase()}.${lastName.toLowerCase()}@citibankdemobusinessinc.com`;
  const generateRandomBio = () => {
    const bios = [
      'Innovating the future of finance.',
      'Passionate about customer-centric solutions.',
      'Driving digital transformation in banking.',
      'Dedicated to empowering financial well-being.',
      'Building secure and accessible financial tools.'
    ];
    return bios[Math.floor(Math.random() * bios.length)];
  };
  const generateProfilePictureUrl = (seed: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
  const generateRandomTheme = () => {
    const themes: UserPreferences['theme'][] = ['light', 'dark', 'system'];
    return themes[Math.floor(Math.random() * themes.length)];
  };
  const generateRandomBoolean = () => Math.random() > 0.5;
  const generateRandomLanguage = () => {
    const languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN'];
    return languages[Math.floor(Math.random() * languages.length)];
  };
  const generateLastPasswordChange = () => new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString();

  // Simulate fetching user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Use internal generative functions
        const userId = generateUserId();
        const firstName = generateRandomName('first');
        const lastName = generateRandomName('last');
        const mockProfile: UserProfileData = {
          id: userId,
          firstName: firstName,
          lastName: lastName,
          email: generateRandomEmail(firstName, lastName),
          bio: generateRandomBio(),
          profilePictureUrl: generateProfilePictureUrl(firstName.charAt(0) + lastName.charAt(0)),
        };

        const mockPreferences: UserPreferences = {
          theme: generateRandomTheme(),
          emailNotifications: generateRandomBoolean(),
          pushNotifications: generateRandomBoolean(),
          language: generateRandomLanguage(),
        };

        const mockAccount: UserAccountDetails = {
          lastPasswordChange: generateLastPasswordChange(),
          twoFactorEnabled: generateRandomBoolean(),
        };

        setProfile(mockProfile);
        setPreferences(mockPreferences);
        setAccount(mockAccount);
      } catch (err) {
        setError('Failed to load user data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleProfileChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  }, []);

  const handlePreferencesChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setPreferences(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null);
  }, []);

  const handleAccountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAccount(prev => prev ? { ...prev, [name]: checked } : null);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent, section: ActiveTab) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, you would send the data to your backend
      console.log(`Saving ${section} data:`, { profile, preferences, account });

      setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError(`Failed to save ${section} data. Please try again.`);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [profile, preferences, account]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) { // Only show global error if no profile data was loaded at all
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">User Profile</h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md dark:bg-green-800 dark:border-green-700 dark:text-green-100">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-800 dark:border-red-700 dark:text-red-100">
          {error}
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'account'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
            }`}
          >
            Account Details
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'profile' && profile && (
          <form onSubmit={(e) => handleSubmit(e, 'profile')} className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                src={profile.profilePictureUrl}
                alt={`${profile.firstName} ${profile.lastName}`}
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profile.firstName} {profile.lastName}</h2>
                <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                <button
                  type="button"
                  className="mt-2 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  onClick={() => alert('Feature to upload new profile picture not implemented yet!')}
                >
                  Change Profile Picture
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={profile.firstName}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={profile.lastName}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                name="email"
                id="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
              <textarea
                name="bio"
                id="bio"
                rows={4}
                value={profile.bio}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'preferences' && preferences && (
          <form onSubmit={(e) => handleSubmit(e, 'preferences')} className="space-y-6">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
              <select
                name="theme"
                id="theme"
                value={preferences.theme}
                onChange={handlePreferencesChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex-grow flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Receive important updates and newsletters via email.</span>
              </span>
              <label htmlFor="emailNotifications" className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={preferences.emailNotifications}
                  onChange={handlePreferencesChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex-grow flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Get real-time alerts for important activities.</span>
              </span>
              <label htmlFor="pushNotifications" className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  name="pushNotifications"
                  checked={preferences.pushNotifications}
                  onChange={handlePreferencesChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
              <select
                name="language"
                id="language"
                value={preferences.language}
                onChange={handlePreferencesChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="en-US">English (US)</option>
                <option value="es-ES">Spanish (Spain)</option>
                <option value="fr-FR">French (France)</option>
                <option value="de-DE">German (Germany)</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'account' && account && (
          <form onSubmit={(e) => handleSubmit(e, 'account')} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Password</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Last changed: {new Date(account.lastPasswordChange).toLocaleDateString()}
              </p>
              <button
                type="button"
                onClick={() => alert('Password change functionality not implemented yet!')}
                className="mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Password
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="flex-grow flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Two-Factor Authentication</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account.
                </span>
              </span>
              <label htmlFor="twoFactorEnabled" className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="twoFactorEnabled"
                  name="twoFactorEnabled"
                  checked={account.twoFactorEnabled}
                  onChange={handleAccountChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-red-700 dark:text-red-400">Delete Account</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    alert('Account deletion functionality not implemented yet!');
                  }
                }}
                className="mt-2 px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete My Account
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Account Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;