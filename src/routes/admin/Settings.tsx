import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Save, 
  Globe, 
  Mail, 
  DollarSign, 
  Shield,
  Palette,
  Bell,
  Database,
  AlertTriangle
} from 'lucide-react';

interface PlatformSettings {
  // General Settings
  platform_name: string;
  platform_description: string;
  contact_email: string;
  support_email: string;
  
  // Business Settings
  commission_rate: number;
  currency: string;
  minimum_booking_amount: number;
  booking_cancellation_hours: number;
  
  // Feature Toggles
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_notifications: boolean;
  auto_approve_properties: boolean;
  
  // SEO Settings
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  
  // Legal Settings
  terms_of_service: string;
  privacy_policy: string;
  
  // Notification Settings
  admin_notification_email: string;
  booking_notification_enabled: boolean;
  review_notification_enabled: boolean;
}

const GlobalSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'VENVL Rentals Hub',
    platform_description: 'Premium vacation rental marketplace',
    contact_email: 'contact@venvl.com',
    support_email: 'support@venvl.com',
    commission_rate: 10,
    currency: 'USD',
    minimum_booking_amount: 50,
    booking_cancellation_hours: 24,
    maintenance_mode: false,
    registration_enabled: true,
    email_notifications: true,
    auto_approve_properties: false,
    meta_title: 'VENVL - Premium Vacation Rentals',
    meta_description: 'Discover and book premium vacation rentals worldwide',
    meta_keywords: 'vacation rentals, booking, travel, accommodation',
    terms_of_service: '',
    privacy_policy: '',
    admin_notification_email: 'admin@venvl.com',
    booking_notification_enabled: true,
    review_notification_enabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;

      // Convert array of settings to object
      const settingsObject: any = {};
      data?.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });

      // Merge with defaults
      setSettings(prev => ({ ...prev, ...settingsObject }));
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load platform settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Convert settings object to array format for database
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        category: getCategoryForKey(key),
        description: getDescriptionForKey(key),
      }));

      // Delete existing settings and insert new ones
      await supabase.from('platform_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error } = await supabase
        .from('platform_settings')
        .insert(settingsArray);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('log_admin_action', {
        p_action: 'platform_settings_updated',
        p_resource_type: 'settings',
        p_metadata: { updated_keys: Object.keys(settings) }
      });

      toast({
        title: "Success",
        description: "Platform settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save platform settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryForKey = (key: string): string => {
    if (key.includes('email') || key.includes('notification')) return 'notifications';
    if (key.includes('meta') || key.includes('seo')) return 'seo';
    if (key.includes('commission') || key.includes('currency') || key.includes('booking')) return 'business';
    if (key.includes('maintenance') || key.includes('registration') || key.includes('auto_approve')) return 'features';
    if (key.includes('terms') || key.includes('privacy')) return 'legal';
    return 'general';
  };

  const getDescriptionForKey = (key: string): string => {
    const descriptions: Record<string, string> = {
      platform_name: 'Name of the platform displayed to users',
      platform_description: 'Short description of the platform',
      commission_rate: 'Platform commission percentage on bookings',
      maintenance_mode: 'Enable maintenance mode to restrict access',
      auto_approve_properties: 'Automatically approve new property listings',
      // Add more as needed
    };
    return descriptions[key] || '';
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Global Settings</h1>
          <p className="text-muted-foreground mt-2">Configure platform-wide settings and preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>Basic platform information and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                value={settings.platform_name}
                onChange={(e) => updateSetting('platform_name', e.target.value)}
                placeholder="Enter platform name"
              />
            </div>
            <div>
              <Label htmlFor="platform_description">Platform Description</Label>
              <Textarea
                id="platform_description"
                value={settings.platform_description}
                onChange={(e) => updateSetting('platform_description', e.target.value)}
                placeholder="Enter platform description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => updateSetting('contact_email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => updateSetting('support_email', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Business Settings</span>
            </CardTitle>
            <CardDescription>Revenue and booking configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={settings.commission_rate}
                onChange={(e) => updateSetting('commission_rate', parseFloat(e.target.value) || 0)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
                placeholder="USD"
              />
            </div>
            <div>
              <Label htmlFor="minimum_booking_amount">Minimum Booking Amount</Label>
              <Input
                id="minimum_booking_amount"
                type="number"
                min="0"
                value={settings.minimum_booking_amount}
                onChange={(e) => updateSetting('minimum_booking_amount', parseInt(e.target.value) || 0)}
                placeholder="50"
              />
            </div>
            <div>
              <Label htmlFor="booking_cancellation_hours">Cancellation Hours</Label>
              <Input
                id="booking_cancellation_hours"
                type="number"
                min="0"
                value={settings.booking_cancellation_hours}
                onChange={(e) => updateSetting('booking_cancellation_hours', parseInt(e.target.value) || 0)}
                placeholder="24"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Feature Toggles</span>
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable access to the platform</p>
              </div>
              <Switch
                id="maintenance_mode"
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="registration_enabled">User Registration</Label>
                <p className="text-sm text-muted-foreground">Allow new users to register</p>
              </div>
              <Switch
                id="registration_enabled"
                checked={settings.registration_enabled}
                onCheckedChange={(checked) => updateSetting('registration_enabled', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_approve_properties">Auto-approve Properties</Label>
                <p className="text-sm text-muted-foreground">Automatically approve new listings</p>
              </div>
              <Switch
                id="auto_approve_properties"
                checked={settings.auto_approve_properties}
                onCheckedChange={(checked) => updateSetting('auto_approve_properties', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>Configure email notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin_notification_email">Admin Notification Email</Label>
              <Input
                id="admin_notification_email"
                type="email"
                value={settings.admin_notification_email}
                onChange={(e) => updateSetting('admin_notification_email', e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="booking_notification_enabled">Booking Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify users about booking updates</p>
                </div>
                <Switch
                  id="booking_notification_enabled"
                  checked={settings.booking_notification_enabled}
                  onCheckedChange={(checked) => updateSetting('booking_notification_enabled', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>SEO Settings</span>
            </CardTitle>
            <CardDescription>Search engine optimization configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={settings.meta_title}
                onChange={(e) => updateSetting('meta_title', e.target.value)}
                placeholder="Platform meta title"
              />
            </div>
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={settings.meta_description}
                onChange={(e) => updateSetting('meta_description', e.target.value)}
                placeholder="Platform meta description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                value={settings.meta_keywords}
                onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Legal Documents</span>
            </CardTitle>
            <CardDescription>Terms of service and privacy policy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="terms_of_service">Terms of Service</Label>
              <Textarea
                id="terms_of_service"
                value={settings.terms_of_service}
                onChange={(e) => updateSetting('terms_of_service', e.target.value)}
                placeholder="Enter terms of service content..."
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="privacy_policy">Privacy Policy</Label>
              <Textarea
                id="privacy_policy"
                value={settings.privacy_policy}
                onChange={(e) => updateSetting('privacy_policy', e.target.value)}
                placeholder="Enter privacy policy content..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Banner for Maintenance Mode */}
      {settings.maintenance_mode && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Maintenance Mode is Enabled</span>
            </div>
            <p className="text-sm text-orange-700 mt-2">
              The platform is currently in maintenance mode. Users will not be able to access the site.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSettings;