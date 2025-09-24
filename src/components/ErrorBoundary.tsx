import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Date.now().toString(36);
    return { hasError: true, error, errorId };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);

    // Log error securely
    try {
      await handleError(
        new CustomError(
          'React Error Boundary caught an error',
          ErrorCodes.SYSTEM_DATABASE_ERROR,
          'critical',
          'An unexpected error occurred. Our team has been notified.',
        ),
        {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
        },
        false, // Don't show toast, we'll handle UI here
      );
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
          <div className='max-w-md w-full text-center space-y-4'>
            <AlertTriangle className='h-16 w-16 text-destructive mx-auto' />
            <div className='space-y-2'>
              <h1 className='text-2xl font-bold text-foreground'>
                Application Error
              </h1>
              <p className='text-muted-foreground'>
                The application failed to initialize. This is likely due to
                missing environment variables.
              </p>
            </div>
            <div className='bg-muted p-4 rounded-lg text-left space-y-2'>
              <h2 className='font-semibold text-foreground'>To fix this:</h2>
              <ol className='list-decimal list-inside space-y-1 text-sm text-muted-foreground'>
                <li>
                  Copy{' '}
                  <code className='bg-background px-1 rounded'>
                    .env.example
                  </code>{' '}
                  to <code className='bg-background px-1 rounded'>.env</code>
                </li>
                <li>Add your Supabase project URL and anonymous key</li>
                <li>Restart the development server</li>
              </ol>
            </div>
            <div className='space-y-3'>
              <button
                onClick={this.handleRetry}
                className='w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className='w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors'
              >
                Go to Homepage
              </button>
            </div>
            {this.state.errorId && (
              <p className='text-xs text-muted-foreground'>
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
