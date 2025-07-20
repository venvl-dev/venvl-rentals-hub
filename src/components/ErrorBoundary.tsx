import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Application Error
              </h1>
              <p className="text-muted-foreground">
                The application failed to initialize. This is likely due to missing environment variables.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-left space-y-2">
              <h2 className="font-semibold text-foreground">To fix this:</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Copy <code className="bg-background px-1 rounded">.env.example</code> to <code className="bg-background px-1 rounded">.env</code></li>
                <li>Add your Supabase project URL and anonymous key</li>
                <li>Restart the development server</li>
              </ol>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}