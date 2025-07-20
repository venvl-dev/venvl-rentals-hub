import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { validateInput, sanitizeHtml } from '@/lib/security';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import { useSecurity } from '@/components/security/SecurityProvider';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'number';
  required?: boolean;
  maxLength?: number;
  validation?: (value: string) => string | null;
  sanitize?: boolean;
}

interface SecureFormProps {
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitText?: string;
  className?: string;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  title,
  description,
  fields,
  onSubmit,
  submitText = 'Submit',
  className = ''
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  
  const { checkAndLogAction } = useSecurity();

  const clearError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    clearError(fieldName);
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name] || '';

      try {
        // Required field validation
        if (field.required && !value.trim()) {
          newErrors[field.name] = `${field.label} is required`;
          return;
        }

        // Skip validation for empty optional fields
        if (!field.required && !value.trim()) {
          return;
        }

        // Input validation and sanitization
        const maxLength = field.maxLength || (field.type === 'textarea' ? 2000 : 255);
        const validatedValue = validateInput(value, maxLength);

        // Custom field validation
        if (field.validation) {
          const customError = field.validation(validatedValue);
          if (customError) {
            newErrors[field.name] = customError;
          }
        }

        // Email validation
        if (field.type === 'email' && validatedValue) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(validatedValue)) {
            newErrors[field.name] = 'Please enter a valid email address';
          }
        }

        // Update form data with validated value
        if (field.sanitize && field.type === 'textarea') {
          setFormData(prev => ({ 
            ...prev, 
            [field.name]: sanitizeHtml(validatedValue) 
          }));
        }

      } catch (error) {
        newErrors[field.name] = (error as Error).message;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, fields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      // Security check
      const allowed = await checkAndLogAction('form_submission', 'form', title);
      if (!allowed) {
        setGeneralError('Action temporarily blocked. Please try again later.');
        return;
      }

      // Prepare clean data
      const cleanData: Record<string, any> = {};
      fields.forEach(field => {
        const value = formData[field.name];
        if (value !== undefined && value !== '') {
          cleanData[field.name] = field.type === 'number' ? Number(value) : value;
        }
      });

      await onSubmit(cleanData);
    } catch (error) {
      await handleError(
        new CustomError(
          'Form submission failed',
          ErrorCodes.VALIDATION_INVALID_FORMAT,
          'medium'
        ),
        { formTitle: title, error }
      );
      setGeneralError('An error occurred while submitting the form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const baseClasses = `mt-1 block w-full border rounded-md shadow-sm focus:ring-primary focus:border-primary ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

    const commonProps = {
      id: field.name,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleInputChange(field.name, e.target.value),
      disabled: loading,
      className: baseClasses,
      maxLength: field.maxLength || (field.type === 'textarea' ? 2000 : 255)
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      default:
        return (
          <input
            {...commonProps}
            type={field.type}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error Display */}
          {generalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{generalError}</span>
            </div>
          )}

          {/* Form Fields */}
          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
              )}
            </div>
          ))}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              submitText
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};