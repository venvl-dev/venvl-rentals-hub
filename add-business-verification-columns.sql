-- Simple script to add business verification columns to profiles table
-- Run this in your Supabase SQL Editor

-- Add business verification columns to profiles table if they don't exist
DO $$
BEGIN
    -- Add company_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
        ALTER TABLE profiles ADD COLUMN company_name TEXT;
        RAISE NOTICE 'Added company_name column';
    END IF;

    -- Add commercial_register column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commercial_register') THEN
        ALTER TABLE profiles ADD COLUMN commercial_register TEXT;
        RAISE NOTICE 'Added commercial_register column';
    END IF;

    -- Add tax_card column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tax_card') THEN
        ALTER TABLE profiles ADD COLUMN tax_card TEXT;
        RAISE NOTICE 'Added tax_card column';
    END IF;

    -- Add business_verification_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_verification_status') THEN
        ALTER TABLE profiles ADD COLUMN business_verification_status TEXT DEFAULT 'not_submitted';
        RAISE NOTICE 'Added business_verification_status column';
    END IF;

    -- Add commercial_register_document column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commercial_register_document') THEN
        ALTER TABLE profiles ADD COLUMN commercial_register_document TEXT;
        RAISE NOTICE 'Added commercial_register_document column';
    END IF;

    -- Add tax_card_document column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tax_card_document') THEN
        ALTER TABLE profiles ADD COLUMN tax_card_document TEXT;
        RAISE NOTICE 'Added tax_card_document column';
    END IF;
END $$;

-- Add constraint for business_verification_status values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'profiles_business_verification_status_check') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_business_verification_status_check
        CHECK (business_verification_status IN ('not_submitted', 'pending', 'verified', 'rejected'));
        RAISE NOTICE 'Added business verification status constraint';
    END IF;
END $$;

-- Success message
SELECT 'Business verification columns added successfully!' as status;