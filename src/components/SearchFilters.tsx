
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Search, MapPin, Users, Home, Loader2, Bed, Bath, RotateCcw, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { validateInput } from '@/lib/security';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import { AMENITIES_LIST, cleanAmenityIds, getAmenitiesBySpecificCategory } from '@/lib/amenitiesUtils';
import { useToast } from '@/hooks/use-toast';

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
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  minPropertySize?: number;
  maxPropertySize?: number;
}

const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    guests: 1,
    amenities: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);

  // Enhanced validation with all new fields
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
      
      // Validate bedrooms
      if (filters.bedrooms && (filters.bedrooms < 1 || filters.bedrooms > 10)) {
        newErrors.bedrooms = 'Bedrooms must be between 1 and 10';
      }
      
      // Validate bathrooms
      if (filters.bathrooms && (filters.bathrooms < 1 || filters.bathrooms > 10)) {
        newErrors.bathrooms = 'Bathrooms must be between 1 and 10';
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
      
      // Validate property size range
      if (filters.minPropertySize && filters.maxPropertySize && filters.minPropertySize > filters.maxPropertySize) {
        newErrors.propertySize = 'Minimum property size cannot be greater than maximum size';
      }
      
      // Validate amenities
      if (filters.amenities && filters.amenities.length > 0) {
        const cleanedAmenities = cleanAmenityIds(filters.amenities);
        if (cleanedAmenities.length !== filters.amenities.length) {
          newErrors.amenities = 'Invalid amenity selection detected';
        }
      }
      
    } catch (error) {
      newErrors.general = 'Invalid search parameters. Please check your input.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [filters]);

  // Enhanced search handler with full filter cleaning
  const handleSearch = useCallback(async () => {
    if (!validateSearchFilters()) {
      toast({
        title: "Invalid Filters",
        description: "Please fix the validation errors before searching.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Create clean, complete filter object
      const cleanFilters: SearchFilters = {
        location: filters.location.trim(),
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        guests: filters.guests,
        propertyType: filters.propertyType || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        bedrooms: filters.bedrooms || undefined,
        bathrooms: filters.bathrooms || undefined,
        amenities: filters.amenities ? cleanAmenityIds(filters.amenities) : [],
        minPropertySize: filters.minPropertySize || undefined,
        maxPropertySize: filters.maxPropertySize || undefined,
      };
      
      await onSearch(cleanFilters);
      toast({
        title: "Search Started",
        description: "Finding properties that match your criteria...",
      });
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
  }, [filters, onSearch, validateSearchFilters, toast]);

  const handleLocationChange = useCallback((value: string) => {
    try {
      const sanitizedValue = value.slice(0, 100);
      setFilters(prev => ({ ...prev, location: sanitizedValue }));
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: '' }));
      }
    } catch (error) {
      console.error('Location input error:', error);
    }
  }, [errors.location]);

  // Price range synchronization effect
  useEffect(() => {
    if (priceRange[0] !== (filters.minPrice || 0) || priceRange[1] !== (filters.maxPrice || 2000)) {
      setFilters(prev => ({
        ...prev,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 2000 ? priceRange[1] : undefined,
      }));
    }
  }, [priceRange, filters.minPrice, filters.maxPrice]);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setFilters({
      location: '',
      guests: 1,
      amenities: [],
    });
    setPriceRange([0, 2000]);
    setErrors({});
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
    });
  }, [toast]);

  // Number stepper helper
  const NumberStepper = ({ value, onChange, min = 1, max = 10, label }: {
    value?: number;
    onChange: (value?: number) => void;
    min?: number;
    max?: number;
    label: string;
  }) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const newValue = (value || min) - 1;
          onChange(newValue >= min ? newValue : undefined);
        }}
        disabled={!value || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="min-w-[3rem] text-center text-sm font-medium">
        {value || 'Any'}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const newValue = (value || min - 1) + 1;
          onChange(newValue <= max ? newValue : max);
        }}
        disabled={value === max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            {Object.entries(errors).map(([key, error]) => (
              <p key={key} className="text-sm text-destructive">{error}</p>
            ))}
          </div>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="basic">Basic Search</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
            </TabsList>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="location-input" className="text-sm font-medium mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Location
                </Label>
                <Input
                  id="location-input"
                  placeholder="Where are you going?"
                  value={filters.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className={errors.location ? 'border-destructive' : ''}
                  disabled={loading}
                  aria-describedby={errors.location ? "location-error" : undefined}
                />
                {errors.location && (
                  <p id="location-error" className="mt-1 text-sm text-destructive">{errors.location}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Check-in</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-left font-normal ${errors.dates ? 'border-destructive' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.checkIn ? format(filters.checkIn, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.checkIn}
                      onSelect={(date) => setFilters(prev => ({ ...prev, checkIn: date }))}
                      disabled={(date) => date < new Date()}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Check-out</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-left font-normal ${errors.dates ? 'border-destructive' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.checkOut ? format(filters.checkOut, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.checkOut}
                      onSelect={(date) => setFilters(prev => ({ ...prev, checkOut: date }))}
                      disabled={(date) => date < new Date() || (filters.checkIn && date <= filters.checkIn)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.dates && (
                  <p className="mt-1 text-sm text-destructive">{errors.dates}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="guests-select" className="text-sm font-medium mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Guests
                </Label>
                <Select 
                  value={filters.guests.toString()} 
                  onValueChange={(value) => {
                    const guestCount = parseInt(value);
                    if (guestCount >= 1 && guestCount <= 20) {
                      setFilters(prev => ({ ...prev, guests: guestCount }));
                      if (errors.guests) {
                        setErrors(prev => ({ ...prev, guests: '' }));
                      }
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger 
                    id="guests-select" 
                    className={errors.guests ? 'border-destructive' : ''}
                  >
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
                  <p className="mt-1 text-sm text-destructive">{errors.guests}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Property Details</h3>
                
                <div>
                  <Label htmlFor="property-type-select" className="text-sm font-medium mb-2 flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Property Type
                  </Label>
                  <Select 
                    value={filters.propertyType || ""} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, propertyType: value || undefined }))}
                    disabled={loading}
                  >
                    <SelectTrigger id="property-type-select">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
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

                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    Bedrooms
                  </Label>
                  <NumberStepper
                    value={filters.bedrooms}
                    onChange={(value) => setFilters(prev => ({ ...prev, bedrooms: value }))}
                    min={1}
                    max={10}
                    label="bedrooms"
                  />
                  {errors.bedrooms && (
                    <p className="mt-1 text-sm text-destructive">{errors.bedrooms}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    Bathrooms
                  </Label>
                  <NumberStepper
                    value={filters.bathrooms}
                    onChange={(value) => setFilters(prev => ({ ...prev, bathrooms: value }))}
                    min={1}
                    max={10}
                    label="bathrooms"
                  />
                  {errors.bathrooms && (
                    <p className="mt-1 text-sm text-destructive">{errors.bathrooms}</p>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Price Range</h3>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Price per night (${priceRange[0]} - ${priceRange[1]})
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    max={2000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-destructive">{errors.price}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="min-size" className="text-sm font-medium mb-1 block">
                      Min Size (m²)
                    </Label>
                    <Input
                      id="min-size"
                      type="number"
                      placeholder="Min"
                      value={filters.minPropertySize || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        setFilters(prev => ({ ...prev, minPropertySize: value }));
                      }}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-size" className="text-sm font-medium mb-1 block">
                      Max Size (m²)
                    </Label>
                    <Input
                      id="max-size"
                      type="number"
                      placeholder="Max"
                      value={filters.maxPropertySize || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        setFilters(prev => ({ ...prev, maxPropertySize: value }));
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>
                {errors.propertySize && (
                  <p className="text-sm text-destructive">{errors.propertySize}</p>
                )}
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Amenities</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {getAmenitiesBySpecificCategory('essential').slice(0, 8).map((amenity) => {
                    const isSelected = filters.amenities?.includes(amenity.id) || false;
                    return (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const currentAmenities = filters.amenities || [];
                            const updatedAmenities = checked
                              ? [...currentAmenities, amenity.id]
                              : currentAmenities.filter(id => id !== amenity.id);
                            setFilters(prev => ({ ...prev, amenities: updatedAmenities }));
                          }}
                        />
                        <Label 
                          htmlFor={`amenity-${amenity.id}`}
                          className="text-sm font-normal flex items-center cursor-pointer"
                        >
                          <amenity.icon className="h-4 w-4 mr-2" />
                          {amenity.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {errors.amenities && (
                  <p className="text-sm text-destructive">{errors.amenities}</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center gap-4 mt-6">
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
            <span>{loading ? 'Searching...' : 'Search Properties'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
