import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Users, Home, Calendar, MessageSquare, Bell, UserPlus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const DataSeeding = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const runTestScenario = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const { data, error } = await supabase.rpc('create_test_scenario');
      
      if (error) throw error;
      
      setResult(data);
      toast.success('Test scenario created successfully!');
    } catch (error) {
      console.error('Error creating test scenario:', error);
      toast.error('Failed to create test scenario');
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateExistingAmenities = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user found');

      // Mapping of old amenity IDs to new ones - fixes synchronization issue
      const amenityMapping: Record<string, string> = {
        'wifi': 'WiFi',
        'kitchen': 'Kitchen',
        'air_conditioning': 'Air Conditioning',
        'heating': 'Heating',
        'tv': 'TV',
        'netflix': 'Netflix',
        'sound_system': 'Sound System',
        'gaming_console': 'Gaming Console',
        'parking': 'Free Parking',
        'private_entrance': 'Private Entrance',
        'security': 'Security',
        'balcony': 'Balcony',
        'washing_machine': 'Washing Machine',
        'workspace': 'Workspace',
        'closet': 'Closet'
      };

      // Get all properties
      const { data: properties, error: fetchError } = await supabase
        .from('properties')
        .select('id, amenities');

      if (fetchError) throw fetchError;

      // Update each property's amenities
      for (const property of properties || []) {
        const updatedAmenities = property.amenities?.map((amenity: string) => 
          amenityMapping[amenity] || amenity
        ) || [];

        const { error: updateError } = await supabase
          .from('properties')
          .update({ amenities: updatedAmenities })
          .eq('id', property.id);

        if (updateError) throw updateError;
      }

      toast.success('Existing amenities updated successfully!');
    } catch (error) {
      console.error('Error updating amenities:', error);
      toast.error('Failed to update amenities');
    } finally {
      setLoading(false);
    }
  };

  const seedPropertiesForHost = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user found');

      // Create sample properties with the new amenity structure
      const sampleProperties = [
        {
          title: "Modern Downtown Apartment",
          description: "A beautiful modern apartment in the heart of the city with all amenities you need for a comfortable stay.",
          property_type: "apartment" as const,
          address: "123 Main Street",
          city: "Cairo",
          state: "Cairo Governorate",
          country: "Egypt",
          bedrooms: 2,
          bathrooms: 1,
          max_guests: 4,
          price_per_night: 250,
          monthly_price: 6500,
          rental_type: "both" as const,
          min_nights: 1,
          min_months: 1,
          amenities: ["WiFi", "Kitchen", "Air Conditioning", "TV", "Washing Machine", "Balcony", "Free Parking"],
          images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
          host_id: user.id,
          is_active: true,
          approval_status: "approved" as const
        },
        {
          title: "Cozy Studio with Amenities",
          description: "Perfect studio for short or long stays with modern amenities and great location.",
          property_type: "studio" as const,
          address: "456 Garden Street",
          city: "Alexandria",
          state: "Alexandria Governorate", 
          country: "Egypt",
          bedrooms: 1,
          bathrooms: 1,
          max_guests: 2,
          price_per_night: 180,
          monthly_price: 4500,
          rental_type: "both" as const,
          min_nights: 1,
          min_months: 1,
          amenities: ["WiFi", "Kitchen", "Air Conditioning", "TV", "Netflix", "Workspace", "Closet"],
          images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
          host_id: user.id,
          is_active: true,
          approval_status: "approved" as const
        },
        {
          title: "Luxury Villa with Full Amenities",
          description: "Spacious villa perfect for families with entertainment and comfort amenities.",
          property_type: "villa" as const,
          address: "789 Luxury Lane",
          city: "Giza",
          state: "Giza Governorate",
          country: "Egypt", 
          bedrooms: 4,
          bathrooms: 3,
          max_guests: 8,
          price_per_night: 450,
          monthly_price: 12000,
          rental_type: "both" as const,
          min_nights: 2,
          min_months: 1,
          amenities: ["WiFi", "Kitchen", "Air Conditioning", "Heating", "TV", "Netflix", "Sound System", "Gaming Console", "Free Parking", "Private Entrance", "Security", "Balcony"],
          images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
          host_id: user.id,
          is_active: true,
          approval_status: "approved" as const
        }
      ];

      // Insert properties
      const { error: insertError } = await supabase
        .from('properties')
        .insert(sampleProperties);

      if (insertError) throw insertError;
      
      toast.success('Sample properties with amenities created successfully!');
    } catch (error) {
      console.error('Error seeding properties:', error);
      toast.error('Failed to seed properties');
    } finally {
      setLoading(false);
    }
  };

  const seedBookingsForGuest = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user found');

      const { error } = await supabase.rpc('seed_sample_bookings_and_reviews', {
        guest_user_id: user.id
      });
      
      if (error) throw error;
      
      toast.success('Sample bookings and reviews created for your account!');
    } catch (error) {
      console.error('Error seeding bookings:', error);
      toast.error('Failed to seed bookings');
    } finally {
      setLoading(false);
    }
  };

  const seedNotifications = async () => {
    setLoading(true);
    
    try {
      // Get current user and their profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase.rpc('seed_sample_notifications', {
        user_id: user.id,
        user_role: profile?.role || 'guest'
      });
      
      if (error) throw error;
      
      toast.success('Sample notifications created for your account!');
    } catch (error) {
      console.error('Error seeding notifications:', error);
      toast.error('Failed to seed notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <Database className="h-8 w-8" />
            Data Seeding Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Populate your VENVL platform with realistic test data
          </p>
        </div>

        <div className="grid gap-6">
          {/* Step 1: Create Test Users */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <UserPlus className="h-5 w-5" />
                Step 1: Create Test Users First
              </CardTitle>
              <CardDescription className="text-blue-700">
                Before seeding data, you need to create test users with different roles through the authentication system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Required Test Users:</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>Host User:</strong> Create a user and select "Host" as the account type
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>Guest User:</strong> Create a user and select "Guest" as the account type
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>Admin User:</strong> Create a user and select "Admin" as the account type
                  </li>
                </ul>
              </div>
              
              <Link to="/auth">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Go to Authentication Page
                </Button>
              </Link>
              
              <p className="text-xs text-blue-600 text-center">
                Create each user account separately, then return here to seed data
              </p>
            </CardContent>
          </Card>

          {/* Complete Test Scenario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Complete Test Scenario
              </CardTitle>
              <CardDescription>
                Creates a complete test environment with properties, bookings, reviews, and notifications.
                Requires at least one host and one guest user to exist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runTestScenario} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Test Scenario...
                  </>
                ) : (
                  'Create Complete Test Scenario'
                )}
              </Button>
              
              {result && (
                <Alert>
                  <AlertDescription>{result}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Fix Amenities */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Settings className="h-5 w-5" />
                Fix Existing Amenities
              </CardTitle>
              <CardDescription className="text-orange-700">
                Update existing property amenities to use the new format with proper icons.
                Run this if you have existing properties with old amenity format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={updateExistingAmenities} 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Amenities...
                  </>
                ) : (
                  'Update Existing Amenities'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Individual Seeding Options */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Seed Properties
                </CardTitle>
                <CardDescription>
                  Add sample properties to your host account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={seedPropertiesForHost} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sample Properties'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Seed Bookings
                </CardTitle>
                <CardDescription>
                  Add sample bookings and reviews to your guest account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={seedBookingsForGuest} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sample Bookings'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Seed Notifications
                </CardTitle>
                <CardDescription>
                  Add sample notifications to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={seedNotifications} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sample Notifications'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Getting Started Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4>How to use this seeding dashboard:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Create test users first:</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Click "Go to Authentication Page" above</li>
                      <li>Create a user with the "Host" role</li>
                      <li>Create a user with the "Guest" role</li>
                      <li>Optionally create a user with the "Admin" role</li>
                      <li>You can use the provided test credentials or create your own</li>
                    </ul>
                  </li>
                  <li>Return to this page and run the "Complete Test Scenario" to populate all data at once</li>
                  <li>Or use individual seeding options to add specific types of data</li>
                  <li>Navigate through the app to see your seeded data in action</li>
                </ol>
                
                <h4 className="mt-6">What gets created:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Properties:</strong> 3 diverse property listings with complete amenity data</li>
                  <li><strong>Amenities:</strong> Full categorized amenities (Essential, Comfort, Entertainment)</li>
                  <li><strong>Bookings:</strong> Past completed bookings and future confirmed bookings</li>
                  <li><strong>Reviews:</strong> 5-star reviews for completed stays</li>
                  <li><strong>Notifications:</strong> Role-appropriate notifications for each user type</li>
                </ul>

                <h4 className="mt-6">New Amenity System Features:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Categorized Display:</strong> Amenities organized by Essential, Comfort, and Entertainment</li>
                  <li><strong>Icon Integration:</strong> Each amenity displays with appropriate Lucide React icons</li>
                  <li><strong>Property Cards:</strong> Show top 4 amenities with icons</li>
                  <li><strong>Property Pages:</strong> Full categorized amenity listing with enhanced styling</li>
                  <li><strong>Host Dashboard:</strong> Easy amenity selection with visual categories</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataSeeding;
