
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Building2, Shield } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'guest' | 'host' | 'admin' | 'super_admin'>('guest');
  const [authType, setAuthType] = useState<'signin' | 'guest-signup' | 'host-signup' | 'admin-login'>('signin');
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast.error(`Sign in failed: ${error.message}`);
      } else {
        console.log('Sign in successful:', data);
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      toast.error('An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: role,
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please try signing in instead.');
        } else if (error.message.includes('weak password')) {
          toast.error('Password is too weak. Please use at least 6 characters.');
        } else if (error.message.includes('invalid email')) {
          toast.error('Please enter a valid email address.');
        } else {
          toast.error(`Sign up failed: ${error.message}`);
        }
      } else {
        console.log('Sign up successful:', data);
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Registration successful! Check your email for the confirmation link.');
        } else {
          toast.success('Account created successfully!');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      toast.error('An unexpected error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRole('guest');
    setShowPassword(false);
  };

  const handleAuthTypeChange = (type: typeof authType) => {
    setAuthType(type);
    resetForm();
    
    if (type === 'host-signup') {
      setRole('host');
    } else if (type === 'admin-login') {
      setRole('admin');
    } else {
      setRole('guest');
    }
  };

  const getAuthTypeIcon = () => {
    switch (authType) {
      case 'signin':
        return <Mail className="h-6 w-6" />;
      case 'guest-signup':
        return <User className="h-6 w-6" />;
      case 'host-signup':
        return <Building2 className="h-6 w-6" />;
      case 'admin-login':
        return <Shield className="h-6 w-6" />;
      default:
        return <Mail className="h-6 w-6" />;
    }
  };

  const getAuthTypeTitle = () => {
    switch (authType) {
      case 'signin':
        return 'Welcome Back';
      case 'guest-signup':
        return 'Join as a Guest';
      case 'host-signup':
        return 'Become a Host';
      case 'admin-login':
        return 'Admin Access';
      default:
        return 'Welcome';
    }
  };

  const getAuthTypeDescription = () => {
    switch (authType) {
      case 'signin':
        return 'Sign in to your VENVL account';
      case 'guest-signup':
        return 'Start your journey and book amazing properties';
      case 'host-signup':
        return 'List your property and earn with VENVL';
      case 'admin-login':
        return 'Administrative access to VENVL platform';
      default:
        return 'Access your account';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header with Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-center items-center space-x-3 mb-6">
          <img 
            src="/lovable-uploads/3996e48e-8de1-4401-a0d2-f3a7fecf5cbb.png" 
            alt="VENVL Logo" 
            className="h-12 w-12"
          />
          <span className="text-3xl font-bold text-gray-900">VENVL</span>
        </div>
        <p className="text-center text-gray-600 text-lg">Premium Rental Experience</p>
      </div>

      {/* Auth Type Selector */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={authType === 'signin' ? 'default' : 'outline'}
            onClick={() => handleAuthTypeChange('signin')}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Mail className="h-5 w-5" />
            <span className="text-sm">Sign In</span>
          </Button>
          <Button
            variant={authType === 'guest-signup' ? 'default' : 'outline'}
            onClick={() => handleAuthTypeChange('guest-signup')}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <User className="h-5 w-5" />
            <span className="text-sm">Join as Guest</span>
          </Button>
          <Button
            variant={authType === 'host-signup' ? 'default' : 'outline'}
            onClick={() => handleAuthTypeChange('host-signup')}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Building2 className="h-5 w-5" />
            <span className="text-sm">Become Host</span>
          </Button>
          <Button
            variant={authType === 'admin-login' ? 'default' : 'outline'}
            onClick={() => handleAuthTypeChange('admin-login')}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Shield className="h-5 w-5" />
            <span className="text-sm">Admin</span>
          </Button>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-black/5 rounded-full">
                {getAuthTypeIcon()}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {getAuthTypeTitle()}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {getAuthTypeDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authType === 'signin' || authType === 'admin-login' ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <Label htmlFor="signin-email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signin-password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-black focus:ring-black"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : `Sign In${authType === 'admin-login' ? ' as Admin' : ''}`}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-700 font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="mt-1 h-12 border-gray-200 focus:border-black focus:ring-black"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-700 font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="mt-1 h-12 border-gray-200 focus:border-black focus:ring-black"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (min 6 characters)"
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-black focus:ring-black"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium" 
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 
                    authType === 'host-signup' ? 'Start Hosting' : 'Join VENVL'
                  }
                </Button>
              </form>
            )}
            
            {/* Test Accounts Info */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-sm mb-3 text-blue-900">Test Accounts</h4>
              <div className="text-xs space-y-2 text-blue-700">
                <div className="flex justify-between">
                  <span className="font-medium">Admin:</span>
                  <span>admin@venvl.com / Password123</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Host:</span>
                  <span>host@venvl.com / Password123</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Guest:</span>
                  <span>guest@venvl.com / Password123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
