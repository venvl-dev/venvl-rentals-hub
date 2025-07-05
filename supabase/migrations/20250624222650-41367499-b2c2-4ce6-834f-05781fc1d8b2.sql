
-- Create a function to seed sample data that will be called manually after real users exist
-- This approach avoids foreign key constraint issues

-- First, let's create a function that can be called to seed properties for an existing host
CREATE OR REPLACE FUNCTION public.seed_sample_properties_for_host(host_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert sample properties for the given host
  INSERT INTO public.properties (
    id, host_id, title, description, property_type, address, city, state, country, 
    postal_code, latitude, longitude, price_per_night, daily_price, monthly_price,
    max_guests, bedrooms, bathrooms, rental_type, images, amenities, approval_status, is_active
  ) VALUES
  (
    gen_random_uuid(),
    host_user_id,
    'Luxury Downtown Apartment',
    'Modern luxury apartment in the heart of downtown with stunning city views. Features high-end finishes, marble countertops, and premium appliances. Perfect for business travelers and couples.',
    'apartment',
    '123 Main Street, Unit 15A',
    'New York',
    'NY',
    'US',
    '10001',
    40.7589, -73.9851,
    250.00, 250.00, 6500.00,
    4, 2, 2,
    'daily',
    ARRAY['https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    ARRAY['WiFi', 'Kitchen', 'Air Conditioning', 'TV', 'Washing Machine', 'Dryer'],
    'approved',
    true
  ),
  (
    gen_random_uuid(),
    host_user_id,
    'Cozy Studio Near Central Park',
    'Charming studio apartment just steps from Central Park. Compact but efficiently designed with all modern amenities. Great for solo travelers or couples on a budget.',
    'studio',
    '456 Park Avenue, Apt 8B',
    'New York',
    'NY',
    'US',
    '10028',
    40.7794, -73.9632,
    180.00, 180.00, 4800.00,
    2, 1, 1,
    'daily',
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'],
    ARRAY['WiFi', 'Kitchen', 'Heating', 'TV'],
    'approved',
    true
  ),
  (
    gen_random_uuid(),
    host_user_id,
    'Spacious Family Villa',
    'Beautiful 4-bedroom villa perfect for families. Large backyard with BBQ area, modern kitchen, and comfortable living spaces. Located in a quiet residential neighborhood.',
    'villa',
    '789 Elm Street',
    'Los Angeles',
    'CA',
    'US',
    '90210',
    34.0901, -118.4065,
    400.00, 400.00, 10000.00,
    8, 4, 3,
    'daily',
    ARRAY['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
    ARRAY['WiFi', 'Kitchen', 'Pool', 'Free Parking', 'Air Conditioning', 'TV', 'Washing Machine', 'Dryer'],
    'approved',
    true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to seed bookings and reviews for existing properties
CREATE OR REPLACE FUNCTION public.seed_sample_bookings_and_reviews(guest_user_id UUID)
RETURNS void AS $$
DECLARE
  property_record RECORD;
  booking_id UUID;
BEGIN
  -- Create some bookings for existing properties
  FOR property_record IN 
    SELECT id, price_per_night FROM public.properties 
    WHERE is_active = true 
    LIMIT 3
  LOOP
    -- Create a completed booking from the past
    booking_id := gen_random_uuid();
    
    INSERT INTO public.bookings (
      id, property_id, guest_id, check_in, check_out, guests, total_price, status, created_at, updated_at
    ) VALUES (
      booking_id,
      property_record.id,
      guest_user_id,
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE - INTERVAL '27 days',
      2,
      property_record.price_per_night * 3,
      'completed',
      NOW() - INTERVAL '35 days',
      NOW() - INTERVAL '27 days'
    );
    
    -- Create a review for the completed booking
    INSERT INTO public.reviews (
      booking_id, guest_id, property_id, rating, comment, created_at
    ) VALUES (
      booking_id,
      guest_user_id,
      property_record.id,
      5,
      'Amazing stay! The property was exactly as described and the host was very responsive. Would definitely book again.',
      NOW() - INTERVAL '26 days'
    );
    
    -- Create a future booking
    INSERT INTO public.bookings (
      id, property_id, guest_id, check_in, check_out, guests, total_price, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      property_record.id,
      guest_user_id,
      CURRENT_DATE + INTERVAL '15 days',
      CURRENT_DATE + INTERVAL '18 days',
      2,
      property_record.price_per_night * 3,
      'confirmed',
      NOW(),
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to seed notifications for a user
CREATE OR REPLACE FUNCTION public.seed_sample_notifications(user_id UUID, user_role TEXT DEFAULT 'guest')
RETURNS void AS $$
BEGIN
  IF user_role = 'host' THEN
    -- Host notifications
    INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at) VALUES
    (user_id, 'New Booking Request', 'You have a new booking request for your Luxury Downtown Apartment', 'booking', false, NOW() - INTERVAL '2 hours'),
    (user_id, 'Property Approved', 'Your property "Cozy Studio Near Central Park" has been approved and is now live', 'property', false, NOW() - INTERVAL '1 day'),
    (user_id, 'Booking Confirmed', 'A guest has confirmed their booking for next week', 'booking', true, NOW() - INTERVAL '3 days'),
    (user_id, 'New Review', 'You received a 5-star review from a recent guest', 'review', true, NOW() - INTERVAL '1 week');
  ELSE
    -- Guest notifications
    INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at) VALUES
    (user_id, 'Booking Confirmed', 'Your booking for Luxury Downtown Apartment has been confirmed', 'booking', false, NOW() - INTERVAL '1 hour'),
    (user_id, 'Check-in Reminder', 'Your check-in is tomorrow. Here are the details you need', 'booking', false, NOW() - INTERVAL '1 day'),
    (user_id, 'Booking Complete', 'How was your stay? Please leave a review', 'review', true, NOW() - INTERVAL '1 week'),
    (user_id, 'Welcome to VENVL', 'Welcome to VENVL! Start exploring amazing properties', 'info', true, NOW() - INTERVAL '2 weeks');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a comprehensive seeding function that sets up a complete test scenario
CREATE OR REPLACE FUNCTION public.create_test_scenario()
RETURNS TEXT AS $$
DECLARE
  host_id UUID;
  guest_id UUID;
  admin_id UUID;
  result_text TEXT := '';
BEGIN
  -- This function will be called manually after users are created through the UI
  -- It expects at least one host and one guest to exist in the profiles table
  
  -- Get the first host user
  SELECT id INTO host_id FROM public.profiles WHERE role = 'host' LIMIT 1;
  
  -- Get the first guest user  
  SELECT id INTO guest_id FROM public.profiles WHERE role = 'guest' LIMIT 1;
  
  -- Get the first admin user
  SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  IF host_id IS NULL THEN
    result_text := result_text || 'No host user found. Please create a host user first. ';
  ELSE
    -- Seed properties for the host
    PERFORM public.seed_sample_properties_for_host(host_id);
    result_text := result_text || 'Created sample properties for host. ';
    
    -- Seed notifications for the host
    PERFORM public.seed_sample_notifications(host_id, 'host');
    result_text := result_text || 'Created notifications for host. ';
  END IF;
  
  IF guest_id IS NULL THEN
    result_text := result_text || 'No guest user found. Please create a guest user first. ';
  ELSE
    -- Seed bookings and reviews for the guest (only if we have properties)
    IF host_id IS NOT NULL THEN
      PERFORM public.seed_sample_bookings_and_reviews(guest_id);
      result_text := result_text || 'Created bookings and reviews for guest. ';
    END IF;
    
    -- Seed notifications for the guest
    PERFORM public.seed_sample_notifications(guest_id, 'guest');
    result_text := result_text || 'Created notifications for guest. ';
  END IF;
  
  IF admin_id IS NOT NULL THEN
    -- Seed notifications for the admin
    PERFORM public.seed_sample_notifications(admin_id, 'admin');
    result_text := result_text || 'Created notifications for admin. ';
  END IF;
  
  IF result_text = '' THEN
    result_text := 'No users found. Please create users through the authentication system first.';
  END IF;
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
