import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Calendar,
  MessageCircle,
  Clock,
  Camera,
  Languages,
  Heart,
  Edit3,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfileProps {
  userId?: string;
  isOwnProfile?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string;
  bio?: string;
  location?: string;
  languages?: string[];
  created_at: string;
  role: 'guest' | 'host' | 'super_admin';
  is_active: boolean;
  // Extended profile fields
  decade_born?: string;
  dream_destination?: string;
  work?: string;
  pets?: string;
  school?: string;
  favorite_song?: string;
  useless_skill?: string;
  fun_fact?: string;
  spend_time?: string;
  obsessed_with?: string;
  biography_title?: string;
  about_me?: string;
  host_stats?: {
    properties_count: number;
    response_rate: number;
    response_time: string;
    superhost: boolean;
  };
}


const UserProfile = ({ userId, isOwnProfile = false }: UserProfileProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('about');
  const profileId = userId || user?.id;

  // Fetch user profile
  const { data: profile, isLoading: profileLoading, refetch } = useQuery({
    queryKey: ['user-profile', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      // Load saved profile data from localStorage if available
      let localData = null;
      try {
        const savedData = localStorage.getItem(`profile_${profileId}`);
        console.log('🔍 UserProfile - Checking localStorage for profile_' + profileId);
        console.log('📦 Raw localStorage data:', savedData);
        if (savedData) {
          localData = JSON.parse(savedData);
          console.log('✅ Parsed localStorage data:', localData);
        } else {
          console.log('❌ No localStorage data found');
        }
      } catch (e) {
        console.warn('Failed to parse saved profile data:', e);
      }

      // Use actual profile data combined with localStorage data
      const extendedProfile: UserProfile = {
        ...data,
        avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
        bio: localData?.aboutMe || data.bio || data.about_me || "No bio available",
        location: localData?.location || data.location || "Location not specified",
        languages: data.languages ? data.languages.split(',').map(lang => lang.trim()) : [],
        // Extended profile fields from localStorage
        decade_born: localData?.decadeBorn || data.decade_born,
        dream_destination: localData?.dreamDestination || data.dream_destination,
        work: localData?.work || data.work,
        pets: localData?.pets || data.pets,
        school: localData?.school || data.school,
        favorite_song: localData?.favoriteSong || data.favorite_song,
        useless_skill: localData?.uselessSkill || data.useless_skill,
        fun_fact: localData?.funFact || data.fun_fact,
        spend_time: localData?.spendTime || data.spend_time,
        obsessed_with: localData?.obsessedWith || data.obsessed_with,
        biography_title: localData?.biographyTitle || data.biography_title,
        about_me: localData?.aboutMe || data.about_me,
        host_stats: data.role === 'host' ? {
          properties_count: 3,
          response_rate: 98,
          response_time: "Within an hour",
          superhost: true,
        } : undefined,
      };

      console.log('🎯 Final combined profile data:', extendedProfile);
      console.log('📊 Extended fields present:', {
        decade_born: extendedProfile.decade_born,
        work: extendedProfile.work,
        pets: extendedProfile.pets,
        fun_fact: extendedProfile.fun_fact
      });

      return extendedProfile;
    },
    enabled: !!profileId,
    staleTime: 0, // Always refetch when cache is invalidated
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Listen for localStorage changes and refetch the profile
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `profile_${profileId}` && e.newValue !== e.oldValue) {
        console.log('🔄 localStorage changed for profile, refetching...');
        refetch();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [profileId, refetch]);


  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
        <p className="text-gray-500">The user profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
  const memberSince = new Date(profile.created_at).getFullYear();

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="relative">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={profile.avatar_url} alt={fullName} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  {profile.host_stats?.superhost && (
                    <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                      <Award className="h-3 w-3 mr-1" />
                      Superhost
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Member since {memberSince}
                  </div>
                </div>
              </div>
            </div>

            {/* Host Stats */}
            {profile.host_stats && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.host_stats.properties_count}
                  </div>
                  <div className="text-sm text-gray-600">Listings</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.host_stats.response_rate}%
                  </div>
                  <div className="text-sm text-gray-600">Response rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-gray-900 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{profile.host_stats.response_time}</span>
                  </div>
                  <div className="text-sm text-gray-600">Response time</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {!isOwnProfile && (
                <Button className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact
                </Button>
              )}
              {isOwnProfile && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleEditProfile}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {profile.first_name || 'User'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((lang, index) => (
                      <Badge key={index} variant="secondary">{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}


              {/* Extended Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Decade I was born</h4>
                  <p className="text-gray-600">{profile.decade_born || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Dream destination</h4>
                  <p className="text-gray-600">{profile.dream_destination || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">My work</h4>
                  <p className="text-gray-600">{profile.work || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Pets</h4>
                  <p className="text-gray-600">{profile.pets || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">School</h4>
                  <p className="text-gray-600">{profile.school || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Favorite song in high school</h4>
                  <p className="text-gray-600">{profile.favorite_song || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Most useless skill</h4>
                  <p className="text-gray-600">{profile.useless_skill || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Fun fact</h4>
                  <p className="text-gray-600">{profile.fun_fact || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">I spend too much time</h4>
                  <p className="text-gray-600">{profile.spend_time || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">I'm obsessed with</h4>
                  <p className="text-gray-600">{profile.obsessed_with || '(Not set)'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default UserProfile;