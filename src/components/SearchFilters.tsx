
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';

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

  const handleSearch = () => {
    onSearch(filters);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Input
              placeholder="Where are you going?"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
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
            <label className="text-sm font-medium mb-2 block">Guests</label>
            <Select value={filters.guests.toString()} onValueChange={(value) => setFilters({ ...filters, guests: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num} guest{num > 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Property Type</label>
            <Select value={filters.propertyType} onValueChange={(value) => setFilters({ ...filters, propertyType: value })}>
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
        </div>
        
        <div className="flex justify-center mt-6">
          <Button onClick={handleSearch} className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
