import { useCallback, useEffect, useState } from 'react';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { validateInput } from '@/lib/security';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';

interface UseFormValidationProps {
  validationRules: Record<string, {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  }>;
  onValidChange?: (isValid: boolean) => void;
}

interface UseFormValidationReturn {
  values: Record<string, string>;
  errors: Record<string, string>;
  isValid: boolean;
  setValue: (field: string, value: string) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAll: () => void;
  validateField: (field: string) => boolean;
  validateAll: () => boolean;
}

export const useFormValidation = ({
  validationRules,
  onValidChange
}: UseFormValidationProps): UseFormValidationReturn => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback((field: string): boolean => {
    const value = values[field] || '';
    const rules = validationRules[field];
    
    if (!rules) return true;

    try {
      // Required validation
      if (rules.required && !value.trim()) {
        setErrors(prev => ({ ...prev, [field]: `${field} is required` }));
        return false;
      }

      // Skip other validations for empty optional fields
      if (!rules.required && !value.trim()) {
        setErrors(prev => ({ ...prev, [field]: '' }));
        return true;
      }

      // Length validations
      if (rules.minLength && value.length < rules.minLength) {
        setErrors(prev => ({ 
          ...prev, 
          [field]: `${field} must be at least ${rules.minLength} characters` 
        }));
        return false;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        setErrors(prev => ({ 
          ...prev, 
          [field]: `${field} must not exceed ${rules.maxLength} characters` 
        }));
        return false;
      }

      // Input sanitization
      const sanitizedValue = validateInput(value, rules.maxLength || 255);
      if (sanitizedValue !== value) {
        setValues(prev => ({ ...prev, [field]: sanitizedValue }));
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
        setErrors(prev => ({ ...prev, [field]: `${field} format is invalid` }));
        return false;
      }

      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(sanitizedValue);
        if (customError) {
          setErrors(prev => ({ ...prev, [field]: customError }));
          return false;
        }
      }

      // Clear error if validation passed
      setErrors(prev => ({ ...prev, [field]: '' }));
      return true;
    } catch (error) {
      handleError(
        new CustomError(
          'Form validation error',
          ErrorCodes.VALIDATION_INVALID_FORMAT,
          'low'
        ),
        { field, value, error }
      );
      setErrors(prev => ({ ...prev, [field]: 'Validation error occurred' }));
      return false;
    }
  }, [values, validationRules]);

  const debouncedValidateField = useDebounceCallback(validateField, 300);

  const setValue = useCallback((field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Validate field after value change (debounced)
    debouncedValidateField(field);
  }, [debouncedValidateField]);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const clearAll = useCallback(() => {
    setValues({});
    setErrors({});
    setIsValid(false);
  }, []);

  const validateAll = useCallback((): boolean => {
    const fieldNames = Object.keys(validationRules);
    const results = fieldNames.map(field => validateField(field));
    const allValid = results.every(result => result);
    setIsValid(allValid);
    return allValid;
  }, [validationRules, validateField]);

  // Update validity when errors change
  useEffect(() => {
    const hasErrors = Object.values(errors).some(error => error !== '');
    const newIsValid = !hasErrors && Object.keys(values).length > 0;
    
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
      onValidChange?.(newIsValid);
    }
  }, [errors, values, isValid, onValidChange]);

  return {
    values,
    errors,
    isValid,
    setValue,
    setError,
    clearError,
    clearAll,
    validateField,
    validateAll
  };
};