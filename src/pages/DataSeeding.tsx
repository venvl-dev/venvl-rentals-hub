
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Users, Home, Calendar, MessageSquare, Bell } from 'lucide-react';
import { toast } from 'sonner';

const DataSeeding = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const runTestScenario = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const { data, error } = await supabase.rpc('create_test_scenario');
      
      if (error) throw error;
      
      setResult(data);
      toast.success('Test scenario created successfully!');
    } catch (error) {
      console.error('Error creating test scenario:', error);
      toast.error('Failed to create test scenario');
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedPropertiesForHost = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user found');

      const { error } = await supabase.rpc('seed_sample_properties_for_host', {
        host_user_id: user.id
      });
      
      if (error) throw error;
      
      toast.success('Sample properties created for your account!');
    } catch (error) {
      console.error('Error seeding properties:', error);
      toast.error('Failed to seed properties');
    } finally {
      setLoading(false);
    }
  };

  const seedBookingsForGuest = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user found');

      const { error } = await supabase.rpc('seed_sample_bookings_and_reviews', {
        guest_user_id: user.id
      });
      
      if (error) throw error;
      
      toast.success('Sample bookings and reviews created for your account!');
    } catch (error) {
      console.error('Error seeding bookings:', error);
      toast.error('Failed to seed bookings');
    } finally {
      setLoading(false);
    }
  };

  const seedNotifications = async () => {
    setLoading(true);
    
    try {
      // Get current user and their profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase.rpc('seed_sample_notifications', {
        user_id: user.id,
        user_role: profile?.role || 'guest'
      });
      
      if (error) throw error;
      
      toast.success('Sample notifications created for your account!');
    } catch (error) {
      console.error('Error seeding notifications:', error);
      toast.error('Failed to seed notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <Database className="h-8 w-8" />
            Data Seeding Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Populate your VENVL platform with realistic test data
          </p>
        </div>

        <div className="grid gap-6">
          {/* Complete Test Scenario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Complete Test Scenario
              </CardTitle>
              <CardDescription>
                Creates a complete test environment with properties, bookings, reviews, and notifications.
                Requires at least one host and one guest user to exist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runTestScenario} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Test Scenario...
                  </>
                ) : (
                  'Create Complete Test Scenario'
                )}
              </Button>
              
              {result && (
                <Alert>
                  <AlertDescription>{result}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Individual Seeding Options */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Seed Properties
                </CardTitle>
                <CardDescription>
                  Add sample properties to your host account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={seedPropertiesForHost} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sample Properties'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Seed Bookings
                </CardTitle>
                <CardDescription>
                  Add sample bookings and reviews to your guest account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={seedBookingsForGuest} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sample Bookings'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Seed Notifications
                </CardTitle>
                <CardDescription>
                  Add sample notifications to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={seedNotifications} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sample Notifications'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4>How to use this seeding dashboard:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>First, create test users through the authentication system:
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Create at least one user with the "host" role</li>
                      <li>Create at least one user with the "guest" role</li>
                      <li>Optionally create an "admin" user</li>
                    </ul>
                  </li>
                  <li>Run the "Complete Test Scenario" to populate all data at once</li>
                  <li>Or use individual seeding options to add specific types of data</li>
                  <li>Navigate through the app to see your seeded data in action</li>
                </ol>
                
                <h4 className="mt-6">What gets created:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Properties:</strong> 3 diverse property listings (apartment, studio, villa)</li>
                  <li><strong>Bookings:</strong> Past completed bookings and future confirmed bookings</li>
                  <li><strong>Reviews:</strong> 5-star reviews for completed stays</li>
                  <li><strong>Notifications:</strong> Role-appropriate notifications for each user type</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataSeeding;
