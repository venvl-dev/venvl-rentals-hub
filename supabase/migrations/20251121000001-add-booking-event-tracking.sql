-- Migration Part 2: Add Booking & Cancellation Event Tracking Functions
-- Description: Implements event logging for confirmed bookings and cancellations
-- Dependencies: guest_events table, bookings table, log_guest_event function, cancel_by_host enum value

-- Step 1: Create function to log booking events with comprehensive payload
CREATE OR REPLACE FUNCTION public.log_booking_event(
  p_booking_id UUID,
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_guests INTEGER,
  p_total_egp DECIMAL,
  p_payment_status TEXT DEFAULT NULL,
  p_booking_type TEXT DEFAULT 'daily',
  p_duration_months INTEGER DEFAULT NULL,
  p_action_source TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  event_payload JSONB;
BEGIN
  -- Build the event payload according to spec
  event_payload := jsonb_build_object(
    'booking_id', p_booking_id::text,
    'property_id', p_property_id::text,
    'check_in', p_check_in,
    'check_out', p_check_out,
    'guests', p_guests,
    'total_egp', p_total_egp,
    'payment_status', p_payment_status,
    'booking_type', p_booking_type,
    'duration_months', p_duration_months,
    'action_source', p_action_source
  );

  -- Log the event using existing log_guest_event function
  event_id := log_guest_event('book', event_payload);

  -- Update guest_profiles metrics
  UPDATE public.guest_profiles
  SET
    short_term_bookings_count = CASE
      WHEN p_booking_type = 'daily' THEN COALESCE(short_term_bookings_count, 0) + 1
      ELSE COALESCE(short_term_bookings_count, 0)
    END,
    long_term_bookings_count = CASE
      WHEN p_booking_type = 'monthly' THEN COALESCE(long_term_bookings_count, 0) + 1
      ELSE COALESCE(long_term_bookings_count, 0)
    END,
    lifetime_value_egp = COALESCE(lifetime_value_egp, 0) + p_total_egp,
    last_seen = NOW(),
    updated_at = NOW()
  WHERE user_id = auth.uid();

  -- Create guest_profiles entry if doesn't exist
  INSERT INTO public.guest_profiles (user_id, first_seen, last_seen)
  VALUES (auth.uid(), NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN event_id;
END;
$$;

-- Step 3: Create function to log cancellation events with reason and refund info
CREATE OR REPLACE FUNCTION public.log_cancellation_event(
  p_booking_id UUID,
  p_reason_code TEXT,
  p_refund_amount_egp DECIMAL DEFAULT 0,
  p_days_before_checkin INTEGER DEFAULT NULL,
  p_cancelled_by TEXT DEFAULT 'guest' -- 'guest' or 'host'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  event_payload JSONB;
  event_type public.guest_event_type;
  booking_info RECORD;
  refund_ratio DECIMAL;
BEGIN
  -- Get booking information for context
  SELECT
    b.property_id,
    b.total_price,
    b.check_in,
    b.check_out,
    b.guests
  INTO booking_info
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  -- Calculate refund ratio
  IF booking_info.total_price > 0 THEN
    refund_ratio := p_refund_amount_egp / booking_info.total_price;
  ELSE
    refund_ratio := 0;
  END IF;

  -- Determine event type based on who cancelled
  IF p_cancelled_by = 'host' THEN
    event_type := 'cancel_by_host';
  ELSE
    event_type := 'cancel';
  END IF;

  -- Build the cancellation event payload according to spec
  event_payload := jsonb_build_object(
    'booking_id', p_booking_id::text,
    'property_id', booking_info.property_id::text,
    'reason_code', p_reason_code,
    'refund_amount_egp', p_refund_amount_egp,
    'days_before_checkin', p_days_before_checkin,
    'refund_ratio', refund_ratio,
    'cancelled_by', p_cancelled_by,
    'original_total_egp', booking_info.total_price,
    'check_in', booking_info.check_in,
    'check_out', booking_info.check_out,
    'guests', booking_info.guests
  );

  -- Log the event using existing log_guest_event function
  event_id := log_guest_event(event_type, event_payload);

  RETURN event_id;
END;
$$;

-- Step 4: Create helper function to calculate refund amount based on cancellation policy
CREATE OR REPLACE FUNCTION public.calculate_refund_amount(
  p_booking_id UUID,
  p_days_before_checkin INTEGER DEFAULT NULL
)
RETURNS TABLE (
  refund_amount DECIMAL,
  refund_percentage INTEGER,
  days_before_checkin INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_info RECORD;
  calculated_days INTEGER;
  refund_pct INTEGER;
  refund_amt DECIMAL;
BEGIN
  -- Get booking information
  SELECT
    b.total_price,
    b.check_in,
    b.final_price
  INTO booking_info
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  -- Calculate days before check-in if not provided
  IF p_days_before_checkin IS NULL THEN
    calculated_days := EXTRACT(DAY FROM (booking_info.check_in::timestamp - NOW()));
  ELSE
    calculated_days := p_days_before_checkin;
  END IF;

  -- Apply cancellation policy
  -- More than 7 days: Full refund
  -- 3-7 days: 50% refund
  -- Less than 3 days: No refund
  IF calculated_days > 7 THEN
    refund_pct := 100;
  ELSIF calculated_days >= 3 THEN
    refund_pct := 50;
  ELSE
    refund_pct := 0;
  END IF;

  -- Use final_price if available, otherwise total_price
  refund_amt := COALESCE(booking_info.final_price, booking_info.total_price) * (refund_pct::DECIMAL / 100);

  RETURN QUERY SELECT refund_amt, refund_pct, calculated_days;
END;
$$;

-- Step 5: Create analytics view for booking events
CREATE OR REPLACE VIEW public.booking_events_summary AS
SELECT
  DATE_TRUNC('day', ge.ts) AS event_date,
  ge.type AS event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT ge.user_id) AS unique_users,
  AVG((ge.payload->>'total_egp')::DECIMAL) AS avg_booking_value,
  SUM((ge.payload->>'total_egp')::DECIMAL) AS total_booking_value,
  SUM(CASE WHEN ge.payload->>'booking_type' = 'daily' THEN 1 ELSE 0 END) AS daily_bookings,
  SUM(CASE WHEN ge.payload->>'booking_type' = 'monthly' THEN 1 ELSE 0 END) AS monthly_bookings
FROM public.guest_events ge
WHERE ge.type IN ('book', 'cancel', 'cancel_by_host')
GROUP BY DATE_TRUNC('day', ge.ts), ge.type
ORDER BY event_date DESC, event_type;

-- Step 6: Create analytics view for cancellation reasons
CREATE OR REPLACE VIEW public.cancellation_reasons_summary AS
SELECT
  ge.payload->>'reason_code' AS reason,
  ge.type AS cancellation_type,
  COUNT(*) AS cancellation_count,
  AVG((ge.payload->>'days_before_checkin')::INTEGER) AS avg_days_before_checkin,
  AVG((ge.payload->>'refund_ratio')::DECIMAL) AS avg_refund_ratio,
  SUM((ge.payload->>'refund_amount_egp')::DECIMAL) AS total_refunds
FROM public.guest_events ge
WHERE ge.type IN ('cancel', 'cancel_by_host')
  AND ge.payload->>'reason_code' IS NOT NULL
GROUP BY ge.payload->>'reason_code', ge.type
ORDER BY cancellation_count DESC;

-- Step 7: Create function to get booking funnel analytics
CREATE OR REPLACE FUNCTION public.get_booking_funnel_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  stage TEXT,
  count BIGINT,
  conversion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  views_count BIGINT;
  checkout_count BIGINT;
  bookings_count BIGINT;
  cancellations_count BIGINT;
BEGIN
  -- Count property views
  SELECT COUNT(*) INTO views_count
  FROM public.guest_events
  WHERE type = 'view'
    AND ts BETWEEN p_start_date AND p_end_date;

  -- Count checkout starts
  SELECT COUNT(*) INTO checkout_count
  FROM public.guest_events
  WHERE type = 'start_checkout'
    AND ts BETWEEN p_start_date AND p_end_date;

  -- Count confirmed bookings
  SELECT COUNT(*) INTO bookings_count
  FROM public.guest_events
  WHERE type = 'book'
    AND ts BETWEEN p_start_date AND p_end_date;

  -- Count cancellations
  SELECT COUNT(*) INTO cancellations_count
  FROM public.guest_events
  WHERE type IN ('cancel', 'cancel_by_host')
    AND ts BETWEEN p_start_date AND p_end_date;

  -- Return funnel stages with conversion rates
  RETURN QUERY
  SELECT 'views'::TEXT, views_count, 100.0::DECIMAL
  UNION ALL
  SELECT 'checkout_started'::TEXT, checkout_count,
    CASE WHEN views_count > 0 THEN (checkout_count::DECIMAL / views_count * 100) ELSE 0 END
  UNION ALL
  SELECT 'bookings_confirmed'::TEXT, bookings_count,
    CASE WHEN checkout_count > 0 THEN (bookings_count::DECIMAL / checkout_count * 100) ELSE 0 END
  UNION ALL
  SELECT 'bookings_cancelled'::TEXT, cancellations_count,
    CASE WHEN bookings_count > 0 THEN (cancellations_count::DECIMAL / bookings_count * 100) ELSE 0 END;
END;
$$;

-- Step 8: Create index for efficient event queries
CREATE INDEX IF NOT EXISTS idx_guest_events_booking_id
ON public.guest_events ((payload->>'booking_id'))
WHERE type IN ('book', 'cancel', 'cancel_by_host');

CREATE INDEX IF NOT EXISTS idx_guest_events_booking_type
ON public.guest_events (type, ts DESC)
WHERE type IN ('book', 'cancel', 'cancel_by_host');

-- Step 9: Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.log_booking_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_cancellation_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_refund_amount TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_funnel_stats TO authenticated;
GRANT SELECT ON public.booking_events_summary TO authenticated;
GRANT SELECT ON public.cancellation_reasons_summary TO authenticated;

-- Step 10: Add helpful comments
COMMENT ON FUNCTION public.log_booking_event IS
'Logs a booking event to guest_events with standardized payload. Updates guest profile metrics.';

COMMENT ON FUNCTION public.log_cancellation_event IS
'Logs a cancellation event (guest or host initiated) with reason, refund info, and days before check-in.';

COMMENT ON FUNCTION public.calculate_refund_amount IS
'Calculates refund amount based on cancellation policy: >7 days = 100%, 3-7 days = 50%, <3 days = 0%';

COMMENT ON FUNCTION public.get_booking_funnel_stats IS
'Returns booking funnel analytics: views → checkout → bookings → cancellations with conversion rates.';

COMMENT ON VIEW public.booking_events_summary IS
'Daily summary of booking and cancellation events with aggregated metrics.';

COMMENT ON VIEW public.cancellation_reasons_summary IS
'Summary of cancellation reasons, types, and refund statistics.';
