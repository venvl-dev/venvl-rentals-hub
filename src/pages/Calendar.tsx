
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import DashboardCalendar from '@/components/calendar/DashboardCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface User {
  id: string;
  email?: string;
}

const Calendar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'host' | 'guest'>('guest');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        navigate('/auth');
        return;
      }

      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // Get user profile to determine user type
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error getting profile:', profileError);
        toast.error('Failed to load user profile');
      } else if (profile) {
        setUserType(profile.role === 'host' ? 'host' : 'guest');
      }
    } catch (error) {
      console.error('Error in checkUser:', error);
      toast.error('Authentication error');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    if (userType === 'host') {
      navigate('/host/dashboard');
    } else {
      navigate('/guest/bookings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Calendar View
              </h1>
              <p className="text-gray-600">
                {userType === 'host' 
                  ? 'Manage your property bookings and availability'
                  : 'View your upcoming trips and booking history'
                }
              </p>
            </div>
            
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {userType === 'host' ? 'Property Bookings' : 'My Bookings'}
                </span>
                <span className="text-sm font-normal text-gray-500 capitalize">
                  {userType} View
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DashboardCalendar 
                userId={user.id} 
                userType={userType}
              />
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Calendar;
