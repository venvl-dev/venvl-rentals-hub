
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { CalendarBooking } from '../types';
import { toast } from 'sonner';

export const useBookings = (userId: string, userType: 'host' | 'guest', currentDate: Date) => {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!userId) {
      console.log('No userId provided to useBookings hook');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      console.log(`Fetching bookings for ${userType} user ${userId} from ${startDate} to ${endDate}`);

      // First, get bookings with property data
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          property:properties(title)
        `)
        .gte('check_in', startDate)
        .lte('check_out', endDate);

      if (userType === 'host') {
        // Get properties owned by this host first
        const { data: hostProperties, error: propertiesError } = await supabase
          .from('properties')
          .select('id')
          .eq('host_id', userId);
        
        if (propertiesError) {
          console.error('Error fetching host properties:', propertiesError);
          throw propertiesError;
        }

        if (!hostProperties || hostProperties.length === 0) {
          console.log('No properties found for host:', userId);
          setBookings([]);
          setLoading(false);
          return;
        }

        const propertyIds = hostProperties.map(p => p.id);
        bookingsQuery = bookingsQuery.in('property_id', propertyIds);
      } else {
        bookingsQuery = bookingsQuery.eq('guest_id', userId);
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery;

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log(`Found ${bookingsData?.length || 0} bookings`);

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get unique guest IDs for guest profile data
      const guestIds = [...new Set(bookingsData.map(b => b.guest_id).filter(Boolean))];
      
      let guestProfiles: any[] = [];
      if (guestIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', guestIds);

        if (profilesError) {
          console.error('Error fetching guest profiles:', profilesError);
          // Don't throw error here, just log it and continue without guest names
        } else {
          guestProfiles = profiles || [];
        }
      }

      // Combine the data
      const typedBookings: CalendarBooking[] = bookingsData.map(booking => {
        const guestProfile = guestProfiles.find(p => p.id === booking.guest_id);
        return {
          ...booking,
          property: booking.property || null,
          guest: guestProfile ? {
            first_name: guestProfile.first_name || '',
            last_name: guestProfile.last_name || ''
          } : null
        };
      });
      
      setBookings(typedBookings);
    } catch (error) {
      console.error('Error in fetchBookings:', error);
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userId, userType, currentDate]);

  return { bookings, loading, refetch: fetchBookings };
};
