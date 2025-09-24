import { Separator } from '@/components/ui/separator';
import { format, differenceInDays } from 'date-fns';

interface PriceBreakdownProps {
  booking: {
    property: {
      price_per_night: number;
      monthly_price?: number;
    };
    checkIn: Date;
    checkOut: Date;
    bookingType: 'daily' | 'monthly';
    totalPrice: number;
    duration?: number;
  };
  currency?: string;
  showDetailed?: boolean;
}

const PriceBreakdown = ({
  booking,
  currency = 'EGP',
  showDetailed = true,
}: PriceBreakdownProps) => {
  const nights = differenceInDays(booking.checkOut, booking.checkIn);

  // For monthly bookings, calculate per-month pricing instead of total
  const isMonthly = booking.bookingType === 'monthly';
  const monthlyPrice = booking.property.monthly_price || 0;
  const monthlyServiceFee = Math.round(monthlyPrice * 0.1); // 10% service fee per month
  const monthlyTaxes = Math.round(monthlyPrice * 0.05); // 5% taxes per month
  const monthlyTotal = monthlyPrice + monthlyServiceFee + monthlyTaxes;

  // For daily bookings, use total pricing
  const basePrice = isMonthly ? monthlyPrice : booking.totalPrice;
  const serviceFee = isMonthly
    ? monthlyServiceFee
    : Math.round(booking.totalPrice * 0.1);
  const taxes = isMonthly
    ? monthlyTaxes
    : Math.round(booking.totalPrice * 0.05);
  const finalTotal = isMonthly
    ? monthlyTotal
    : booking.totalPrice + serviceFee + taxes;

  const unitPrice =
    booking.bookingType === 'daily'
      ? booking.property.price_per_night
      : booking.property.monthly_price || 0;

  const units =
    booking.bookingType === 'daily' ? nights : booking.duration || 1;
  const unitLabel =
    booking.bookingType === 'daily'
      ? nights === 1
        ? 'night'
        : 'nights'
      : 'month';

  return (
    <div className='space-y-4'>
      <h4 className='font-semibold text-gray-900'>Price breakdown</h4>

      <div className='space-y-3'>
        {/* Date Range */}
        {showDetailed && (
          <div className='flex justify-between text-sm text-gray-600'>
            <span>Dates</span>
            <span>
              {format(booking.checkIn, 'MMM dd')} -{' '}
              {format(booking.checkOut, 'MMM dd')}
            </span>
          </div>
        )}

        {/* Base Rate */}
        <div className='flex justify-between'>
          <span className='text-sm'>
            {currency} {Math.round(unitPrice)} × {isMonthly ? 1 : units}{' '}
            {unitLabel}
          </span>
          <span className='font-medium'>
            {currency} {Math.round(basePrice).toLocaleString()}
          </span>
        </div>

        {/* Service Fee */}
        <div className='flex justify-between'>
          <span className='text-sm'>Service fee (10%)</span>
          <span className='font-medium'>
            {currency} {serviceFee.toLocaleString()}
          </span>
        </div>

        {/* Taxes */}
        <div className='flex justify-between'>
          <span className='text-sm'>Taxes (5%)</span>
          <span className='font-medium'>
            {currency} {taxes.toLocaleString()}
          </span>
        </div>

        <Separator className='my-4' />

        {/* Total */}
        <div className='flex justify-between text-lg font-bold text-gray-900'>
          <span>
            {isMonthly ? 'Monthly Payment' : 'Total'} ({currency})
          </span>
          <span>
            {currency} {finalTotal.toLocaleString()}
          </span>
        </div>

        {/* Monthly Payment Info */}
        {isMonthly && units > 1 && (
          <div className='bg-blue-50 rounded-lg p-3 mt-4'>
            <div className='text-sm text-blue-800'>
              <div className='font-medium mb-1'>Payment Schedule:</div>
              <div>
                • You pay: {currency} {finalTotal.toLocaleString()} per month
              </div>
              <div>• Duration: {units} months</div>
              <div className='font-semibold'>
                • Total amount over {units} months: {currency}{' '}
                {(finalTotal * units).toLocaleString()}
              </div>
              <div className='text-xs mt-1 text-blue-600'>
                * You will be charged monthly, not upfront
              </div>
            </div>
          </div>
        )}

        {/* Single month info */}
        {isMonthly && units === 1 && (
          <div className='bg-blue-50 rounded-lg p-3 mt-4'>
            <div className='text-sm text-blue-800'>
              <div className='font-medium'>Single month booking</div>
              <div className='text-xs mt-1'>
                Payment due: {currency} {finalTotal.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Info */}
      {showDetailed && (
        <div className='bg-gray-50 rounded-lg p-3 mt-4'>
          <p className='text-xs text-gray-600'>
            Prices are in {currency} and include all applicable fees. Payment
            will be processed securely through our payment partner.
          </p>
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;
