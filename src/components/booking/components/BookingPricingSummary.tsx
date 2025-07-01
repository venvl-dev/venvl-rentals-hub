
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { differenceInDays } from 'date-fns';

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
        className="space-y-4"
      >
        <Separator />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {bookingMode === 'daily' 
                ? `EGP ${pricePerNight} × ${nights} nights`
                : `EGP ${monthlyPrice} × ${monthlyDuration} months`
              }
            </span>
            <span className="font-semibold">EGP {totalPrice}</span>
          </div>
          
          <div className="flex items-center justify-between text-lg font-bold pt-4 border-t border-gray-200">
            <span>Total</span>
            <span>EGP {totalPrice}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingPricingSummary;
