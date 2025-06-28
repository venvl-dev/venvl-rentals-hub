
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import SearchPill from '@/components/search/SearchPill';
import PropertyFilters from '@/components/search/PropertyFilters';
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

interface FilterOptions {
  priceRange: [number, number];
  propertyTypes: string[];
  amenities: string[];
  bookingTypes: string[];
  minRating: number;
  instantBook: boolean;
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
  
  const [propertyFilters, setPropertyFilters] = useState<FilterOptions>({
    priceRange: [0, 1000],
    propertyTypes: [],
    amenities: [],
    bookingTypes: [],
    minRating: 0,
    instantBook: false,
  });

  const [availableFilters, setAvailableFilters] = useState({
    propertyTypes: [] as { value: string; label: string; count: number }[],
    amenities: [] as { value: string; label: string; count: number }[],
    priceRange: { min: 0, max: 1000 },
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, searchFilters, propertyFilters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('Fetching properties...');
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved');

      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
      
      const propertiesData = data || [];
      console.log(`Fetched ${propertiesData.length} properties`);
      
      setProperties(propertiesData);
      generateAvailableFilters(propertiesData);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error(`Failed to load properties: ${error.message || 'Unknown error'}`);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableFilters = (propertiesData: Property[]) => {
    if (!propertiesData.length) {
      setAvailableFilters({
        propertyTypes: [],
        amenities: [],
        priceRange: { min: 0, max: 1000 },
      });
      return;
    }

    // Generate property types with counts
    const propertyTypeCounts = propertiesData.reduce((acc, prop) => {
      const type = prop.property_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const propertyTypes = Object.entries(propertyTypeCounts).map(([type, count]) => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count,
    }));

    // Generate amenities with counts
    const amenityCounts = propertiesData.reduce((acc, prop) => {
      (prop.amenities || []).forEach(amenity => {
        if (amenity) {
          acc[amenity] = (acc[amenity] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const amenities = Object.entries(amenityCounts).map(([amenity, count]) => ({
      value: amenity,
      label: amenity,
      count,
    }));

    // Calculate price range
    const prices = propertiesData.map(prop => prop.price_per_night).filter(price => price && price > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000;

    setAvailableFilters({
      propertyTypes,
      amenities,
      priceRange: { min: minPrice, max: maxPrice },
    });

    // Update filter defaults
    setPropertyFilters(prev => ({
      ...prev,
      priceRange: [minPrice, maxPrice],
    }));
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Search filters
    if (searchFilters.location) {
      filtered = filtered.filter(property => 
        property.city?.toLowerCase().includes(searchFilters.location.toLowerCase()) ||
        property.state?.toLowerCase().includes(searchFilters.location.toLowerCase())
      );
    }

    if (searchFilters.guests) {
      filtered = filtered.filter(property => property.max_guests >= searchFilters.guests);
    }

    if (searchFilters.bookingType !== 'flexible') {
      filtered = filtered.filter(property => 
        property.booking_types?.includes(searchFilters.bookingType) || 
        (!property.booking_types && searchFilters.bookingType === 'daily')
      );
    }

    if (searchFilters.propertyType) {
      filtered = filtered.filter(property => property.property_type === searchFilters.propertyType);
    }

    if (searchFilters.priceRange) {
      filtered = filtered.filter(property => 
        property.price_per_night >= searchFilters.priceRange!.min &&
        property.price_per_night <= searchFilters.priceRange!.max
      );
    }

    if (searchFilters.amenities && searchFilters.amenities.length > 0) {
      filtered = filtered.filter(property =>
        searchFilters.amenities!.every(amenity => 
          property.amenities?.includes(amenity)
        )
      );
    }

    // Property filters
    filtered = filtered.filter(property => 
      property.price_per_night >= propertyFilters.priceRange[0] &&
      property.price_per_night <= propertyFilters.priceRange[1]
    );

    if (propertyFilters.propertyTypes.length > 0) {
      filtered = filtered.filter(property => 
        propertyFilters.propertyTypes.includes(property.property_type)
      );
    }

    if (propertyFilters.amenities.length > 0) {
      filtered = filtered.filter(property =>
        propertyFilters.amenities.every(amenity => 
          property.amenities?.includes(amenity)
        )
      );
    }

    if (propertyFilters.bookingTypes.length > 0) {
      filtered = filtered.filter(property =>
        propertyFilters.bookingTypes.some(type =>
          property.booking_types?.includes(type) || 
          (!property.booking_types && type === 'daily')
        )
      );
    }

    console.log(`Applied filters: ${filtered.length} properties match criteria`);
    setFilteredProperties(filtered);
  };

  const handleSearch = (filters: SearchFilters) => {
    console.log('Search filters applied:', filters);
    setSearchFilters(filters);
    
    // Save search preferences for logged-in users
    saveSearchPreferences(filters);
  };

  const saveSearchPreferences = async (filters: SearchFilters) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Convert SearchFilters to a plain object that can be serialized as JSON
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
      // Don't show error to user for this non-critical feature
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Find your perfect stay
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing properties for your next vacation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SearchPill onSearch={handleSearch} initialFilters={searchFilters} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <PropertyFilters
            filters={propertyFilters}
            onFiltersChange={setPropertyFilters}
            availableFilters={availableFilters}
          />
        </motion.div>

        {loading ? (
          <motion.div 
            className="flex justify-center items-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-lg">Loading properties...</span>
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-xl font-semibold">
                {filteredProperties.length} propert{filteredProperties.length !== 1 ? 'ies' : 'y'} found
              </h2>
              <div className="text-sm text-gray-600">
                {searchFilters.location && `in ${searchFilters.location}`}
              </div>
            </motion.div>

            {filteredProperties.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                {properties.length === 0 && (
                  <p className="text-sm text-gray-500">
                    It looks like there are no properties in the system yet. 
                    Please check back later or contact support if this seems incorrect.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="transition-transform duration-200"
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
