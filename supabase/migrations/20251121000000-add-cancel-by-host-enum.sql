
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'cancel_by_host'
    AND enumtypid = 'public.guest_event_type'::regtype
  ) THEN
    ALTER TYPE public.guest_event_type ADD VALUE 'cancel_by_host';
  END IF;
END $$;
