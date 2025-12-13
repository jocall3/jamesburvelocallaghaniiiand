import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define the shape of the user object
interface User {
  id: string;
  email: string;
  // Add any other relevant user properties
}

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to provide authentication context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for existing authentication (e.g., from local storage or cookies)
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      // Replace with your actual authentication check logic
      // For example, fetch user data from an API or check local storage
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          localStorage.removeItem('authUser'); // Clear invalid data
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};