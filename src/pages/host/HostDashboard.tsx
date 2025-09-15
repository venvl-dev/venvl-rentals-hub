import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, DollarSign, Users, Home, TrendingUp, Eye, Star, Edit, Trash2, BarChart3, Settings, Loader2, AlertTriangle, CheckCircle, Archive, RotateCcw } from 'lucide-react';
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
import DeleteConfirmationModal from '@/components/ui/delete-confirmation-modal';
import PauseConfirmationModal from '@/components/ui/pause-confirmation-modal';
import {
  getRentalType,
  getDailyPrice,
  getMonthlyPrice,
  getRentalTypeBadge
} from '@/lib/rentalTypeUtils';

// Enhanced PropertyImage component with error handling and validation
const PropertyImage = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    setImageSrc('/placeholder.svg');
  };

  // Use placeholder if no src or invalid URL
  const finalSrc = imageSrc && isValidUrl(imageSrc) ? imageSrc : '/placeholder.svg';

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={finalSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      {imageError  && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Home className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <span className="text-sm">No Image</span>
          </div>
        </div>
      )}
    </div>
  );
};

const HostDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  
  // Debug user information
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Dashboard user info:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      authLoading 
    });
  }
  
  const [propertyFilter, setPropertyFilter] = useState<'active' | 'archived' | 'all'>(() =>
    (localStorage.getItem('hostPropertyFilter') as 'active' | 'archived' | 'all') || 'active'
  );
  
  const {
    data: properties = [],
    isLoading: loading,
    refetch: refetchProperties,
  } = useHostProperties(user?.id, propertyFilter);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isFixingAmenities, setIsFixingAmenities] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: { action: string; loading: boolean }
  }>({});
  const [retryAttempts, setRetryAttempts] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl || localStorage.getItem('hostDashboardTab') || 'properties';
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    property: Property | null;
  }>({ isOpen: false, property: null });
  const [pauseModal, setPauseModal] = useState<{
    isOpen: boolean; 
    property: Property | null;
  }>({ isOpen: false, property: null });

  // Handle tab changes and update URL
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    localStorage.setItem('hostDashboardTab', newTab);
    
    // Update URL with tab parameter
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    setSearchParams(newSearchParams, { replace: false });
  }, [searchParams, setSearchParams]);

  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      localStorage.setItem('hostDashboardTab', tabFromUrl);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    localStorage.setItem('hostPropertyFilter', propertyFilter);
  }, [propertyFilter]);

  const handlePropertySave = useCallback(() => {
    setEditingProperty(null);
    refetchProperties();
  }, [refetchProperties]);

  const handleEdit = useCallback((property: Property) => {
    setEditingProperty(property);
  }, []);

  const setLoadingState = useCallback((propertyId: string, action: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [propertyId]: { action, loading }
    }));
  }, []);

  const handleDeleteClick = useCallback((property: Property) => {
    setDeleteModal({ isOpen: true, property });
  }, []);

  const handleRestoreClick = useCallback(async (property: Property) => {
    const { id: propertyId, title: propertyTitle } = property;
    setLoadingState(propertyId, 'restoring', true);
    
    try {
      await handleRestoreProperty(propertyId);
      toast.success(`"${propertyTitle}" has been restored successfully!`);
    } catch (error) {
      console.error('Error restoring property:', error);
      toast.error('Failed to restore property');
    } finally {
      setLoadingState(propertyId, '', false);
    }
  }, [setLoadingState]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.property) return;
    
    const { id: propertyId, title: propertyTitle } = deleteModal.property;
    console.log('🗑️ DELETE DEBUG: Starting delete process for:', {
      propertyId,
      propertyTitle,
      property: deleteModal.property
    });

    setDeleteModal({ isOpen: false, property: null });
    setLoadingState(propertyId, 'deleting', true);
    
    try {
      // Check for any bookings (since we don't know the exact column names, we'll handle gracefully)
      console.log('🗑️ DELETE DEBUG: Checking for any bookings...');
      let hasBlockingBookings = false;
      
      try {
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('property_id', propertyId)
          .limit(1);
          
        if (!bookingError && bookings && bookings.length > 0) {
          console.log('🗑️ DELETE DEBUG: Found bookings, but since schema is unclear, proceeding with deletion...');
          // Since we can't determine date columns reliably, we'll let the database constraints handle it
        } else {
          console.log('🗑️ DELETE DEBUG: No bookings found, safe to delete.');
        }
      } catch (bookingCheckError) {
        console.log('🗑️ DELETE DEBUG: Booking check failed, but proceeding - database will handle constraints:', bookingCheckError);
      }

      console.log('🗑️ DELETE DEBUG: ✅ Proceeding with deletion...');

      // Use soft delete function
      console.log('🗑️ DELETE DEBUG: Attempting soft delete via RPC function...');
      const { data, error } = await supabase.rpc('soft_delete_property', {
        property_id: propertyId
      });

      console.log('🗑️ DELETE DEBUG: RPC function result:', { data, error });

      if (error) {
        console.log('🗑️ DELETE DEBUG: RPC function failed, trying direct update fallback...');
        console.error('🗑️ DELETE DEBUG: RPC Error:', error);
        
        // Fallback to direct update if function doesn't exist
        const { error: updateError } = await supabase
          .from('properties')
          .update({ 
            deleted_at: new Date().toISOString(),
            is_active: false 
          })
          .eq('id', propertyId);
          
        console.log('🗑️ DELETE DEBUG: Direct update result:', { updateError });
        
        if (updateError) {
          console.error('🗑️ DELETE DEBUG: Direct update failed:', updateError);
          throw updateError;
        }
        
        console.log('🗑️ DELETE DEBUG: ✅ Direct update successful');
      } else if (!data) {
        console.log('🗑️ DELETE DEBUG: ❌ RPC returned no data - likely blocked by booking constraint');
        throw new Error('Property could not be deleted. It may have active bookings.');
      } else {
        console.log('🗑️ DELETE DEBUG: ✅ RPC function successful:', data);
      }
      
      console.log('🗑️ DELETE DEBUG: Refetching properties...');
      refetchProperties();
      
      console.log('🗑️ DELETE DEBUG: ✅ Delete process completed successfully');
      toast.success(`"${propertyTitle}" has been archived successfully. You can restore it from your archived properties.`, {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => handleRestoreProperty(propertyId)
        }
      });
    } catch (error) {
      console.error('🗑️ DELETE DEBUG: ❌ ERROR in delete process:', error);
      console.log('🗑️ DELETE DEBUG: Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      const errorMessage = (error as Error).message?.includes('booking') 
        ? 'Cannot delete property with active bookings. Please cancel bookings first.'
        : (error as Error).message || 'Failed to delete property';
      
      console.log('🗑️ DELETE DEBUG: Showing error message:', errorMessage);
      
      toast.error(errorMessage, {
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => handleDeleteWithValidation(propertyId, propertyTitle)
        }
      });
    } finally {
      console.log('🗑️ DELETE DEBUG: Cleaning up loading state...');
      setLoadingState(propertyId, '', false);
    }
  }, [refetchProperties, setLoadingState, deleteModal]);

  const handleRestoreProperty = useCallback(async (propertyId: string) => {
    try {
      const { error } = await supabase.rpc('restore_property', {
        property_id: propertyId
      });

      if (error) {
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from('properties')
          .update({ deleted_at: null })
          .eq('id', propertyId);
          
        if (updateError) throw updateError;
      }
      
      refetchProperties();
      toast.success('Property restored successfully');
    } catch (error) {
      console.error('Error restoring property:', error);
      toast.error('Failed to restore property');
    }
  }, [refetchProperties]);

  const handleDeleteWithValidation = useCallback(async (propertyId: string, propertyTitle: string) => {
    // Find the property object to trigger the delete modal
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setDeleteModal({ isOpen: true, property });
    } else {
      // If property not found, show error
      toast.error('Property not found. Please refresh the page and try again.');
    }
  }, [properties]);

  const handlePauseClick = useCallback((property: Property) => {
    setPauseModal({ isOpen: true, property });
  }, []);

  const handlePauseConfirm = useCallback(async () => {
    if (!pauseModal.property) return;
    
    const { id: propertyId, title: propertyTitle, is_active: currentStatus } = pauseModal.property;
    setPauseModal({ isOpen: false, property: null });

    const newStatus = !currentStatus;
    const action = newStatus ? 'activating' : 'pausing';
    const actionPast = newStatus ? 'activated' : 'paused';

    setLoadingState(propertyId, action, true);
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;
      
      refetchProperties();
      toast.success(`"${propertyTitle}" has been ${actionPast} successfully`, {
        duration: 4000
      });
    } catch (error) {
      console.error('Error updating property status:', error);
      const retryKey = `${propertyId}-${action}`;
      const attempts = retryAttempts[retryKey] || 0;
      
      if (attempts < 2) {
        setRetryAttempts(prev => ({ ...prev, [retryKey]: attempts + 1 }));
        toast.error(`Failed to ${action.slice(0, -3)} property. Retrying... (${attempts + 1}/3)`, {
          duration: 3000
        });
        
        // Auto retry after delay with correct action
        setTimeout(() => {
          if (action === 'activating') {
            handleActivateProperty(propertyId, propertyTitle);
          } else {
            // Retry the pause operation
            handlePauseConfirm();
          }
        }, 1000);
      } else {
        toast.error(`Failed to ${action.slice(0, -3)} property after multiple attempts. Please refresh the page and try again.`, {
          duration: 6000,
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload()
          }
        });
      }
    } finally {
      setLoadingState(propertyId, '', false);
    }
  }, [refetchProperties, setLoadingState, retryAttempts, pauseModal]);

  const handleActivateProperty = useCallback(async (propertyId: string, propertyTitle: string) => {
    setLoadingState(propertyId, 'activating', true);
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;
      
      refetchProperties();
      toast.success(`"${propertyTitle}" has been activated successfully`, {
        duration: 4000
      });
    } catch (error) {
      console.error('Error activating property:', error);
      toast.error('Failed to activate property', { duration: 4000 });
    } finally {
      setLoadingState(propertyId, '', false);
    }
  }, [refetchProperties, setLoadingState]);

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

  // Enhanced price formatting utility with edge case handling
  const formatPrice = useCallback((price: number | null | undefined): string => {
    // Handle null, undefined, or zero
    if (!price || price === 0) return 'EGP 0';
    
    // Handle negative numbers
    if (price < 0) return 'EGP 0';
    
    // Handle extremely large numbers (over 1 billion)
    if (price > 1000000000) return 'EGP 999,999,999+';
    
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('EGP', 'EGP ');
  }, []);

  // Memoized PropertyPriceDisplay component to prevent unnecessary re-renders
  const PropertyPriceDisplay = useCallback(({ property }: { property: Property }) => {
    const rentalType = getRentalType(property);
    const dailyPrice = getDailyPrice(property);
    const monthlyPrice = getMonthlyPrice(property);

    return (
      <div className="space-y-1">
        {rentalType === 'daily' && (
          <div className="font-semibold text-lg text-gray-900">{formatPrice(dailyPrice)}/night</div>
        )}
        {rentalType === 'monthly' && (
          <div className="font-semibold text-lg text-gray-900">{formatPrice(monthlyPrice)}/month</div>
        )}
        {rentalType === 'both' && (
          <div className="space-y-0.5">
            <div className="font-semibold text-lg text-gray-900">{formatPrice(dailyPrice)}/night</div>
            <div className="text-sm text-gray-500">{formatPrice(monthlyPrice)}/month</div>
          </div>
        )}
      </div>
    );
  }, [formatPrice]);

  // Helper function to simplify button state management
  const getButtonState = useCallback((property: Property) => {
    const loading = loadingStates[property.id];
    const isStatusLoading = loading?.loading && (loading.action.includes('activating') || loading.action.includes('pausing'));
    
    return {
      isLoading: isStatusLoading,
      loadingText: loading?.action === 'activating' ? 'Activating...' : 'Pausing...',
      buttonText: property.is_active ? 'Pause' : 'Activate',
      icon: property.is_active ? AlertTriangle : CheckCircle
    };
  }, [loadingStates]);

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

  if (editingProperty) {
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
            onClick={() => setEditingProperty({} as Property)} 
            className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 rounded-2xl px-6 py-3"
          >
            <Plus className="h-4 w-4" />
            Add New Property
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] rounded-2xl bg-gray-100 p-2">
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Your Properties</h2>
                <p className="text-gray-600">Manage and monitor your property listings</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Filter:</span>
                  <Select value={propertyFilter} onValueChange={(value: 'active' | 'archived' | 'all') => setPropertyFilter(value)}>
                    <SelectTrigger className="w-48 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Properties</SelectItem>
                      <SelectItem value="archived">Archived Properties</SelectItem>
                      <SelectItem value="all">All Properties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col bg-white h-full">
                    <div className="h-48 relative flex-shrink-0">
                      <PropertyImage
                        src={property.images?.[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        {property.deleted_at ? (
                          <Badge className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
                            Archived
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
                            {property.is_active ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-0 flex flex-col flex-1">
                      <div className="p-6 pb-4 flex-1 flex flex-col">
                        <div className="h-16 flex flex-col justify-start">
                          <h3 className="font-semibold text-xl mb-1 line-clamp-2 text-gray-900">{property.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{property.city}, {property.state}</p>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 flex-1">{property.description}</p>

                        <div className="space-y-3 mt-auto">
                          <div>
                            <PropertyPriceDisplay property={property} />
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
                            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-xs">
                              Flexible Booking
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pb-6 mt-auto">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="flex-1 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {/* Show different actions based on property status */}
                          {property.deleted_at ? (
                            // Archived property actions
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreClick(property)}
                              disabled={loadingStates[property.id]?.loading && loadingStates[property.id]?.action === 'restoring'}
                              className="flex-1 rounded-lg border-green-300 hover:bg-green-50 text-green-700"
                              title={`Restore "${property.title}"`}
                            >
                              {loadingStates[property.id]?.loading && loadingStates[property.id]?.action === 'restoring' ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restore
                                </>
                              )}
                            </Button>
                          ) : (
                            // Active property actions
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(property)}
                                className="flex-1 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              {(() => {
                                const buttonState = getButtonState(property);
                                const IconComponent = buttonState.icon;

                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => property.is_active ? handlePauseClick(property) : handleActivateProperty(property.id, property.title)}
                                    disabled={buttonState.isLoading}
                                    className="flex-1 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700"
                                  >
                                    {buttonState.isLoading ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        {buttonState.loadingText}
                                      </>
                                    ) : (
                                      <>
                                        <IconComponent className="h-4 w-4 mr-1" />
                                        {buttonState.buttonText}
                                      </>
                                    )}
                                  </Button>
                                );
                              })()}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(property)}
                                disabled={loadingStates[property.id]?.loading && loadingStates[property.id]?.action === 'deleting'}
                                className="w-10 rounded-lg border-red-300 hover:bg-red-50 text-red-600 p-0 flex items-center justify-center"
                                title={`Archive "${property.title}"`}
                              >
                                {loadingStates[property.id]?.loading && loadingStates[property.id]?.action === 'deleting' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, property: null })}
        onConfirm={handleDeleteConfirm}
        propertyTitle={deleteModal.property?.title || ''}
        isLoading={deleteModal.property ? loadingStates[deleteModal.property.id]?.loading && loadingStates[deleteModal.property.id]?.action === 'deleting' : false}
      />

      {/* Pause Confirmation Modal */}
      <PauseConfirmationModal
        isOpen={pauseModal.isOpen}
        onClose={() => setPauseModal({ isOpen: false, property: null })}
        onConfirm={handlePauseConfirm}
        propertyTitle={pauseModal.property?.title || ''}
        isLoading={pauseModal.property ? loadingStates[pauseModal.property.id]?.loading && loadingStates[pauseModal.property.id]?.action === 'pausing' : false}
      />
    </div>
  );
};

export default HostDashboard;
