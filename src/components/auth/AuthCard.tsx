
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Building2, Shield, Loader2, Crown } from 'lucide-react';

interface AuthCardProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

const AuthCard = ({ mode, onToggleMode }: AuthCardProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'guest' as 'guest' | 'host' | 'admin' | 'super_admin'
  });
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'host':
        navigate('/host/dashboard');
        break;
      case 'admin':
      case 'super_admin':
        navigate('/admin');
        break;
      default:
        navigate('/guest/bookings');
        break;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else {
          toast.error(`Sign in failed: ${error.message}`);
        }
        return;
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      toast.success('Welcome back to VENVL!');
      redirectByRole(profile?.role || 'guest');
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      toast.error('An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            role: formData.role,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please try signing in instead.');
        } else if (error.message.includes('weak password')) {
          toast.error('Password is too weak. Please use at least 6 characters.');
        } else if (error.message.includes('invalid email')) {
          toast.error('Please enter a valid email address.');
        } else {
          toast.error(`Sign up failed: ${error.message}`);
        }
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Registration successful! Check your email for the confirmation link.');
      } else {
        toast.success('Welcome to VENVL!');
        redirectByRole(formData.role);
      }
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      toast.error('An unexpected error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (type: 'guest' | 'host' | 'admin' | 'super_admin') => {
    const accounts = {
      guest: { email: 'guest@venvl.com', password: 'Password123' },
      host: { email: 'host@venvl.com', password: 'Password123' },
      admin: { email: 'admin@venvl.com', password: 'Password123' },
      super_admin: { email: 'superadmin@venvl.com', password: 'SuperSecure123' }
    };
    
    setFormData(prev => ({
      ...prev,
      email: accounts[type].email,
      password: accounts[type].password
    }));
  };

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
          {mode === 'signin' ? 'Welcome back' : 'Join VENVL'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account today'}
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-0">
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-6">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    I want to join as a:
                  </Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
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
                    <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Shield className="h-4 w-4" />
                        <span>Admin - Manage platform</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                      <RadioGroupItem value="super_admin" id="super_admin" />
                      <Label htmlFor="super_admin" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Crown className="h-4 w-4 text-red-600" />
                        <span className="text-red-700 font-medium">Super Admin - Full system control</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-md transition-colors" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

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

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onToggleMode}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {mode === 'signin' ? 'Create account' : 'Sign in instead'}
              </Button>
            </div>
          </div>

          {mode === 'signin' && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-3 text-blue-900">Test Accounts</h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillTestAccount('guest')}
                  className="w-full text-left text-xs text-blue-700 hover:text-blue-900 p-2 rounded hover:bg-blue-100 transition-colors"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Guest Account:</span>
                    <span>guest@venvl.com / Password123</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('host')}
                  className="w-full text-left text-xs text-blue-700 hover:text-blue-900 p-2 rounded hover:bg-blue-100 transition-colors"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Host Account:</span>
                    <span>host@venvl.com / Password123</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('admin')}
                  className="w-full text-left text-xs text-blue-700 hover:text-blue-900 p-2 rounded hover:bg-blue-100 transition-colors"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Admin Account:</span>
                    <span>admin@venvl.com / Password123</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('super_admin')}
                  className="w-full text-left text-xs text-red-700 hover:text-red-900 p-2 rounded hover:bg-red-100 transition-colors border border-red-200 bg-red-50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center">
                      <Crown className="h-3 w-3 mr-1" />
                      Super Admin:
                    </span>
                    <span>superadmin@venvl.com / SuperSecure123</span>
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
