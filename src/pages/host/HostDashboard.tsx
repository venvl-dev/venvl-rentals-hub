import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, DollarSign, Users, Home, TrendingUp, Eye, Star, Edit, Trash2, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import BookingsList from '@/components/host/BookingsList';
import EnhancedPropertyForm from '@/components/host/EnhancedPropertyForm';
import Header from '@/components/Header';
import HostStats from '@/components/host/HostStats';
import HostCalendar from '@/components/calendar/HostCalendar';
import SimplePropertyTest from '@/components/host/SimplePropertyTest';
import { Property } from '@/types/property';
import useHostProperties from '@/hooks/useHostProperties';
import {
  getRentalType,
  getDailyPrice,
  getMonthlyPrice,
  getRentalTypeBadge,
  type PropertyRentalData 
} from '@/lib/rentalTypeUtils';

const HostDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    data: properties = [],
    isLoading: loading,
    refetch: refetchProperties,
  } = useHostProperties(user?.id);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isFixingAmenities, setIsFixingAmenities] = useState(false);
  const [activeTab, setActiveTab] = useState(() =>
    localStorage.getItem('hostDashboardTab') || 'properties'
  );

  useEffect(() => {
    localStorage.setItem('hostDashboardTab', activeTab);
  }, [activeTab]);

  const handlePropertySave = useCallback(() => {
    setEditingProperty(null);
    refetchProperties();
  }, [refetchProperties]);

  const handleEdit = useCallback((property: Property) => {
    setEditingProperty(property);
  }, []);

  const handleDelete = useCallback(async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      refetchProperties();
      toast.success('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  }, [refetchProperties]);

  const togglePropertyStatus = useCallback(async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: !currentStatus })
        .eq('id', propertyId);

      if (error) throw error;
      
      refetchProperties();
      toast.success(`Property ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error('Failed to update property status');
    }
  }, [refetchProperties]);

  const fixAmenities = useCallback(async () => {
    setIsFixingAmenities(true);
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Starting amenities fix process...');
    }
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Mapping of old amenity IDs to new ones
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

      // Get all user's properties
      const { data: userProperties, error: fetchError } = await supabase
        .from('properties')
        .select('id, amenities')
        .eq('host_id', user.user.id);

      if (fetchError) throw fetchError;

      if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 Found properties to fix:', userProperties);
      }

      // Update each property's amenities
      for (const property of userProperties || []) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🔧 Fixing amenities for property ${property.id}:`, property.amenities);
        }
        
        const updatedAmenities = property.amenities?.map((amenity: string) => {
          const newAmenity = amenityMapping[amenity] || amenity;
          if (newAmenity !== amenity) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`🔧 Mapping ${amenity} → ${newAmenity}`);
            }
          }
          return newAmenity;
        }) || [];

        if (process.env.NODE_ENV !== 'production') {
          console.log(`🔧 Updated amenities for ${property.id}:`, updatedAmenities);
        }

        const { error: updateError } = await supabase
          .from('properties')
          .update({ amenities: updatedAmenities })
          .eq('id', property.id);

        if (updateError) throw updateError;
      }

      // Refresh properties list
      await refetchProperties();
      
      toast.success('Amenities fixed successfully! All properties updated.');
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Amenities fix completed successfully');
      }
    } catch (error) {
      console.error('❌ Error fixing amenities:', error);
      toast.error('Failed to fix amenities');
    } finally {
      setIsFixingAmenities(false);
    }
  }, [refetchProperties]);

  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Memoized PropertyPriceDisplay component to prevent unnecessary re-renders
  const PropertyPriceDisplay = useMemo(() => ({ property }: { property: Property & PropertyRentalData }) => {
    const rentalType = getRentalType(property);
    const dailyPrice = getDailyPrice(property);
    const monthlyPrice = getMonthlyPrice(property);
    const badge = getRentalTypeBadge(rentalType);

    return (
      <div className="space-y-1">
        {rentalType === 'daily' && (
          <div className="font-medium">EGP {dailyPrice}/night</div>
        )}
        {rentalType === 'monthly' && (
          <div className="font-medium">EGP {monthlyPrice}/month</div>
        )}
        {rentalType === 'both' && (
          <>
            <div className="font-medium">EGP {dailyPrice}/night</div>
            <div className="text-sm text-gray-600">EGP {monthlyPrice}/month</div>
          </>
        )}
        <div className="mt-1">
          <Badge className={`text-xs ${badge.color}`}>
            {badge.label}
          </Badge>
        </div>
      </div>
    );
  }, []);

  if (loading || authLoading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Current editingProperty state:', editingProperty);
  console.log('Should show form?', !!editingProperty);
  
  if (editingProperty) {
    console.log('Rendering EnhancedPropertyForm with property:', editingProperty);
    return (
      <div>
        <Header />
        <EnhancedPropertyForm
          property={editingProperty}
          onSave={handlePropertySave}
          onCancel={() => setEditingProperty(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Home className="h-8 w-8" />
              Host Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage your properties and bookings</p>
          </div>
          <Button 
            onClick={() => {
              console.log('Add New Property button clicked');
              setEditingProperty({} as Property);
              console.log('editingProperty set to:', {});
            }} 
            className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 rounded-2xl px-6 py-3"
          >
            <Plus className="h-4 w-4" />
            Add New Property
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl bg-gray-100 p-2">
            <TabsTrigger value="properties" className="flex items-center gap-2 rounded-xl">
              <Home className="h-4 w-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2 rounded-xl">
              <Users className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2 rounded-xl">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-xl">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 rounded-xl">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            {properties.length === 0 ? (
              <Card className="rounded-3xl shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Home className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding your first property to begin hosting</p>
                  <Button 
                    onClick={() => setEditingProperty({} as Property)}
                    className="bg-black text-white hover:bg-gray-800 rounded-2xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="aspect-video relative">
                      <img
                        src={property.images?.[0] || '/placeholder.svg'}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <Badge className={`${getStatusColor(property.approval_status || 'pending')} border-0`}>
                          {property.approval_status || 'pending'}
                        </Badge>
                        <Badge variant={property.is_active ? "default" : "secondary"}>
                          {property.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2 truncate">{property.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{property.city}, {property.state}</p>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{property.description}</p>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <PropertyPriceDisplay property={property} />
                        <span className="text-gray-600">{property.bedrooms} bed • {property.bathrooms} bath</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/property/${property.id}`)}
                          className="flex-1 rounded-xl"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(property)}
                          className="flex-1 rounded-xl"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePropertyStatus(property.id, property.is_active || false)}
                          className="flex-1 rounded-xl"
                        >
                          {property.is_active ? 'Pause' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(property.id)}
                          className="text-red-600 hover:text-red-700 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsList />
          </TabsContent>

          <TabsContent value="calendar">
            {properties.length === 0 ? (
              <Card className="rounded-3xl shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No properties to display</h3>
                  <p className="text-gray-600 mb-4">Add properties to view their booking calendars</p>
                  <Button 
                    onClick={() => setEditingProperty({} as Property)}
                    className="bg-black text-white hover:bg-gray-800 rounded-2xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {properties.map((property) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HostCalendar
                      propertyId={property.id}
                      propertyTitle={property.title}
                      onBookingClick={(bookingId) => console.log('Booking clicked:', bookingId)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <HostStats />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Amenities Debug & Fix Tool */}
              <Card className="rounded-3xl shadow-lg border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Settings className="h-5 w-5" />
                    Amenities Debug & Fix Tool
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-3">What this tool does:</h4>
                    <ul className="space-y-2 text-sm text-orange-700">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Updates old amenity IDs (wifi, kitchen) to new format (WiFi, Kitchen)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Fixes amenities display issues in property forms and pages</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Ensures amenities show with proper icons instead of gray dots</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Synchronizes amenities between edit forms and property display</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Debug Info:</strong> Check browser console for detailed logs while using this tool.
                      Look for 🔧 emoji logs to track the fix process.
                    </p>
                  </div>

                  <Button 
                    onClick={fixAmenities}
                    disabled={isFixingAmenities}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-3"
                    size="lg"
                  >
                    {isFixingAmenities ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Fixing Amenities...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Fix All Property Amenities
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-orange-600 text-center">
                    This will update all your properties with the new amenity format. Check console for details.
                  </p>
                </CardContent>
              </Card>

              <SimplePropertyTest />
              
              <Card className="rounded-3xl shadow-lg">
                <CardHeader>
                  <CardTitle>Host Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Host settings will be available soon.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HostDashboard;
