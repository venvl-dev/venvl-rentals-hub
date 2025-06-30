
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import VenvlSearchPill from '@/components/search/VenvlSearchPill';
import VenvlAdvancedFilters from '@/components/search/VenvlAdvancedFilters';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  bedrooms?: number;
  bathrooms?: number;
}

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: '',
    guests: 1,
    bookingType: 'daily',
  });
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, searchFilters, advancedFilters]);

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
    console.log('Applying filters:', searchFilters, advancedFilters);
    console.log('Total properties to filter:', properties.length);
    
    let filtered = [...properties];

    // Location filter
    if (searchFilters.location.trim()) {
      const searchLocation = searchFilters.location.toLowerCase().trim();
      filtered = filtered.filter(property => {
        const cityMatch = property.city?.toLowerCase().includes(searchLocation);
        const stateMatch = property.state?.toLowerCase().includes(searchLocation);
        const fullLocationMatch = `${property.city}, ${property.state}`.toLowerCase().includes(searchLocation);
        return cityMatch || stateMatch || fullLocationMatch;
      });
      console.log(`After location filter "${searchFilters.location}": ${filtered.length} properties`);
    }

    // Guest capacity filter
    if (searchFilters.guests > 0) {
      filtered = filtered.filter(property => property.max_guests >= searchFilters.guests);
      console.log(`After guests filter (${searchFilters.guests}): ${filtered.length} properties`);
    }

    // Booking type filter
    if (searchFilters.bookingType !== 'flexible') {
      filtered = filtered.filter(property => {
        const supportsBookingType = property.booking_types?.includes(searchFilters.bookingType);
        const defaultSupport = !property.booking_types && searchFilters.bookingType === 'daily';
        const monthlySupport = searchFilters.bookingType === 'monthly' && property.monthly_price;
        return supportsBookingType || defaultSupport || monthlySupport;
      });
      console.log(`After booking type filter (${searchFilters.bookingType}): ${filtered.length} properties`);
    }

    // Advanced filters
    if (advancedFilters.priceRange) {
      filtered = filtered.filter(property => {
        const price = searchFilters.bookingType === 'monthly' && property.monthly_price 
          ? property.monthly_price 
          : property.price_per_night;
        return price >= advancedFilters.priceRange[0] && price <= advancedFilters.priceRange[1];
      });
    }

    if (advancedFilters.propertyTypes?.length > 0) {
      filtered = filtered.filter(property => 
        advancedFilters.propertyTypes.includes(property.property_type)
      );
    }

    if (advancedFilters.amenities?.length > 0) {
      filtered = filtered.filter(property => 
        advancedFilters.amenities.every((amenity: string) => 
          property.amenities?.includes(amenity)
        )
      );
    }

    if (advancedFilters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms >= advancedFilters.bedrooms);
    }

    if (advancedFilters.bathrooms) {
      filtered = filtered.filter(property => property.bathrooms >= advancedFilters.bathrooms);
    }

    console.log(`Final filtered properties: ${filtered.length}`);
    setFilteredProperties(filtered);
  };

  const handleSearch = (filters: SearchFilters) => {
    console.log('Search triggered with filters:', filters);
    setSearchFilters(filters);
    saveSearchPreferences(filters);
  };

  const handleAdvancedFilters = (filters: any) => {
    setAdvancedFilters(filters);
    setShowAdvancedFilters(false);
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
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mt-2">
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
              className="w-full max-w-4xl mx-auto px-2 sm:px-4 space-y-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <VenvlSearchPill onSearch={handleSearch} initialFilters={searchFilters} />
              
              {/* Advanced Filters Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(true)}
                  className="flex items-center gap-2 rounded-full border-gray-300 hover:border-gray-400 bg-white shadow-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Advanced filters
                </Button>
              </div>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
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
                    <p className="text-gray-600 mb-6 px-4">Try adjusting your search criteria or filters</p>
                    {properties.length === 0 && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500 px-4">
                          It looks like there are no approved properties in the system yet.
                        </p>
                        <button 
                          onClick={fetchProperties}
                          className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
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

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <VenvlAdvancedFilters
          onFiltersChange={handleAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          initialFilters={advancedFilters}
        />
      )}
    </div>
  );
};

export default Index;
