-- Add wishlist_count column to guest_profiles
ALTER TABLE public.guest_profiles
ADD COLUMN IF NOT EXISTS wishlist_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for wishlist_count for analytics queries
CREATE INDEX IF NOT EXISTS idx_guest_profiles_wishlist_count
ON public.guest_profiles(wishlist_count DESC);

-- Create wishlists table for tracking user's saved properties
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  list_name TEXT DEFAULT 'default' NOT NULL,
  action_source TEXT, -- e.g., 'detail_page', 'search_results', 'map_view'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, property_id, list_name)
);

-- Create indexes for efficient queries
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_property_id ON public.wishlists(property_id);
CREATE INDEX idx_wishlists_user_list ON public.wishlists(user_id, list_name);
CREATE INDEX idx_wishlists_created_at ON public.wishlists(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlists
CREATE POLICY "Users can view their own wishlists" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create wishlist items" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wishlist items" ON public.wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their wishlist items" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- Function to log guest events
CREATE OR REPLACE FUNCTION public.log_guest_event(
  event_type public.guest_event_type,
  event_payload JSONB,
  p_session_id TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  INSERT INTO public.guest_events (
    type,
    payload,
    user_id,
    session_id,
    device_type,
    user_agent
  ) VALUES (
    event_type,
    event_payload,
    current_user_id,
    p_session_id,
    p_device_type,
    p_user_agent
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

-- Function to add property to wishlist with idempotent behavior
CREATE OR REPLACE FUNCTION public.add_to_wishlist(
  target_property_id UUID,
  p_list_name TEXT DEFAULT 'default',
  p_action_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  wishlist_id UUID;
  current_user_id UUID;
  is_new BOOLEAN := false;
  event_payload JSONB;
BEGIN
  current_user_id := auth.uid();

  -- Only allow authenticated users
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if property exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = target_property_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Property not found or inactive';
  END IF;

  -- Try to insert or get existing wishlist item (idempotent)
  INSERT INTO public.wishlists (user_id, property_id, list_name, action_source)
  VALUES (current_user_id, target_property_id, p_list_name, p_action_source)
  ON CONFLICT (user_id, property_id, list_name) DO UPDATE
    SET updated_at = NOW(),
        action_source = COALESCE(EXCLUDED.action_source, wishlists.action_source)
  RETURNING id, (xmax = 0) INTO wishlist_id, is_new;

  -- If this is a new wishlist item, update the wishlist_count and log event
  IF is_new THEN
    -- Update guest_profiles wishlist_count
    INSERT INTO public.guest_profiles (user_id, wishlist_count, first_seen, last_seen)
    VALUES (current_user_id, 1, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET wishlist_count = guest_profiles.wishlist_count + 1,
          last_seen = NOW(),
          updated_at = NOW();

    -- Log the wishlist_add event
    event_payload := jsonb_build_object(
      'property_id', target_property_id,
      'list_name', p_list_name,
      'action_source', p_action_source
    );

    PERFORM log_guest_event('wishlist_add', event_payload);
  END IF;

  RETURN jsonb_build_object(
    'id', wishlist_id,
    'is_new', is_new,
    'message', CASE
      WHEN is_new THEN 'Property added to wishlist'
      ELSE 'Property already in wishlist'
    END
  );
END;
$$;

-- Function to remove property from wishlist
CREATE OR REPLACE FUNCTION public.remove_from_wishlist(
  target_property_id UUID,
  p_list_name TEXT DEFAULT 'default'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  was_deleted BOOLEAN := false;
  event_payload JSONB;
BEGIN
  current_user_id := auth.uid();

  -- Only allow authenticated users
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Delete the wishlist item
  DELETE FROM public.wishlists
  WHERE user_id = current_user_id
    AND property_id = target_property_id
    AND list_name = p_list_name
  RETURNING true INTO was_deleted;

  -- If item was deleted, update the wishlist_count and log event
  IF was_deleted THEN
    -- Update guest_profiles wishlist_count
    UPDATE public.guest_profiles
    SET wishlist_count = GREATEST(0, wishlist_count - 1),
        last_seen = NOW(),
        updated_at = NOW()
    WHERE user_id = current_user_id;

    -- Log the wishlist_remove event
    event_payload := jsonb_build_object(
      'property_id', target_property_id,
      'list_name', p_list_name
    );

    PERFORM log_guest_event('wishlist_remove', event_payload);
  END IF;

  RETURN jsonb_build_object(
    'was_deleted', COALESCE(was_deleted, false),
    'message', CASE
      WHEN was_deleted THEN 'Property removed from wishlist'
      ELSE 'Property not found in wishlist'
    END
  );
END;
$$;

-- Function to get user's wishlist with property details
CREATE OR REPLACE FUNCTION public.get_user_wishlist(
  p_list_name TEXT DEFAULT 'default',
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  wishlist_id UUID,
  property_id UUID,
  title TEXT,
  property_type property_type,
  price_per_night DECIMAL(10, 2),
  city TEXT,
  images TEXT[],
  action_source TEXT,
  added_at TIMESTAMP WITH TIME ZONE
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
    w.id,
    p.id,
    p.title,
    p.property_type,
    p.price_per_night,
    p.city,
    p.images,
    w.action_source,
    w.created_at
  FROM public.wishlists w
  JOIN public.properties p ON w.property_id = p.id
  WHERE w.user_id = current_user_id
    AND w.list_name = p_list_name
    AND p.is_active = true
    AND (p.deleted_at IS NULL OR p.deleted_at > NOW())
  ORDER BY w.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to check if property is in wishlist
CREATE OR REPLACE FUNCTION public.is_in_wishlist(
  target_property_id UUID,
  p_list_name TEXT DEFAULT 'default'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  -- Anonymous users have no wishlists
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE user_id = current_user_id
      AND property_id = target_property_id
      AND list_name = p_list_name
  );
END;
$$;

-- Function to get wishlist count for user
CREATE OR REPLACE FUNCTION public.get_wishlist_count(
  p_list_name TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  count INTEGER;
BEGIN
  current_user_id := auth.uid();

  -- Anonymous users have no wishlists
  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::INTEGER INTO count
  FROM public.wishlists
  WHERE user_id = current_user_id
    AND (p_list_name IS NULL OR list_name = p_list_name);

  RETURN COALESCE(count, 0);
END;
$$;

-- Enable real-time for the wishlists table
ALTER TABLE public.wishlists REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlists;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT UPDATE ON public.guest_profiles TO authenticated;
GRANT INSERT ON public.guest_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_guest_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_from_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_in_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wishlist_count TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
