
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const SystemSetup = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const initializeSystem = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('initialize-system');
      
      if (error) throw error;
      
      setResult(data);
      
      if (data.success) {
        toast.success('System initialized successfully!');
      } else {
        toast.error('System initialization failed');
      }
    } catch (error) {
      console.error('Error initializing system:', error);
      toast.error('Failed to initialize system');
      setResult({ 
        success: false, 
        error: error.message,
        message: 'System initialization failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <Settings className="h-8 w-8" />
            VENVL System Setup
          </h1>
          <p className="text-lg text-gray-600">
            Initialize your VENVL platform with default users and demo data
          </p>
        </div>

        <div className="grid gap-6">
          {/* Main Setup Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Users className="h-5 w-5" />
                System Initialization
              </CardTitle>
              <CardDescription className="text-blue-700">
                This will create default users and populate the platform with demo data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">What will be created:</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>Super Admin:</strong> superadmin@venvl.com (password: SuperAdmin123!)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>Host User:</strong> host@venvl.com (password: Host123!)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>Guest User:</strong> guest@venvl.com (password: Guest123!)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>Demo Data:</strong> Properties, bookings, reviews, and notifications
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={initializeSystem} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing System...
                  </>
                ) : (
                  'Initialize VENVL System'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  Initialization Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                    {result.message}
                  </AlertDescription>
                </Alert>

                {result.users_created !== undefined && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Summary:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>Users created: {result.users_created}</li>
                      {result.demo_data_result && (
                        <li>Demo data: {result.demo_data_result}</li>
                      )}
                    </ul>
                  </div>
                )}

                {result.results && result.results.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">User Creation Details:</h4>
                    {result.results.map((userResult: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{userResult.email} ({userResult.role})</span>
                        {userResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-red-600">{userResult.error}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {result.success && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Use the login credentials above to access different user roles</li>
                      <li>• Explore the demo properties and bookings</li>
                      <li>• Test the booking and review system</li>
                      <li>• Access the admin panel with the super admin account</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>One-time setup:</strong> This initialization can only be run once. 
                If users already exist in the system, this will not create duplicates.
              </p>
              <p>
                <strong>Default passwords:</strong> The default passwords are provided for 
                demo purposes. Change them after first login for security.
              </p>
              <p>
                <strong>Demo data:</strong> The system will create sample properties, 
                bookings, reviews, and notifications to help you explore the platform.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemSetup;
