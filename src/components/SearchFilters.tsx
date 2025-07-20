
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, MapPin, Users, Home, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { validateInput } from '@/lib/security';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
}

const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    guests: 1,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateSearchFilters = useCallback((): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    try {
      // Validate location input
      if (filters.location.trim().length > 0) {
        const cleanLocation = validateInput(filters.location, 100);
        if (cleanLocation !== filters.location) {
          setFilters(prev => ({ ...prev, location: cleanLocation }));
        }
      }
      
      // Validate guest count
      if (filters.guests < 1 || filters.guests > 20) {
        newErrors.guests = 'Guest count must be between 1 and 20';
      }
      
      // Validate date range
      if (filters.checkIn && filters.checkOut) {
        if (filters.checkIn >= filters.checkOut) {
          newErrors.dates = 'Check-out date must be after check-in date';
        }
        
        const maxStay = new Date();
        maxStay.setFullYear(maxStay.getFullYear() + 1);
        if (filters.checkIn > maxStay) {
          newErrors.dates = 'Check-in date cannot be more than 1 year in the future';
        }
      }
      
      // Validate price range
      if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
        newErrors.price = 'Minimum price cannot be greater than maximum price';
      }
      
    } catch (error) {
      newErrors.general = 'Invalid search parameters. Please check your input.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [filters]);

  const handleSearch = useCallback(async () => {
    if (!validateSearchFilters()) return;
    
    setLoading(true);
    try {
      await onSearch(filters);
    } catch (error) {
      await handleError(
        new CustomError(
          'Search failed',
          ErrorCodes.SYSTEM_NETWORK_ERROR,
          'medium',
          'Search failed. Please try again.'
        ),
        { filters }
      );
    } finally {
      setLoading(false);
    }
  }, [filters, onSearch, validateSearchFilters]);

  const handleLocationChange = useCallback((value: string) => {
    try {
      const sanitizedValue = value.slice(0, 100); // Limit length
      setFilters(prev => ({ ...prev, location: sanitizedValue }));
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: '' }));
      }
    } catch (error) {
      console.error('Location input error:', error);
    }
  }, [errors.location]);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {Object.entries(errors).map(([key, error]) => (
              <p key={key} className="text-sm text-red-600">{error}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="location-input" className="text-sm font-medium mb-2 block">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <Input
              id="location-input"
              placeholder="Where are you going?"
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className={`${errors.location ? 'border-red-500' : ''}`}
              disabled={loading}
              aria-describedby={errors.location ? "location-error" : undefined}
            />
            {errors.location && (
              <p id="location-error" className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Check-in</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.checkIn ? format(filters.checkIn, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.checkIn}
                  onSelect={(date) => setFilters({ ...filters, checkIn: date })}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Check-out</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.checkOut ? format(filters.checkOut, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.checkOut}
                  onSelect={(date) => setFilters({ ...filters, checkOut: date })}
                  disabled={(date) => date < new Date() || (filters.checkIn && date <= filters.checkIn)}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label htmlFor="guests-select" className="text-sm font-medium mb-2 block">
              <Users className="inline h-4 w-4 mr-1" />
              Guests
            </label>
            <Select 
              value={filters.guests.toString()} 
              onValueChange={(value) => {
                const guestCount = parseInt(value);
                if (guestCount >= 1 && guestCount <= 20) {
                  setFilters({ ...filters, guests: guestCount });
                  if (errors.guests) {
                    setErrors(prev => ({ ...prev, guests: '' }));
                  }
                }
              }}
              disabled={loading}
            >
              <SelectTrigger id="guests-select" className={errors.guests ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} guest{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.guests && (
              <p className="mt-1 text-sm text-red-600">{errors.guests}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="property-type-select" className="text-sm font-medium mb-2 block">
              <Home className="inline h-4 w-4 mr-1" />
              Property Type
            </label>
            <Select 
              value={filters.propertyType} 
              onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
              disabled={loading}
            >
              <SelectTrigger id="property-type-select">
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="cabin">Cabin</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleSearch} 
            className="flex items-center space-x-2 min-w-[120px]"
            disabled={loading}
            aria-label="Search for properties"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
