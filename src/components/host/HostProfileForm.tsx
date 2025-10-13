import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Save,
  Building2,
  Shield,
  Lock,
  Upload,
  FileText,
  CheckCircle,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HostProfile {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
  company_name: string;
  commercial_register: string;
  tax_card: string;
  business_verification_status: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  commercial_register_document?: string;
  tax_card_document?: string;
}

const HostProfileForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<HostProfile>({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: '',
    company_name: '',
    commercial_register: '',
    tax_card: '',
    business_verification_status: 'not_submitted',
    commercial_register_document: '',
    tax_card_document: '',
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingCommercial, setUploadingCommercial] = useState(false);
  const [uploadingTax, setUploadingTax] = useState(false);


  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          const newProfile = {
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || user?.email || '',
            avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
            company_name: data.company_name || '',
            commercial_register: data.commercial_register || '',
            tax_card: data.tax_card || '',
            business_verification_status: data.business_verification_status || 'not_submitted',
            commercial_register_document: data.commercial_register_document || '',
            tax_card_document: data.tax_card_document || '',
          };

          // Check if verification status changed to verified
          if (profile.business_verification_status === 'pending' &&
              newProfile.business_verification_status === 'verified') {
            toast.success('🎉 Congratulations! Your business has been verified by our admin team!', {
              duration: 6000
            });
          }

          // Check if verification was rejected
          if (profile.business_verification_status === 'pending' &&
              newProfile.business_verification_status === 'rejected') {
            toast.error('Your business verification was rejected. Please contact support for more information.', {
              duration: 8000
            });
          }

          setProfile(newProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    // Set up real-time subscription for profile changes
    const subscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          const newData = payload.new as any;

          // Check if verification status changed to verified
          if (profile.business_verification_status === 'pending' &&
              newData.business_verification_status === 'verified') {
            toast.success('🎉 Congratulations! Your business has been verified by our admin team!', {
              duration: 6000
            });
          }

          // Check if verification was rejected
          if (profile.business_verification_status === 'pending' &&
              newData.business_verification_status === 'rejected') {
            toast.error('Your business verification was rejected. Please contact support for more information.', {
              duration: 8000
            });
          }

          setProfile(prev => ({
            ...prev,
            business_verification_status: newData.business_verification_status || prev.business_verification_status,
            company_name: newData.company_name || prev.company_name,
            commercial_register: newData.commercial_register || prev.commercial_register,
            tax_card: newData.tax_card || prev.tax_card,
            commercial_register_document: newData.commercial_register_document || prev.commercial_register_document,
            tax_card_document: newData.tax_card_document || prev.tax_card_document,
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, profile.business_verification_status]);

  const handleInputChange = (field: keyof HostProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file: File, documentType: 'commercial' | 'tax') => {
    if (!user?.id) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const setUploading = documentType === 'commercial' ? setUploadingCommercial : setUploadingTax;
    setUploading(true);

    try {
      // First, try to create the business-documents bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const businessBucketExists = buckets?.some(bucket => bucket.id === 'business-documents');

      if (!businessBucketExists) {
        // Create the bucket programmatically
        const { error: createError } = await supabase.storage.createBucket('business-documents', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf']
        });

        if (createError) {
          console.warn('Could not create business-documents bucket:', createError);
        }
      }

      const fileName = `${user.id}/${documentType}_register_${Date.now()}.pdf`;

      // Try uploading to business-documents bucket
      const { data, error } = await supabase.storage
        .from('business-documents')
        .upload(fileName, file);

      if (error) {
        // If still failing, convert file to base64 and store in database
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;

        // Store base64 data directly in profile
        const fieldName = documentType === 'commercial' ? 'commercial_register_document' : 'tax_card_document';
        setProfile(prev => ({
          ...prev,
          [fieldName]: base64Data,
          business_verification_status: 'pending'
        }));

        toast.success(`${documentType === 'commercial' ? 'Commercial register' : 'Tax card'} document uploaded successfully!`);
        return;
      }

      // Get public URL for successful storage upload
      const { data: { publicUrl } } = supabase.storage
        .from('business-documents')
        .getPublicUrl(fileName);

      // Update profile with document URL and set status to pending
      const fieldName = documentType === 'commercial' ? 'commercial_register_document' : 'tax_card_document';
      setProfile(prev => ({
        ...prev,
        [fieldName]: publicUrl,
        business_verification_status: 'pending'
      }));

      toast.success(`${documentType === 'commercial' ? 'Commercial register' : 'Tax card'} document uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = (documentType: 'commercial' | 'tax') => {
    const fieldName = documentType === 'commercial' ? 'commercial_register_document' : 'tax_card_document';
    setProfile(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    toast.success('Document removed');
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      let emailChangeInitiated = false;

      // Update email in Supabase Auth if it has changed
      if (profile.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profile.email
        });

        if (emailError) {
          throw emailError;
        } else {
          emailChangeInitiated = true;
          toast.success('Email confirmation sent to your new email address. Please confirm to complete the change.');
        }
      }

      // Prepare update data with only basic fields initially
      const updateData: any = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: emailChangeInitiated ? user.email : profile.email, // Keep current email until confirmed
        updated_at: new Date().toISOString(),
      };

      // Add business fields only if they exist in the schema
      try {
        // Test if business fields exist by doing a select first
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('company_name, commercial_register, tax_card, business_verification_status, commercial_register_document, tax_card_document')
          .eq('id', user.id)
          .limit(1)
          .single();

        if (!testError) {
          // If no error, the columns exist, so we can include them
          updateData.company_name = profile.company_name;
          updateData.commercial_register = profile.commercial_register;
          updateData.tax_card = profile.tax_card;
          updateData.business_verification_status = profile.business_verification_status;
          updateData.commercial_register_document = profile.commercial_register_document;
          updateData.tax_card_document = profile.tax_card_document;
        }
      } catch (schemaError) {
        console.warn('Business verification columns not available yet. Saving basic profile only.');
        toast.info('Business verification features require database update. Contact admin.');
      }

      // Update profile information
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      if (!emailChangeInitiated) {
        toast.success('Profile updated successfully!');
      }

      // Reset form email to current auth email if change was initiated
      if (emailChangeInitiated) {
        setProfile(prev => ({ ...prev, email: user.email || '' }));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || 'Host';

  return (
    <div className="space-y-6">

      {/* Profile Form */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="rounded-xl"
            />
            <p className="text-sm text-gray-500 mt-1">
              Note: Email changes require confirmation. You'll receive a confirmation link at your new email address.
            </p>
          </div>

          {/* Save Button for Personal Info */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white hover:bg-gray-800 rounded-2xl px-8 py-3"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            {/* Prominent Verification Status Badge */}
            <Badge
              variant={
                profile.business_verification_status === 'verified' ? 'default' :
                profile.business_verification_status === 'pending' ? 'secondary' :
                profile.business_verification_status === 'rejected' ? 'destructive' : 'outline'
              }
              className={`text-sm px-3 py-1 ${
                profile.business_verification_status === 'verified' ? 'bg-green-500 hover:bg-green-600 text-white' :
                profile.business_verification_status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                profile.business_verification_status === 'rejected' ? 'bg-red-500 hover:bg-red-600 text-white' : ''
              }`}
            >
              {profile.business_verification_status === 'verified' && '✓ Business Verified'}
              {profile.business_verification_status === 'pending' && '⏳ Under Review'}
              {profile.business_verification_status === 'rejected' && '✗ Verification Rejected'}
              {profile.business_verification_status === 'not_submitted' && '📋 Verification Required'}
            </Badge>
          </div>
          {/* Status Description */}
          {profile.business_verification_status === 'verified' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-green-800 font-medium">
                🎉 Congratulations! Your business has been successfully verified by our admin team.
                You now have full access to all host features.
              </p>
            </div>
          )}
          {profile.business_verification_status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-yellow-800 font-medium">
                ⏳ Your business verification is currently under review.
                Our admin team will review your documents and notify you of the result.
              </p>
            </div>
          )}
          {profile.business_verification_status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-red-800 font-medium">
                ❌ Your business verification was rejected.
                Please contact our support team for more information or resubmit your documents.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={profile.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="e.g., ABC Property Management LLC"
              className="rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="commercial_register">Commercial Register Number</Label>
            <Input
              id="commercial_register"
              value={profile.commercial_register}
              onChange={(e) => handleInputChange('commercial_register', e.target.value)}
              placeholder="e.g., CR-123456789"
              className="rounded-xl"
            />
          </div>

          {/* Commercial Register Document Upload */}
          <div className="space-y-3">
            <Label>Commercial Register Document (PDF)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-gray-400 transition-colors">
              {profile.commercial_register_document ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Commercial Register Uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (profile.commercial_register_document?.startsWith('data:')) {
                          // Handle base64 data
                          const link = document.createElement('a');
                          link.href = profile.commercial_register_document;
                          link.download = 'commercial_register.pdf';
                          link.click();
                        } else {
                          // Handle URL
                          window.open(profile.commercial_register_document, '_blank');
                        }
                      }}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveDocument('commercial')}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload Commercial Register PDF</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'commercial');
                    }}
                    className="hidden"
                    id="commercial-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('commercial-upload')?.click()}
                    disabled={uploadingCommercial}
                    className="text-sm"
                  >
                    {uploadingCommercial ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-3 w-3" />
                        Choose PDF File
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="tax_card">Tax Card Number</Label>
            <Input
              id="tax_card"
              value={profile.tax_card}
              onChange={(e) => handleInputChange('tax_card', e.target.value)}
              placeholder="e.g., TC-987654321"
              className="rounded-xl"
            />
          </div>

          {/* Tax Card Document Upload */}
          <div className="space-y-3">
            <Label>Tax Card Document (PDF)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-gray-400 transition-colors">
              {profile.tax_card_document ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Tax Card Uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (profile.tax_card_document?.startsWith('data:')) {
                          // Handle base64 data
                          const link = document.createElement('a');
                          link.href = profile.tax_card_document;
                          link.download = 'tax_card.pdf';
                          link.click();
                        } else {
                          // Handle URL
                          window.open(profile.tax_card_document, '_blank');
                        }
                      }}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveDocument('tax')}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload Tax Card PDF</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'tax');
                    }}
                    className="hidden"
                    id="tax-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('tax-upload')?.click()}
                    disabled={uploadingTax}
                    className="text-sm"
                  >
                    {uploadingTax ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-3 w-3" />
                        Choose PDF File
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Verification Status */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5" />
              <Label>Business Verification Status</Label>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  profile.business_verification_status === 'verified' ? 'default' :
                  profile.business_verification_status === 'pending' ? 'secondary' :
                  profile.business_verification_status === 'rejected' ? 'destructive' : 'outline'
                }
                className={
                  profile.business_verification_status === 'verified' ? 'bg-green-500 hover:bg-green-600' :
                  profile.business_verification_status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  profile.business_verification_status === 'rejected' ? 'bg-red-500 hover:bg-red-600' : ''
                }
              >
                {profile.business_verification_status === 'verified' && '✓ Verified'}
                {profile.business_verification_status === 'pending' && '⏳ Pending Review'}
                {profile.business_verification_status === 'rejected' && '✗ Rejected'}
                {profile.business_verification_status === 'not_submitted' && '📋 Not Submitted'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {profile.business_verification_status === 'verified' && 'Your business has been verified.'}
              {profile.business_verification_status === 'pending' && 'Your business verification is under review.'}
              {profile.business_verification_status === 'rejected' && 'Your business verification was rejected. Please contact support.'}
              {profile.business_verification_status === 'not_submitted' && 'Submit your business documents for verification.'}
            </p>
          </div>

          {/* Save Button for Business Info */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white hover:bg-gray-800 rounded-2xl px-8 py-3"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Business Info
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Change Password Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-2xl px-8 py-3"
            >
              {changingPassword ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HostProfileForm;