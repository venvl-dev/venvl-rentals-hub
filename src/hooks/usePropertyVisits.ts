import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const usePropertyVisitsCount = (id: string) => {
  const { data: count, isLoading } = useQuery({
    queryKey: ['property-visits', id],
    queryFn: async () => {
      const result = await supabase
        .from('property_visits')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', id);

      console.log(result);
      return result.count;
    },
  });

  return { count, isLoading };
};

export default usePropertyVisitsCount;
