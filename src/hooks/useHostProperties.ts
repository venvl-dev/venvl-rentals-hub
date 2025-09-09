import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { cleanAmenityIds } from '@/lib/amenitiesUtils';

const fetchHostProperties = async (hostId: string, filter: 'active' | 'archived' | 'all' = 'active'): Promise<Property[]> => {
  console.log('🔍 Fetching properties for host ID:', hostId, 'with filter:', filter);
  
  let query = supabase
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
      host_id,
      deleted_at
      `
    )
    .eq('host_id', hostId);

  // Apply filter based on selection
  if (filter === 'active') {
    query = query.is('deleted_at', null); // Only active properties
  } else if (filter === 'archived') {
    query = query.not('deleted_at', 'is', null); // Only archived properties
  }
  // For 'all', no additional filter is applied
  
  const { data, error } = await query
    .order('created_at', { ascending: false });

  console.log('📊 Raw query result:', { data, error, hostId });
  
  if (error) {
    console.error('❌ Error fetching properties:', error);
    throw error;
  }
  
  const processedData = (data || []).map((p) => ({
    ...p,
    amenities: cleanAmenityIds(p.amenities || []),
  })) as Property[];
  
  console.log('✅ Processed properties:', processedData.length, 'properties found');
  
  return processedData;
};

export const useHostProperties = (hostId?: string, filter: 'active' | 'archived' | 'all' = 'active') =>
  useQuery<Property[]>({
    queryKey: ['hostProperties', hostId, filter],
    queryFn: () => fetchHostProperties(hostId as string, filter),
    enabled: !!hostId,
    staleTime: 5 * 60 * 1000,
  });

export default useHostProperties;
