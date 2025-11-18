-- Fix log_guest_event function to match actual guest_events table structure
-- This handles cases where session_id column may not exist

-- Drop the old function
DROP FUNCTION IF EXISTS public.log_guest_event(public.guest_event_type, JSONB, TEXT, TEXT, TEXT);

-- Create simplified version without optional parameters that may not exist
CREATE OR REPLACE FUNCTION public.log_guest_event(
  event_type public.guest_event_type,
  event_payload JSONB
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

  -- Insert with only the columns that definitely exist
  INSERT INTO public.guest_events (
    type,
    payload,
    user_id
  ) VALUES (
    event_type,
    event_payload,
    current_user_id
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_guest_event TO authenticated;

-- Update the add_to_wishlist function to use simplified log_guest_event
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
      'property_id', target_property_id::text,
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

-- Update the remove_from_wishlist function similarly
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
      'property_id', target_property_id::text,
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
