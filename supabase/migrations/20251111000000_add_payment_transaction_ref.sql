-- Add payment_transaction_ref column to bookings table
-- This stores the PayTabs transaction reference for payment tracking

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_transaction_ref TEXT;

-- Add index for faster lookups by transaction reference
CREATE INDEX IF NOT EXISTS idx_bookings_payment_transaction_ref
ON bookings(payment_transaction_ref);

-- Add comment to document the column
COMMENT ON COLUMN bookings.payment_transaction_ref IS 'PayTabs transaction reference for payment tracking and verification';
