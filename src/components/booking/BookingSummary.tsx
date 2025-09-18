
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CalendarIcon, Users, CreditCard, MapPin, Clock, Check } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import PriceBreakdownModal from './components/PriceBreakdownModal';

interface BookingSummaryProps {
  booking: {
    property: {
      id: string;
      title: string;
      images: string[];
      city: string;
      state: string;
      price_per_night: number;
      monthly_price?: number;
    };
    checkIn: Date;
    checkOut: Date;
    guests: number;
    bookingType: 'daily' | 'monthly';
    totalPrice: number;
    duration?: number;
  };
  onConfirmPayment: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const BookingSummary = ({ booking, onConfirmPayment, onCancel, isProcessing = false }: BookingSummaryProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  
  const nights = differenceInDays(booking.checkOut, booking.checkIn);
  
  // For monthly bookings, use monthly price instead of total
  const basePrice = booking.bookingType === 'monthly' 
    ? booking.property.monthly_price || 0 
    : booking.totalPrice;
    
  const serviceFee = Math.round(basePrice * 0.1); // 10% service fee
  const taxes = Math.round(basePrice * 0.05); // 5% taxes
  const finalTotal = basePrice + serviceFee + taxes;


  const handlePayment = async () => {
    try {
      if (paymentMethod === 'card') {
        // Simulate Stripe payment flow
        toast.success('Payment processed successfully!');
        onConfirmPayment();
      } else {
        // Cash payment - just confirm booking
        onConfirmPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

//   const handlePayment = async () => {
//   try {
//     if (paymentMethod === 'card') {
//       // 🎯 STRIPE INTEGRATION GOES HERE
//       const { sessionId } = await createStripeCheckoutSession({
//         amount: finalTotal,
//         bookingData: booking,
//         customerId: user.id
//       });
      
//       // Redirect to Stripe Checkout
//       const stripe = await stripePromise;
//       await stripe.redirectToCheckout({ sessionId });
      
//     } else {
//       // Cash payment - create booking with 'pending' payment status
//       onConfirmPayment();
//     }
//   } catch (error) {
//     console.error('Payment error:', error);
//     toast.error('Payment failed. Please try again.');
//   }
// };
  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Confirm and pay</h1>
          <p className="text-gray-600">Review your booking details before payment</p>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-6">
          {/* Booking Details */}
          <Card className="rounded-3xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                Your trip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Info */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <img
                    src={booking.property.images[0] || '/placeholder.svg'}
                    alt={booking.property.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-4 ">
                    <h3 className="font-semibold text-lg">{booking.property.title}</h3>
                    <div className="flex justify-between items-center text-gray-600 text-sm">
                      <MapPin className="h-1 w-1 mr-1" />
                      {booking.property.city}, {booking.property.state}
                    </div>
                    <Badge className="mt-2 bg-black text-white">
                      {booking.bookingType === 'daily' ? 'Daily stay' : 'Monthly stay'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Trip Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Dates</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {booking.bookingType === 'daily' 
                        ? `${nights} ${nights === 1 ? 'night' : 'nights'}`
                        : `${booking.duration} ${booking.duration === 1 ? 'month' : 'months'}`
                      }
                    </div>
                  </div>
                </div>

                {/* Total Amount Information for Monthly Bookings */}
                {booking.bookingType === 'monthly' && booking.duration && booking.duration > 1 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="text-sm text-amber-800">
                      <div className="font-medium mb-1">Payment Information:</div>
                      <div>• Monthly payment: EGP {finalTotal.toLocaleString()}</div>
                      <div>• Total over {booking.duration} months: <span className="font-semibold">EGP {(finalTotal * booking.duration).toLocaleString()}</span></div>
                      <div className="text-xs mt-1">You will be charged monthly, not upfront</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Guests</span>
                  </div>
                  <span className="font-medium">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="rounded-3xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Payment details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Payment method</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      paymentMethod === 'card'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <CreditCard className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                      <div className="font-semibold text-sm">Card</div>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      paymentMethod === 'cash'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                      <div className="font-semibold text-sm">Cash</div>
                    </div>
                  </motion.button>
                </div>
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold">Payment summary</h4>
                <PriceBreakdownModal 
                  booking={{
                    ...booking,
                    totalPrice: basePrice,
                    guests: booking.guests
                  }} 
                  currency="EGP"
                />
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      {paymentMethod === 'card' ? 'Pay now' : 'Confirm booking'}
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full border-2 hover:border-gray-300 py-3 rounded-2xl"
                >
                  Cancel
                </Button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    You'll pay in cash when you arrive. Your booking will be confirmed after the host accepts your request.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingSummary;
