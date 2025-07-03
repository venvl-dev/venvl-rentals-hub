
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Database, Trash2, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface InitializationResult {
  success: boolean;
  error?: string;
  users_created?: number;
  demo_data_result?: string;
  results?: Array<{
    email: string;
    role: string;
    success: boolean;
  }>;
}

const SystemSetup = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [initializationResult, setInitializationResult] = useState<InitializationResult | null>(null);

  const clearAllData = async () => {
    setIsClearing(true);
    try {
      console.log('Starting data cleanup...');
      
      // Delete all existing data in correct order
      const tables = ['reviews', 'bookings', 'properties', 'notifications', 'profiles'] as const;
      
      for (const table of tables) {
        console.log(`Clearing ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error && !error.message.includes('No rows')) {
          console.error(`Error clearing ${table}:`, error);
        }
      }

      // Clear auth users (this will cascade to profiles due to foreign key)
      console.log('Clearing auth users...');
      const { data: users } = await supabase.auth.admin.listUsers();
      
      if (users.users && users.users.length > 0) {
        for (const user of users.users) {
          await supabase.auth.admin.deleteUser(user.id);
        }
      }

      toast.success('All existing data cleared successfully');
      setInitializationResult(null);
    } catch (error) {
      console.error('Error clearing data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Error clearing data: ' + errorMessage);
    } finally {
      setIsClearing(false);
    }
  };

  const initializeSystem = async () => {
    setIsInitializing(true);
    setInitializationResult(null);

    try {
      console.log('Calling initialize-system edge function...');
      
      const { data, error } = await supabase.functions.invoke('initialize-system', {
        body: {}
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Initialization result:', data);
      setInitializationResult(data);

      if (data.success) {
        toast.success('System initialized successfully with demo data!');
      } else {
        toast.error('System initialization failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error initializing system:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Error initializing system: ' + errorMessage);
      setInitializationResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Setup & Management</h1>
          <p className="text-gray-600">Initialize VENVL with default users and demo data automatically</p>
        </div>

        <div className="grid gap-6">
          {/* System Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Management
              </CardTitle>
              <CardDescription>
                Manage the VENVL system initialization and data cleanup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={clearAllData}
                  disabled={isClearing || isInitializing}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Clear All Data
                </Button>
                
                <Button
                  onClick={initializeSystem}
                  disabled={isInitializing || isClearing}
                  className="flex items-center gap-2"
                >
                  {isInitializing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Initialize System + Demo Data
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Clear All Data:</strong> Removes all users, properties, bookings, and reviews from the database.
                  <br />
                  <strong>Initialize System + Demo Data:</strong> Creates default users (super admin, host, guest) and automatically seeds demo properties, bookings, and reviews.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Default Users Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Default User Accounts
              </CardTitle>
              <CardDescription>
                These accounts will be created during system initialization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Super Admin</h3>
                    <Badge variant="destructive">Super Admin</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">superadmin@venvl.com</p>
                  <p className="text-sm text-gray-500">SuperAdmin123!</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Host</h3>
                    <Badge variant="secondary">Host</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">host@venvl.com</p>
                  <p className="text-sm text-gray-500">Host123!</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Guest</h3>
                    <Badge variant="outline">Guest</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">guest@venvl.com</p>
                  <p className="text-sm text-gray-500">Guest123!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Initialization Results */}
          {initializationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(initializationResult.success)}
                  Initialization Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Status:</span>
                    <Badge variant={initializationResult.success ? "default" : "destructive"}>
                      {initializationResult.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  
                  {initializationResult.users_created !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Users Created:</span>
                      <Badge variant="secondary">{initializationResult.users_created}</Badge>
                    </div>
                  )}
                  
                  {initializationResult.demo_data_result && (
                    <div>
                      <span className="font-medium">Demo Data:</span>
                      <p className="text-sm text-gray-600 mt-1">{initializationResult.demo_data_result}</p>
                    </div>
                  )}
                  
                  {initializationResult.results && initializationResult.results.length > 0 && (
                    <div>
                      <span className="font-medium">User Creation Details:</span>
                      <div className="mt-2 space-y-2">
                        {initializationResult.results.map((result, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{result.email}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{result.role}</Badge>
                              {getStatusIcon(result.success)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {initializationResult.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{initializationResult.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSetup;
