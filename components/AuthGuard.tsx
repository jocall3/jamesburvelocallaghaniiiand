import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext is in the same directory or adjust path

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[]; // Optional array of roles
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Simulate checking authentication.  Replace with actual auth check.
    // setTimeout(() => {
      setIsCheckingAuth(false);
    // }, 500);


    if (!isAuthenticated && !isCheckingAuth) {
      navigate('/login'); // Redirect to login if not authenticated
    }

     // Check roles if allowedRoles is specified
     if (isAuthenticated && !isCheckingAuth && allowedRoles && allowedRoles.length > 0) {
        if (!user || !user.roles || !user.roles.some(role => allowedRoles.includes(role))) {
          navigate('/unauthorized');  // Redirect to unauthorized page if roles don't match
        }
    }

  }, [isAuthenticated, navigate, allowedRoles, user, isCheckingAuth]);

  if (isCheckingAuth) {
    // You can customize this loading state (e.g., a spinner)
    return <div>Loading...</div>;
  }


  if (isAuthenticated && (!allowedRoles || allowedRoles.length === 0 || (user && user.roles && user.roles.some(role => allowedRoles.includes(role))))) {
    return <>{children}</>;
  }


  return null; // or an error/fallback component
};

export default AuthGuard;