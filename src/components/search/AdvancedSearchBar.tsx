
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPin, Users } from 'lucide-react';
import { format, addDays } from 'date-fns';

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

interface AdvancedSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const AdvancedSearchBar = ({ onSearch, initialFilters }: AdvancedSearchBarProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: initialFilters?.location || '',
    checkIn: initialFilters?.checkIn,
    checkOut: initialFilters?.checkOut,
    guests: initialFilters?.guests || 1,
    bookingType: initialFilters?.bookingType || 'daily',
    flexibleOption: initialFilters?.flexibleOption,
    duration: initialFilters?.duration,
    propertyType: initialFilters?.propertyType,
    priceRange: initialFilters?.priceRange,
    amenities: initialFilters?.amenities || [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleBookingTypeChange = (type: 'daily' | 'monthly' | 'flexible') => {
    setFilters(prev => ({ 
      ...prev, 
      bookingType: type,
      checkIn: type === 'flexible' ? undefined : prev.checkIn,
      checkOut: type === 'flexible' ? undefined : prev.checkOut,
      duration: type === 'monthly' ? (prev.duration || 1) : undefined,
      flexibleOption: type === 'flexible' ? (prev.flexibleOption || 'weekend') : undefined
    }));
  };

  const flexibleOptions = [
    { value: 'weekend', label: 'Weekend getaway (2-3 nights)' },
    { value: 'week', label: 'A week (7 nights)' },
    { value: 'month', label: 'A month (30 nights)' },
    { value: 'any', label: "I'm flexible" }
  ];

  const amenitiesList = [
    'WiFi', 'Kitchen', 'Pool', 'Parking', 'Air Conditioning', 
    'TV', 'Washer', 'Dryer', 'Hot Tub', 'Gym'
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
      {/* Main Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Location */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Where</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search destinations"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        {/* Booking Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stay Type</label>
          <Select value={filters.bookingType} onValueChange={handleBookingTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily stays</SelectItem>
              <SelectItem value="monthly">Monthly stays</SelectItem>
              <SelectItem value="flexible">I'm flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date/Duration Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {filters.bookingType === 'monthly' ? 'Duration' : 
             filters.bookingType === 'flexible' ? 'When' : 'Dates'}
          </label>
          
          {filters.bookingType === 'monthly' && (
            <Select 
              value={filters.duration?.toString()} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, duration: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select months" />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,6,12].map(months => (
                  <SelectItem key={months} value={months.toString()}>
                    {months} month{months > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filters.bookingType === 'flexible' && (
            <Select 
              value={filters.flexibleOption} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, flexibleOption: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="How long?" />
              </SelectTrigger>
              <SelectContent>
                {flexibleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filters.bookingType === 'daily' && (
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.checkIn ? format(filters.checkIn, "MMM dd") : "Check-in"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.checkIn}
                    onSelect={(date) => setFilters(prev => ({ ...prev, checkIn: date }))}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.checkOut ? format(filters.checkOut, "MMM dd") : "Check-out"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.checkOut}
                    onSelect={(date) => setFilters(prev => ({ ...prev, checkOut: date }))}
                    disabled={(date) => date < new Date() || (filters.checkIn && date <= filters.checkIn)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Select 
              value={filters.guests.toString()} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, guests: parseInt(value) }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} guest{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm"
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced filters
        </Button>
        <Button onClick={handleSearch} className="px-8">
          Search
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
            <Select 
              value={filters.propertyType} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, propertyType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="cabin">Cabin</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min price"
                value={filters.priceRange?.min || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priceRange: { 
                    min: parseInt(e.target.value) || 0, 
                    max: prev.priceRange?.max || 1000 
                  }
                }))}
              />
              <Input
                type="number"
                placeholder="Max price"
                value={filters.priceRange?.max || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priceRange: { 
                    min: prev.priceRange?.min || 0, 
                    max: parseInt(e.target.value) || 1000 
                  }
                }))}
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {amenitiesList.map(amenity => (
                <Badge
                  key={amenity}
                  variant={filters.amenities?.includes(amenity) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const newAmenities = filters.amenities?.includes(amenity)
                      ? filters.amenities.filter(a => a !== amenity)
                      : [...(filters.amenities || []), amenity];
                    setFilters(prev => ({ ...prev, amenities: newAmenities }));
                  }}
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchBar;
