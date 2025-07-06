import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isAfter, isBefore, isEqual, addDays, differenceInDays } from 'date-fns';

export interface BookingCalendarData {
  id: string;
  check_in: string;
  check_out: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  guest_name?: string;
  guest_id: string;
  booking_type: 'daily' | 'monthly';
  total_price: number;
}

export interface BlockedDate {
  id?: string;
  property_id: string;
  date: string;
  reason: string;
  created_by: string;
  created_at?: string;
}

export interface CalendarDay {
  date: Date;
  status: 'available' | 'booked' | 'blocked' | 'pending';
  bookingData?: BookingCalendarData;
  blockedReason?: string;
  isToday: boolean;
  isCurrentMonth: boolean;
}

// Cache for frequently accessed data
const calendarCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = calendarCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  calendarCache.delete(key);
  return null;
}

function setCachedData(key: string, data: any): void {
  calendarCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch all bookings for a property with optimized query
 */
export async function fetchPropertyBookings(propertyId: string): Promise<BookingCalendarData[]> {
  const cacheKey = `bookings_${propertyId}`;
  const cached = getCachedData<BookingCalendarData[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        check_in,
        check_out,
        status,
        guest_id,
        booking_type,
        total_price,
        profiles:guest_id(first_name, last_name)
      `)
      .eq('property_id', propertyId)
      .in('status', ['pending', 'confirmed', 'completed'])
      .order('check_in', { ascending: true });

    if (error) throw error;

    const bookings: BookingCalendarData[] = data?.map(booking => ({
      id: booking.id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      status: booking.status as BookingCalendarData['status'],
      guest_id: booking.guest_id,
      booking_type: booking.booking_type as 'daily' | 'monthly',
      total_price: booking.total_price,
      guest_name: (booking as any).profiles ? 
        `${(booking as any).profiles.first_name} ${(booking as any).profiles.last_name}` : 
        'Guest'
    })) || [];

    setCachedData(cacheKey, bookings);
    return bookings;
  } catch (error) {
    console.error('Error fetching property bookings:', error);
    return [];
  }
}

/**
 * Fetch blocked dates for a property
 */
export async function fetchBlockedDates(propertyId: string): Promise<BlockedDate[]> {
  const cacheKey = `blocked_${propertyId}`;
  const cached = getCachedData<BlockedDate[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('property_availability')
      .select('*')
      .eq('property_id', propertyId)
      .order('blocked_date', { ascending: true });

    if (error) throw error;

    const blockedDates: BlockedDate[] = data?.map(item => ({
      id: item.id,
      property_id: item.property_id,
      date: item.blocked_date,
      reason: item.reason || 'Unavailable',
      created_by: (item as any).created_by || null,
      created_at: item.created_at
    })) || [];

    setCachedData(cacheKey, blockedDates);
    return blockedDates;
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return [];
  }
}

/**
 * Check if a date range conflicts with existing bookings
 */
export async function checkDateAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ available: boolean; conflicts: BookingCalendarData[] }> {
  try {
    const { data: conflicts, error } = await supabase.rpc('check_booking_conflicts', {
      p_property_id: propertyId,
      p_check_in: format(checkIn, 'yyyy-MM-dd'),
      p_check_out: format(checkOut, 'yyyy-MM-dd'),
    });

    if (error) throw error;

    return {
      available: !conflicts,
      conflicts: conflicts ? [] : [] // Would contain conflicting bookings if available
    };
  } catch (error) {
    console.error('Error checking date availability:', error);
    return { available: false, conflicts: [] };
  }
}

/**
 * Block specific dates for a property
 */
export async function blockDates(
  propertyId: string,
  dates: Date[],
  reason: string,
  userId: string
): Promise<boolean> {
  try {
    const blockedDates = dates.map(date => ({
      property_id: propertyId,
      blocked_date: format(date, 'yyyy-MM-dd'),
      reason,
      created_by: userId
    }));

    const { error } = await supabase
      .from('property_availability')
      .insert(blockedDates);

    if (error) throw error;

    // Clear cache
    calendarCache.delete(`blocked_${propertyId}`);
    return true;
  } catch (error) {
    console.error('Error blocking dates:', error);
    return false;
  }
}

/**
 * Unblock specific dates for a property
 */
export async function unblockDates(
  propertyId: string,
  dates: Date[]
): Promise<boolean> {
  try {
    const dateStrings = dates.map(date => format(date, 'yyyy-MM-dd'));

    const { error } = await supabase
      .from('property_availability')
      .delete()
      .eq('property_id', propertyId)
      .in('blocked_date', dateStrings);

    if (error) throw error;

    // Clear cache
    calendarCache.delete(`blocked_${propertyId}`);
    return true;
  } catch (error) {
    console.error('Error unblocking dates:', error);
    return false;
  }
}

/**
 * Generate calendar days for a month with booking status
 */
export async function generateCalendarDays(
  propertyId: string,
  year: number,
  month: number
): Promise<CalendarDay[]> {
  const cacheKey = `calendar_${propertyId}_${year}_${month}`;
  const cached = getCachedData<CalendarDay[]>(cacheKey);
  if (cached) return cached;

  const bookings = await fetchPropertyBookings(propertyId);
  const blockedDates = await fetchBlockedDates(propertyId);
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const today = new Date();
  
  const days: CalendarDay[] = [];

  for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if date is blocked
    const blockedDate = blockedDates.find(bd => bd.date === dateStr);
    if (blockedDate) {
      days.push({
        date: new Date(date),
        status: 'blocked',
        blockedReason: blockedDate.reason,
        isToday: isEqual(date, today),
        isCurrentMonth: date.getMonth() === month
      });
      continue;
    }

    // Check if date has booking
    const booking = bookings.find(b => {
      const checkIn = parseISO(b.check_in);
      const checkOut = parseISO(b.check_out);
      return (isEqual(date, checkIn) || isAfter(date, checkIn)) && 
             isBefore(date, checkOut);
    });

    if (booking) {
      days.push({
        date: new Date(date),
        status: booking.status === 'pending' ? 'pending' : 'booked',
        bookingData: booking,
        isToday: isEqual(date, today),
        isCurrentMonth: date.getMonth() === month
      });
    } else {
      days.push({
        date: new Date(date),
        status: 'available',
        isToday: isEqual(date, today),
        isCurrentMonth: date.getMonth() === month
      });
    }
  }

  setCachedData(cacheKey, days);
  return days;
}

/**
 * Get calendar color for status
 */
export function getCalendarStatusColor(status: CalendarDay['status']): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'booked':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'blocked':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-500 border-gray-100';
  }
}

/**
 * Get calendar status label
 */
export function getCalendarStatusLabel(status: CalendarDay['status']): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'booked':
      return 'Booked';
    case 'pending':
      return 'Pending';
    case 'blocked':
      return 'Blocked';
    default:
      return '';
  }
}

/**
 * Clear calendar cache for a property
 */
export function clearCalendarCache(propertyId?: string): void {
  if (propertyId) {
    // Clear specific property cache
    const keysToDelete = Array.from(calendarCache.keys()).filter(key => 
      key.includes(propertyId)
    );
    keysToDelete.forEach(key => calendarCache.delete(key));
  } else {
    // Clear all cache
    calendarCache.clear();
  }
} 
