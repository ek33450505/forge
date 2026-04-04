import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  paneId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(
      `[ErrorBoundary] Pane ${this.props.paneId ?? 'unknown'} crashed:`,
      error,
      errorInfo,
    );
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: 'var(--bg)',
            color: 'var(--fg)',
            padding: '24px',
          }}
        >
          <AlertTriangle
            size={32}
            style={{ color: 'var(--warning, #f59e0b)' }}
          />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
            Something went wrong
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--fg-muted)',
              fontFamily: 'monospace',
              maxWidth: '400px',
              textAlign: 'center',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: '8px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--bg)',
              backgroundColor: 'var(--accent)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Pane
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
