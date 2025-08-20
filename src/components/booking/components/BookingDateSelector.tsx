import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarDays, Minus, Plus } from 'lucide-react';
import { addMonths, format, differenceInDays } from 'date-fns';

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
  const updateMonthlyDuration = (change: number) => {
    const newDuration = Math.max(minMonths || 1, Math.min(12, monthlyDuration + change));
    onDateChange({ monthlyDuration: newDuration });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-gray-700" />
        <span className="text-sm font-semibold text-gray-900">
          {bookingMode === 'daily' ? 'Select dates' : 'Select start & duration'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {bookingMode === 'daily' && (
          <motion.div
            key="daily-booking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="border border-gray-200 rounded-lg p-2 lg:p-3 bg-white">
              <Calendar
                mode="range"
                selected={{ from: checkIn, to: checkOut }}
                onSelect={(range) => {
                  onDateChange({
                    checkIn: range?.from,
                    checkOut: range?.to,
                  });
                }}
                disabled={isDateBlocked}
                numberOfMonths={1}
                className="w-full"
                classNames={{
                  months: "flex flex-col space-y-3",
                  month: "space-y-3",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-7 lg:w-8 font-normal text-xs",
                  row: "flex w-full mt-1",
                  cell: "h-7 w-7 lg:h-8 lg:w-8 text-center text-sm p-0 relative",
                  day: "h-7 w-7 lg:h-8 lg:w-8 p-0 font-normal text-sm",
                  day_selected: "bg-black text-white hover:bg-gray-800",
                  day_today: "bg-gray-100 text-gray-900",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-30",
                  day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                }}
              />
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
                  <span className="font-semibold">{differenceInDays(checkOut, checkIn)} nights</span>
                  <span className="text-gray-600 ml-2">
                    {format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd')}
                  </span>
                  {minNights && differenceInDays(checkOut, checkIn) < minNights && (
                    <div className="text-red-600 mt-2 text-sm font-medium">
                      ⚠️ Minimum stay required: {minNights} night{minNights > 1 ? 's' : ''}
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
            className="space-y-3"
          >
            <div className="border border-gray-200 rounded-lg p-2 lg:p-3 bg-white">
              <Calendar
                mode="single"
                selected={monthlyStartDate}
                onSelect={(date) => onDateChange({ monthlyStartDate: date })}
                disabled={isDateBlocked}
                numberOfMonths={1}
                className="w-full"
                classNames={{
                  months: "flex flex-col space-y-3",
                  month: "space-y-3",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-7 lg:w-8 font-normal text-xs",
                  row: "flex w-full mt-1",
                  cell: "h-7 w-7 lg:h-8 lg:w-8 text-center text-sm p-0 relative",
                  day: "h-7 w-7 lg:h-8 lg:w-8 p-0 font-normal text-sm",
                  day_selected: "bg-black text-white hover:bg-gray-800",
                  day_today: "bg-gray-100 text-gray-900",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-30",
                }}
              />
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
                <span className="font-medium">{monthlyDuration} month{monthlyDuration > 1 ? 's' : ''}</span>
                {monthlyStartDate && (
                  <span className="block text-xs mt-0.5">
                    Starting {format(monthlyStartDate, 'MMM dd')}
                  </span>
                )}
                {minMonths && monthlyDuration < minMonths && (
                  <div className="text-red-600 mt-2 text-sm font-medium">
                    ⚠️ Minimum stay required: {minMonths} month{minMonths > 1 ? 's' : ''}
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
                  <span className="font-semibold">{monthlyDuration} month{monthlyDuration > 1 ? 's' : ''}</span>
                  <span className="text-gray-600 ml-2">
                    Starting {format(monthlyStartDate, 'MMM dd')}
                  </span>
                  {minMonths && monthlyDuration < minMonths && (
                    <div className="text-red-600 mt-2 text-sm font-medium">
                      ⚠️ Minimum stay required: {minMonths} month{minMonths > 1 ? 's' : ''}
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
