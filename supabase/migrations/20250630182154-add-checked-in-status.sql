
-- Add 'checked_in' to the booking_status enum
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'checked_in';
