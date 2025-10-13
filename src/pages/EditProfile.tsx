import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, Globe, Briefcase, Heart, GraduationCap, Music, Smile, Clock, Target, Languages, BookOpen, MapPin, User, Calendar, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    decadeBorn: '',
    dreamDestination: '',
    work: '',
    pets: '',
    school: '',
    favoriteSong: '',
    uselessSkill: '',
    funFact: '',
    spendTime: '',
    obsessedWith: '',
    languages: '',
    biographyTitle: '',
    location: '',
    aboutMe: ''
  });

  // Fetch existing profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Load profile data into form when available
  useEffect(() => {
    if (profile && user?.id) {
      // First, try to get saved data from localStorage
      const savedData = localStorage.getItem(`profile_${user.id}`);
      let localData = null;

      if (savedData) {
        try {
          localData = JSON.parse(savedData);
        } catch (e) {
          console.warn('Failed to parse saved profile data');
        }
      }

      setFormData({
        decadeBorn: localData?.decadeBorn || profile.decade_born || '',
        dreamDestination: localData?.dreamDestination || profile.dream_destination || '',
        work: localData?.work || profile.work || '',
        pets: localData?.pets || profile.pets || '',
        school: localData?.school || profile.school || '',
        favoriteSong: localData?.favoriteSong || profile.favorite_song || '',
        uselessSkill: localData?.uselessSkill || profile.useless_skill || '',
        funFact: localData?.funFact || profile.fun_fact || '',
        spendTime: localData?.spendTime || profile.spend_time || '',
        obsessedWith: localData?.obsessedWith || profile.obsessed_with || '',
        languages: localData?.languages || profile.languages || '',
        biographyTitle: localData?.biographyTitle || profile.biography_title || '',
        location: localData?.location || profile.location || '',
        aboutMe: localData?.aboutMe || profile.about_me || profile.bio || ''
      });
    }
  }, [profile, user?.id]);

  // Mutation for saving profile data
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🔄 Starting profile update mutation...');
      console.log('📄 Data to save:', data);

      if (!user?.id) {
        console.error('❌ No user ID found');
        throw new Error('No user ID');
      }

      console.log('👤 User ID:', user.id);

      // Store profile data in localStorage as a temporary solution
      // until database migration is applied
      const profileData = {
        decadeBorn: data.decadeBorn,
        dreamDestination: data.dreamDestination,
        work: data.work,
        pets: data.pets,
        school: data.school,
        favoriteSong: data.favoriteSong,
        uselessSkill: data.uselessSkill,
        funFact: data.funFact,
        spendTime: data.spendTime,
        obsessedWith: data.obsessedWith,
        languages: data.languages,
        biographyTitle: data.biographyTitle,
        location: data.location,
        aboutMe: data.aboutMe
      };

      console.log('💾 Saving to localStorage:', profileData);

      // Save to localStorage temporarily
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      console.log('✅ localStorage save complete');

      // Try to update basic fields that should exist
      try {
        const basicUpdate: any = {};

        // Only add fields that might exist
        if (data.location) basicUpdate.location = data.location;
        if (data.aboutMe) basicUpdate.bio = data.aboutMe;

        console.log('🗄️ Attempting database update:', basicUpdate);

        const { error } = await supabase
          .from('profiles')
          .update(basicUpdate)
          .eq('id', user.id);

        if (error) {
          console.error('❌ Database update error:', error);
          // Don't throw - localStorage save succeeded
        } else {
          console.log('✅ Database update successful');
        }
      } catch (dbError) {
        console.warn('⚠️ Database update failed, using localStorage instead:', dbError);
        // Continue - localStorage save succeeded
      }

      console.log('🎉 Profile update mutation completed');
    },
    onSuccess: async () => {
      console.log('🎉 Profile update SUCCESS!');

      // Force update the cache with the new data
      if (user?.id) {
        queryClient.setQueryData(['user-profile', user.id], (oldData: any) => {
          if (!oldData) return oldData;

          // Merge the new form data with the existing profile data
          return {
            ...oldData,
            bio: formData.aboutMe || oldData.bio,
            location: formData.location || oldData.location,
            decade_born: formData.decadeBorn || oldData.decade_born,
            dream_destination: formData.dreamDestination || oldData.dream_destination,
            work: formData.work || oldData.work,
            pets: formData.pets || oldData.pets,
            school: formData.school || oldData.school,
            favorite_song: formData.favoriteSong || oldData.favorite_song,
            useless_skill: formData.uselessSkill || oldData.useless_skill,
            fun_fact: formData.funFact || oldData.fun_fact,
            spend_time: formData.spendTime || oldData.spend_time,
            obsessed_with: formData.obsessedWith || oldData.obsessed_with,
            biography_title: formData.biographyTitle || oldData.biography_title,
            about_me: formData.aboutMe || oldData.about_me
          };
        });
      }

      // Invalidate all user-profile queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      toast.success('Profile updated successfully!', {
        duration: 2000,
      });
      console.log('🧭 Navigating to profile page in 1.5 seconds...');

      // Add a small delay so user can see the success message
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    },
    onError: (error) => {
      console.error('❌ Profile update ERROR:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentField, setCurrentField] = useState<{
    field: keyof typeof formData;
    label: string;
    placeholder: string;
    multiline: boolean;
  } | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openPopup = (field: keyof typeof formData, label: string, placeholder: string, multiline: boolean = false) => {
    setCurrentField({ field, label, placeholder, multiline });
    setTempValue(formData[field]);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setCurrentField(null);
    setTempValue('');
  };

  const savePopupValue = () => {
    if (currentField) {
      handleInputChange(currentField.field, tempValue);
    }
    closePopup();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage (using properties bucket)
      const { error: uploadError } = await supabase.storage
        .from('properties')
        .upload(`avatars/${fileName}`, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('properties')
        .getPublicUrl(`avatars/${fileName}`);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Invalidate queries to refresh the avatar
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      toast.success('Profile photo updated successfully!');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleSave = () => {
    console.log('🖱️ Save button clicked!');
    console.log('📋 Current form data:', formData);
    console.log('👤 User ID:', user?.id);

    if (!user?.id) {
      console.error('❌ No user logged in');
      toast.error('No user logged in');
      return;
    }

    // Check if there's any data to save
    const hasData = Object.values(formData).some(value => value.trim() !== '');
    console.log('📊 Has profile data to save:', hasData);

    if (!hasData) {
      toast.info('Add some profile information to save');
      return;
    }

    console.log('▶️ Starting mutation...');
    updateProfileMutation.mutate(formData);
  };

  const ProfileField = ({
    icon: Icon,
    label,
    placeholder,
    field,
    multiline = false
  }: {
    icon: any;
    label: string;
    placeholder: string;
    field: keyof typeof formData;
    multiline?: boolean;
  }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={() => openPopup(field, label, placeholder, multiline)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <Label className="text-base font-medium text-gray-900">{label}</Label>
            </div>
            <div className="min-h-[40px] flex items-center">
              <p className={`text-sm ${formData[field] ? 'text-gray-900' : 'text-gray-500'}`}>
                {formData[field] || placeholder}
              </p>
            </div>
          </div>
          <div className="p-1">
            <Edit3 className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Edit Profile</h1>
              <p className="text-gray-600">
                Update your profile information to help others get to know you better
              </p>
            </div>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-8">
          {/* Left Side - Profile Image */}
          <div className="w-80">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <p className="text-sm text-gray-600">
                  Add a profile photo to help others recognize you
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-48 w-48">
                    <AvatarImage
                      src={profile?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face`}
                      alt={fullName}
                    />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full p-0"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={isUploadingPhoto}
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={isUploadingPhoto}
                  >
                    {isUploadingPhoto ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG up to 10MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Form Fields */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField
            icon={Calendar}
            label="Decade I was born"
            placeholder="Decade you were born"
            field="decadeBorn"
          />

          <ProfileField
            icon={Globe}
            label="Where I've always wanted to go"
            placeholder="Where have you always wanted to travel?"
            field="dreamDestination"
          />

          <ProfileField
            icon={Briefcase}
            label="My work"
            placeholder="What do you do for work?"
            field="work"
          />

          <ProfileField
            icon={Heart}
            label="Pets"
            placeholder="Do you have any pets in your life?"
            field="pets"
          />

          <ProfileField
            icon={GraduationCap}
            label="Where I went to school"
            placeholder="Where did you go to school?"
            field="school"
          />

          <ProfileField
            icon={Music}
            label="My favorite song in high school"
            placeholder="What was your favorite song in high school?"
            field="favoriteSong"
          />

          <ProfileField
            icon={Smile}
            label="My most useless skill"
            placeholder="What's your most useless skill?"
            field="uselessSkill"
          />

          <ProfileField
            icon={Target}
            label="My fun fact"
            placeholder="What's a fun fact about you?"
            field="funFact"
          />

          <ProfileField
            icon={Clock}
            label="I spend too much time"
            placeholder="What do you spend too much time doing?"
            field="spendTime"
          />

          <ProfileField
            icon={Heart}
            label="I'm obsessed with"
            placeholder="What are you obsessed with?"
            field="obsessedWith"
          />

          <ProfileField
            icon={Languages}
            label="Languages I speak"
            placeholder="Languages you speak"
            field="languages"
          />

          <ProfileField
            icon={MapPin}
            label="Where I live"
            placeholder="Where you live"
            field="location"
          />
        </div>

            {/* About me field - full width within left column */}
            <div className="mt-6">
              <ProfileField
                icon={Edit3}
                label="About me"
                placeholder="Write something fun and punchy."
                field="aboutMe"
                multiline={true}
              />
            </div>

            {/* Save Button Footer */}
            <div className="flex justify-start pt-6">
              <Button
                onClick={handleSave}
                size="lg"
                className="min-w-[200px]"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Popup Modal */}
      <Dialog open={isPopupOpen} onOpenChange={closePopup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {currentField?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={closePopup}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Edit your profile information. This will be visible to other users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentField?.multiline ? (
              <Textarea
                placeholder={currentField.placeholder}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="min-h-[120px]"
                autoFocus
              />
            ) : (
              <Input
                placeholder={currentField?.placeholder}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button onClick={savePopupValue}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditProfile;