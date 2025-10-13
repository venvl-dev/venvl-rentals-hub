-- Create storage bucket for business verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-documents',
  'business-documents',
  false, -- Private bucket for security
  10485760, -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for business documents
CREATE POLICY "Business documents are accessible by admins" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'business-documents' AND
    (
      -- Allow user to view their own documents
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Allow super_admin to view all documents
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
    )
  );

CREATE POLICY "Authenticated hosts can upload business documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-documents' AND
    auth.role() = 'authenticated' AND
    -- Only allow uploads to their own folder
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own business documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own business documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add business verification fields to profiles table if they don't exist
DO $$
BEGIN
    -- Add company_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
        ALTER TABLE profiles ADD COLUMN company_name TEXT;
    END IF;

    -- Add commercial_register column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commercial_register') THEN
        ALTER TABLE profiles ADD COLUMN commercial_register TEXT;
    END IF;

    -- Add tax_card column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tax_card') THEN
        ALTER TABLE profiles ADD COLUMN tax_card TEXT;
    END IF;

    -- Add business_verification_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_verification_status') THEN
        ALTER TABLE profiles ADD COLUMN business_verification_status TEXT DEFAULT 'not_submitted';
    END IF;

    -- Add commercial_register_document column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commercial_register_document') THEN
        ALTER TABLE profiles ADD COLUMN commercial_register_document TEXT;
    END IF;

    -- Add tax_card_document column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tax_card_document') THEN
        ALTER TABLE profiles ADD COLUMN tax_card_document TEXT;
    END IF;
END $$;

-- Add constraint for business_verification_status values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'profiles_business_verification_status_check') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_business_verification_status_check
        CHECK (business_verification_status IN ('not_submitted', 'pending', 'verified', 'rejected'));
    END IF;
END $$;