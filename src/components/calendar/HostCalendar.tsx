import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCalendarStatusColor,
  blockDates,
  unblockDates,
  clearCalendarCache,
} from '@/lib/calendarUtils';
import { generateCalendarDays, CalendarDay } from '@/lib/calendarUtils';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  X,
  User,
  Clock,
  DollarSign,
  Filter,
  Download,
  Ban,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface HostCalendarProps {
  propertyId: string;
  propertyTitle: string;
  onBookingClick?: (bookingId: string) => void;
  className?: string;
}

interface BookingFilter {
  status: 'all' | 'pending' | 'confirmed' | 'checked_in' | 'completed';
  type: 'all' | 'daily' | 'monthly';
}

const HostCalendar: React.FC<HostCalendarProps> = ({
  propertyId,
  propertyTitle,
  onBookingClick,
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dragMode, setDragMode] = useState<'block' | 'unblock' | null>(null);
  const [filter, setFilter] = useState<BookingFilter>({
    status: 'all',
    type: 'all',
  });

  // Block dates modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockingDates, setBlockingDates] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const days = await generateCalendarDays(
        propertyId,
        currentDate.getFullYear(),
        currentDate.getMonth(),
      );

      setCalendarDays(days);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [propertyId, currentDate]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDates([]);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDates([]);
  };

  const handleDateClick = (date: Date, day: CalendarDay) => {
    if (day.bookingData && onBookingClick) {
      onBookingClick(day.bookingData.id);
      return;
    }

    // Date selection for blocking/unblocking
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = selectedDates.some(
      (d) => format(d, 'yyyy-MM-dd') === dateStr,
    );

    if (isSelected) {
      setSelectedDates(
        selectedDates.filter((d) => format(d, 'yyyy-MM-dd') !== dateStr),
      );
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleBlockDates = async () => {
    if (!userId || selectedDates.length === 0 || !blockReason.trim()) {
      toast.error('Please select dates and provide a reason');
      return;
    }

    setBlockingDates(true);
    try {
      const success = await blockDates(
        propertyId,
        selectedDates,
        blockReason.trim(),
        userId,
      );
      if (success) {
        toast.success(
          `Blocked ${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''}`,
        );
        setSelectedDates([]);
        setBlockReason('');
        setBlockModalOpen(false);
        loadCalendarData();
      } else {
        toast.error('Failed to block dates');
      }
    } catch (error) {
      toast.error('Error blocking dates');
    } finally {
      setBlockingDates(false);
    }
  };

  const handleUnblockDates = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select dates to unblock');
      return;
    }

    try {
      const success = await unblockDates(propertyId, selectedDates);
      if (success) {
        toast.success(
          `Unblocked ${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''}`,
        );
        setSelectedDates([]);
        loadCalendarData();
      } else {
        toast.error('Failed to unblock dates');
      }
    } catch (error) {
      toast.error('Error unblocking dates');
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'checked_in':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isDateSelected = useCallback(
    (date: Date): boolean => {
      return selectedDates.some(
        (d) => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'),
      );
    },
    [selectedDates],
  );

  // Memoize filtered calendar days to avoid recalculating on every render
  const filteredCalendarDays = useMemo(() => {
    return calendarDays.map((day) => {
      if (day.bookingData) {
        const matchesStatus =
          filter.status === 'all' || day.bookingData.status === filter.status;
        const matchesType =
          filter.type === 'all' || day.bookingData.booking_type === filter.type;

        if (!matchesStatus || !matchesType) {
          // Keep the day as booked but hide booking details for filtered items
          return { ...day, bookingData: undefined };
        }
      }
      return day;
    });
  }, [calendarDays, filter]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDay = useCallback(
    (day: CalendarDay, index: number) => {
      const isSelected = isDateSelected(day.date);
      const hasBooking = !!day.bookingData;

      return (
        <div
          key={index}
          className={`
          relative w-full h-16 flex flex-col items-center justify-center text-sm font-medium rounded-lg cursor-pointer
          transition-colors duration-150 border-2
          ${day.isCurrentMonth ? 'text-black' : 'text-gray-400'}
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent'}
          ${hasBooking ? 'hover:bg-gray-50' : 'hover:bg-gray-100'}
          ${getCalendarStatusColor(day.status)}
        `}
          onClick={() => handleDateClick(day.date, day)}
          title={`${format(day.date, 'EEE, MMM d, yyyy')}${hasBooking ? ` - ${day.bookingData!.guest_name}` : ''}`}
        >
          <span className='relative z-10 text-xs'>{format(day.date, 'd')}</span>

          {day.isToday && (
            <div className='absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full' />
          )}

          {hasBooking && (
            <div className='flex items-center justify-center mt-1'>
              <div
                className={`w-2 h-2 rounded-full ${getBookingStatusColor(day.bookingData!.status)}`}
              />
            </div>
          )}

          {day.status === 'blocked' && (
            <div className='absolute top-1 right-1'>
              <Ban className='h-3 w-3 text-gray-500' />
            </div>
          )}
        </div>
      );
    },
    [isDateSelected, handleDateClick],
  );

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            <span>Calendar - {propertyTitle}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handlePrevMonth}
              disabled={loading}
              className='rounded-full w-8 h-8 p-0'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div className='text-lg font-semibold min-w-[120px] text-center'>
              {format(currentDate, 'MMM yyyy')}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleNextMonth}
              disabled={loading}
              className='rounded-full w-8 h-8 p-0'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Controls */}
        <div className='flex flex-wrap items-center justify-between gap-4 mb-4'>
          {/* Filters */}
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-gray-500' />
            <Select
              value={filter.status}
              onValueChange={(value) =>
                setFilter({ ...filter, status: value as any })
              }
            >
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='confirmed'>Confirmed</SelectItem>
                <SelectItem value='checked_in'>Checked In</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.type}
              onValueChange={(value) =>
                setFilter({ ...filter, type: value as any })
              }
            >
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='daily'>Daily</SelectItem>
                <SelectItem value='monthly'>Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2'>
            {selectedDates.length > 0 && (
              <>
                <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant='outline' size='sm' className='gap-2'>
                      <Ban className='h-4 w-4' />
                      Block ({selectedDates.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block Selected Dates</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='blockReason'>Reason for blocking</Label>
                        <Textarea
                          id='blockReason'
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder='e.g., Maintenance, Personal use, etc.'
                          className='mt-1'
                        />
                      </div>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='outline'
                          onClick={() => setBlockModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBlockDates}
                          disabled={blockingDates}
                        >
                          {blockingDates ? 'Blocking...' : 'Block Dates'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleUnblockDates}
                  className='gap-2'
                >
                  <Check className='h-4 w-4' />
                  Unblock ({selectedDates.length})
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Calendar Legend */}
        <div className='flex flex-wrap gap-3 mb-4 text-xs'>
          <div className='flex items-center gap-1'>
            <div className='w-3 h-3 bg-green-100 border border-green-200 rounded' />
            <span>Available</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-3 h-3 bg-green-500 rounded' />
            <span>Confirmed</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-3 h-3 bg-yellow-500 rounded' />
            <span>Pending</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-3 h-3 bg-purple-500 rounded' />
            <span>Checked In</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-3 h-3 bg-blue-500 rounded' />
            <span>Completed</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-3 h-3 bg-gray-100 border border-gray-200 rounded' />
            <span>Blocked</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className='space-y-2'>
          {/* Day Headers */}
          <div className='grid grid-cols-7 gap-1 mb-2'>
            {dayNames.map((day) => (
              <div
                key={day}
                className='text-center text-xs font-medium text-gray-500 py-2'
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {loading ? (
            <div className='grid grid-cols-7 gap-1'>
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={index} className='h-16 w-full rounded-lg' />
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-7 gap-1'>
              {filteredCalendarDays.map((day, index) =>
                renderCalendarDay(day, index),
              )}
            </div>
          )}
        </div>

        {/* Selected Dates Info */}
        {selectedDates.length > 0 && (
          <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
            <p className='text-sm text-blue-800'>
              {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''}{' '}
              selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HostCalendar;
