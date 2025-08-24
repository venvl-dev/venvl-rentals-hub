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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {bookingMode === 'daily' ? 'Select Your Dates' : 'Choose Duration'}
            </h3>
            <p className="text-xs text-gray-500">
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
            <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-b from-white to-gray-50/30 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5"></div>
              <div className="relative p-3 flex justify-center">
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
                className=""
                classNames={{
                  months: "flex flex-col space-y-2",
                  month: "space-y-2",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-bold text-gray-800",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-6 w-6 bg-white hover:bg-gray-50 rounded-md border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "border-collapse space-y-1",
                  head_row: "flex mb-1",
                  head_cell: "text-gray-500 rounded-md w-7 font-medium text-xs uppercase tracking-wide",
                  row: "flex mt-0.5 gap-0.5",
                  cell: "h-7 w-7 text-center text-sm p-0 relative",
                  day: "h-7 w-7 p-0 font-medium text-xs hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-md transition-all duration-200 hover:shadow-sm",
                  day_selected: "bg-gradient-to-br from-gray-800 to-black text-white border-gray-700 shadow-md hover:from-black hover:to-gray-800",
                  day_today: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
                  day_outside: "text-gray-300 opacity-40",
                  day_disabled: "bg-gradient-to-br from-red-50 to-red-100 text-red-600 opacity-60 cursor-not-allowed border-red-200 relative after:absolute after:inset-0 after:bg-red-500/5 after:rounded-md",
                  day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-800 aria-selected:border-blue-300",
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
            className="space-y-4"
          >
            <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-b from-white to-gray-50/30 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5"></div>
              <div className="relative p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={monthlyStartDate}
                onSelect={(date) => onDateChange({ monthlyStartDate: date })}
                disabled={isDateBlocked}
                numberOfMonths={1}
                className=""
                classNames={{
                  months: "flex flex-col space-y-2",
                  month: "space-y-2",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-bold text-gray-800",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-6 w-6 bg-white hover:bg-gray-50 rounded-md border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "border-collapse space-y-1",
                  head_row: "flex mb-1",
                  head_cell: "text-gray-500 rounded-md w-7 font-medium text-xs uppercase tracking-wide",
                  row: "flex mt-0.5 gap-0.5",
                  cell: "h-7 w-7 text-center text-sm p-0 relative",
                  day: "h-7 w-7 p-0 font-medium text-xs hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-md transition-all duration-200 hover:shadow-sm",
                  day_selected: "bg-gradient-to-br from-gray-800 to-black text-white border-gray-700 shadow-md hover:from-black hover:to-gray-800",
                  day_today: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
                  day_outside: "text-gray-300 opacity-40",
                  day_disabled: "bg-gradient-to-br from-red-50 to-red-100 text-red-600 opacity-60 cursor-not-allowed border-red-200 relative after:absolute after:inset-0 after:bg-red-500/5 after:rounded-md",
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
