
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import VenvlSearchBar from '@/components/search/VenvlSearchBar';
import PropertyCard from '@/components/PropertyCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  monthly_price?: number;
  images: string[];
  city: string;
  state: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  booking_types: string[];
  approval_status: string;
  is_active: boolean;
}

interface SearchFilters {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  bookingType: 'daily' | 'monthly' | 'flexible';
  flexibleOption?: string;
  duration?: number;
  propertyType?: string;
  priceRange?: { min: number; max: number };
  amenities?: string[];
}

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: '',
    guests: 1,
    bookingType: 'daily',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, searchFilters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('Fetching properties...');
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price_per_night,
          monthly_price,
          images,
          city,
          state,
          property_type,
          bedrooms,
          bathrooms,
          max_guests,
          amenities,
          booking_types,
          approval_status,
          is_active
        `)
        .eq('is_active', true)
        .eq('approval_status', 'approved');

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      console.log('Raw data from Supabase:', data);
      const propertiesData = data || [];
      console.log(`Successfully fetched ${propertiesData.length} properties`);
      
      setProperties(propertiesData);
      
      if (propertiesData.length === 0) {
        console.warn('No approved and active properties found in database');
        toast.info('No properties are currently available. Please check back later.');
      }
      
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error(`Failed to load properties: ${error.message || 'Unknown error'}`);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log('Applying filters to', properties.length, 'properties');
    let filtered = [...properties];

    // Location filter
    if (searchFilters.location) {
      filtered = filtered.filter(property => 
        property.city?.toLowerCase().includes(searchFilters.location.toLowerCase()) ||
        property.state?.toLowerCase().includes(searchFilters.location.toLowerCase())
      );
      console.log(`After location filter: ${filtered.length} properties`);
    }

    // Guest capacity filter
    if (searchFilters.guests) {
      filtered = filtered.filter(property => property.max_guests >= searchFilters.guests);
      console.log(`After guests filter: ${filtered.length} properties`);
    }

    // Booking type filter
    if (searchFilters.bookingType !== 'flexible') {
      filtered = filtered.filter(property => 
        property.booking_types?.includes(searchFilters.bookingType) || 
        (!property.booking_types && searchFilters.bookingType === 'daily')
      );
      console.log(`After booking type filter: ${filtered.length} properties`);
    }

    // Property type filter
    if (searchFilters.propertyType) {
      filtered = filtered.filter(property => property.property_type === searchFilters.propertyType);
      console.log(`After property type filter: ${filtered.length} properties`);
    }

    // Price range filter
    if (searchFilters.priceRange) {
      filtered = filtered.filter(property => 
        property.price_per_night >= searchFilters.priceRange!.min &&
        property.price_per_night <= searchFilters.priceRange!.max
      );
      console.log(`After price range filter: ${filtered.length} properties`);
    }

    // Amenities filter
    if (searchFilters.amenities && searchFilters.amenities.length > 0) {
      filtered = filtered.filter(property =>
        searchFilters.amenities!.every(amenity => 
          property.amenities?.includes(amenity)
        )
      );
      console.log(`After amenities filter: ${filtered.length} properties`);
    }

    console.log(`Final filtered properties: ${filtered.length}`);
    setFilteredProperties(filtered);
  };

  const handleSearch = (filters: SearchFilters) => {
    console.log('Search filters applied:', filters);
    setSearchFilters(filters);
    saveSearchPreferences(filters);
  };

  const saveSearchPreferences = async (filters: SearchFilters) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const searchDataForStorage = {
          location: filters.location,
          checkIn: filters.checkIn?.toISOString(),
          checkOut: filters.checkOut?.toISOString(),
          guests: filters.guests,
          bookingType: filters.bookingType,
          flexibleOption: filters.flexibleOption,
          duration: filters.duration,
          propertyType: filters.propertyType,
          priceRange: filters.priceRange,
          amenities: filters.amenities,
        };

        await supabase
          .from('search_preferences')
          .insert({
            user_id: user.id,
            destination: filters.location,
            search_data: searchDataForStorage,
          });
      }
    } catch (error) {
      console.error('Error saving search preferences:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />
      
      <main className="w-full">
        {/* Hero Section */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1 
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Discover your perfect
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500 mt-2">
                  VENVL experience
                </span>
              </motion.h1>
              <motion.p 
                className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Exceptional stays, curated experiences, unforgettable moments
              </motion.p>
            </motion.div>

            {/* Search Bar Container */}
            <motion.div
              className="w-full max-w-5xl mx-auto px-2 sm:px-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <VenvlSearchBar onSearch={handleSearch} initialFilters={searchFilters} />
            </motion.div>
          </div>
        </section>

        {/* Results Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-16 sm:py-24"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
                <span className="text-lg text-gray-600">Loading properties...</span>
              </motion.div>
            ) : (
              <>
                <motion.div 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {filteredProperties.length} propert{filteredProperties.length !== 1 ? 'ies' : 'y'} found
                  </h2>
                  {searchFilters.location && (
                    <div className="text-sm sm:text-base text-gray-600">
                      in {searchFilters.location}
                    </div>
                  )}
                </motion.div>

                {filteredProperties.length === 0 ? (
                  <motion.div 
                    className="text-center py-16 sm:py-24"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">No properties found</h3>
                    <p className="text-gray-600 mb-6 px-4">Try adjusting your search criteria</p>
                    {properties.length === 0 && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500 px-4">
                          It looks like there are no approved properties in the system yet.
                        </p>
                        <button 
                          onClick={fetchProperties}
                          className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-red-600 transition-all font-medium shadow-lg"
                        >
                          Retry Loading
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    {filteredProperties.map((property, index) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="transition-transform duration-300"
                      >
                        <PropertyCard property={property} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
