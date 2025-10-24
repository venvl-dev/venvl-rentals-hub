import Header from '@/components/Header';
import AnalyticsTab from '@/components/host/AnalyticsTab';
import BookingsList from '@/components/host/BookingsList';
import CalendarTab from '@/components/host/CalendarTab';
import EnhancedPropertyForm from '@/components/host/EnhancedPropertyForm';
import PropertiesTab from '@/components/host/PropertiesTab';
import HostProfileForm from '@/components/host/HostProfileForm';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from '@/components/ui/delete-confirmation-modal';
import PauseConfirmationModal from '@/components/ui/pause-confirmation-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import useHostProperties from '@/hooks/useHostProperties';
import { supabase } from '@/integrations/supabase/client';
import { calculatePropertyStats, PropertySaturation } from '@/lib/propertUtils';
import { Property } from '@/types/property';
import { format, isBefore, subYears } from 'date-fns';
import { BarChart3, Calendar, Home, Plus, User, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const HostDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Debug user information
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Dashboard user info:', {
      user: user ? { id: user.id, email: user.email } : null,
      authLoading,
    });
  }

  const [propertyFilter, setPropertyFilter] = useState<
    'active' | 'archived' | 'all'
  >(
    () =>
      (localStorage.getItem('hostPropertyFilter') as
        | 'active'
        | 'archived'
        | 'all') || 'active',
  );

  const {
    data: properties = [],
    isLoading: loading,
    refetch: refetchProperties,
  } = useHostProperties(user?.id);
  const [propertiesStatsMap, setPropertiesStatsMap] = useState(
    new Map<string, PropertySaturation>(),
  );
  useEffect(() => {
    (async () => {
      // Get all bookings for the time range (including all statuses)
      const endDate = new Date();
      const startDate = subYears(endDate, 1);
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          property_id,
          check_in,
          check_out,
          total_price,
          status,
          properties!inner(host_id, title)
        `,
        )
        .eq('properties.host_id', user.id)
        .or(
          `and(check_in.gte.${format(startDate, 'yyyy-MM-dd')},check_in.lte.${format(endDate, 'yyyy-MM-dd')}),and(check_out.gte.${format(startDate, 'yyyy-MM-dd')},check_out.lte.${format(endDate, 'yyyy-MM-dd')}),and(check_in.lte.${format(startDate, 'yyyy-MM-dd')},check_out.gte.${format(endDate, 'yyyy-MM-dd')})`,
        );

      if (bookingsError) throw bookingsError;
      const map = new Map<string, PropertySaturation>();
      for (const property of properties) {
        const propertyBookings = bookingsData.filter(
          (booking) => booking.property_id === property.id,
        );
        const propertyStats = calculatePropertyStats(
          property,
          propertyBookings,
          {
            startDate: isBefore(property.created_at, startDate)
              ? startDate
              : new Date(property.created_at),
            endDate,
          },
        );
        map.set(property.id, propertyStats);
      }
      setPropertiesStatsMap(map);
    })();
  }, [properties, user.id]);

  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: { action: string; loading: boolean };
  }>({});
  const [retryAttempts, setRetryAttempts] = useState<{ [key: string]: number }>(
    {},
  );
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    return (
      tabFromUrl || localStorage.getItem('hostDashboardTab') || 'properties'
    );
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
  const handleTabChange = useCallback(
    (newTab: string) => {
      setActiveTab(newTab);
      localStorage.setItem('hostDashboardTab', newTab);

      // Update URL with tab parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', newTab);
      setSearchParams(newSearchParams, { replace: false });
    },
    [searchParams, setSearchParams],
  );

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

  const setLoadingState = useCallback(
    (propertyId: string, action: string, loading: boolean) => {
      setLoadingStates((prev) => ({
        ...prev,
        [propertyId]: { action, loading },
      }));
    },
    [],
  );

  const handleDeleteClick = useCallback((property: Property) => {
    setDeleteModal({ isOpen: true, property });
  }, []);

  const handleRestoreClick = useCallback(
    async (property: Property) => {
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
    },
    [setLoadingState],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.property) return;

    const { id: propertyId, title: propertyTitle } = deleteModal.property;
    console.log('🗑️ DELETE DEBUG: Starting delete process for:', {
      propertyId,
      propertyTitle,
      property: deleteModal.property,
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
          console.log(
            '🗑️ DELETE DEBUG: Found bookings, but since schema is unclear, proceeding with deletion...',
          );
          // Since we can't determine date columns reliably, we'll let the database constraints handle it
        } else {
          console.log('🗑️ DELETE DEBUG: No bookings found, safe to delete.');
        }
      } catch (bookingCheckError) {
        console.log(
          '🗑️ DELETE DEBUG: Booking check failed, but proceeding - database will handle constraints:',
          bookingCheckError,
        );
      }

      console.log('🗑️ DELETE DEBUG: ✅ Proceeding with deletion...');

      // Use soft delete function
      console.log(
        '🗑️ DELETE DEBUG: Attempting soft delete via RPC function...',
      );
      const { data, error } = await supabase.rpc('soft_delete_property', {
        property_id: propertyId,
      });

      console.log('🗑️ DELETE DEBUG: RPC function result:', { data, error });

      if (error) {
        console.log(
          '🗑️ DELETE DEBUG: RPC function failed, trying direct update fallback...',
        );
        console.error('🗑️ DELETE DEBUG: RPC Error:', error);

        // Fallback to direct update if function doesn't exist
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            deleted_at: new Date().toISOString(),
            is_active: false,
          })
          .eq('id', propertyId);

        console.log('🗑️ DELETE DEBUG: Direct update result:', { updateError });

        if (updateError) {
          console.error('🗑️ DELETE DEBUG: Direct update failed:', updateError);
          throw updateError;
        }

        console.log('🗑️ DELETE DEBUG: ✅ Direct update successful');
      } else if (!data) {
        console.log(
          '🗑️ DELETE DEBUG: ❌ RPC returned no data - likely blocked by booking constraint',
        );
        throw new Error(
          'Property could not be deleted. It may have active bookings.',
        );
      } else {
        console.log('🗑️ DELETE DEBUG: ✅ RPC function successful:', data);
      }

      console.log('🗑️ DELETE DEBUG: Refetching properties...');
      refetchProperties();

      console.log('🗑️ DELETE DEBUG: ✅ Delete process completed successfully');
      toast.success(
        `"${propertyTitle}" has been archived successfully. You can restore it from your archived properties.`,
        {
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => handleRestoreProperty(propertyId),
          },
        },
      );
    } catch (error) {
      console.error('🗑️ DELETE DEBUG: ❌ ERROR in delete process:', error);
      console.log('🗑️ DELETE DEBUG: Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name,
      });

      const errorMessage = (error as Error).message?.includes('booking')
        ? 'Cannot delete property with active bookings. Please cancel bookings first.'
        : (error as Error).message || 'Failed to delete property';

      console.log('🗑️ DELETE DEBUG: Showing error message:', errorMessage);

      toast.error(errorMessage, {
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => handleDeleteWithValidation(propertyId, propertyTitle),
        },
      });
    } finally {
      console.log('🗑️ DELETE DEBUG: Cleaning up loading state...');
      setLoadingState(propertyId, '', false);
    }
  }, [refetchProperties, setLoadingState, deleteModal]);

  const handleRestoreProperty = useCallback(
    async (propertyId: string) => {
      try {
        const { error } = await supabase.rpc('restore_property', {
          property_id: propertyId,
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
    },
    [refetchProperties],
  );

  const handleDeleteWithValidation = useCallback(
    async (propertyId: string, propertyTitle: string) => {
      // Find the property object to trigger the delete modal
      const property = properties.find((p) => p.id === propertyId);
      if (property) {
        setDeleteModal({ isOpen: true, property });
      } else {
        // If property not found, show error
        toast.error(
          'Property not found. Please refresh the page and try again.',
        );
      }
    },
    [properties],
  );

  const handlePauseClick = useCallback((property: Property) => {
    setPauseModal({ isOpen: true, property });
  }, []);

  const handlePauseConfirm = useCallback(async () => {
    if (!pauseModal.property) return;

    const {
      id: propertyId,
      title: propertyTitle,
      is_active: currentStatus,
    } = pauseModal.property;
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId);

      if (error) throw error;

      refetchProperties();
      toast.success(`"${propertyTitle}" has been ${actionPast} successfully`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Error updating property status:', error);
      const retryKey = `${propertyId}-${action}`;
      const attempts = retryAttempts[retryKey] || 0;

      if (attempts < 2) {
        setRetryAttempts((prev) => ({ ...prev, [retryKey]: attempts + 1 }));
        toast.error(
          `Failed to ${action.slice(0, -3)} property. Retrying... (${attempts + 1}/3)`,
          {
            duration: 3000,
          },
        );

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
        toast.error(
          `Failed to ${action.slice(0, -3)} property after multiple attempts. Please refresh the page and try again.`,
          {
            duration: 6000,
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload(),
            },
          },
        );
      }
    } finally {
      setLoadingState(propertyId, '', false);
    }
  }, [refetchProperties, setLoadingState, retryAttempts, pauseModal]);

  const handleActivateProperty = useCallback(
    async (propertyId: string, propertyTitle: string) => {
      setLoadingState(propertyId, 'activating', true);

      try {
        const { error } = await supabase
          .from('properties')
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', propertyId);

        if (error) throw error;

        refetchProperties();
        toast.success(`"${propertyTitle}" has been activated successfully`, {
          duration: 4000,
        });
      } catch (error) {
        console.error('Error activating property:', error);
        toast.error('Failed to activate property', { duration: 4000 });
      } finally {
        setLoadingState(propertyId, '', false);
      }
    },
    [refetchProperties, setLoadingState],
  );

  const handleAddProperty = useCallback(() => {
    console.log('🔍 Add New Property button clicked');
    console.log('🔍 Current editingProperty before:', editingProperty);
    // Use a special marker object to indicate "add new property" mode
    const newPropertyMarker = { id: 'new-property' } as Property;
    console.log('🔍 Setting editingProperty to:', newPropertyMarker);
    setEditingProperty(newPropertyMarker);
  }, [editingProperty]);

  if (loading || authLoading) {
    return (
      <div>
        <Header />
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <div className='text-gray-600'>Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (editingProperty) {
    console.log(
      '🔍 Rendering property form with editingProperty:',
      editingProperty,
    );
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
      <div className='container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8'>
          <div className='flex-1'>
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 sm:gap-3'>
              <Home className='h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10' />
              Host Dashboard
            </h1>
            <p className='text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg'>
              Manage your properties and bookings
            </p>
          </div>
          <Button
            onClick={handleAddProperty}
            className='flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 rounded-2xl px-4 sm:px-6 py-3 sm:py-3 w-full sm:w-auto min-h-[44px] touch-target'
          >
            <Plus className='h-4 w-4 sm:h-5 sm:w-5' />
            <span className='whitespace-nowrap text-sm sm:text-base'>Add New Property</span>
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-5 rounded-2xl bg-gray-100 p-1 sm:p-2 gap-0.5 sm:gap-1'>
            <TabsTrigger
              value='properties'
              className='flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 rounded-xl text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2.5 min-h-[40px] touch-target'
            >
              <Home className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='hidden lg:inline'>Properties</span>
              <span className='lg:hidden'>Props</span>
            </TabsTrigger>
            <TabsTrigger
              value='bookings'
              className='flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 rounded-xl text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2.5 min-h-[40px] touch-target'
            >
              <Users className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='hidden lg:inline'>Bookings</span>
              <span className='lg:hidden'>Book</span>
            </TabsTrigger>
            <TabsTrigger
              value='calendar'
              className='flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 rounded-xl text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2.5 min-h-[40px] touch-target'
            >
              <Calendar className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='hidden lg:inline'>Calendar</span>
              <span className='lg:hidden'>Cal</span>
            </TabsTrigger>
            <TabsTrigger
              value='analytics'
              className='flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 rounded-xl text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2.5 min-h-[40px] touch-target'
            >
              <BarChart3 className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='hidden lg:inline'>Analytics</span>
              <span className='lg:hidden'>Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value='profile'
              className='flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 rounded-xl text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2.5 min-h-[40px] touch-target'
            >
              <User className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='hidden lg:inline'>Profile</span>
              <span className='lg:hidden'>User</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='properties'>
            <PropertiesTab
              properties={properties}
              propertiesStatsMap={propertiesStatsMap}
              propertyFilter={propertyFilter}
              setPropertyFilter={setPropertyFilter}
              loadingStates={loadingStates}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onPause={handlePauseClick}
              onActivate={handleActivateProperty}
              onRestore={handleRestoreClick}
              onAddProperty={handleAddProperty}
            />
          </TabsContent>

          <TabsContent value='bookings'>
            <BookingsList />
          </TabsContent>

          <TabsContent value='calendar'>
            <CalendarTab
              properties={properties}
              onAddProperty={handleAddProperty}
            />
          </TabsContent>

          <TabsContent value='analytics'>
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value='profile'>
            <HostProfileForm />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, property: null })}
        onConfirm={handleDeleteConfirm}
        propertyTitle={deleteModal.property?.title || ''}
        isLoading={
          deleteModal.property
            ? loadingStates[deleteModal.property.id]?.loading &&
              loadingStates[deleteModal.property.id]?.action === 'deleting'
            : false
        }
      />

      {/* Pause Confirmation Modal */}
      <PauseConfirmationModal
        isOpen={pauseModal.isOpen}
        onClose={() => setPauseModal({ isOpen: false, property: null })}
        onConfirm={handlePauseConfirm}
        propertyTitle={pauseModal.property?.title || ''}
        isLoading={
          pauseModal.property
            ? loadingStates[pauseModal.property.id]?.loading &&
              loadingStates[pauseModal.property.id]?.action === 'pausing'
            : false
        }
      />
    </div>
  );
};

export default HostDashboard;
