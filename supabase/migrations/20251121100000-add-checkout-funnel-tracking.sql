-- Migration: Add Checkout Funnel Tracking (A4)
-- Description: Implements checkout abandonment detection and funnel analytics
-- Note: start_checkout enum value already exists, this adds the tracking logic

-- Step 0: Add session_id column to guest_events table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'guest_events'
      AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.guest_events
    ADD COLUMN session_id TEXT;

    -- Add index for session_id to improve query performance
    CREATE INDEX idx_guest_events_session_id ON public.guest_events(session_id);

    -- Add index for common query pattern (type + session_id)
    CREATE INDEX idx_guest_events_type_session ON public.guest_events(type, session_id);
  END IF;
END $$;

-- Step 0.5: Update log_guest_event function to support session_id parameter
-- Drop the old 2-parameter version to avoid ambiguity
DROP FUNCTION IF EXISTS public.log_guest_event(public.guest_event_type, JSONB);

-- Create new 3-parameter version with session_id support
CREATE OR REPLACE FUNCTION public.log_guest_event(
  event_type public.guest_event_type,
  event_payload JSONB,
  p_session_id TEXT DEFAULT NULL
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

  -- Insert with session_id if provided
  INSERT INTO public.guest_events (
    type,
    payload,
    user_id,
    session_id
  ) VALUES (
    event_type,
    event_payload,
    current_user_id,
    p_session_id
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_guest_event TO authenticated;

-- Step 1: Create function to log checkout start event with deduplication
CREATE OR REPLACE FUNCTION public.log_checkout_start_event(
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_guests INTEGER,
  p_total_egp DECIMAL,
  p_booking_type TEXT DEFAULT 'daily',
  p_duration_months INTEGER DEFAULT NULL,
  p_payment_method_selected TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  event_payload JSONB;
  existing_recent_checkout UUID;
BEGIN
  -- Deduplication: Check for duplicate start_checkout within last 5 minutes for same session
  IF p_session_id IS NOT NULL THEN
    SELECT id INTO existing_recent_checkout
    FROM public.guest_events
    WHERE session_id = p_session_id
      AND type = 'start_checkout'
      AND payload->>'property_id' = p_property_id::text
      AND ts >= NOW() - INTERVAL '5 minutes'
    ORDER BY ts DESC
    LIMIT 1;

    -- Return existing event ID if found (prevents duplicate logging)
    IF existing_recent_checkout IS NOT NULL THEN
      RETURN existing_recent_checkout;
    END IF;
  END IF;

  -- Build event payload per spec
  event_payload := jsonb_build_object(
    'property_id', p_property_id::text,
    'check_in', p_check_in,
    'check_out', p_check_out,
    'guests', p_guests,
    'total_egp', p_total_egp,
    'booking_type', p_booking_type,
    'duration_months', p_duration_months,
    'payment_method_selected', p_payment_method_selected
  );

  -- Use existing log_guest_event function
  event_id := log_guest_event('start_checkout', event_payload, p_session_id);

  RETURN event_id;
END;
$$;

-- Step 2: Create function to detect abandoned checkouts (30-minute threshold)
CREATE OR REPLACE FUNCTION public.flag_abandoned_checkouts(
  p_minutes_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  checkout_event_id UUID,
  session_id TEXT,
  user_id UUID,
  property_id TEXT,
  minutes_since_checkout INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH recent_checkouts AS (
    -- Get start_checkout events past the threshold time
    SELECT
      ge.id AS checkout_id,
      ge.session_id,
      ge.user_id,
      ge.payload->>'property_id' AS prop_id,
      ge.ts AS checkout_time
    FROM public.guest_events ge
    WHERE ge.type = 'start_checkout'
      AND ge.ts <= NOW() - (p_minutes_threshold || ' minutes')::INTERVAL
      AND ge.ts >= NOW() - INTERVAL '24 hours' -- Only check last 24 hours
      AND ge.session_id IS NOT NULL
  ),
  completed_sessions AS (
    -- Sessions with a 'book' event after start_checkout
    SELECT DISTINCT rc.session_id
    FROM recent_checkouts rc
    INNER JOIN public.guest_events ge ON ge.session_id = rc.session_id
    WHERE ge.type = 'book'
      AND ge.ts > rc.checkout_time
  )
  -- Return abandoned checkouts (no book event, not already flagged)
  SELECT
    rc.checkout_id,
    rc.session_id,
    rc.user_id,
    rc.prop_id,
    EXTRACT(EPOCH FROM (NOW() - rc.checkout_time))::INTEGER / 60 AS minutes_elapsed
  FROM recent_checkouts rc
  WHERE rc.session_id NOT IN (SELECT session_id FROM completed_sessions)
  ORDER BY rc.checkout_time DESC;
END;
$$;

-- Step 3: Create analytics view for checkout funnel
CREATE OR REPLACE VIEW public.checkout_funnel_analysis AS
WITH funnel_stages AS (
  SELECT
    DATE_TRUNC('day', ge.ts) AS funnel_date,
    ge.session_id,
    ge.user_id,
    ge.payload->>'property_id' AS property_id,
    MIN(CASE WHEN ge.type = 'start_checkout' THEN ge.ts END) AS checkout_started_at,
    MIN(CASE WHEN ge.type = 'book' THEN ge.ts END) AS booking_completed_at
  FROM public.guest_events ge
  WHERE ge.type IN ('start_checkout', 'book')
    AND ge.session_id IS NOT NULL
  GROUP BY DATE_TRUNC('day', ge.ts), ge.session_id, ge.user_id, ge.payload->>'property_id'
)
SELECT
  funnel_date,
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN checkout_started_at IS NOT NULL THEN session_id END) AS checkouts_started,
  COUNT(DISTINCT CASE WHEN booking_completed_at IS NOT NULL THEN session_id END) AS bookings_completed,
  COUNT(DISTINCT CASE
    WHEN checkout_started_at IS NOT NULL
    AND booking_completed_at IS NULL
    THEN session_id
  END) AS checkouts_abandoned,
  -- Conversion rate
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN booking_completed_at IS NOT NULL THEN session_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN checkout_started_at IS NOT NULL THEN session_id END), 0),
    2
  ) AS conversion_rate
FROM funnel_stages
GROUP BY funnel_date
ORDER BY funnel_date DESC;

-- Step 4: Create view for abandonment reasons analysis
CREATE OR REPLACE VIEW public.checkout_abandonment_analysis AS
WITH checkout_sessions AS (
  SELECT
    ge.session_id,
    ge.user_id,
    ge.payload->>'property_id' AS property_id,
    ge.ts AS started_at,
    ge.payload->>'total_egp' AS total_egp
  FROM public.guest_events ge
  WHERE ge.type = 'start_checkout'
    AND ge.session_id IS NOT NULL
    AND ge.ts >= NOW() - INTERVAL '7 days'
),
completed_bookings AS (
  SELECT
    ge.session_id,
    ge.ts AS completed_at
  FROM public.guest_events ge
  WHERE ge.type = 'book'
    AND ge.session_id IS NOT NULL
    AND ge.ts >= NOW() - INTERVAL '7 days'
)
SELECT
  cs.session_id,
  cs.user_id,
  cs.property_id,
  cs.total_egp,
  cs.started_at,
  cb.completed_at,
  CASE
    WHEN cb.completed_at IS NOT NULL THEN 'Completed'
    WHEN NOW() - cs.started_at > INTERVAL '30 minutes' THEN 'Abandoned (>30min)'
    ELSE 'In Progress'
  END AS status,
  EXTRACT(EPOCH FROM (COALESCE(cb.completed_at, NOW()) - cs.started_at))::INTEGER / 60 AS duration_minutes
FROM checkout_sessions cs
LEFT JOIN completed_bookings cb ON cs.session_id = cb.session_id
ORDER BY cs.started_at DESC;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.log_checkout_start_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.flag_abandoned_checkouts TO authenticated;
GRANT SELECT ON public.checkout_funnel_analysis TO authenticated;
GRANT SELECT ON public.checkout_abandonment_analysis TO authenticated;

-- Step 6: Add helpful comments
COMMENT ON FUNCTION public.log_checkout_start_event IS
'Logs start_checkout event when user initiates booking flow. Deduplicates by session_id within 5 minutes to handle multiple tabs.';

COMMENT ON FUNCTION public.flag_abandoned_checkouts IS
'Identifies checkout sessions abandoned for >30 minutes without a book event. Used for abandonment analysis.';

COMMENT ON VIEW public.checkout_funnel_analysis IS
'Daily checkout funnel metrics: sessions, checkouts started, bookings completed, abandonment rate.';

COMMENT ON VIEW public.checkout_abandonment_analysis IS
'Detailed view of checkout sessions showing completion status and time to convert/abandon (last 7 days).';
