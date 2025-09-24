import { Database } from '@/integrations/supabase/types';

export type BookingStatus = Database['public']['Enums']['booking_status'];

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string | null;
  updated_at: string | null;

  // Joined data from other tables
  property?: {
    title: string;
    images: string[];
    city: string;
    state: string | null;
  };
}
