import React from 'react';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service in production
    if (process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true') {
      // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket)
      // reportErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#0d1117',
          color: '#c9d1d9'
        }}>
          <h1 style={{ color: '#f85149', marginBottom: '20px' }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: '20px', textAlign: 'center', maxWidth: '600px' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#161b22',
              borderRadius: '6px',
              maxWidth: '800px',
              width: '100%'
            }}>
              <summary style={{ cursor: 'pointer', color: '#58a6ff', marginBottom: '10px' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                color: '#f85149',
                overflow: 'auto',
                fontSize: '0.85em',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#58a6ff',
              color: '#0d1117',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#30363d',
              color: '#c9d1d9',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

