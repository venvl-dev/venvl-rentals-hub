-- Create countries table
CREATE TABLE IF NOT EXISTS public.countries (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL, -- ISO country code (e.g., 'US', 'EG', 'UK')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country_id INTEGER REFERENCES public.countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, country_id) -- Prevent duplicate city names within the same country
);

-- Insert some common countries
INSERT INTO public.countries (name, code) VALUES
  ('United States', 'US'),
  ('Egypt', 'EG'),
  ('United Kingdom', 'UK'),
  ('Canada', 'CA'),
  ('Australia', 'AU'),
  ('Germany', 'DE'),
  ('France', 'FR'),
  ('Spain', 'ES'),
  ('Italy', 'IT'),
  ('United Arab Emirates', 'AE'),
  ('Saudi Arabia', 'SA'),
  ('Turkey', 'TR'),
  ('Jordan', 'JO'),
  ('Lebanon', 'LB'),
  ('Morocco', 'MA')
ON CONFLICT (code) DO NOTHING;

-- Insert cities for Egypt (assuming this is a primary market)
INSERT INTO public.cities (name, country_id) VALUES
  ('Cairo', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Alexandria', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Giza', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('New Cairo', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('New Administrative Capital', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('6th of October City', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Sheikh Zayed City', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Maadi', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Heliopolis', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Zamalek', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Sharm El Sheikh', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Hurghada', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Luxor', (SELECT id FROM public.countries WHERE code = 'EG')),
  ('Aswan', (SELECT id FROM public.countries WHERE code = 'EG'))
ON CONFLICT (name, country_id) DO NOTHING;

-- Insert major cities for United States
INSERT INTO public.cities (name, country_id) VALUES
  ('New York', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Los Angeles', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Chicago', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Houston', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Phoenix', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Philadelphia', (SELECT id FROM public.countries WHERE code = 'US')),
  ('San Antonio', (SELECT id FROM public.countries WHERE code = 'US')),
  ('San Diego', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Dallas', (SELECT id FROM public.countries WHERE code = 'US')),
  ('San Francisco', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Miami', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Seattle', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Boston', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Las Vegas', (SELECT id FROM public.countries WHERE code = 'US'))
ON CONFLICT (name, country_id) DO NOTHING;

-- Insert major cities for UAE
INSERT INTO public.cities (name, country_id) VALUES
  ('Dubai', (SELECT id FROM public.countries WHERE code = 'AE')),
  ('Abu Dhabi', (SELECT id FROM public.countries WHERE code = 'AE')),
  ('Sharjah', (SELECT id FROM public.countries WHERE code = 'AE')),
  ('Ajman', (SELECT id FROM public.countries WHERE code = 'AE')),
  ('Ras Al Khaimah', (SELECT id FROM public.countries WHERE code = 'AE')),
  ('Fujairah', (SELECT id FROM public.countries WHERE code = 'AE')),
  ('Umm Al Quwain', (SELECT id FROM public.countries WHERE code = 'AE'))
ON CONFLICT (name, country_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON public.cities(country_id);
CREATE INDEX IF NOT EXISTS idx_countries_code ON public.countries(code);

-- Enable RLS (Row Level Security)
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access to everyone
CREATE POLICY "Allow read access to countries" ON public.countries
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to cities" ON public.cities
  FOR SELECT USING (true);

-- Grant usage on the tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;