"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  // Add other profile-specific fields as needed
  bio?: string;
  location?: string;
  website?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (status === 'authenticated') {
      // In a real application, you would fetch user profile data from your backend API
      // using the session.user.id or session.user.email.
      // For this example, we'll simulate fetching data.
      const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          const mockProfile: UserProfile = {
            id: session.user?.sub || session.user?.id || 'user-123', // Use sub or id from session if available
            name: session.user?.name || 'Guest User',
            email: session.user?.email || 'guest@example.com',
            image: session.user?.image || '/default-avatar.png',
            bio: 'A passionate developer exploring the world of web technologies.',
            location: 'San Francisco, CA',
            website: 'https://example.com',
          };
          setUserProfile(mockProfile);
          setEditedProfile(mockProfile); // Initialize editedProfile with current data
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Handle error, e.g., redirect to an error page or show a message
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin'); // Redirect to sign-in if not authenticated
    }
  }, [session, status, router]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedProfile(userProfile || {}); // Reset to original data
  };

  const handleSaveClick = async () => {
    if (!userProfile) return;

    setIsLoading(true); // Show loading indicator while saving
    try {
      // Simulate API call to update profile
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedProfile = { ...userProfile, ...editedProfile };
      setUserProfile(updatedProfile);
      setEditedProfile(updatedProfile); // Update editedProfile to reflect saved changes
      setIsEditing(false);
      console.log('Profile updated successfully:', updatedProfile);
      // Optionally show a success message to the user
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error, e.g., show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-red-600">Could not load profile information.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white shadow-lg rounded-lg max-w-4xl">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500 shadow-md">
          <Image
            src={userProfile.image || '/default-avatar.png'}
            alt="User Avatar"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{userProfile.name}</h1>
          <p className="text-xl text-gray-600 mb-4">{userProfile.email}</p>

          {!isEditing ? (
            <>
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Bio</h3>
                  <p className="text-gray-600">{userProfile.bio || 'No bio available.'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Location</h3>
                  <p className="text-gray-600">{userProfile.location || 'Not specified.'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Website</h3>
                  <p className="text-gray-600">
                    {userProfile.website ? (
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {userProfile.website}
                      </a>
                    ) : (
                      'Not specified.'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEditClick}
                className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-lg font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editedProfile.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-lg font-semibold text-gray-700 mb-1">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={editedProfile.bio || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-lg font-semibold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={editedProfile.location || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-lg font-semibold text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={editedProfile.website || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSaveClick}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelClick}
                  className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition duration-300 ease-in-out"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}