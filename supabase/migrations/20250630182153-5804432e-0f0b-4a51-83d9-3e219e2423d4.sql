
-- Add booking reference number and enhance booking status tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EGP',
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;

-- Create index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_property_dates ON public.bookings (property_id, check_in, check_out);

-- Function to generate unique booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
    ref_number TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        ref_number := 'VNV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
        
        -- Check if reference already exists
        IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_reference = ref_number) THEN
            RETURN ref_number;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            -- Fallback with random suffix
            ref_number := ref_number || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN ref_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking reference on insert
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_reference
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_reference();

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflicts(
    p_property_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM public.bookings
    WHERE property_id = p_property_id
        AND status IN ('pending', 'confirmed', 'checked_in')
        AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
        AND (
            (check_in <= p_check_in AND check_out > p_check_in) OR
            (check_in < p_check_out AND check_out >= p_check_out) OR
            (check_in >= p_check_in AND check_out <= p_check_out)
        );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies for bookings table
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Hosts can view bookings for their properties" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (guest_id = auth.uid());

CREATE POLICY "Hosts can view bookings for their properties" ON public.bookings
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM public.properties WHERE host_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (
        guest_id = auth.uid() OR 
        property_id IN (
            SELECT id FROM public.properties WHERE host_id = auth.uid()
        )
    );

-- Create booking_notifications table for tracking notifications
CREATE TABLE IF NOT EXISTS public.booking_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL,
    notification_type TEXT NOT NULL, -- 'booking_confirmed', 'new_booking', 'booking_cancelled'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on booking_notifications
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own booking notifications" ON public.booking_notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "System can insert booking notifications" ON public.booking_notifications
    FOR INSERT WITH CHECK (true);
