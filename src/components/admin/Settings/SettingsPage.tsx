import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '../AdminLayout';
import { Loader2, TestTube } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
}

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [testingEmail, setTestingEmail] = useState(false);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as Setting[];
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      
      if (error) throw error;
      
      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action: 'update_setting',
        p_resource_type: 'platform_settings',
        p_metadata: { key, value }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update setting');
      console.error('Setting update error:', error);
    },
  });

  const handleSettingUpdate = (key: string, value: any) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: getSettingValue('admin_notification_email') || getSettingValue('contact_email'),
          subject: 'Test Email',
          text: 'This is a test email from VENVL.',
        },
      });

      if (error) throw error;

      toast.success('Test email sent successfully');
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };


  const getSettingValue = (key: string) => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Platform Settings">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Settings">
      <div className="p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic platform information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input
                    id="platform-name"
                    value={getSettingValue('platform_name') || ''}
                    onChange={(e) => handleSettingUpdate('platform_name', e.target.value)}
                    placeholder="VENVL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={getSettingValue('contact_email') || ''}
                    onChange={(e) => handleSettingUpdate('contact_email', e.target.value)}
                    placeholder="support@venvl.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Settings</CardTitle>
                <CardDescription>
                  Configure platform and host fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                  <Input
                    id="platform-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={getSettingValue('platform_fee') || 0}
                    onChange={(e) => handleSettingUpdate('platform_fee', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="host-fee">Host Fee (%)</Label>
                  <Input
                    id="host-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={getSettingValue('host_fee') || 0}
                    onChange={(e) => handleSettingUpdate('host_fee', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Controls</CardTitle>
                <CardDescription>
                  Configure booking limits and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-properties">Max Properties per Host</Label>
                  <Input
                    id="max-properties"
                    type="number"
                    min="1"
                    value={getSettingValue('max_properties_per_host') || 10}
                    onChange={(e) => handleSettingUpdate('max_properties_per_host', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Control system-wide features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable to put the platform in maintenance mode
                    </div>
                  </div>
                  <Switch
                    checked={getSettingValue('maintenance_mode') || false}
                    onCheckedChange={(checked) => handleSettingUpdate('maintenance_mode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure SMTP settings for email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={getSettingValue('smtp_host') || ''}
                    onChange={(e) => handleSettingUpdate('smtp_host', e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={getSettingValue('smtp_port') || 587}
                    onChange={(e) => handleSettingUpdate('smtp_port', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    value={getSettingValue('smtp_user') || ''}
                    onChange={(e) => handleSettingUpdate('smtp_user', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">SMTP Password</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    value={getSettingValue('smtp_pass') || ''}
                    onChange={(e) => handleSettingUpdate('smtp_pass', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Notification Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={getSettingValue('admin_notification_email') || ''}
                    onChange={(e) => handleSettingUpdate('admin_notification_email', e.target.value)}
                    placeholder="admin@venvl.com"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    variant="outline"
                  >
                    {testingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
