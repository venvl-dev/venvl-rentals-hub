import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { differenceInDays } from 'date-fns';
import { Receipt } from 'lucide-react';

interface BookingPricingSummaryProps {
  bookingMode: 'daily' | 'monthly';
  checkIn?: Date;
  checkOut?: Date;
  monthlyDuration: number;
  pricePerNight: number;
  monthlyPrice?: number;
  totalPrice: number;
}

const BookingPricingSummary = ({
  bookingMode,
  checkIn,
  checkOut,
  monthlyDuration,
  pricePerNight,
  monthlyPrice,
  totalPrice,
}: BookingPricingSummaryProps) => {
  if (totalPrice === 0) return null;

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className='space-y-2 sm:space-y-3'
      >
        <Separator className='bg-gray-200' />

        {/* Pricing Summary - Responsive */}
        <div className='bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200'>
          {/* Header - Responsive */}
          <div className='flex items-center gap-2 mb-3 sm:mb-4'>
            <Receipt className='h-4 w-4 sm:h-5 sm:w-5 text-gray-700' />
            <span className='text-sm sm:text-base font-semibold text-gray-900'>
              Price summary
            </span>
          </div>

          {/* Price Calculation - Responsive Layout */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4'>
            <div className='text-xs sm:text-sm text-gray-700 order-1 sm:order-1'>
              {bookingMode === 'daily'
                ? `EGP ${pricePerNight} × ${nights} nights`
                : monthlyDuration > 1
                ? `EGP ${monthlyPrice} per month (${monthlyDuration} months)`
                : `EGP ${monthlyPrice} per month`}
            </div>
            <span className='font-semibold text-gray-900 text-sm sm:text-base order-2 sm:order-2'>
              EGP {totalPrice}
            </span>
          </div>

          {/* Additional info for monthly - Responsive */}
          {bookingMode === 'monthly' && monthlyDuration > 1 && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 sm:mb-4'>
              <div className='text-xs sm:text-sm text-blue-900 font-medium mb-1'>
                Monthly Payment Plan
              </div>
              <div className='text-xs sm:text-sm text-blue-700'>
                Pay EGP {monthlyPrice} each month for {monthlyDuration} months
              </div>
              <div className='text-xs text-blue-600 mt-1'>
                Total contract value: EGP {(monthlyPrice || 0) * monthlyDuration}
              </div>
            </div>
          )}

          {/* Total - Responsive */}
          <Separator className='bg-gray-200 mb-3 sm:mb-4' />
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0'>
            <span className='text-sm sm:text-base lg:text-lg font-bold text-gray-900 order-1 sm:order-1'>
              {bookingMode === 'monthly' && monthlyDuration > 1 ? 'First month payment' : 'Total'}
            </span>
            <span className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 order-2 sm:order-2'>
              EGP {totalPrice}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingPricingSummary;
