-- Create table for tracking user visits to listings
CREATE TABLE public.listing_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX idx_listing_visits_user_id ON public.listing_visits(user_id);
CREATE INDEX idx_listing_visits_property_id ON public.listing_visits(property_id);
CREATE INDEX idx_listing_visits_user_recent ON public.listing_visits(user_id, visited_at DESC);

-- Create composite index for duplicate prevention (will handle this in the function)
CREATE INDEX idx_listing_visits_user_property_time ON public.listing_visits(user_id, property_id, visited_at);

-- Enable Row Level Security
ALTER TABLE public.listing_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own visits" ON public.listing_visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create visits" ON public.listing_visits  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Property hosts can view visits to their properties" ON public.listing_visits
  FOR SELECT USING (
    auth.uid() IN (
      SELECT host_id FROM public.properties WHERE id = property_id
    )
  );

-- Function to track listing visit
CREATE OR REPLACE FUNCTION public.track_listing_visit(target_property_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  visit_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Only track visits for authenticated users
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if property exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = target_property_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Property not found or inactive';
  END IF;

  -- Check if user visited this property in the last 5 minutes
  SELECT id INTO visit_id 
  FROM public.listing_visits
  WHERE user_id = current_user_id 
    AND property_id = target_property_id
    AND visited_at >= NOW() - INTERVAL '5 minutes'
  ORDER BY visited_at DESC
  LIMIT 1;

  -- If no recent visit found, create a new one
  IF visit_id IS NULL THEN
    INSERT INTO public.listing_visits (user_id, property_id) 
    VALUES (current_user_id, target_property_id)
    RETURNING id INTO visit_id;
  END IF;

  RETURN visit_id;
END;
$$;

-- Function to get user's visited listings
CREATE OR REPLACE FUNCTION public.get_user_visited_listings(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  property_id UUID,
  title TEXT,
  property_type property_type,
  price_per_night DECIMAL(10, 2),
  city TEXT,
  images TEXT[],
  last_visited_at TIMESTAMP WITH TIME ZONE,
  visit_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Only allow authenticated users
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.property_type,
    p.price_per_night,
    p.city,
    p.images,
    MAX(lv.visited_at) as last_visited_at,
    COUNT(lv.id) as visit_count
  FROM public.listing_visits lv
  JOIN public.properties p ON lv.property_id = p.id
  WHERE lv.user_id = current_user_id
    AND p.is_active = true
  GROUP BY p.id, p.title, p.property_type, p.price_per_night, p.city, p.images
  ORDER BY last_visited_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to get visit statistics for property hosts
CREATE OR REPLACE FUNCTION public.get_property_visit_stats(target_property_id UUID)
RETURNS TABLE (
  total_visits BIGINT,
  unique_visitors BIGINT,
  visits_today BIGINT,
  visits_this_week BIGINT,
  visits_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  property_host_id UUID;
BEGIN
  -- Check if user is the property host
  SELECT host_id INTO property_host_id
  FROM public.properties
  WHERE id = target_property_id;
  
  IF property_host_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied - only property host can view visit stats';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_visits,
    COUNT(DISTINCT user_id)::BIGINT as unique_visitors,
    COUNT(*) FILTER (WHERE visited_at >= CURRENT_DATE)::BIGINT as visits_today,
    COUNT(*) FILTER (WHERE visited_at >= DATE_TRUNC('week', NOW()))::BIGINT as visits_this_week,
    COUNT(*) FILTER (WHERE visited_at >= DATE_TRUNC('month', NOW()))::BIGINT as visits_this_month
  FROM public.listing_visits 
  WHERE property_id = target_property_id;
END;
$$;

-- Enable real-time for the new table
ALTER TABLE public.listing_visits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_visits;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.listing_visits TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_listing_visit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_visited_listings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_visit_stats TO authenticated;