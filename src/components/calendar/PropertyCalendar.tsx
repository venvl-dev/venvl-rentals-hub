import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  generateCalendarDays, 
  getCalendarStatusColor, 
  CalendarDay 
} from '@/lib/calendarUtils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PropertyCalendarProps {
  propertyId: string;
  rentalType: 'daily' | 'monthly' | 'both';
  onDateSelect?: (startDate: Date, endDate?: Date) => void;
  selectedRange?: { start: Date; end?: Date };
  disabled?: boolean;
  minNights?: number;
  minMonths?: number;
  className?: string;
}

const PropertyCalendar: React.FC<PropertyCalendarProps> = ({
  propertyId,
  rentalType,
  onDateSelect,
  selectedRange,
  disabled = false,
  minNights = 1,
  minMonths = 1,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const days = await generateCalendarDays(
        propertyId,
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      setCalendarDays(days);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [propertyId, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    if (disabled) return;
    
    const dayData = calendarDays.find(d => 
      format(d.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (!dayData || dayData.status !== 'available') return;

    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedRange) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const startStr = format(selectedRange.start, 'yyyy-MM-dd');
    const endStr = selectedRange.end ? format(selectedRange.end, 'yyyy-MM-dd') : null;
    
    return dateStr === startStr || (endStr && dateStr === endStr);
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedRange || !selectedRange.end) return false;
    
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const isSelected = isDateSelected(day.date);
    const isInRange = isDateInRange(day.date);
    const isHovered = hoveredDate && format(day.date, 'yyyy-MM-dd') === format(hoveredDate, 'yyyy-MM-dd');
    const isClickable = day.status === 'available' && !disabled;

    return (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={`
                relative w-full h-12 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer
                transition-all duration-200
                ${day.isCurrentMonth ? 'text-black' : 'text-gray-400'}
                ${isClickable ? 'hover:bg-gray-100' : ''}
                ${isSelected ? 'bg-black text-white' : ''}
                ${isInRange && !isSelected ? 'bg-gray-100' : ''}
                ${isHovered ? 'bg-gray-50' : ''}
                ${!isClickable ? 'cursor-not-allowed' : ''}
                ${getCalendarStatusColor(day.status)}
              `}
              whileHover={isClickable ? { scale: 1.05 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
              onClick={() => handleDateClick(day.date)}
              onMouseEnter={() => setHoveredDate(day.date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <span className="relative z-10">
                {format(day.date, 'd')}
              </span>
              
              {day.isToday && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
              
              {day.status === 'booked' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
              
              {day.status === 'pending' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />
              )}
              
              {day.status === 'blocked' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-gray-500 rounded-full" />
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{format(day.date, 'MMM d, yyyy')}</p>
              <p className="text-sm">
                {day.status === 'available' && 'Available for booking'}
                {day.status === 'booked' && `Booked${day.bookingData?.guest_name ? ` by ${day.bookingData.guest_name}` : ''}`}
                {day.status === 'pending' && 'Pending booking'}
                {day.status === 'blocked' && `Blocked${day.blockedReason ? `: ${day.blockedReason}` : ''}`}
              </p>
              {day.bookingData && (
                <div className="text-xs text-gray-500">
                  <p>Check-in: {format(new Date(day.bookingData.check_in), 'MMM d')}</p>
                  <p>Check-out: {format(new Date(day.bookingData.check_out), 'MMM d')}</p>
                  <p>Type: {day.bookingData.booking_type}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Availability Calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              disabled={loading}
              className="rounded-full w-8 h-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[120px] text-center">
              {format(currentDate, 'MMM yyyy')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={loading}
              className="rounded-full w-8 h-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Legend */}
        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded" />
            <span>Blocked</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={format(currentDate, 'yyyy-MM')}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-1"
              >
                {calendarDays.map((day, index) => renderCalendarDay(day, index))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Booking Info */}
        {rentalType !== 'both' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Info className="h-4 w-4" />
              <span>
                This property is available for {rentalType} rentals only.
                {rentalType === 'daily' && ` Minimum ${minNights} night${minNights > 1 ? 's' : ''}.`}
                {rentalType === 'monthly' && ` Minimum ${minMonths} month${minMonths > 1 ? 's' : ''}.`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyCalendar; 