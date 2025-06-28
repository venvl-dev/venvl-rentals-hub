
import { format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';
import { CalendarBooking } from './types';
import { getBookingTypeColor, getStatusColor } from './utils/bookingUtils';
import BookingPopover from './BookingPopover';

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  bookings: CalendarBooking[];
  userType: 'host' | 'guest';
}

const CalendarDay = ({ date, currentMonth, bookings, userType }: CalendarDayProps) => {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isToday = isSameDay(date, new Date());

  return (
    <motion.div
      className={`min-h-[120px] p-2 border border-gray-200 ${
        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
      } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
          {format(date, 'd')}
        </span>
        {isToday && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>

      <div className="space-y-1">
        {bookings.slice(0, 2).map((booking) => (
          <Popover key={booking.id}>
            <PopoverTrigger asChild>
              <motion.div
                className={`text-xs p-1 rounded cursor-pointer ${getBookingTypeColor(booking.booking_type, booking.status)}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="truncate font-medium">
                  {userType === 'host' 
                    ? booking.guest 
                      ? `${booking.guest.first_name} ${booking.guest.last_name}`
                      : 'Guest'
                    : booking.property?.title || 'Property'
                  }
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={`text-xs px-1 ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </Badge>
                  <span className="text-xs opacity-75">
                    {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                  </span>
                </div>
              </motion.div>
            </PopoverTrigger>
            <BookingPopover booking={booking} userType={userType} />
          </Popover>
        ))}
        
        {bookings.length > 2 && (
          <div className="text-xs text-gray-500 text-center p-1">
            +{bookings.length - 2} more
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CalendarDay;
