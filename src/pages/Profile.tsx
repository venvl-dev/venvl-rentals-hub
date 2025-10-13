import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/user/UserProfile';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
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
            <div>
              <h1 className="text-2xl font-semibold">
                {isOwnProfile ? 'Your Profile' : 'User Profile'}
              </h1>
              <p className="text-gray-600">
                {isOwnProfile
                  ? 'Manage your profile information and settings'
                  : 'View user information and reviews'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <UserProfile userId={userId} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  );
};

export default Profile;