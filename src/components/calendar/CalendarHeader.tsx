
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const navigateToPrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const navigateToNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <motion.div 
      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Title and Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToPrevious}
              className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-2xl font-bold text-gray-900 min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToNext}
              className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            Today
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="daily">Daily Stays</SelectItem>
                <SelectItem value="monthly">Monthly Stays</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              Viewing as: <span className="font-medium capitalize">{userType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 border-l-4 border-blue-500 rounded-sm"></div>
          <span>Daily Booking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-200 border-l-4 border-green-500 rounded-sm"></div>
          <span>Monthly Booking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarHeader;
