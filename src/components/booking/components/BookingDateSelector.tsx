import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarDays, Minus, Plus } from 'lucide-react';
import { addMonths, format, differenceInDays, isAfter, startOfDay } from 'date-fns';

interface BookingDateSelectorProps {
  bookingMode: 'daily' | 'monthly';
  checkIn?: Date;
  checkOut?: Date;
  monthlyStartDate?: Date;
  monthlyDuration: number;
  onDateChange: (data: {
    checkIn?: Date;
    checkOut?: Date;
    monthlyStartDate?: Date;
    monthlyDuration?: number;
  }) => void;
  isDateBlocked: (date: Date) => boolean;
  minNights?: number;
  minMonths?: number;
}

const BookingDateSelector = ({
  bookingMode,
  checkIn,
  checkOut,
  monthlyStartDate,
  monthlyDuration,
  onDateChange,
  isDateBlocked,
  minNights,
  minMonths,
}: BookingDateSelectorProps) => {
  console.log('📊 BookingDateSelector rendered with:', { bookingMode, checkIn, checkOut, monthlyStartDate });
  
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedDate, setLastClickedDate] = useState<Date | null>(null);
  const [isDoubleClick, setIsDoubleClick] = useState<boolean>(false);
  const dailyCalendarRef = useRef<HTMLDivElement>(null);
  const monthlyCalendarRef = useRef<HTMLDivElement>(null);
  
  // Add direct event listener for double-click detection on calendar buttons
  useEffect(() => {
    console.log('🚀 Setting up event listeners...');
    console.log('📅 Daily calendar ref:', dailyCalendarRef.current);
    console.log('📅 Monthly calendar ref:', monthlyCalendarRef.current);
    console.log('🔧 Booking mode:', bookingMode);
    
    const dailyCalendar = dailyCalendarRef.current;
    const monthlyCalendar = monthlyCalendarRef.current;
    
    const handleDoubleClick = (event: MouseEvent) => {
      console.log('🖱️ Double-click event detected on calendar');
      
      try {
        const target = event.target as HTMLElement;
        const dayButton = target.closest('[role="gridcell"] button');
        
        if (!dayButton) {
          console.log('❌ No day button found');
          return;
        }
        
        console.log('📅 Day button found, clearing selection...');
        
        // Simplified approach - just clear the selection regardless
        if (bookingMode === 'daily') {
          console.log('🔄 Clearing daily selection');
          onDateChange({ checkIn: undefined, checkOut: undefined });
        } else {
          console.log('🔄 Clearing monthly selection');
          onDateChange({ monthlyStartDate: undefined });
        }
        
        // Remove styling from the clicked button
        dayButton.setAttribute('aria-selected', 'false');
        dayButton.removeAttribute('data-selected');
        
        // Remove selection classes
        dayButton.classList.remove('day_selected', 'rdp-day_selected', 'bg-primary', 'text-primary-foreground');
        
        // Clear inline styles
        dayButton.style.backgroundColor = '';
        dayButton.style.color = '';
        dayButton.style.border = '';
        
        // For daily mode, clear all buttons in the calendar
        if (bookingMode === 'daily') {
          const allButtons = dayButton.closest('[role="grid"]')?.querySelectorAll('[role="gridcell"] button');
          allButtons?.forEach((btn) => {
            const button = btn as HTMLElement;
            button.setAttribute('aria-selected', 'false');
            button.removeAttribute('data-selected');
            button.classList.remove('day_selected', 'rdp-day_selected', 'day_range_middle', 'day_range_start', 'day_range_end');
            button.style.backgroundColor = '';
            button.style.color = '';
            button.style.border = '';
          });
        }
        
        console.log('✅ Selection cleared successfully');
        
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();
        
      } catch (error) {
        console.error('❌ Error in handleDoubleClick:', error);
      }
    };

    // Test click listener
    const handleSingleClick = (event: MouseEvent) => {
      console.log('👆 Single click detected on calendar');
    };

    // Try document-wide listener as fallback
    const documentDoubleClickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dayButton = target.closest('[role="gridcell"] button');
      
      if (dayButton) {
        console.log('🌍 Document-wide double-click on calendar button detected');
        handleDoubleClick(event);
      }
    };

    if (dailyCalendar) {
      dailyCalendar.addEventListener('click', handleSingleClick);
      dailyCalendar.addEventListener('dblclick', handleDoubleClick);
      console.log('🎉 Event listeners added to daily calendar');
    }
    
    if (monthlyCalendar) {
      monthlyCalendar.addEventListener('click', handleSingleClick);
      monthlyCalendar.addEventListener('dblclick', handleDoubleClick);
      console.log('🎉 Event listeners added to monthly calendar');
    }
    
    // Add document-wide listener as backup
    document.addEventListener('dblclick', documentDoubleClickHandler);
    console.log('🌍 Document-wide double-click listener added');

    return () => {
      if (dailyCalendar) {
        dailyCalendar.removeEventListener('click', handleSingleClick);
        dailyCalendar.removeEventListener('dblclick', handleDoubleClick);
      }
      if (monthlyCalendar) {
        monthlyCalendar.removeEventListener('click', handleSingleClick);
        monthlyCalendar.removeEventListener('dblclick', handleDoubleClick);
      }
      document.removeEventListener('dblclick', documentDoubleClickHandler);
      console.log('🧹 All event listeners cleaned up');
    };
  }, [bookingMode, onDateChange]);

  const updateMonthlyDuration = (change: number) => {
    const newDuration = Math.max(minMonths || 1, Math.min(12, monthlyDuration + change));
    onDateChange({ monthlyDuration: newDuration });
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const isPast = !isAfter(startOfDay(date), today) && startOfDay(date).getTime() !== today.getTime();
    return isDateBlocked(date) || isPast;
  };

  const isPastDate = (date: Date) => {
    const today = startOfDay(new Date());
    return !isAfter(startOfDay(date), today) && startOfDay(date).getTime() !== today.getTime();
  };

  const isBookedDate = (date: Date) => {
    const today = startOfDay(new Date());
    const isPast = !isAfter(startOfDay(date), today) && startOfDay(date).getTime() !== today.getTime();
    return isDateBlocked(date) && !isPast;
  };

  const handleDateClick = (date: Date) => {
    console.log('🖱️ handleDateClick called with date:', date?.toDateString());
    
    if (!date) return;
    
    const now = Date.now();
    const dateTime = date.getTime();
    
    const isSelectedDate = bookingMode === 'daily' 
      ? (checkIn && dateTime === checkIn.getTime()) || 
        (checkOut && dateTime === checkOut.getTime()) ||
        (checkIn && checkOut && date >= checkIn && date <= checkOut)
      : monthlyStartDate && dateTime === monthlyStartDate.getTime();

    console.log('🔍 Date click analysis:', {
      isSelectedDate,
      lastClickedDate: lastClickedDate?.toDateString(),
      timeDiff: now - lastClickTime,
      bookingMode
    });

    // Check for double click (within 500ms on the same selected date)
    if (isSelectedDate && 
        lastClickedDate && 
        lastClickedDate.getTime() === dateTime && 
        now - lastClickTime < 500) {
      
      console.log('🔄 Double-click detected via handleDateClick - clearing selection');
      
      // Double click detected - clear selection
      if (bookingMode === 'daily') {
        onDateChange({ checkIn: undefined, checkOut: undefined });
      } else {
        onDateChange({ monthlyStartDate: undefined });
      }
      
      setLastClickedDate(null);
      setLastClickTime(0);
      
      console.log('✅ Selection cleared via handleDateClick');
      return;
    }

    // Store click info for double-click detection
    setLastClickedDate(date);
    setLastClickTime(now);
    
    console.log('📅 Single click on date stored for double-click detection');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-800 to-black rounded-lg flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {bookingMode === 'daily' ? 'Select Your Dates' : 'Choose Duration'}
            </h3>
            <p className="text-xs text-black">
              {bookingMode === 'daily' ? 'Pick check-in and check-out dates' : 'Select start date and duration'}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {bookingMode === 'daily' && (
          <motion.div
            key="daily-booking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div ref={dailyCalendarRef} className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-b from-white to-gray-50/30 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-black/10"></div>
              <div className="relative p-3 flex justify-center">
              <Calendar
                mode="range"
                selected={{ from: checkIn, to: checkOut }}
                onSelect={(range) => {
                  // Prevent selection during double-click
                  if (isDoubleClick) {
                    console.log('🚫 Ignoring onSelect due to double-click');
                    return;
                  }
                  
                  console.log('✅ onSelect triggered:', range);
                  onDateChange({
                    checkIn: range?.from,
                    checkOut: range?.to,
                  });
                }}
                onDayClick={handleDateClick}
                disabled={isDateDisabled}
                modifiers={{
                  past: isPastDate,
                  booked: isBookedDate
                }}
                modifiersStyles={{
                  past: {
                    backgroundColor: '#f3f4f6 !important',
                    color: '#9ca3af !important',
                    opacity: '0.6 !important',
                    border: '1px solid #d1d5db !important',
                    cursor: 'not-allowed !important'
                  },
                  booked: {
                    backgroundColor: '#fecaca',
                    color: '#991b1b',
                    border: '1px solid #f87171'
                  }
                }}
                numberOfMonths={1}
                className=""
                classNames={{
                  months: "flex flex-col space-y-3",
                  month: "space-y-3",
                  caption: "flex justify-center pt-2 relative items-center",
                  caption_label: "text-lg font-bold text-black",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-white hover:bg-black hover:text-white rounded-md border border-black shadow-sm transition-all duration-200 hover:shadow-md",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "border-collapse space-y-2",
                  head_row: "flex mb-2",
                  head_cell: "text-black rounded-md w-10 font-medium text-sm uppercase tracking-wide",
                  row: "flex mt-1 gap-1",
                  cell: "h-10 w-10 text-center text-sm p-0 relative",
                  day: "h-10 w-10 p-0 font-medium text-sm hover:bg-black hover:text-white hover:border-black border border-transparent rounded-md transition-all duration-200 hover:shadow-sm",
                  day_selected: "bg-gradient-to-br from-gray-800 to-black text-white border-gray-700 shadow-md hover:from-black hover:to-gray-800 [&[aria-selected=false]]:bg-transparent [&[aria-selected=false]]:text-black [&[aria-selected=false]]:border-transparent",
                  day_today: "bg-white text-black border-black font-bold",
                  day_outside: "text-gray-400 opacity-40",
                  day_disabled: "bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed border-gray-200",
                  day_range_middle: "aria-selected:bg-gray-800 aria-selected:text-white aria-selected:border-black",
                }}
              />
              </div>
            </div>

            {/* Enhanced Calendar Legend */}
            <div className="bg-gray-50/50 rounded-lg p-2 border border-gray-100">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gray-100 rounded-sm border border-gray-200 shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-red-100 to-red-200 rounded-sm border border-red-300 shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-800 to-black rounded-sm shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Selected</span>
                </div>
              </div>
            </div>

            {/* Date Summary - Compact */}
            {checkIn && checkOut && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`border rounded-lg p-3 ${
                  minNights && differenceInDays(checkOut, checkIn) < minNights
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className={`text-sm ${
                  minNights && differenceInDays(checkOut, checkIn) < minNights
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}>
                  <span className="font-semibold">{differenceInDays(checkOut, checkIn).toLocaleString()} nights</span>
                  <span className="text-gray-600 ml-2">
                    {format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd')}
                  </span>
                  {minNights && differenceInDays(checkOut, checkIn) < minNights && (
                    <div className="text-red-600 mt-2 text-sm font-medium">
                      ⚠️ Minimum stay required: {minNights?.toLocaleString()} night{minNights && minNights > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {bookingMode === 'monthly' && (
          <motion.div
            key="monthly-booking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div ref={monthlyCalendarRef} className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-b from-white to-gray-50/30 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-black/10"></div>
              <div className="relative p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={monthlyStartDate}
                onSelect={(date) => {
                  // Prevent selection during double-click
                  if (isDoubleClick) {
                    console.log('🚫 Ignoring onSelect due to double-click (monthly)');
                    return;
                  }
                  
                  console.log('✅ onSelect triggered (monthly):', date);
                  onDateChange({ monthlyStartDate: date });
                }}
                onDayClick={handleDateClick}
                disabled={isDateDisabled}
                modifiers={{
                  past: isPastDate,
                  booked: isBookedDate
                }}
                modifiersStyles={{
                  past: {
                    backgroundColor: '#f3f4f6 !important',
                    color: '#9ca3af !important',
                    opacity: '0.6 !important',
                    border: '1px solid #d1d5db !important',
                    cursor: 'not-allowed !important'
                  },
                  booked: {
                    backgroundColor: '#fecaca',
                    color: '#991b1b',
                    border: '1px solid #f87171'
                  }
                }}
                numberOfMonths={1}
                className=""
                classNames={{
                  months: "flex flex-col space-y-3",
                  month: "space-y-3",
                  caption: "flex justify-center pt-2 relative items-center",
                  caption_label: "text-lg font-bold text-black",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-white hover:bg-black hover:text-white rounded-md border border-black shadow-sm transition-all duration-200 hover:shadow-md",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "border-collapse space-y-2",
                  head_row: "flex mb-2",
                  head_cell: "text-black rounded-md w-10 font-medium text-sm uppercase tracking-wide",
                  row: "flex mt-1 gap-1",
                  cell: "h-10 w-10 text-center text-sm p-0 relative",
                  day: "h-10 w-10 p-0 font-medium text-sm hover:bg-black hover:text-white hover:border-black border border-transparent rounded-md transition-all duration-200 hover:shadow-sm",
                  day_selected: "bg-gradient-to-br from-gray-800 to-black text-white border-gray-700 shadow-md hover:from-black hover:to-gray-800 [&[aria-selected=false]]:bg-transparent [&[aria-selected=false]]:text-black [&[aria-selected=false]]:border-transparent",
                  day_today: "bg-white text-black border-black font-bold",
                  day_outside: "text-gray-400 opacity-40",
                  day_disabled: "bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed border-gray-200",
                }}
              />
              </div>
            </div>

            {/* Enhanced Calendar Legend */}
            <div className="bg-gray-50/50 rounded-lg p-2 border border-gray-100">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gray-100 rounded-sm border border-gray-200 shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-red-100 to-red-200 rounded-sm border border-red-300 shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-800 to-black rounded-sm shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Selected</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMonthlyDuration(-1)}
                    disabled={monthlyDuration <= (minMonths || 1)}
                    className="w-7 h-7 p-0 rounded-md"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-base font-bold w-8 text-center">
                    {monthlyDuration}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMonthlyDuration(1)}
                    disabled={monthlyDuration >= 12}
                    className="w-7 h-7 p-0 rounded-md"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 text-center">
                <span className="font-medium">{monthlyDuration.toLocaleString()} month{monthlyDuration > 1 ? 's' : ''}</span>
                {monthlyStartDate && (
                  <span className="block text-xs mt-0.5">
                    Starting {format(monthlyStartDate, 'MMM dd')}
                  </span>
                )}
                {minMonths && monthlyDuration < minMonths && (
                  <div className="text-red-600 mt-2 text-sm font-medium">
                    ⚠️ Minimum stay required: {minMonths?.toLocaleString()} month{minMonths && minMonths > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[1, 3, 6, 12].map((month) => (
                  <Button
                    key={month}
                    variant={monthlyDuration === month ? "default" : "outline"}
                    size="sm"
                    onClick={() => onDateChange({ monthlyDuration: month })}
                    className={`h-8 text-xs font-medium ${
                      monthlyDuration === month ? 'bg-black hover:bg-gray-800' : ''
                    }`}
                    disabled={month < (minMonths || 1)}
                  >
                    {month}m
                  </Button>
                ))}
              </div>
            </div>

            {/* Monthly Summary - Compact */}
            {monthlyStartDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`border rounded-lg p-3 ${
                  minMonths && monthlyDuration < minMonths
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className={`text-sm ${
                  minMonths && monthlyDuration < minMonths
                    ? 'text-red-800'
                    : 'text-green-800'
                }`}>
                  <span className="font-semibold">{monthlyDuration.toLocaleString()} month{monthlyDuration > 1 ? 's' : ''}</span>
                  <span className="text-gray-600 ml-2">
                    Starting {format(monthlyStartDate, 'MMM dd')}
                  </span>
                  {minMonths && monthlyDuration < minMonths && (
                    <div className="text-red-600 mt-2 text-sm font-medium">
                      ⚠️ Minimum stay required: {minMonths?.toLocaleString()} month{minMonths && minMonths > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingDateSelector;
