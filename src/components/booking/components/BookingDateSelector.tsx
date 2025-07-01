
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
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-gray-700" />
        <span className="font-semibold text-gray-900">
          {bookingMode === 'daily' ? 'Select dates' : 'Select start date & duration'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {bookingMode === 'daily' && (
          <motion.div
            key="daily-booking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="border border-gray-200 rounded-xl p-4">
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
              />
            </div>

            {checkIn && checkOut && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <div className="text-sm text-blue-800">
                  <strong>{differenceInDays(checkOut, checkIn)}</strong> nights from{' '}
                  <strong>{format(checkIn, 'MMM dd')}</strong> to{' '}
                  <strong>{format(checkOut, 'MMM dd')}</strong>
                  {minNights && differenceInDays(checkOut, checkIn) < minNights && (
                    <div className="text-red-600 mt-2">
                      Minimum stay is {minNights} night{minNights > 1 ? 's' : ''}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="border border-gray-200 rounded-xl p-4">
              <Calendar
                mode="single"
                selected={monthlyStartDate}
                onSelect={(date) => onDateChange({ monthlyStartDate: date })}
                disabled={isDateBlocked}
                numberOfMonths={1}
                className="w-full"
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Duration</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMonthlyDuration(-1)}
                    disabled={monthlyDuration <= (minMonths || 1)}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-bold w-12 text-center">
                    {monthlyDuration}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMonthlyDuration(1)}
                    disabled={monthlyDuration >= 12}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 text-center">
                {monthlyDuration} {monthlyDuration === 1 ? 'month' : 'months'}
                {monthlyStartDate && (
                  <span className="block mt-1">
                    Starting {format(monthlyStartDate, 'MMM dd, yyyy')}
                  </span>
                )}
                {minMonths && monthlyDuration < minMonths && (
                  <div className="text-red-600 mt-2">
                    Minimum stay is {minMonths} month{minMonths > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((month) => (
                  <Button
                    key={month}
                    variant={monthlyDuration === month ? "default" : "outline"}
                    size="sm"
                    onClick={() => onDateChange({ monthlyDuration: month })}
                    className="h-10 text-sm"
                    disabled={month < (minMonths || 1)}
                  >
                    {month}m
                  </Button>
                ))}
              </div>
            </div>

            {monthlyStartDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <div className="text-sm text-green-800">
                  <strong>{monthlyDuration}</strong> {monthlyDuration === 1 ? 'month' : 'months'} starting from{' '}
                  <strong>{format(monthlyStartDate, 'MMM dd, yyyy')}</strong>
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
