import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useViewRegistry, ViewRegistration } from '../../core/registry/ViewRegistryContext';
import { ViewId } from '../../types/View';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorBoundary } from '../../components/utils/ErrorBoundary';
import { FallbackComponent } from '../../components/utils/FallbackComponent';
import { AppShell } from './AppShell';

interface AppLoaderProps {
  viewId: ViewId;
  appProps?: Record<string, any>;
}

// Define the type for the dynamically loaded component
type LazyComponent = React.LazyExoticComponent<React.ComponentType<any>>;

/**
 * A map to cache dynamically loaded components.
 * This prevents unnecessary re-creation of lazy wrappers, which can sometimes
 * confuse React's module resolution or lead to excessive network requests
 * if not handled correctly by the bundler.
 */
const componentCache = new Map<ViewId, LazyComponent>();

/**
 * Higher-Order Component responsible for dynamically loading and rendering applications
 * based on the ViewRegistry.
 *
 * It handles:
 * 1. Looking up the registration details (path, component) via ViewRegistry.
 * 2. Dynamically importing the component using React.lazy.
 * 3. Providing suspense loading state.
 * 4. Wrapping the application in a standard AppShell.
 * 5. Handling errors via ErrorBoundary.
 */
export const AppLoader: React.FC<AppLoaderProps> = ({ viewId, appProps = {} }) => {
  const { registry } = useViewRegistry();
  const [registration, setRegistration] = useState<ViewRegistration | null>(null);

  useEffect(() => {
    const reg = registry.get(viewId);
    setRegistration(reg || null);
  }, [viewId, registry]);

  if (!registration) {
    return (
      <AppShell viewId={viewId}>
        <FallbackComponent
          error={new Error(`Application viewId "${viewId}" not found in the registry.`)}
          componentName="AppLoader"
        />
      </AppShell>
    );
  }

  const getLazyComponent = (viewId: ViewId, componentPath: string): LazyComponent => {
    if (componentCache.has(viewId)) {
      return componentCache.get(viewId)!;
    }

    // Dynamic import based on the component path provided in the registration
    const Component = lazy(() => import(`../${componentPath}`));

    componentCache.set(viewId, Component);
    return Component;
  };

  const LazyApp = getLazyComponent(viewId, registration.component);

  return (
    <AppShell viewId={viewId}>
      <ErrorBoundary
        viewId={viewId}
        fallbackRender={({ error, resetError }) => (
          <FallbackComponent
            error={error}
            componentName={`App: ${viewId}`}
            onReset={resetError}
          />
        )}
      >
        <Suspense fallback={<LoadingSpinner size="lg" message={`Loading Application: ${registration.name}`} />}>
          {/*
            We spread appProps (which typically contains the context like user, permissions,
            and specific data passed to the instance) onto the dynamically loaded application component.
          */}
          <LazyApp {...appProps} />
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
};