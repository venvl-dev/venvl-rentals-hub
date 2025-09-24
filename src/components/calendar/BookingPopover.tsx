import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { PopoverContent } from '@/components/ui/popover';
import { CalendarBooking } from './types';
import { getBookingTypeColor, getStatusColor } from './utils/bookingUtils';

interface BookingPopoverProps {
  booking: CalendarBooking;
  userType: 'host' | 'guest';
}

const BookingPopover = ({ booking, userType }: BookingPopoverProps) => {
  return (
    <PopoverContent className='w-80 p-4 rounded-2xl shadow-2xl'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h4 className='font-semibold text-lg'>
            {userType === 'host'
              ? booking.guest
                ? `${booking.guest.first_name} ${booking.guest.last_name}`
                : 'Guest'
              : booking.property?.title || 'Property'}
          </h4>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>

        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-gray-600'>Check-in:</span>
            <div className='font-medium'>
              {format(parseISO(booking.check_in), 'MMM dd, yyyy')}
            </div>
          </div>
          <div>
            <span className='text-gray-600'>Check-out:</span>
            <div className='font-medium'>
              {format(parseISO(booking.check_out), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between text-sm'>
          <span className='text-gray-600'>Type:</span>
          <Badge
            variant='outline'
            className={getBookingTypeColor(
              booking.booking_type,
              booking.status,
            )}
          >
            {booking.booking_type}
          </Badge>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-gray-600 text-sm'>Total:</span>
          <span className='font-semibold text-lg'>${booking.total_price}</span>
        </div>
      </div>
    </PopoverContent>
  );
};

export default BookingPopover;
