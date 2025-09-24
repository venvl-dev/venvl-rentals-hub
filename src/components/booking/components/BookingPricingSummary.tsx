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
        className='space-y-3'
      >
        <Separator className='bg-gray-200' />

        {/* Pricing Summary - Simplified */}
        <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
          {/* Header - Compact */}
          <div className='flex items-center gap-2 mb-3'>
            <Receipt className='h-4 w-4 text-gray-700' />
            <span className='text-sm font-semibold text-gray-900'>
              Price summary
            </span>
          </div>

          {/* Price Calculation - Streamlined */}
          <div className='flex items-center justify-between mb-3'>
            <div className='text-sm text-gray-700'>
              {bookingMode === 'daily'
                ? `EGP ${pricePerNight} × ${nights} nights`
                : `EGP ${monthlyPrice} × ${monthlyDuration} months`}
            </div>
            <span className='font-semibold text-gray-900'>
              EGP {totalPrice}
            </span>
          </div>

          {/* Total - Simplified */}
          <Separator className='bg-gray-200 mb-3' />
          <div className='flex items-center justify-between'>
            <span className='text-base font-bold text-gray-900'>Total</span>
            <span className='text-lg font-bold text-gray-900'>
              EGP {totalPrice}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingPricingSummary;
