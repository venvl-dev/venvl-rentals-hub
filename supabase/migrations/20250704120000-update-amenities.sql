-- Update amenity names and property records to match constants

-- Update amenities table entries
UPDATE public.amenities SET name = 'Free Parking' WHERE name = 'Parking';
UPDATE public.amenities SET name = 'Washing Machine' WHERE name = 'Washer';

-- Normalize existing property amenity arrays
UPDATE public.properties SET amenities = array_replace(amenities, 'Parking', 'Free Parking');
UPDATE public.properties SET amenities = array_replace(amenities, 'parking', 'Free Parking');
UPDATE public.properties SET amenities = array_replace(amenities, 'Washer', 'Washing Machine');
UPDATE public.properties SET amenities = array_replace(amenities, 'washing_machine', 'Washing Machine');

UPDATE public.properties SET amenities = array_replace(amenities, 'wifi', 'WiFi');
UPDATE public.properties SET amenities = array_replace(amenities, 'kitchen', 'Kitchen');
UPDATE public.properties SET amenities = array_replace(amenities, 'air_conditioning', 'Air Conditioning');
UPDATE public.properties SET amenities = array_replace(amenities, 'heating', 'Heating');
UPDATE public.properties SET amenities = array_replace(amenities, 'tv', 'TV');
UPDATE public.properties SET amenities = array_replace(amenities, 'netflix', 'Netflix');
UPDATE public.properties SET amenities = array_replace(amenities, 'sound_system', 'Sound System');
UPDATE public.properties SET amenities = array_replace(amenities, 'gaming_console', 'Gaming Console');
UPDATE public.properties SET amenities = array_replace(amenities, 'private_entrance', 'Private Entrance');
UPDATE public.properties SET amenities = array_replace(amenities, 'security', 'Security');
UPDATE public.properties SET amenities = array_replace(amenities, 'balcony', 'Balcony');
UPDATE public.properties SET amenities = array_replace(amenities, 'workspace', 'Workspace');
UPDATE public.properties SET amenities = array_replace(amenities, 'closet', 'Closet');
