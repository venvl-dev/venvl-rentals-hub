
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  filterType: 'all' | 'daily' | 'monthly';
  setFilterType: (type: 'all' | 'daily' | 'monthly') => void;
  userType: 'host' | 'guest';
}

const CalendarHeader = ({ 
  currentDate, 
  setCurrentDate, 
  filterType, 
  setFilterType, 
  userType 
}: CalendarHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white p-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold flex items-center">
          <CalendarIcon className="h-6 w-6 mr-3 text-gray-700" />
          {userType === 'host' ? 'Booking Calendar' : 'My Bookings'}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 rounded-2xl">
                <Filter className="h-4 w-4" />
                <span className="capitalize">{filterType}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 rounded-2xl">
              <div className="space-y-1">
                {['all', 'daily', 'monthly'].map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type ? "default" : "ghost"}
                    className="w-full justify-start capitalize rounded-xl"
                    onClick={() => setFilterType(type as 'all' | 'daily' | 'monthly')}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Month Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-lg font-semibold min-w-[150px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
          <span>Daily stays</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded"></div>
          <span>Monthly stays</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-500 rounded"></div>
          <span>Flexible stays</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
