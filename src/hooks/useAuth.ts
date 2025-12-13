import { useState, useEffect, useCallback } from 'react';

// Define a type for the user object
interface User {
  id: string;
  username: string;
  // Add any other user properties here
}

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// Create a context for authentication
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Custom hook to provide authentication context
const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load authentication state from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('isAuthenticated');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(storedAuth === 'true');
      } catch (error) {
        console.error('Failed to parse user data from local storage:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
    }
  }, []);

  // Function to handle user login
  const login = useCallback((userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  }, []);

  // Function to handle user logout
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  }, []);

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
};

export default useAuth;