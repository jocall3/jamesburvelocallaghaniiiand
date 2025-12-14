```typescript
import React, { Suspense, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

// --- Type Definitions ---

/**
 * Defines the position and size of a widget within the CSS grid.
 * Coordinates are 0-indexed.
 */
export interface GridConfig {
  /** The starting column (0-indexed). */
  x: number;
  /** The starting row (0-indexed). */
  y: number;
  /** The number of columns the widget should span. */
  w: number;
  /** The number of rows the widget should span. */
  h: number;
}

/**
 * The configuration for a single widget to be rendered on the dashboard.
 * @template P - The type of the props object for the widget component.
 * @template D - The type of the data object for the widget component.
 */
export interface WidgetConfig<P = Record<string, any>, D = any> {
  /** A unique identifier for this widget instance. */
  id: string;
  /** A string key that maps to a component in the `widgetRegistry`. */
  type: string;
  /** The grid layout configuration for this widget. */
  gridConfig: GridConfig;
  /** Props to be passed directly to the widget component. */
  props?: P;
  /** Data to be passed to the widget component, often fetched externally. */
  data?: D;
}

/**
 * A registry mapping widget type strings to lazy-loaded React components.
 * Using React.lazy is crucial for performance and code-splitting.
 */
export type WidgetRegistry = {
  [key: string]: React.LazyExoticComponent<React.ComponentType<any>>;
};

/**
 * Props for the UniversalDashboard component.
 */
export interface UniversalDashboardProps {
  /** The array of widget configurations that defines the dashboard's content and layout. */
  layoutConfig: WidgetConfig[];
  /** The map of widget types to their lazy-loaded components. */
  widgetRegistry: WidgetRegistry;
  /** Optional className to apply to the root container. */
  className?: string;
  /** If true, displays a loading spinner for the entire dashboard. */
  isLoading?: boolean;
  /** If an error is provided, displays a dashboard-wide error message. */
  error?: Error | null;
  /** The gap between grid items in pixels. Defaults to 16. */
  gap?: number;
  /** The total number of columns in the grid layout. Defaults to 12. */
  columnCount?: number;
}

// --- Styled Components ---

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const DashboardRoot = styled.div<{ gap: number; columnCount: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.columnCount}, 1fr);
  /* The auto-rows property can be adjusted based on desired fixed-row-height behavior */
  grid-auto-rows: minmax(100px, auto);
  gap: ${(props) => props.gap}px;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: ${(props) => props.gap}px;
  box-sizing: border-box;
  background-color: #f0f2f5;
`;

const WidgetContainer = styled.div<{ gridConfig: GridConfig }>`
  grid-column: ${(props) => props.gridConfig.x + 1} / span ${(props) => props.gridConfig.w};
  grid-row: ${(props) => props.gridConfig.y + 1} / span ${(props) => props.gridConfig.h};
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.3s ease;

  &:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 0 6px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatusOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 300px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
`;

const Loader = styled.div`
  border: 5px solid #e0e0e0;
  border-top: 5px solid #4a90e2;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spinAnimation} 1s linear infinite;
`;

const ErrorDisplay = styled(StatusOverlay)`
  color: #d32f2f;
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  flex-direction: column;
  gap: 8px;

  & > strong {
    font-size: 1.1rem;
  }

  & > code {
    font-size: 0.9rem;
    color: #c62828;
    word-break: break-all;
  }
`;

const WidgetFallbackContainer = () => (
  <StatusOverlay>
    <Loader />
  </StatusOverlay>
);

const WidgetError = ({ type }: { type: string }) => (
  <ErrorDisplay style={{ height: '100%', minHeight: 'unset', borderRadius: 0 }}>
    <strong>Widget Error</strong>
    <code>Component type "{type}" not found in registry.</code>
  </ErrorDisplay>
);

// --- Core Component ---

const UniversalDashboardComponent: React.FC<UniversalDashboardProps> = ({
  layoutConfig,
  widgetRegistry,
  className,
  isLoading = false,
  error = null,
  gap = 16,
  columnCount = 12,
}) => {
  if (isLoading) {
    return (
      <StatusOverlay className={className}>
        <Loader />
      </StatusOverlay>
    );
  }

  if (error) {
    return (
      <ErrorDisplay className={className}>
        <strong>Failed to load dashboard</strong>
        <code>{error.message || 'An unexpected error occurred.'}</code>
      </ErrorDisplay>
    );
  }

  const renderedWidgets = useMemo(() => {
    return layoutConfig.map((widgetConfig) => {
      const WidgetComponent = widgetRegistry[widgetConfig.type];

      const content = WidgetComponent ? (
        <WidgetComponent {...widgetConfig.props} data={widgetConfig.data} />
      ) : (
        <WidgetError type={widgetConfig.type} />
      );

      return (
        <WidgetContainer key={widgetConfig.id} gridConfig={widgetConfig.gridConfig}>
          <Suspense fallback={<WidgetFallbackContainer />}>{content}</Suspense>
        </WidgetContainer>
      );
    });
  }, [layoutConfig, widgetRegistry]);

  return (
    <DashboardRoot className={className} gap={gap} columnCount={columnCount}>
      {renderedWidgets}
    </DashboardRoot>
  );
};

/**
 * A high-performance, polymorphic dashboard container capable of rendering any
 * generated business model UI. It uses a registry pattern with `React.lazy`
 * for optimal code-splitting and performance.
 *
 * @example
 * const widgetRegistry = {
 *   'kpiCard': React.lazy(() => import('./widgets/KpiCard')),
 *   'lineChart': React.lazy(() => import('./widgets/LineChart')),
 * };
 *
 * const layout = [
 *   { id: 'sales', type: 'kpiCard', gridConfig: {x: 0, y: 0, w: 3, h: 2}, props: { title: 'Total Sales' }, data: 150000 },
 *   { id: 'revenue', type: 'lineChart', gridConfig: {x: 3, y: 0, w: 9, h: 4}, props: { title: 'Revenue Over Time' }, data: [...] },
 * ];
 *
 * <UniversalDashboard layoutConfig={layout} widgetRegistry={widgetRegistry} />
 */
export const UniversalDashboard = React.memo(UniversalDashboardComponent);

export default UniversalDashboard;
```