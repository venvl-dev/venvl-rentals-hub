import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { cleanAmenityIds } from '@/lib/amenitiesUtils';

const fetchHostProperties = async (hostId: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `
      id,
      title,
      description,
      address,
      city,
      state,
      country,
      postal_code,
      property_type,
      rental_type,
      bedrooms,
      bathrooms,
      max_guests,
      price_per_night,
      daily_price,
      monthly_price,
      min_nights,
      min_months,
      images,
      amenities,
      is_active,
      approval_status,
      blocked_dates,
      booking_types,
      created_at,
      updated_at,
      host_id
      `,
    )
    .eq('host_id', hostId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []).map((p) => ({
    ...p,
    amenities: cleanAmenityIds(p.amenities || []),
  })) as Property[];
};

export const useHostProperties = (hostId?: string) =>
  useQuery<Property[]>({
    queryKey: ['hostProperties', hostId],
    queryFn: () => fetchHostProperties(hostId as string),
    enabled: !!hostId,
    staleTime: 5 * 60 * 1000,
  });

export default useHostProperties;
