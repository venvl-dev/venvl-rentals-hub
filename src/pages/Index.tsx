import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import VenvlSearchPill from '@/components/search/VenvlSearchPill';
import NewAdvancedFilters from '@/components/search/NewAdvancedFilters';
import FilterBadgeDisplay from '@/components/search/FilterBadgeDisplay';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { cleanAmenityIds } from '@/lib/amenitiesUtils';
import { useAuthImagePreload } from '@/hooks/useAuthImagePreload';
import { useFilterStore } from '@/hooks/useFilterStore';
import { usePropertyFiltering } from '@/hooks/usePropertyFiltering';
import React from 'react';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  monthly_price?: number;
  daily_price?: number;
  images: string[];
  city: string;
  state: string;
  country: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  booking_types?: string[];
  rental_type?: string;
  min_nights?: number;
  min_months?: number;
  is_active: boolean;
  approval_status?: string;
  created_at: string;
  updated_at: string;
  blocked_dates?: string[];
}


const Index = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Use centralized filter store
  const {
    searchFilters,
    advancedFilters,
    updateSearchFilters,
    updateAdvancedFilters,
    clearAllFilters,
    hasActiveFilters,
    getActiveFilterCount,
    getCombinedFilters,
    priceLoading,
    dbPriceRange
  } = useFilterStore();

  // Use authentication-aware image preloading
  const { user, isLoading: authLoading, imagesPreloaded, preloadImages, refreshImages } = useAuthImagePreload();

  // Use property filtering hook
  const { filteredProperties, filteringStats } = usePropertyFiltering(properties, getCombinedFilters());
  
  
  
  

  useEffect(() => {
    fetchProperties();
  }, []);

  // Preload images when properties change or user auth state changes
  useEffect(() => {
    if (properties.length > 0 && !authLoading) {
      preloadImages(properties);
    }
  }, [properties, authLoading, preloadImages]);

  // Refresh images when user logs in/out
  useEffect(() => {
    if (properties.length > 0 && !authLoading) {
      refreshImages(properties);
    }
  }, [user, refreshImages, properties, authLoading]);

  const fetchProperties = useCallback(async (offset = 0, limit = 20) => {
    try {
      setLoading(true);
      
      // Optimized query - fetch only essential fields with pagination
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price_per_night,
          daily_price,
          monthly_price,
          images,
          city,
          state,
          country,
          property_type,
          bedrooms,
          bathrooms,
          max_guests,
          amenities,
          booking_types,
          rental_type,
          min_nights,
          min_months,
          blocked_dates,
          is_active,
          approval_status,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties');
        return;
      }

      
      if (data) {
        
        // Clean amenities data
        data.forEach(p => {
          p.amenities = cleanAmenityIds(p.amenities || []);
        });

        setProperties(data);

        // Properties loaded successfully - filtering will be handled by components
      }
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((filters: any) => {
    updateSearchFilters(filters);
  }, [updateSearchFilters]);

  const handleAdvancedFilters = useCallback((newFilters: any) => {
    updateAdvancedFilters(newFilters);
  }, [updateAdvancedFilters]);

  const handleRemoveFilter = useCallback((filterKey: keyof typeof advancedFilters, value?: string) => {
    const updates: any = {};
    
    if (filterKey === 'propertyTypes' && value) {
      const currentTypes = advancedFilters.propertyTypes || [];
      updates.propertyTypes = currentTypes.filter(type => type !== value);
      if (updates.propertyTypes.length === 0) updates.propertyTypes = null;
    } else if (filterKey === 'amenities' && value) {
      const currentAmenities = advancedFilters.amenities || [];
      updates.amenities = currentAmenities.filter(amenity => amenity !== value);
      if (updates.amenities.length === 0) updates.amenities = null;
    } else {
      updates[filterKey] = null;
    }
    
    updateAdvancedFilters(updates);
  }, [advancedFilters, updateAdvancedFilters]);

  const handleClearFilters = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  // Enhanced loading state
  const isFullyLoaded = !loading && !authLoading && imagesPreloaded;

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
              
              {/* Advanced Filters Button with Active Filter Count */}
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(true)}
                  className="flex items-center gap-2 rounded-full border-gray-300 hover:border-gray-400 bg-white shadow-sm relative"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Advanced filters
                  {getActiveFilterCount > 0 && (
                    <Badge className="ml-1 bg-black text-white text-xs px-2 py-1 rounded-full">
                      {getActiveFilterCount}
                    </Badge>
                  )}
                </Button>
                
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 rounded-full text-gray-600 hover:text-gray-900"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <motion.div
                  className="max-w-4xl mx-auto px-2 sm:px-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FilterBadgeDisplay
                    advancedFilters={advancedFilters}
                    onRemoveFilter={handleRemoveFilter}
                    dbPriceRange={dbPriceRange}
                  />
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Results Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            {loading || authLoading ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Loading Skeleton Cards */}
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <>
                <motion.div 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {filteredProperties.length} propert{filteredProperties.length !== 1 ? 'ies' : 'y'} found
                    </h2>
                    
                    {hasActiveFilters && filteringStats.total > filteredProperties.length && (
                      <Badge variant="outline" className="text-xs">
                        {filteringStats.reduction}% filtered out
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {searchFilters.location && (
                      <div className="text-sm sm:text-base text-gray-600">
                        in {searchFilters.location}
                      </div>
                    )}
                    
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Filter className="h-4 w-4 mr-1" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                </motion.div>

                {/* Properties Grid */}
                {filteredProperties.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    {filteredProperties.map((property, index) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <PropertyCard property={property} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Properties Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or filters
                    </p>
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Advanced Filters Modal */}
        <NewAdvancedFilters
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onApply={handleAdvancedFilters}
          initialFilters={advancedFilters}
        />
      </main>
    </div>
  );
};

export default Index;
