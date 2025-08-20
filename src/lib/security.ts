// Security utilities for input validation and sanitization
import { supabase } from "@/integrations/supabase/client";

// Input validation and sanitization
export const validateInput = (input: string, maxLength: number = 1000): string => {
  if (!input || input.trim().length === 0) {
    throw new Error('Input cannot be null or empty');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  
  // Basic sanitization - remove control characters
  return input.replace(/[^\x20-\x7E]/g, '').trim();
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// XSS prevention
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Rate limiting check
export const checkRateLimit = async (
  action: string, 
  maxAttempts: number = 10, 
  windowMinutes: number = 60
): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return false;

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    const { data, error } = await supabase
      .from('rate_limits')
      .select('attempt_count')
      .eq('user_id', user.user.id)
      .eq('action_type', action)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return false;
    }

    const currentAttempts = data?.attempt_count || 0;
    
    if (currentAttempts >= maxAttempts) {
      return false;
    }

    // Update or insert rate limit record
    await supabase
      .from('rate_limits')
      .upsert({
        user_id: user.user.id,
        action_type: action,
        attempt_count: currentAttempts + 1,
        window_start: windowStart.toISOString()
      });

    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return false;
  }
};

// Security audit logging
export const logSecurityEvent = async (
  action: string,
  resourceType?: string,
  resourceId?: string,
  success: boolean = true,
  errorMessage?: string
): Promise<void> => {
  try {
    await supabase.rpc('log_security_event', {
      p_action: action,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
      p_success: success,
      p_error_message: errorMessage || null
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Content Security Policy headers for client-side
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
});

// SQL injection prevention helpers
export const escapeSqlString = (input: string): string => {
  return input.replace(/'/g, "''");
};

// File upload validation
export const validateFileUpload = (file: File, allowedTypes: string[], maxSizeMB: number = 5): { isValid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }
  
  return { isValid: true };
};