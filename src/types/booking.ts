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
  final_price?: number | null;
  status: BookingStatus;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  booking_reference?: string;
  guest_id_documents?: {
    main_guest?: string;
    additional_guests?: string[];
    uploaded_at?: string;
  } | null;
  id_verification_status?: string;

  // Joined data from other tables
  property?: {
    title: string;
    images: string[];
    city: string;
    state: string | null;
  };
}
