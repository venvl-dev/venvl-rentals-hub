
export interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  images: string[];
  city: string;
  state: string;
  address: string;
  country: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  host_id: string;
}
