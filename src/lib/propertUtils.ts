import { Booking } from '@/types/booking';
import { Property } from '@/types/property';
import { differenceInDays } from 'date-fns';

export interface PropertySaturation {
  id: string;
  title: string;
  totalDays: number;
  bookedDays: number;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
  avgBookingValue: number;
}

export const calculatePropertyStats = (
  property: Property,
  propertyBookings: Booking[],
  { startDate, endDate = new Date() }: { startDate: Date; endDate?: Date },
) => {
  const confirmedBookings = propertyBookings.filter((b) =>
    ['confirmed', 'checked_in', 'completed'].includes(b.status),
  );

  const totalDaysInRange = differenceInDays(endDate, startDate) + 1;

  let bookedDays = 0;
  let totalRevenue = 0;
  console.log(confirmedBookings.length);
  confirmedBookings.forEach((booking) => {
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);

    // Calculate overlapping days within our time range
    const overlapStart = checkIn < startDate ? startDate : checkIn;
    const overlapEnd = checkOut > endDate ? endDate : checkOut;

    if (overlapStart <= overlapEnd) {
      const totalsBookedDays = differenceInDays(checkOut, checkIn) + 1;
      const daysBooked = differenceInDays(overlapEnd, overlapStart) + 1;
      bookedDays += daysBooked;

      totalRevenue += booking.total_price * (daysBooked / totalsBookedDays);
    }
  });

  const occupancyRate = (
    totalDaysInRange > 0 ? (bookedDays / totalDaysInRange) * 100 : 0
  ).toFixed(2);
  const avgBookingValue = (
    confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0
  ).toFixed(2);

  return {
    id: property.id,
    title: property.title,
    totalDays: totalDaysInRange,
    bookedDays,
    occupancyRate,
    revenue: totalRevenue,
    bookingsCount: confirmedBookings.length,
    avgBookingValue,
  };
};
