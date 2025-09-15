import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface PriceBreakdownModalProps {
  booking: {
    property: {
      price_per_night: number;
      monthly_price?: number;
      title: string;
    };
    checkIn: Date;
    checkOut: Date;
    bookingType: 'daily' | 'monthly';
    totalPrice: number;
    duration?: number;
    guests: number;
  };
  currency?: string;
}

const PriceBreakdownModal = ({ 
  booking, 
  currency = 'EGP'
}: PriceBreakdownModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const nights = differenceInDays(booking.checkOut, booking.checkIn);
  
  // For monthly bookings, calculate per-month pricing instead of total
  const isMonthly = booking.bookingType === 'monthly';
  const monthlyPrice = booking.property.monthly_price || 0;
  const totalDuration = booking.duration || 1;
  
  // For display: show total calculation, but payment remains monthly
  const totalAmount = isMonthly ? (monthlyPrice * totalDuration) : booking.totalPrice;
  const serviceFee = Math.round(totalAmount * 0.1); // 10% service fee on total
  const taxes = Math.round(totalAmount * 0.05); // 5% taxes on total
  const finalTotal = totalAmount + serviceFee + taxes;

  // But actual payment per month
  const monthlyPayment = isMonthly ? monthlyPrice : booking.totalPrice;
  const monthlyServiceFee = Math.round(monthlyPayment * 0.1);
  const monthlyTaxes = Math.round(monthlyPayment * 0.05);
  const monthlyTotal = monthlyPayment + monthlyServiceFee + monthlyTaxes;

  const unitPrice = booking.bookingType === 'daily' 
    ? booking.property.price_per_night 
    : booking.property.monthly_price || 0;

  const units = booking.bookingType === 'daily' ? nights : totalDuration;
  const unitLabel = booking.bookingType === 'daily' 
    ? (nights === 1 ? 'night' : 'nights')
    : 'month';


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="font-medium">Price breakdown</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">
              {currency} {finalTotal.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              View details
            </div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-4 w-4" />
            Price Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900 mb-1">{booking.property.title}</div>
              <div className="text-gray-600 flex justify-between">
                <span>{format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd')}</span>
                <span>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-3">
            {/* Base Rate */}
            <div className="flex justify-between">
              <div className="text-sm">
                <div>{currency} {unitPrice.toLocaleString()} × {units} {unitLabel}{units > 1 ? 's' : ''}</div>
              </div>
              <div className="text-sm font-medium">
                {currency} {totalAmount.toLocaleString()}
              </div>
            </div>

            {/* Service Fee */}
            <div className="flex justify-between">
              <div className="text-sm text-gray-600">Service fee (10%)</div>
              <div className="text-sm">{currency} {serviceFee.toLocaleString()}</div>
            </div>

            {/* Taxes */}
            <div className="flex justify-between">
              <div className="text-sm text-gray-600">Taxes & fees (5%)</div>
              <div className="text-sm">{currency} {taxes.toLocaleString()}</div>
            </div>

            <Separator />

            {/* Total Amount */}
            <div className="flex justify-between items-center font-bold">
              <span>Total Amount</span>
              <span className="text-lg">{currency} {finalTotal.toLocaleString()}</span>
            </div>

            {/* Monthly Payment Info for Monthly Bookings */}
            {isMonthly && totalDuration > 1 && (
              <>
                <Separator />
                <div className="bg-green-50 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-medium text-green-800">You pay monthly:</div>
                  <div className="space-y-1 text-sm text-green-700">
                    <div className="flex justify-between">
                      <span>Monthly rent:</span>
                      <span>{currency} {monthlyPayment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service fee (10%):</span>
                      <span>{currency} {monthlyServiceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & fees (5%):</span>
                      <span>{currency} {monthlyTaxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-green-200 pt-1">
                      <span>Monthly payment:</span>
                      <span>{currency} {monthlyTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>


          {/* Info Note */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                {isMonthly 
                  ? "Monthly payment processed securely. You'll be charged each month." 
                  : "Prices include all fees. Payment processed securely."}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceBreakdownModal;