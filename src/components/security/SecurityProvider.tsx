import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkRateLimit, logSecurityEvent } from '@/lib/security';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';

interface SecurityContextType {
  checkAndLogAction: (
    action: string,
    resourceType?: string,
    resourceId?: string,
  ) => Promise<boolean>;
  isRateLimited: (action: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined,
);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      logSecurityEvent('session_started', 'authentication', user.id, true);
    }
  }, [user]);

  const checkAndLogAction = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
  ): Promise<boolean> => {
    try {
      // Check rate limiting
      const isAllowed = await checkRateLimit(action, 100, 60); // 100 actions per hour

      if (!isAllowed) {
        await logSecurityEvent(
          action,
          resourceType,
          resourceId,
          false,
          'Rate limit exceeded',
        );
        await handleError(
          new CustomError(
            'Rate limit exceeded',
            ErrorCodes.SYSTEM_RATE_LIMIT_EXCEEDED,
            'medium',
            'You are performing actions too quickly. Please wait a moment.',
          ),
          { action, userId: user?.id },
        );
        return false;
      }

      // Log successful action
      await logSecurityEvent(action, resourceType, resourceId, true);
      return true;
    } catch (error) {
      await logSecurityEvent(
        action,
        resourceType,
        resourceId,
        false,
        (error as Error).message,
      );
      return false;
    }
  };

  const isRateLimited = async (action: string): Promise<boolean> => {
    try {
      return !(await checkRateLimit(action, 10, 1)); // 10 actions per minute
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Fail safely by assuming rate limited
    }
  };

  const value = {
    checkAndLogAction,
    isRateLimited,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
