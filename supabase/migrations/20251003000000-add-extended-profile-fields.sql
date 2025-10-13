-- Add extended profile fields to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS decade_born TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dream_destination TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pets TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_song TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS useless_skill TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fun_fact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spend_time TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS obsessed_with TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biography_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about_me TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add update timestamp trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update the updated_at column on profile changes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();