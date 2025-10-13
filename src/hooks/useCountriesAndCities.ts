import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fallback data in case database tables don't exist
const FALLBACK_COUNTRIES: Country[] = [
  { id: 1, name: 'Egypt', code: 'EG' },
  { id: 2, name: 'United States', code: 'US' },
  { id: 3, name: 'United Arab Emirates', code: 'AE' },
  { id: 4, name: 'United Kingdom', code: 'UK' },
  { id: 5, name: 'Canada', code: 'CA' },
  { id: 6, name: 'Germany', code: 'DE' },
  { id: 7, name: 'France', code: 'FR' },
  { id: 8, name: 'Saudi Arabia', code: 'SA' },
];

const FALLBACK_CITIES: { [countryId: number]: City[] } = {
  1: [ // Egypt
    { id: 1, name: 'Cairo', country_id: 1 },
    { id: 2, name: 'Alexandria', country_id: 1 },
    { id: 3, name: 'Giza', country_id: 1 },
    { id: 4, name: 'New Cairo', country_id: 1 },
    { id: 5, name: 'New Administrative Capital', country_id: 1 },
    { id: 6, name: '6th of October City', country_id: 1 },
    { id: 7, name: 'Sheikh Zayed City', country_id: 1 },
    { id: 8, name: 'Maadi', country_id: 1 },
    { id: 9, name: 'Heliopolis', country_id: 1 },
    { id: 10, name: 'Sharm El Sheikh', country_id: 1 },
  ],
  2: [ // United States
    { id: 11, name: 'New York', country_id: 2 },
    { id: 12, name: 'Los Angeles', country_id: 2 },
    { id: 13, name: 'Chicago', country_id: 2 },
    { id: 14, name: 'Houston', country_id: 2 },
    { id: 15, name: 'Miami', country_id: 2 },
    { id: 16, name: 'San Francisco', country_id: 2 },
    { id: 17, name: 'Seattle', country_id: 2 },
    { id: 18, name: 'Boston', country_id: 2 },
  ],
  3: [ // UAE
    { id: 19, name: 'Dubai', country_id: 3 },
    { id: 20, name: 'Abu Dhabi', country_id: 3 },
    { id: 21, name: 'Sharjah', country_id: 3 },
    { id: 22, name: 'Ajman', country_id: 3 },
  ],
  4: [ // UK
    { id: 23, name: 'London', country_id: 4 },
    { id: 24, name: 'Manchester', country_id: 4 },
    { id: 25, name: 'Birmingham', country_id: 4 },
  ],
  5: [ // Canada
    { id: 26, name: 'Toronto', country_id: 5 },
    { id: 27, name: 'Vancouver', country_id: 5 },
    { id: 28, name: 'Montreal', country_id: 5 },
  ],
  6: [ // Germany
    { id: 29, name: 'Berlin', country_id: 6 },
    { id: 30, name: 'Munich', country_id: 6 },
    { id: 31, name: 'Hamburg', country_id: 6 },
  ],
  7: [ // France
    { id: 32, name: 'Paris', country_id: 7 },
    { id: 33, name: 'Lyon', country_id: 7 },
    { id: 34, name: 'Marseille', country_id: 7 },
  ],
  8: [ // Saudi Arabia
    { id: 35, name: 'Riyadh', country_id: 8 },
    { id: 36, name: 'Jeddah', country_id: 8 },
    { id: 37, name: 'Dammam', country_id: 8 },
  ],
};

const FALLBACK_STATES: { [countryId: number]: State[] } = {
  1: [ // Egypt - Governorates
    { id: 1, name: 'Cairo Governorate', code: 'C', country_id: 1 },
    { id: 2, name: 'Alexandria Governorate', code: 'ALX', country_id: 1 },
    { id: 3, name: 'Giza Governorate', code: 'GZ', country_id: 1 },
    { id: 4, name: 'Qalyubia Governorate', code: 'KB', country_id: 1 },
    { id: 5, name: 'Port Said Governorate', code: 'PTS', country_id: 1 },
    { id: 6, name: 'Suez Governorate', code: 'SUZ', country_id: 1 },
    { id: 7, name: 'Red Sea Governorate', code: 'BA', country_id: 1 },
  ],
  2: [ // United States
    { id: 8, name: 'California', code: 'CA', country_id: 2 },
    { id: 9, name: 'New York', code: 'NY', country_id: 2 },
    { id: 10, name: 'Texas', code: 'TX', country_id: 2 },
    { id: 11, name: 'Florida', code: 'FL', country_id: 2 },
    { id: 12, name: 'Illinois', code: 'IL', country_id: 2 },
    { id: 13, name: 'Pennsylvania', code: 'PA', country_id: 2 },
    { id: 14, name: 'Ohio', code: 'OH', country_id: 2 },
    { id: 15, name: 'Georgia', code: 'GA', country_id: 2 },
    { id: 16, name: 'North Carolina', code: 'NC', country_id: 2 },
    { id: 17, name: 'Michigan', code: 'MI', country_id: 2 },
  ],
  3: [ // UAE - Emirates
    { id: 18, name: 'Dubai', code: 'DU', country_id: 3 },
    { id: 19, name: 'Abu Dhabi', code: 'AZ', country_id: 3 },
    { id: 20, name: 'Sharjah', code: 'SH', country_id: 3 },
    { id: 21, name: 'Ajman', code: 'AJ', country_id: 3 },
    { id: 22, name: 'Ras Al Khaimah', code: 'RK', country_id: 3 },
    { id: 23, name: 'Fujairah', code: 'FU', country_id: 3 },
    { id: 24, name: 'Umm Al Quwain', code: 'UQ', country_id: 3 },
  ],
  4: [ // UK - Countries/Regions
    { id: 25, name: 'England', code: 'ENG', country_id: 4 },
    { id: 26, name: 'Scotland', code: 'SCT', country_id: 4 },
    { id: 27, name: 'Wales', code: 'WLS', country_id: 4 },
    { id: 28, name: 'Northern Ireland', code: 'NIR', country_id: 4 },
  ],
  5: [ // Canada - Provinces
    { id: 29, name: 'Ontario', code: 'ON', country_id: 5 },
    { id: 30, name: 'Quebec', code: 'QC', country_id: 5 },
    { id: 31, name: 'British Columbia', code: 'BC', country_id: 5 },
    { id: 32, name: 'Alberta', code: 'AB', country_id: 5 },
    { id: 33, name: 'Manitoba', code: 'MB', country_id: 5 },
    { id: 34, name: 'Saskatchewan', code: 'SK', country_id: 5 },
  ],
  6: [ // Germany - States
    { id: 35, name: 'Bavaria', code: 'BY', country_id: 6 },
    { id: 36, name: 'Baden-Württemberg', code: 'BW', country_id: 6 },
    { id: 37, name: 'North Rhine-Westphalia', code: 'NW', country_id: 6 },
    { id: 38, name: 'Berlin', code: 'BE', country_id: 6 },
    { id: 39, name: 'Hamburg', code: 'HH', country_id: 6 },
  ],
  7: [ // France - Regions
    { id: 40, name: 'Île-de-France', code: 'IDF', country_id: 7 },
    { id: 41, name: 'Provence-Alpes-Côte d\'Azur', code: 'PAC', country_id: 7 },
    { id: 42, name: 'Auvergne-Rhône-Alpes', code: 'ARA', country_id: 7 },
    { id: 43, name: 'Occitanie', code: 'OCC', country_id: 7 },
    { id: 44, name: 'Nouvelle-Aquitaine', code: 'NAQ', country_id: 7 },
  ],
  8: [ // Saudi Arabia - Provinces
    { id: 45, name: 'Riyadh Province', code: 'RI', country_id: 8 },
    { id: 46, name: 'Makkah Province', code: 'MK', country_id: 8 },
    { id: 47, name: 'Eastern Province', code: 'EP', country_id: 8 },
    { id: 48, name: 'Asir Province', code: 'AS', country_id: 8 },
    { id: 49, name: 'Madinah Province', code: 'MD', country_id: 8 },
  ],
};

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface City {
  id: number;
  name: string;
  country_id: number;
}

export interface State {
  id: number;
  name: string;
  code: string;
  country_id: number;
}

// Fetch all countries
const fetchCountries = async (): Promise<Country[]> => {
  console.log('🔄 Fetching countries...');
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id, name, code')
      .order('name');

    if (error) {
      // If table doesn't exist, use fallback data
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('📋 Using fallback countries data');
        return FALLBACK_COUNTRIES;
      }
      console.error('❌ Error fetching countries:', error);
      throw error;
    }
    console.log('✅ Countries fetched from database:', data);
    return data || [];
  } catch (error) {
    console.log('📋 Database error, using fallback countries data');
    return FALLBACK_COUNTRIES;
  }
};

// Fetch cities by country ID
const fetchCitiesByCountry = async (countryId: number): Promise<City[]> => {
  console.log('🔄 Fetching cities for country:', countryId);
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, country_id')
      .eq('country_id', countryId)
      .order('name');

    if (error) {
      // If table doesn't exist, use fallback data
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('📋 Using fallback cities data for country:', countryId);
        return FALLBACK_CITIES[countryId] || [];
      }
      console.error('❌ Error fetching cities:', error);
      throw error;
    }
    console.log('✅ Cities fetched from database:', data);
    return data || [];
  } catch (error) {
    console.log('📋 Database error, using fallback cities data for country:', countryId);
    return FALLBACK_CITIES[countryId] || [];
  }
};

// Fetch states by country ID
const fetchStatesByCountry = async (countryId: number): Promise<State[]> => {
  console.log('🔄 Fetching states for country:', countryId);
  try {
    const { data, error } = await supabase
      .from('states')
      .select('id, name, code, country_id')
      .eq('country_id', countryId)
      .order('name');

    if (error) {
      // If table doesn't exist, use fallback data
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('📋 Using fallback states data for country:', countryId);
        return FALLBACK_STATES[countryId] || [];
      }
      console.error('❌ Error fetching states:', error);
      throw error;
    }
    console.log('✅ States fetched from database:', data);
    return data || [];
  } catch (error) {
    console.log('📋 Database error, using fallback states data for country:', countryId);
    return FALLBACK_STATES[countryId] || [];
  }
};

// Hook to get all countries
export const useCountries = () => {
  return useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - countries don't change often
    retry: false, // Don't retry on error, just use fallback data
    refetchOnWindowFocus: false,
    initialData: FALLBACK_COUNTRIES, // Start with fallback data immediately
  });
};

// Hook to get cities for a specific country
export const useCitiesByCountry = (countryId: number | null) => {
  return useQuery<City[]>({
    queryKey: ['cities', countryId],
    queryFn: () => fetchCitiesByCountry(countryId!),
    enabled: !!countryId, // Only run query if countryId is provided
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: false, // Don't retry on error, just use fallback data
    refetchOnWindowFocus: false,
    initialData: countryId ? FALLBACK_CITIES[countryId] || [] : [], // Start with fallback data
  });
};

// Hook to get states for a specific country
export const useStatesByCountry = (countryId: number | null) => {
  return useQuery<State[]>({
    queryKey: ['states', countryId],
    queryFn: () => fetchStatesByCountry(countryId!),
    enabled: !!countryId, // Only run query if countryId is provided
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: false, // Don't retry on error, just use fallback data
    refetchOnWindowFocus: false,
    initialData: countryId ? FALLBACK_STATES[countryId] || [] : [], // Start with fallback data
  });
};

// Helper function to find country by name or code
export const findCountryByName = (countries: Country[], nameOrCode: string): Country | undefined => {
  if (!nameOrCode) return undefined;
  return countries.find(
    country =>
      country.name.toLowerCase() === nameOrCode.toLowerCase() ||
      country.code.toLowerCase() === nameOrCode.toLowerCase()
  );
};

// Helper function to find city by name within a country
export const findCityByName = (cities: City[], cityName: string): City | undefined => {
  if (!cityName) return undefined;
  return cities.find(city => city.name.toLowerCase() === cityName.toLowerCase());
};

// Helper function to find state by name within a country
export const findStateByName = (states: State[], stateName: string): State | undefined => {
  if (!stateName) return undefined;
  return states.find(state =>
    state.name.toLowerCase() === stateName.toLowerCase() ||
    state.code.toLowerCase() === stateName.toLowerCase()
  );
};