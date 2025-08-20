
-- First, let's check what policies already exist and create only the missing ones
-- Create policy to allow users to view their own profile (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
          ON public.profiles 
          FOR SELECT 
          USING (auth.uid() = id);
    END IF;
END $$;

-- Create policy to allow users to update their own profile (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
          ON public.profiles 
          FOR UPDATE 
          USING (auth.uid() = id);
    END IF;
END $$;

-- Create policy to allow admins to view all profiles (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        CREATE POLICY "Admins can view all profiles" 
          ON public.profiles 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
          );
    END IF;
END $$;

-- Create policy to allow admins to update all profiles (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can update all profiles'
    ) THEN
        CREATE POLICY "Admins can update all profiles" 
          ON public.profiles 
          FOR UPDATE 
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
          );
    END IF;
END $$;

-- Most importantly, create a policy that allows the system to insert profiles during signup
-- This is needed for the trigger function to work properly
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Allow system to insert profiles during signup'
    ) THEN
        CREATE POLICY "Allow system to insert profiles during signup" 
          ON public.profiles 
          FOR INSERT 
          WITH CHECK (true);
    END IF;
END $$;
