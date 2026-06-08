import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
        }}>
          <div style={{ fontSize: '48px' }}>💥</div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'var(--accent-purple)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}