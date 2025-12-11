import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={styles.container}>
          <h2 style={styles.header}>Something went wrong.</h2>
          <p>We're sorry for the inconvenience. Please try refreshing the page or contact support.</p>
          <button onClick={() => window.location.reload()} style={styles.button}>
            Refresh Page
          </button>
          <details style={styles.details}>
            <summary>Error Details</summary>
            <pre style={styles.pre}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    margin: '1rem',
    textAlign: 'center',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
  },
  header: {
    color: '#b91c1c',
  },
  button: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  details: {
    marginTop: '1.5rem',
    textAlign: 'left',
    color: '#7f1d1d',
  },
  pre: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    backgroundColor: '#fee2e2',
    padding: '1rem',
    borderRadius: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
};

export default ErrorBoundary;