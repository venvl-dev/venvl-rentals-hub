
import { Database } from '@/integrations/supabase/types';

export type PropertyType = Database['public']['Enums']['property_type'];

export interface Property {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  property_type: PropertyType;
  rental_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number;
  price_per_night: number;
  daily_price: number | null;
  monthly_price: number | null;
  images: string[];
  amenities: string[];
  is_active: boolean | null;
  approval_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  host_id: string;
}
