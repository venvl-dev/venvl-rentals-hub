import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '../AdminLayout';
import { Loader2, TestTube } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
}

const emailSchema = z.object({
  smtp_host: z.string().nonempty('Host required'),
  smtp_port: z.coerce.number().min(1),
  smtp_user: z.string().nonempty('User required'),
  smtp_pass: z.string().optional(),
  smtp_secure: z.boolean().default(true),
});

type EmailFormValues = z.infer<typeof emailSchema>;

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [testingEmail, setTestingEmail] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setAuthorized(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (error || data?.role !== 'super_admin') {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    };
    checkRole();
  }, []);

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
    enabled: authorized === true,
  });

  const { data: smtpSettings } = useQuery({
    queryKey: ['smtp-settings'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        'get-smtp-settings',
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );
      if (error) throw error;
      return data as Partial<EmailFormValues>;
    },
    enabled: authorized === true,
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      smtp_host: '',
      smtp_port: 465,
      smtp_user: '',
      smtp_pass: '',
      smtp_secure: true,
    },
  });

  useEffect(() => {
    if (smtpSettings) {
      emailForm.reset({
        smtp_host: smtpSettings.smtp_host || '',
        smtp_port: smtpSettings.smtp_port || 465,
        smtp_user: smtpSettings.smtp_user || '',
        smtp_pass: '',
        smtp_secure: smtpSettings.smtp_secure ?? true,
      });
    }
  }, [smtpSettings]);

  const onSubmitEmail = (values: EmailFormValues) => {
    saveEmailSettings.mutate(values);
  };

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      let finalValue = value;
      if (key === 'smtp_pass' && value) {
        const { data: encrypted, error: encErr } = await supabase.rpc(
          'encrypt_sensitive_data',
          { data: value },
        );
        if (encErr) throw encErr;
        finalValue = encrypted;
      }

      const { error } = await supabase
        .from('platform_settings')
        .update({ value: finalValue, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action: 'update_setting',
        p_resource_type: 'platform_settings',
        p_metadata: { key, value },
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

  const saveEmailSettings = useMutation({
    mutationFn: async (values: EmailFormValues) => {
      const updates: { key: string; value: any }[] = [
        { key: 'smtp_host', value: values.smtp_host },
        { key: 'smtp_port', value: values.smtp_port },
        { key: 'smtp_user', value: values.smtp_user },
        { key: 'smtp_secure', value: values.smtp_secure },
      ];
      if (values.smtp_pass) {
        const { data: encrypted, error: encErr } = await supabase.rpc(
          'encrypt_sensitive_data',
          { data: values.smtp_pass },
        );
        if (encErr) throw encErr;
        updates.push({ key: 'smtp_pass', value: encrypted });
      }

      const { error } = await supabase.from('platform_settings').upsert(
        updates.map((u) => ({ ...u, updated_at: new Date().toISOString() })),
        { onConflict: 'key' },
      );

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'update_smtp_settings',
        p_resource_type: 'platform_settings',
        p_metadata: { keys: updates.map((u) => u.key) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-settings'] });
      toast.success('SMTP settings saved');
    },
    onError: () => toast.error('Failed to save SMTP settings'),
  });

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Get current user's email for test
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', session?.user?.id)
        .single();

      const testEmail =
        profile?.email ||
        session?.user?.email ||
        getSettingValue('admin_notification_email') ||
        getSettingValue('contact_email');

      if (!testEmail) {
        toast.error('No email address found for test');
        return;
      }

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: 'VENVL Test Email',
          html: `
            <h2>VENVL Test Email</h2>
            <p>This is a test email from the VENVL platform.</p>
            <p>Your SMTP configuration is working correctly!</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
            <hr>
            <p><small>VENVL Admin Panel</small></p>
          `,
          text: 'This is a test email from VENVL platform. Your SMTP configuration is working correctly!',
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'send_test_email',
        p_resource_type: 'email',
        p_metadata: { recipient: testEmail },
      });

      toast.success(`Test email sent successfully to ${testEmail}`);
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const getSettingValue = (key: string) => {
    const setting = settings?.find((s) => s.key === key);
    return setting?.value;
  };

  if (authorized === null || isLoading) {
    return (
      <AdminLayout title='Platform Settings'>
        <div className='flex items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      </AdminLayout>
    );
  }

  if (!authorized) {
    return (
      <AdminLayout title='Platform Settings'>
        <div className='p-6'>
          <Alert variant='destructive'>
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be a super admin to manage settings.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Platform Settings'>
      <div className='p-6'>
        <Tabs defaultValue='general' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='general'>General</TabsTrigger>
            <TabsTrigger value='commission'>Commission</TabsTrigger>
            <TabsTrigger value='booking'>Booking</TabsTrigger>
            <TabsTrigger value='system'>System</TabsTrigger>
            <TabsTrigger value='email'>Email</TabsTrigger>
          </TabsList>

          <TabsContent value='general' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic platform information
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='platform-name'>Platform Name</Label>
                  <Input
                    id='platform-name'
                    value={getSettingValue('platform_name') || ''}
                    onChange={(e) =>
                      handleSettingUpdate('platform_name', e.target.value)
                    }
                    placeholder='VENVL'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contact-email'>Contact Email</Label>
                  <Input
                    id='contact-email'
                    type='email'
                    value={getSettingValue('contact_email') || ''}
                    onChange={(e) =>
                      handleSettingUpdate('contact_email', e.target.value)
                    }
                    placeholder='support@venvl.com'
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='commission' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Commission Settings</CardTitle>
                <CardDescription>
                  Configure platform and host fees
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='platform-fee'>Platform Fee (%)</Label>
                  <Input
                    id='platform-fee'
                    type='number'
                    step='0.01'
                    min='0'
                    max='1'
                    value={getSettingValue('platform_fee') || 0}
                    onChange={(e) =>
                      handleSettingUpdate(
                        'platform_fee',
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='host-fee'>Host Fee (%)</Label>
                  <Input
                    id='host-fee'
                    type='number'
                    step='0.01'
                    min='0'
                    max='1'
                    value={getSettingValue('host_fee') || 0}
                    onChange={(e) =>
                      handleSettingUpdate(
                        'host_fee',
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='booking' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Booking Controls</CardTitle>
                <CardDescription>
                  Configure booking limits and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='max-properties'>
                    Max Properties per Host
                  </Label>
                  <Input
                    id='max-properties'
                    type='number'
                    min='1'
                    value={getSettingValue('max_properties_per_host') || 10}
                    onChange={(e) =>
                      handleSettingUpdate(
                        'max_properties_per_host',
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='system' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Control system-wide features</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label>Maintenance Mode</Label>
                    <div className='text-sm text-muted-foreground'>
                      Enable to put the platform in maintenance mode
                    </div>
                  </div>
                  <Switch
                    checked={getSettingValue('maintenance_mode') || false}
                    onCheckedChange={(checked) =>
                      handleSettingUpdate('maintenance_mode', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='email' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>
                  Configure SMTP settings for email notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form
                    onSubmit={emailForm.handleSubmit(onSubmitEmail)}
                    className='space-y-4'
                  >
                    <FormField
                      control={emailForm.control}
                      name='smtp_host'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder='smtp.example.com' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name='smtp_port'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input type='number' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name='smtp_user'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name='smtp_pass'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input type='password' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name='smtp_secure'
                      render={({ field }) => (
                        <FormItem className='flex items-center justify-between'>
                          <FormLabel>Use TLS</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className='flex items-center space-x-2 pt-2'>
                      <Button
                        type='submit'
                        disabled={saveEmailSettings.isPending}
                      >
                        {saveEmailSettings.isPending ? (
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                        type='button'
                        variant='outline'
                      >
                        {testingEmail ? (
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        ) : (
                          <TestTube className='h-4 w-4 mr-2' />
                        )}
                        Send Test Email
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
