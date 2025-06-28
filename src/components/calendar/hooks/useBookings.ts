
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { CalendarBooking } from '../types';

export const useBookings = (userId: string, userType: 'host' | 'guest', currentDate: Date) => {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

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
        const { data: hostProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('host_id', userId);
        
        if (hostProperties && hostProperties.length > 0) {
          const propertyIds = hostProperties.map(p => p.id);
          bookingsQuery = bookingsQuery.in('property_id', propertyIds);
        } else {
          setBookings([]);
          setLoading(false);
          return;
        }
      } else {
        bookingsQuery = bookingsQuery.eq('guest_id', userId);
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery;

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get unique guest IDs
      const guestIds = [...new Set(bookingsData?.map(b => b.guest_id) || [])];
      
      // Fetch guest profiles separately
      const { data: guestProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', guestIds);

      // Combine the data
      const typedBookings: CalendarBooking[] = (bookingsData || []).map(booking => {
        const guestProfile = guestProfiles?.find(p => p.id === booking.guest_id);
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
      console.error('Error fetching bookings:', error);
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
