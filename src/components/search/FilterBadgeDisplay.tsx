import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { AdvancedFilters } from '@/hooks/useFilterStore';

interface FilterBadgeDisplayProps {
  advancedFilters: AdvancedFilters;
  onRemoveFilter: (filterKey: keyof AdvancedFilters, value?: string) => void;
  dbPriceRange?: { min: number; max: number } | null;
}

const FilterBadgeDisplay = ({ advancedFilters, onRemoveFilter, dbPriceRange }: FilterBadgeDisplayProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const badges = [];

  // Booking type badge
  if (advancedFilters.bookingType && advancedFilters.bookingType !== 'daily') {
    badges.push(
      <Badge key="bookingType" variant="secondary" className="flex items-center gap-1">
        {advancedFilters.bookingType === 'monthly' ? 'Monthly' : advancedFilters.bookingType}
        <X 
          className="h-3 w-3 cursor-pointer hover:text-destructive" 
          onClick={() => onRemoveFilter('bookingType')}
        />
      </Badge>
    );
  }

  // Price range badge
  if (advancedFilters.priceRange && dbPriceRange && 
      (advancedFilters.priceRange[0] !== dbPriceRange.min || advancedFilters.priceRange[1] !== dbPriceRange.max)) {
    badges.push(
      <Badge key="priceRange" variant="secondary" className="flex items-center gap-1">
        {formatPrice(advancedFilters.priceRange[0])} - {formatPrice(advancedFilters.priceRange[1])}
        <X 
          className="h-3 w-3 cursor-pointer hover:text-destructive" 
          onClick={() => onRemoveFilter('priceRange')}
        />
      </Badge>
    );
  }

  // Property types badges
  if (advancedFilters.propertyTypes && advancedFilters.propertyTypes.length > 0) {
    advancedFilters.propertyTypes.forEach(type => {
      badges.push(
        <Badge key={`propertyType-${type}`} variant="secondary" className="flex items-center gap-1">
          {type.charAt(0).toUpperCase() + type.slice(1)}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => onRemoveFilter('propertyTypes', type)}
          />
        </Badge>
      );
    });
  }

  // Amenities badges (show only first 3, then count)
  if (advancedFilters.amenities && advancedFilters.amenities.length > 0) {
    const displayAmenities = advancedFilters.amenities.slice(0, 3);
    const remainingCount = advancedFilters.amenities.length - 3;

    displayAmenities.forEach(amenity => {
      badges.push(
        <Badge key={`amenity-${amenity}`} variant="secondary" className="flex items-center gap-1">
          {amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => onRemoveFilter('amenities', amenity)}
          />
        </Badge>
      );
    });

    if (remainingCount > 0) {
      badges.push(
        <Badge key="amenities-more" variant="secondary" className="flex items-center gap-1">
          +{remainingCount} more amenities
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => onRemoveFilter('amenities')}
          />
        </Badge>
      );
    }
  }

  // Bedrooms badge
  if (advancedFilters.bedrooms) {
    badges.push(
      <Badge key="bedrooms" variant="secondary" className="flex items-center gap-1">
        {advancedFilters.bedrooms} bedroom{advancedFilters.bedrooms > 1 ? 's' : ''}
        <X 
          className="h-3 w-3 cursor-pointer hover:text-destructive" 
          onClick={() => onRemoveFilter('bedrooms')}
        />
      </Badge>
    );
  }

  // Bathrooms badge
  if (advancedFilters.bathrooms) {
    badges.push(
      <Badge key="bathrooms" variant="secondary" className="flex items-center gap-1">
        {advancedFilters.bathrooms} bathroom{advancedFilters.bathrooms > 1 ? 's' : ''}
        <X 
          className="h-3 w-3 cursor-pointer hover:text-destructive" 
          onClick={() => onRemoveFilter('bathrooms')}
        />
      </Badge>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {badges}
    </div>
  );
};

export default FilterBadgeDisplay;