import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  parseISO,
} from 'date-fns';
import { CalendarBooking } from './types';
import CalendarDay from './CalendarDay';

interface CalendarGridProps {
  currentDate: Date;
  bookings: CalendarBooking[];
  filterType: 'all' | 'daily' | 'monthly';
  userType: 'host' | 'guest';
}

const CalendarGrid = ({
  currentDate,
  bookings,
  filterType,
  userType,
}: CalendarGridProps) => {
  const getBookingsForDate = (date: Date) => {
    return bookings
      .filter((booking) => {
        const checkIn = parseISO(booking.check_in);
        const checkOut = parseISO(booking.check_out);
        return date >= checkIn && date <= checkOut;
      })
      .filter((booking) => {
        if (filterType === 'all') return true;
        return booking.booking_type === filterType;
      });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className='grid grid-cols-7 gap-0 border border-gray-200 rounded-2xl overflow-hidden'>
      {/* Header */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div
          key={day}
          className='bg-gray-100 p-4 text-center font-semibold text-gray-700 border-b border-gray-200'
        >
          {day}
        </div>
      ))}

      {/* Calendar Days */}
      {weeks.map((week, weekIndex) =>
        week.map((date, dayIndex) => (
          <CalendarDay
            key={`${weekIndex}-${dayIndex}`}
            date={date}
            currentMonth={currentDate}
            bookings={getBookingsForDate(date)}
            userType={userType}
          />
        )),
      )}
    </div>
  );
};

export default CalendarGrid;
