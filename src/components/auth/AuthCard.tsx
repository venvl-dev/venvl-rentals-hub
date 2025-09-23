import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Building2, Shield, Loader2, AlertCircle } from 'lucide-react';
import { validateEmail, validatePasswordStrength, validateInput } from '@/lib/security';

export type AuthRole = 'guest' | 'host' | 'super_admin';

interface AuthCardProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
  role?: AuthRole;
}

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AuthRole;
}

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  general?: string;
}

const AuthCard = ({ mode, onToggleMode, role }: AuthCardProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: role || 'guest'
  });
  const navigate = useNavigate();

  // Clear errors when user starts typing
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  // Centralized role-based redirection
  const redirectByRole = (userRole: AuthRole) => {
    console.log('Redirecting user with role:', userRole);
    
    // Ensure role is one of the valid enum values
    const validRoles: AuthRole[] = ['guest', 'host', 'super_admin'];
    const safeRole = validRoles.includes(userRole) ? userRole : 'guest';
    
    switch (safeRole) {
      case 'host':
        navigate('/host/dashboard');
        break;
      case 'super_admin':
        navigate('/admin/panel');
        break;
      case 'guest':
      default:
        navigate('/'); // Redirect guests to main page to browse properties
        break;
    }
  };

  // Enhanced client-side validation with security
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    try {
      // Email validation with security checks
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else {
        const cleanEmail = validateInput(formData.email, 254); // RFC 5321 limit
        if (!validateEmail(cleanEmail)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }

      // Enhanced password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        if (mode === 'signup') {
          const passwordValidation = validatePasswordStrength(formData.password);
          if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.errors[0];
          }
        } else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
      }

      // Signup-specific validation with sanitization
      if (mode === 'signup') {
        try {
          if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
          } else {
            validateInput(formData.firstName, 50);
          }
          
          if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
          } else {
            validateInput(formData.lastName, 50);
          }
        } catch (inputError: any) {
          if (inputError.message.includes('First name')) {
            newErrors.firstName = inputError.message;
          } else if (inputError.message.includes('Last name')) {
            newErrors.lastName = inputError.message;
          } else {
            newErrors.general = 'Invalid input detected. Please check your entries.';
          }
        }
      }
    } catch (error) {
      newErrors.general = 'Form validation error. Please try again.';
      console.error('Form validation error:', (error as Error).message);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, mode]);

  // Check for duplicate email during signup
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking email:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Unexpected error checking email:', error);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    // Add timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setErrors({ general: 'Sign in timed out. Please check your connection and try again.' });
    }, 30000); // 30 second timeout

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password. Please check your credentials.' });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: 'Please check your email and click the confirmation link before signing in.' });
        } else {
          setErrors({ general: `Sign in failed: ${error.message}` });
        }
        return;
      }

      if (!data.user) {
        setErrors({ general: 'Sign in failed. Please try again.' });
        return;
      }

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, first_name, last_name, email')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setErrors({ general: 'Unable to load user profile. Please try again or contact support.' });
        return;
      }

      if (!profile) {
        console.warn('Profile not found for user, this should not happen with the trigger in place');
        setErrors({ general: 'User profile not found. Please contact support.' });
        return;
      }

      toast.success(`Welcome back, ${profile.first_name}!`);
      redirectByRole(profile.role as AuthRole);
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      setErrors({ general: 'An unexpected error occurred during sign in. Please try again.' });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
        });

      if (error) {
        console.error('Error creating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error creating profile:', error);
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      // Check for duplicate email first
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setErrors({ email: 'This email is already registered. Please try signing in instead.' });
        setLoading(false);
        return;
      }

      console.log('Creating account with role:', formData.role);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            role: formData.role,
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        if (error.message.includes('already registered')) {
          setErrors({ email: 'This email is already registered. Please try signing in instead.' });
        } else if (error.message.includes('weak password')) {
          setErrors({ password: 'Password is too weak. Please use at least 6 characters with letters and numbers.' });
        } else if (error.message.includes('invalid email')) {
          setErrors({ email: 'Please enter a valid email address.' });
        } else if (error.message.includes('signup disabled')) {
          setErrors({ general: 'New registrations are temporarily disabled. Please try again later.' });
        } else {
          setErrors({ general: `Registration failed: ${error.message}` });
        }
        return;
      }

      if (!data.user?.id) {
        setErrors({ general: 'Registration failed. Please try again.' });
        return;
      }

      console.log('User account created:', data.user.id);

      // Create user profile - crucial for role-based access
      const profileCreated = await createUserProfile(data.user.id);
      
      if (!profileCreated) {
        setErrors({ general: 'Account created but profile setup failed. Please contact support.' });
        return;
      }

      console.log('User profile created successfully');

      // Handle email confirmation flow
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Registration successful! Please check your email for the confirmation link to complete your account setup.');
        // Don't redirect yet - wait for email confirmation
      } else {
        // Auto-confirmed - redirect immediately
        toast.success(`Welcome to VENVL, ${formData.firstName}!`);
        
        // Fetch the complete profile to ensure role-based redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        redirectByRole((profile?.role as AuthRole) || formData.role);
      }
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      setErrors({ general: 'An unexpected error occurred during registration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (type: AuthRole) => {
    const accounts = {
      guest: { email: 'guest@venvl.com', password: 'DemoGuest2024$Secure' },
      host: { email: 'host@venvl.com', password: 'DemoHost2024$Secure' },
      super_admin: { email: 'superadmin@venvl.com', password: 'DemoAdmin2024$Secure' }
    };
    
    setFormData(prev => ({
      ...prev,
      email: accounts[type].email,
      password: accounts[type].password
    }));
    setErrors({});
  };

  const getRoleConfig = () => {
    switch (formData.role) {
      case 'host':
        return {
          title: 'Join as a Host',
          description: 'List your properties and start earning',
          icon: <Building2 className="h-6 w-6" />,
          color: 'bg-green-600 hover:bg-green-700'
        };
      case 'super_admin':
        return {
          title: 'Super Admin Access',
          description: 'System administrative portal access',
          icon: <Shield className="h-6 w-6" />,
          color: 'bg-red-600 hover:bg-red-700'
        };
      case 'guest':
      default:
        return {
          title: 'Join VENVL',
          description: 'Discover amazing properties',
          icon: <User className="h-6 w-6" />,
          color: 'bg-black hover:bg-gray-800'
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header with Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-4 mb-8">
          <img 
            src="/lovable-uploads/6b90bd6a-9b4a-4cfe-89f0-5a06cd21ab9a.png" 
            alt="VENVL Logo" 
            className="h-12 object-contain"
          />
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {mode === 'signin' ? 'Welcome back' : roleConfig.title}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'signin' ? 'Sign in to your account' : roleConfig.description}
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-0">
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-6">
            
            {/* General Error Display */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            )}

            {/* Role Selection for Signup without predefined role */}
            {mode === 'signup' && !role && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  I want to join as a: <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value as AuthRole)}
                  className="grid grid-cols-1 gap-3"
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                    <RadioGroupItem value="guest" id="guest" />
                    <Label htmlFor="guest" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <User className="h-4 w-4" />
                      <span>Guest - Book amazing properties</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                    <RadioGroupItem value="host" id="host" />
                    <Label htmlFor="host" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <Building2 className="h-4 w-4" />
                      <span>Host - List your property</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Name Fields for Signup */}
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black ${
                      errors.firstName ? 'border-red-500' : ''
                    }`}
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black ${
                      errors.lastName ? 'border-red-500' : ''
                    }`}
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              {mode === 'signup' && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className={`w-full text-white font-medium py-3 px-4 rounded-md transition-colors ${roleConfig.color}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {roleConfig.icon}
                  <span className="ml-2">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </span>
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                </span>
              </div>
            </div>

            {!role && (
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onToggleMode}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  {mode === 'signin' ? 'Create account' : 'Sign in instead'}
                </Button>
              </div>
            )}
          </div>

          {/* Test Accounts for Development */}
          {mode === 'signin' && process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-3 text-blue-900">Test Accounts</h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillTestAccount('guest')}
                  className="w-full text-left text-xs text-blue-700 hover:text-blue-900 p-2 rounded hover:bg-blue-100 transition-colors"
                  disabled={loading}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Guest Account:</span>
                    <span>guest@venvl.com / DemoGuest2024$Secure</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('host')}
                  className="w-full text-left text-xs text-blue-700 hover:text-blue-900 p-2 rounded hover:bg-blue-100 transition-colors"
                  disabled={loading}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Host Account:</span>
                    <span>host@venvl.com / DemoHost2024$Secure</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('super_admin')}
                  className="w-full text-left text-xs text-blue-700 hover:text-blue-900 p-2 rounded hover:bg-blue-100 transition-colors"
                  disabled={loading}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Super Admin Account:</span>
                    <span>superadmin@venvl.com / DemoAdmin2024$Secure</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthCard;
