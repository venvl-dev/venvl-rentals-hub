import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import VenvlSearchPill from '@/components/search/VenvlSearchPill';
import StandaloneBookingTypeSelector from '@/components/search/StandaloneBookingTypeSelector';
import NewAdvancedFilters from '@/components/search/NewAdvancedFilters';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { useAuthImagePreload } from '@/hooks/useAuthImagePreload';
import { useFilterStore } from '@/hooks/useFilterStore';
import { usePropertyFiltering } from '@/hooks/usePropertyFiltering';
import { useInfiniteProperties } from '@/hooks/properties/useProperties';
import { useInView } from 'react-intersection-observer';
import React from 'react';

const Index = () => {
  const [searchParams] = useSearchParams();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Use infinite properties hook
  const {
    properties,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    totalCount,
  } = useInfiniteProperties();

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
    dbPriceRange,
  } = useFilterStore();

  // Use authentication-aware image preloading
  // const { preloadImages } = useAuthImagePreload();

  // Use property filtering hook
  const { filteredProperties, filteringStats } = usePropertyFiltering(
    properties,
    getCombinedFilters(),
  );

  // Intersection observer for infinite scroll - trigger on 9th element from end
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '800px', // Start loading 400px before element comes into view
    triggerOnce: false,
  });

  // Sync URL search parameters with filter store
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      updateSearchFilters({ location: searchQuery });
    } else {
      // Clear location filter when search parameter is removed
      updateSearchFilters({ location: '' });
    }
  }, [searchParams, updateSearchFilters]);

  // Preload images when properties change or user auth state changes
  // useEffect(() => {
  //   if (properties.length > 0) {
  //     preloadImages(properties);
  //   }
  // }, [properties, preloadImages]);

  // Handle infinite scroll - fetch next page when trigger element is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fallback: Check scroll position to catch fast scrolling
  useEffect(() => {
    const handleScroll = () => {
      // Only check if we're not already loading and have more pages
      if (isFetchingNextPage || !hasNextPage || isLoading) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;

      // If user is within 800px of the bottom, trigger next page
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < 800) {
        fetchNextPage();
      }
    };

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null as any;
      }, 200);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load properties');
    }
  }, [error]);

  const handleSearch = useCallback(
    (filters: any) => {
      updateSearchFilters(filters);
    },
    [updateSearchFilters],
  );

  const handleAdvancedFilters = useCallback(
    (newFilters: any) => {
      updateAdvancedFilters(newFilters);
    },
    [updateAdvancedFilters],
  );

  const handleRemoveFilter = useCallback(
    (filterKey: keyof typeof advancedFilters, value?: string) => {
      const updates: any = {};

      if (filterKey === 'propertyTypes' && value) {
        const currentTypes = advancedFilters.propertyTypes || [];
        updates.propertyTypes = currentTypes.filter((type) => type !== value);
        if (updates.propertyTypes.length === 0) updates.propertyTypes = null;
      } else if (filterKey === 'amenities' && value) {
        const currentAmenities = advancedFilters.amenities || [];
        updates.amenities = currentAmenities.filter(
          (amenity) => amenity !== value,
        );
        if (updates.amenities.length === 0) updates.amenities = null;
      } else {
        updates[filterKey] = null;
      }

      updateAdvancedFilters(updates);
    },
    [advancedFilters, updateAdvancedFilters],
  );

  const handleClearFilters = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  return (
    <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
      <Header />

      <main className='w-full'>
        {/* Hero Section */}
        <section className='relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16'>
          <div className='max-w-7xl mx-auto'>
            <motion.div
              className='text-center mb-8 sm:mb-12'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1
                className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Discover your perfect
                <span className='block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mt-2'>
                  VENVL experience
                </span>
              </motion.h1>
              <motion.p
                className='text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Exceptional stays, curated experiences, unforgettable moments
              </motion.p>
            </motion.div>

            {/* Search Bar Container */}
            <motion.div
              className='w-full max-w-4xl mx-auto px-2 sm:px-4 space-y-6'
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Standalone Booking Type Selector - Fast and Independent */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StandaloneBookingTypeSelector
                  selectedType={searchFilters.bookingType}
                  onTypeChange={(type) => {
                    updateSearchFilters({ bookingType: type });
                  }}
                />
              </motion.div>

              {/* Lazy-loaded Search Pill - Only loads heavy components when needed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <VenvlSearchPill
                  onSearch={handleSearch}
                  initialFilters={searchFilters}
                />
              </motion.div>

              {/* Advanced Filters Button with Active Filter Count */}
              <div className='flex justify-center gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setShowAdvancedFilters(true)}
                  className='flex items-center gap-2 rounded-full border-gray-300 hover:border-gray-400 bg-white shadow-sm relative'
                >
                  <SlidersHorizontal className='h-4 w-4' />
                  Advanced filters
                  {getActiveFilterCount > 0 && (
                    <Badge className='ml-1 bg-black text-white text-xs px-2 py-1 rounded-full'>
                      {getActiveFilterCount}
                    </Badge>
                  )}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant='ghost'
                    onClick={handleClearFilters}
                    className='flex items-center gap-2 rounded-full text-gray-600 hover:text-gray-900'
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Results Section */}
        <section className='w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12'>
          <div className='max-w-7xl mx-auto'>
            {isLoading ? (
              <motion.div
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Loading Skeleton Cards */}
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse'
                  >
                    <div className='aspect-square bg-gray-200'></div>
                    <div className='p-4 space-y-3'>
                      <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                      <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                      <div className='h-4 bg-gray-200 rounded w-1/3'></div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <>
                <motion.div
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <div className='flex items-center gap-4'>
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-900'>
                      {totalCount} propert
                      {totalCount !== 1 ? 'ies' : 'y'} found
                    </h2>

                    {hasActiveFilters &&
                      filteringStats.total > filteredProperties.length && (
                        <Badge variant='outline' className='text-xs'>
                          {filteringStats.reduction}% filtered out
                        </Badge>
                      )}
                  </div>

                  <div className='flex items-center gap-4'>
                    {searchFilters.location && (
                      <div className='text-sm sm:text-base text-gray-600'>
                        in {searchFilters.location}
                      </div>
                    )}

                    {hasActiveFilters && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleClearFilters}
                        className='text-gray-500 hover:text-gray-700'
                      >
                        <Filter className='h-4 w-4 mr-1' />
                        Clear filters
                      </Button>
                    )}
                  </div>
                </motion.div>

                {/* Properties Grid */}
                {filteredProperties.length > 0 ? (
                  <>
                    <motion.div
                      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      {filteredProperties.map((property, index) => (
                        <motion.div
                          key={property.id}
                          ref={
                            index === filteredProperties.length - 2
                              ? loadMoreRef
                              : null
                          }
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                          <PropertyCard
                            property={property}
                            properties={filteredProperties}
                            index={index}
                          />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Loading indicator for next page */}
                    {isFetchingNextPage && (
                      <div className='flex justify-center items-start py-8'>
                        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                        <span className='ml-2 text-gray-600'>
                          Loading more properties...
                        </span>
                      </div>
                    )}

                    {/* End of list indicator */}
                    {!hasNextPage && (
                      <div className='text-center pt-20  text-gray-500'>
                        You've reached the end of the list
                      </div>
                    )}
                  </>
                ) : (
                  <div className='text-center py-12'>
                    <Search className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                      No Properties Found
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Try adjusting your search criteria or filters
                    </p>
                    <Button onClick={handleClearFilters} variant='outline'>
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
