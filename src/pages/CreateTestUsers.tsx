
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, User, Building2, Shield, CheckCircle } from 'lucide-react';

const CreateTestUsers = () => {
  const [loading, setLoading] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  const testUsers = [
    {
      email: 'guest@venvl.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Guest',
      role: 'guest' as const,
      icon: <User className="h-5 w-5" />,
      color: 'bg-blue-600'
    },
    {
      email: 'host@venvl.com',
      password: 'Password123',
      firstName: 'Jane',
      lastName: 'Host',
      role: 'host' as const,
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-green-600'
    },
    {
      email: 'admin@venvl.com',
      password: 'Password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' as const,
      icon: <Shield className="h-5 w-5" />,
      color: 'bg-red-600'
    }
  ];

  const createUser = async (userInfo: typeof testUsers[0]) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      console.log('Creating user with role:', userInfo.role);
      
      const { data, error } = await supabase.auth.signUp({
        email: userInfo.email,
        password: userInfo.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: userInfo.firstName,
            last_name: userInfo.lastName,
            role: userInfo.role,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`User ${userInfo.email} already exists, skipping...`);
          return { success: true, message: 'User already exists' };
        }
        throw error;
      }

      // If user is created successfully, ensure profile is created with correct role
      if (data.user && data.user.id) {
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by trigger
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileCheckError && profileCheckError.code === 'PGRST116') {
          // Profile doesn't exist, create it manually
          console.log('Creating profile manually for user:', data.user.id);
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              first_name: userInfo.firstName,
              last_name: userInfo.lastName,
              role: userInfo.role,
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw new Error('Profile creation failed');
          }
        } else if (existingProfile && existingProfile.role !== userInfo.role) {
          // Profile exists but role is wrong, update it
          console.log('Updating profile role for user:', data.user.id);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: userInfo.role })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Error updating profile role:', updateError);
          }
        }
      }

      return { success: true, message: 'User created successfully' };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: error.message };
    }
  };

  const createAllUsers = async () => {
    setLoading(true);
    const results = [];

    for (const userInfo of testUsers) {
      try {
        const result = await createUser(userInfo);
        if (result.success) {
          results.push(userInfo.email);
          toast.success(`${userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)} user created: ${userInfo.email}`);
        } else {
          toast.error(`Failed to create ${userInfo.role} user: ${result.message}`);
        }
      } catch (error) {
        toast.error(`Error creating ${userInfo.role} user: ${error.message}`);
      }
    }

    setCreatedUsers(results);
    setLoading(false);

    if (results.length > 0) {
      toast.success(`Successfully created ${results.length} test users!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create Test Users
          </h1>
          <p className="text-gray-600">
            Create the default test users for the VENVL platform with proper roles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testUsers.map((user) => (
            <Card key={user.email} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${user.color} text-white`}>
                    {user.icon}
                  </div>
                  <span className="capitalize">{user.role} User</span>
                  {createdUsers.includes(user.email) && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-gray-600">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Password:</strong> {user.password}</div>
                  <div><strong>Name:</strong> {user.firstName} {user.lastName}</div>
                  <div><strong>Role:</strong> {user.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            onClick={createAllUsers}
            disabled={loading}
            className="bg-black hover:bg-gray-800 text-white px-8 py-3"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : (
              'Create All Test Users'
            )}
          </Button>
        </div>

        {createdUsers.length > 0 && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              ✅ Successfully Created Users:
            </h3>
            <ul className="space-y-1">
              {createdUsers.map((email) => (
                <li key={email} className="text-green-700">• {email}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-green-600">
              You can now use these accounts to test the different user roles in the platform.
            </p>
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            📋 Next Steps:
          </h3>
          <ul className="space-y-2 text-blue-700">
            <li>• After creating users, you can sign in with any of the test accounts</li>
            <li>• Each user will be redirected to their appropriate dashboard based on their role</li>
            <li>• Guest users → /guest/bookings</li>
            <li>• Host users → /host/dashboard</li>
            <li>• Admin users → /admin</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateTestUsers;
