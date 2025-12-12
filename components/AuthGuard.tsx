/*
The Unsung Hero of Web Security: Mastering React's AuthGuard Pattern

Ever built a web application and found yourself wrestling with access control? How do you ensure only authenticated users see sensitive data, or that administrators are the only ones who can access specific dashboards? Scattering `if (user.isAuthenticated)` checks everywhere is a recipe for disaster. Enter the `AuthGuard` pattern – a powerful, elegant solution that acts as your application's bouncer, ensuring every user is where they're supposed to be. Let's dive into the surprising power packed into this seemingly simple React component.

**Takeaway 1: The Invisible Gatekeeper: Centralized Access Control**

At its core, the `AuthGuard` component is a higher-order component (or a wrapper component, as seen here) that encapsulates authentication logic. Instead of repeating checks across dozens of components, you wrap your protected routes or components with `AuthGuard`. This centralizes your security logic, making your application far more maintainable and less prone to errors. If a user isn't authenticated, the guard simply redirects them to the login page, no questions asked.

```typescript
// If not authenticated, redirect to login
if (!isAuthenticated && !isCheckingAuth) {
  navigate('/login');
}
```

This single point of control is a game-changer for application security and developer sanity.

**Takeaway 2: Beyond Login: Granular Role-Based Security (RBAC)**

Authentication is just the first step. What if you need to differentiate between a regular user, an editor, and an administrator? This is where Role-Based Access Control (RBAC) shines, and our `AuthGuard` handles it beautifully. By passing an `allowedRoles` prop, you can specify exactly which user roles are permitted to access a particular section. If a logged-in user doesn't possess any of the required roles, they're swiftly redirected to an unauthorized page.

```typescript
// Check roles if allowedRoles is specified
if (isAuthenticated && !isCheckingAuth && allowedRoles && allowedRoles.length > 0) {
    if (!user || !user.roles || !user.roles.some(role => allowedRoles.includes(role))) {
      navigate('/unauthorized');
    }
}
```

This powerful feature allows you to build complex permission systems with minimal effort, ensuring that only the right people have access to the right features.

**Takeaway 3: The Art of Timing: React's `useEffect` and Dependency Management**

The `AuthGuard` leverages React's `useEffect` hook to perform its checks. What's truly impactful here is the careful management of its dependency array: `[isAuthenticated, navigate, allowedRoles, user, isCheckingAuth]`. This isn't just boilerplate; it's crucial. It tells React exactly when to re-run the authentication and role checks – whenever the user's authentication status changes, their roles update, or the component's internal checking state shifts. Missing a dependency can lead to stale data, missed redirects, or even infinite loops. This highlights a core React principle: understanding `useEffect` dependencies is key to building robust and predictable components.

**Takeaway 4: Graceful Transitions: Handling Authentication States**

Imagine a user briefly seeing a protected page before being redirected, or a flicker of content while authentication is still being verified. Not ideal! The `AuthGuard` addresses this with an `isCheckingAuth` state. While the authentication status is being determined (e.g., fetching user data from an API), a simple "Loading..." message is displayed. This prevents jarring user experiences and ensures that redirects only happen once the definitive authentication status is known.

```typescript
if (isCheckingAuth) {
  return <div>Loading...</div>;
}
```

This small detail significantly improves the perceived performance and professionalism of your application.

**Conclusion:**

The `AuthGuard` pattern is more than just a piece of code; it's a fundamental building block for secure, scalable, and user-friendly React applications. By centralizing access control, implementing granular role-based security, mastering `useEffect` dependencies, and handling loading states gracefully, you empower your application with robust protection. So, as you build your next feature, ask yourself: How will you empower your users while safeguarding your application's integrity with a well-placed guard?
*/
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