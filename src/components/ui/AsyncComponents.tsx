import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  loading = false,
  success = false,
  error = false,
  loadingText = 'Loading...',
  successText,
  errorText,
  variant = 'default',
  size = 'default',
  children,
  disabled,
  ...props
}) => {
  const getContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      );
    }
    
    if (success && successText) {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          {successText}
        </>
      );
    }
    
    if (error && errorText) {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2" />
          {errorText}
        </>
      );
    }
    
    return children;
  };

  const getVariant = () => {
    if (success) return 'default';
    if (error) return 'destructive';
    return variant;
  };

  return (
    <Button
      variant={getVariant()}
      size={size}
      disabled={disabled || loading}
      {...props}
    >
      {getContent()}
    </Button>
  );
};

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent
}) => {
  if (loading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (error) {
    return (
      errorComponent || (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )
    );
  }

  return <>{children}</>;
};

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};