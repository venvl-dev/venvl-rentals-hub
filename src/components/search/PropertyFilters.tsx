
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X } from 'lucide-react';

interface FilterOptions {
  priceRange: [number, number];
  propertyTypes: string[];
  amenities: string[];
  bookingTypes: string[];
  minRating: number;
  instantBook: boolean;
}

interface PropertyFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableFilters: {
    propertyTypes: { value: string; label: string; count: number }[];
    amenities: { value: string; label: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

const PropertyFilters = ({ filters, onFiltersChange, availableFilters }: PropertyFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      priceRange: [availableFilters.priceRange.min, availableFilters.priceRange.max],
      propertyTypes: [],
      amenities: [],
      bookingTypes: [],
      minRating: 0,
      instantBook: false,
    });
  };

  const activeFiltersCount = [
    filters.propertyTypes.length > 0,
    filters.amenities.length > 0,
    filters.bookingTypes.length > 0,
    filters.minRating > 0,
    filters.instantBook,
    filters.priceRange[0] !== availableFilters.priceRange.min || 
    filters.priceRange[1] !== availableFilters.priceRange.max
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="space-y-4">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value)}
                    max={availableFilters.priceRange.max}
                    min={availableFilters.priceRange.min}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Property Types */}
              <div>
                <h3 className="font-semibold mb-3">Property Type</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableFilters.propertyTypes.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={filters.propertyTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          const newTypes = checked
                            ? [...filters.propertyTypes, type.value]
                            : filters.propertyTypes.filter(t => t !== type.value);
                          updateFilter('propertyTypes', newTypes);
                        }}
                      />
                      <label
                        htmlFor={`type-${type.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {type.label} ({type.count})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="font-semibold mb-3">Amenities</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableFilters.amenities.map(amenity => (
                    <div key={amenity.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity.value}`}
                        checked={filters.amenities.includes(amenity.value)}
                        onCheckedChange={(checked) => {
                          const newAmenities = checked
                            ? [...filters.amenities, amenity.value]
                            : filters.amenities.filter(a => a !== amenity.value);
                          updateFilter('amenities', newAmenities);
                        }}
                      />
                      <label
                        htmlFor={`amenity-${amenity.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {amenity.label} ({amenity.count})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Types */}
              <div>
                <h3 className="font-semibold mb-3">Booking Options</h3>
                <div className="space-y-2">
                  {[
                    { value: 'daily', label: 'Daily stays' },
                    { value: 'monthly', label: 'Monthly stays' },
                    { value: 'flexible', label: 'Flexible dates' }
                  ].map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`booking-${type.value}`}
                        checked={filters.bookingTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          const newTypes = checked
                            ? [...filters.bookingTypes, type.value]
                            : filters.bookingTypes.filter(t => t !== type.value);
                          updateFilter('bookingTypes', newTypes);
                        }}
                      />
                      <label
                        htmlFor={`booking-${type.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="font-semibold mb-3">Minimum Rating</h3>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, 3.0].map(rating => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={filters.minRating === rating}
                        onCheckedChange={(checked) => {
                          updateFilter('minRating', checked ? rating : 0);
                        }}
                      />
                      <label
                        htmlFor={`rating-${rating}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {rating}+ stars
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instant Book */}
              <div>
                <h3 className="font-semibold mb-3">Booking Options</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instant-book"
                    checked={filters.instantBook}
                    onCheckedChange={(checked) => updateFilter('instantBook', checked)}
                  />
                  <label
                    htmlFor="instant-book"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Instant Book
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyFilters;
