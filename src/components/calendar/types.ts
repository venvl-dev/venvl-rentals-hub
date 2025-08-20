
export interface CalendarBooking {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
  booking_type: string;
  guests: number;
  total_price: number;
  property?: {
    title: string;
  } | null;
  guest?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface DashboardCalendarProps {
  userId: string;
  userType: 'host' | 'guest';
}
