import { useState, useEffect, createContext, useContext } from 'react';

// Define the shape of the authentication context
interface AuthContextProps {
  user: any | null; // Replace 'any' with a more specific type if possible
  login: (credentials: any) => Promise<void>; // Replace 'any' with a more specific type if possible
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Create the authentication context
const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
  error: null,
});

// Create the AuthProvider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null); // Replace 'any' with a more specific type if possible
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate checking for an existing token in local storage or cookies
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('user'); // Clear invalid data
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => { // Replace 'any' with a more specific type if possible
    setIsLoading(true);
    setError(null);

    // Simulate an API call to authenticate the user
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (credentials.username === 'test' && credentials.password === 'password') {
          const fakeUser = {
            id: 1,
            username: 'test',
            email: 'test@example.com',
            roles: ['user'],
          };
          setUser(fakeUser);
          localStorage.setItem('user', JSON.stringify(fakeUser)); // Store user in local storage
          setIsLoading(false);
          resolve();
        } else {
          setError('Invalid credentials');
          setIsLoading(false);
          reject('Invalid credentials');
        }
      }, 1000); // Simulate network latency
    });
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    // Simulate an API call to logout the user
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUser(null);
        localStorage.removeItem('user'); // Remove user from local storage
        setIsLoading(false);
        resolve();
      }, 500); // Simulate network latency
    });
  };

  const value: AuthContextProps = {
    user,
    login,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create the useAuth hook
export const useAuth = () => {
  return useContext(AuthContext);
};