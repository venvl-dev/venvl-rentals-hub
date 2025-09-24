// Enhanced error handling and logging system
import { toast } from '@/hooks/use-toast';
import { logSecurityEvent } from './security';

export interface AppError extends Error {
  code?: string;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  userMessage?: string;
}

export class CustomError extends Error implements AppError {
  code?: string;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  userMessage?: string;

  constructor(
    message: string,
    code?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userMessage?: string,
    context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.severity = severity;
    this.userMessage = userMessage;
    this.context = context;
  }
}

// Error types
export const ErrorCodes = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // Authorization
  AUTHZ_INSUFFICIENT_PERMISSIONS: 'AUTHZ_INSUFFICIENT_PERMISSIONS',
  AUTHZ_ROLE_REQUIRED: 'AUTHZ_ROLE_REQUIRED',

  // Validation
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_LENGTH_EXCEEDED: 'VALIDATION_LENGTH_EXCEEDED',

  // Business Logic
  BUSINESS_BOOKING_CONFLICT: 'BUSINESS_BOOKING_CONFLICT',
  BUSINESS_PROPERTY_UNAVAILABLE: 'BUSINESS_PROPERTY_UNAVAILABLE',
  BUSINESS_INSUFFICIENT_FUNDS: 'BUSINESS_INSUFFICIENT_FUNDS',

  // System
  SYSTEM_DATABASE_ERROR: 'SYSTEM_DATABASE_ERROR',
  SYSTEM_NETWORK_ERROR: 'SYSTEM_NETWORK_ERROR',
  SYSTEM_RATE_LIMIT_EXCEEDED: 'SYSTEM_RATE_LIMIT_EXCEEDED',

  // Security
  SECURITY_SUSPICIOUS_ACTIVITY: 'SECURITY_SUSPICIOUS_ACTIVITY',
  SECURITY_XSS_ATTEMPT: 'SECURITY_XSS_ATTEMPT',
  SECURITY_SQL_INJECTION_ATTEMPT: 'SECURITY_SQL_INJECTION_ATTEMPT',
} as const;

// User-friendly error messages
const getUserMessage = (error: AppError): string => {
  if (error.userMessage) return error.userMessage;

  switch (error.code) {
    case ErrorCodes.AUTH_INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.';
    case ErrorCodes.AUTH_USER_NOT_FOUND:
      return 'User account not found. Please check your credentials.';
    case ErrorCodes.AUTH_UNAUTHORIZED:
      return 'You are not authorized to perform this action.';
    case ErrorCodes.AUTH_SESSION_EXPIRED:
      return 'Your session has expired. Please log in again.';
    case ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS:
      return 'You do not have permission to perform this action.';
    case ErrorCodes.VALIDATION_REQUIRED_FIELD:
      return 'Please fill in all required fields.';
    case ErrorCodes.VALIDATION_INVALID_FORMAT:
      return 'Please check the format of the information entered.';
    case ErrorCodes.BUSINESS_BOOKING_CONFLICT:
      return 'The selected dates are not available. Please choose different dates.';
    case ErrorCodes.BUSINESS_PROPERTY_UNAVAILABLE:
      return 'This property is currently unavailable for booking.';
    case ErrorCodes.SYSTEM_RATE_LIMIT_EXCEEDED:
      return 'Too many requests. Please try again later.';
    case ErrorCodes.SYSTEM_NETWORK_ERROR:
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Error logging
const logError = async (error: AppError, context?: Record<string, any>) => {
  const errorData = {
    message: error.message,
    code: error.code,
    severity: error.severity,
    stack: error.stack,
    context: { ...error.context, ...context },
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', errorData);
  }

  // Log security events for critical errors
  if (error.severity === 'critical' || error.code?.startsWith('SECURITY_')) {
    await logSecurityEvent(
      'error_occurred',
      'application',
      undefined,
      false,
      JSON.stringify(errorData),
    );
  }

  // In production, you would send this to your error monitoring service
  // Example: Sentry, LogRocket, etc.
};

// Global error handler
export const handleError = async (
  error: Error | AppError,
  context?: Record<string, any>,
  showToast: boolean = true,
): Promise<void> => {
  const appError: AppError =
    error instanceof CustomError
      ? error
      : new CustomError(
          error.message,
          'UNKNOWN_ERROR',
          'medium',
          'An unexpected error occurred. Please try again.',
          context,
        );

  // Log the error
  await logError(appError, context);

  // Show user-friendly toast notification
  if (showToast) {
    toast({
      title: 'Error',
      description: getUserMessage(appError),
      variant: 'destructive',
    });
  }
};

// Async error boundary
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>,
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error as Error, context);
      return null;
    }
  };
};

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
  if (error?.code === '23505') {
    return new CustomError(
      'Duplicate entry',
      ErrorCodes.VALIDATION_INVALID_FORMAT,
      'medium',
      'This information already exists. Please use different values.',
    );
  }

  if (error?.code === '23503') {
    return new CustomError(
      'Foreign key constraint violation',
      ErrorCodes.VALIDATION_INVALID_FORMAT,
      'medium',
      'Invalid reference to related data.',
    );
  }

  if (error?.message?.includes('row-level security')) {
    return new CustomError(
      'Access denied',
      ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS,
      'high',
      'You do not have permission to access this data.',
    );
  }

  return new CustomError(
    error?.message || 'Database operation failed',
    ErrorCodes.SYSTEM_DATABASE_ERROR,
    'high',
    'A database error occurred. Please try again.',
  );
};

// Network error handler
export const handleNetworkError = (error: any): AppError => {
  if (error?.name === 'AbortError') {
    return new CustomError(
      'Request cancelled',
      'REQUEST_CANCELLED',
      'low',
      'Request was cancelled.',
    );
  }

  if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return new CustomError(
      'Network error',
      ErrorCodes.SYSTEM_NETWORK_ERROR,
      'medium',
      'Please check your internet connection and try again.',
    );
  }

  return new CustomError(
    'Network request failed',
    ErrorCodes.SYSTEM_NETWORK_ERROR,
    'medium',
    'Unable to connect to the server. Please try again.',
  );
};

// Form validation error handler
export const handleValidationError = (
  field: string,
  value: any,
): AppError | null => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return new CustomError(
      `${field} is required`,
      ErrorCodes.VALIDATION_REQUIRED_FIELD,
      'low',
      `Please enter a ${field.toLowerCase()}.`,
    );
  }

  return null;
};
