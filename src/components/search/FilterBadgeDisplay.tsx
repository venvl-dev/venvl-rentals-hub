import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { AdvancedFilters } from '@/hooks/useFilterStore';

interface FilterBadgeDisplayProps {
  advancedFilters: AdvancedFilters;
  onRemoveFilter: (filterKey: keyof AdvancedFilters, value?: string) => void;
  dbPriceRange?: { min: number; max: number } | null;
}

const FilterBadgeDisplay = ({ advancedFilters, onRemoveFilter, dbPriceRange }: FilterBadgeDisplayProps) => {
  // Memoized price formatter for better performance
  const formatPrice = useMemo(() => (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  // Memoized badges generation for better performance
  const badges = useMemo(() => {
    const badgeArray = [];


    // Price range badge with enhanced null checking
    if (advancedFilters.priceRange && 
        Array.isArray(advancedFilters.priceRange) && 
        advancedFilters.priceRange.length === 2 &&
        dbPriceRange && 
        (advancedFilters.priceRange[0] !== dbPriceRange.min || advancedFilters.priceRange[1] !== dbPriceRange.max)) {
      
      try {
        badgeArray.push(
          <Badge key="priceRange" variant="secondary" className="flex items-center gap-1">
            {formatPrice(advancedFilters.priceRange[0])} - {formatPrice(advancedFilters.priceRange[1])}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
              onClick={() => onRemoveFilter('priceRange')}
            />
          </Badge>
        );
      } catch (error) {
        console.warn('Error formatting price range badge:', error);
      }
    }

    // Property types badges with better error handling
    if (advancedFilters.propertyTypes && Array.isArray(advancedFilters.propertyTypes)) {
      advancedFilters.propertyTypes.forEach(type => {
        if (type && typeof type === 'string') {
          badgeArray.push(
            <Badge key={`propertyType-${type}`} variant="secondary" className="flex items-center gap-1">
              {type.charAt(0).toUpperCase() + type.slice(1)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => onRemoveFilter('propertyTypes', type)}
              />
            </Badge>
          );
        }
      });
    }

    // Amenities badges with better formatting and error handling
    if (advancedFilters.amenities && Array.isArray(advancedFilters.amenities) && advancedFilters.amenities.length > 0) {
      const validAmenities = advancedFilters.amenities.filter(amenity => amenity && typeof amenity === 'string');
      const displayAmenities = validAmenities.slice(0, 3);
      const remainingCount = validAmenities.length - 3;

      displayAmenities.forEach(amenity => {
        const formattedAmenity = amenity
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        badgeArray.push(
          <Badge key={`amenity-${amenity}`} variant="secondary" className="flex items-center gap-1">
            {formattedAmenity}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
              onClick={() => onRemoveFilter('amenities', amenity)}
            />
          </Badge>
        );
      });

      if (remainingCount > 0) {
        badgeArray.push(
          <Badge key="amenities-more" variant="secondary" className="flex items-center gap-1">
            +{remainingCount} more amenity{remainingCount > 1 ? 'ies' : 'y'}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
              onClick={() => onRemoveFilter('amenities')}
            />
          </Badge>
        );
      }
    }

    // Bedrooms badge with type checking
    if (advancedFilters.bedrooms && typeof advancedFilters.bedrooms === 'number') {
      badgeArray.push(
        <Badge key="bedrooms" variant="secondary" className="flex items-center gap-1">
          {advancedFilters.bedrooms} bedroom{advancedFilters.bedrooms > 1 ? 's' : ''}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
            onClick={() => onRemoveFilter('bedrooms')}
          />
        </Badge>
      );
    }

    // Bathrooms badge with type checking
    if (advancedFilters.bathrooms && typeof advancedFilters.bathrooms === 'number') {
      badgeArray.push(
        <Badge key="bathrooms" variant="secondary" className="flex items-center gap-1">
          {advancedFilters.bathrooms} bathroom{advancedFilters.bathrooms > 1 ? 's' : ''}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
            onClick={() => onRemoveFilter('bathrooms')}
          />
        </Badge>
      );
    }

    return badgeArray;
  }, [advancedFilters, dbPriceRange, formatPrice, onRemoveFilter]);

  // Early return if no badges
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Active filters">
      {badges}
    </div>
  );
};

export default React.memo(FilterBadgeDisplay);