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
  showDetailed = true 
}: PriceBreakdownProps) => {
  const nights = differenceInDays(booking.checkOut, booking.checkIn);
  const basePrice = booking.totalPrice;
  const serviceFee = Math.round(basePrice * 0.1); // 10% service fee
  const taxes = Math.round(basePrice * 0.05); // 5% taxes
  const finalTotal = basePrice + serviceFee + taxes;

  const unitPrice = booking.bookingType === 'daily' 
    ? booking.property.price_per_night 
    : booking.property.monthly_price || 0;

  const units = booking.bookingType === 'daily' ? nights : booking.duration || 1;
  const unitLabel = booking.bookingType === 'daily' 
    ? (nights === 1 ? 'night' : 'nights')
    : (booking.duration === 1 ? 'month' : 'months');

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Price breakdown</h4>
      
      <div className="space-y-3">
        {/* Date Range */}
        {showDetailed && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Dates</span>
            <span>
              {format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd')}
            </span>
          </div>
        )}

        {/* Base Rate */}
        <div className="flex justify-between">
          <span className="text-sm">
            {currency} {Math.round(unitPrice)} × {units} {unitLabel}
          </span>
          <span className="font-medium">
            {currency} {Math.round(basePrice).toLocaleString()}
          </span>
        </div>

        {/* Service Fee */}
        <div className="flex justify-between">
          <span className="text-sm">Service fee (10%)</span>
          <span className="font-medium">
            {currency} {serviceFee.toLocaleString()}
          </span>
        </div>

        {/* Taxes */}
        <div className="flex justify-between">
          <span className="text-sm">Taxes (5%)</span>
          <span className="font-medium">
            {currency} {taxes.toLocaleString()}
          </span>
        </div>

        <Separator className="my-4" />

        {/* Total */}
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Total ({currency})</span>
          <span>{currency} {finalTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Additional Info */}
      {showDetailed && (
        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-gray-600">
            Prices are in {currency} and include all applicable fees. 
            Payment will be processed securely through our payment partner.
          </p>
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;