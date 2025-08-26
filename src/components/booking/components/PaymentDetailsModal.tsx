import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, CheckCircle, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface PaymentDetailsModalProps {
  booking: {
    id: string;
    booking_reference: string;
    total_price: number;
    booking_type: string;
    status: string;
    created_at: string;
    check_in: string;
    property: {
      title: string;
      price_per_night?: number;
      monthly_price?: number;
    };
  };
  currency?: string;
}

const PaymentDetailsModal = ({ 
  booking, 
  currency = 'EGP'
}: PaymentDetailsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const createdDate = new Date(booking.created_at);
  const checkInDate = new Date(booking.check_in);
  
  // Calculate payment breakdown
  const basePrice = booking.total_price;
  const serviceFee = Math.round(basePrice * 0.1);
  const taxes = Math.round(basePrice * 0.05);
  const totalCharged = basePrice + serviceFee + taxes;
  
  // Payment due date (typically 24 hours before check-in)
  const paymentDueDate = addDays(checkInDate, -1);
  
  const getPaymentStatus = () => {
    switch (booking.status?.toLowerCase()) {
      case 'confirmed':
        return { label: 'Paid', color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'cancelled':
        return { label: 'Refunded', color: 'bg-gray-100 text-gray-800' };
      default:
        return { label: 'Processing', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const paymentStatus = getPaymentStatus();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex-1 border-2 hover:border-gray-300 py-3 rounded-2xl"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Details
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-4 w-4" />
            Payment Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Payment Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Payment Status</span>
              <Badge className={`${paymentStatus.color} border-0`}>
                {paymentStatus.label}
              </Badge>
            </div>
            <div className="text-xs text-gray-600">
              Reference: {booking.booking_reference}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Amount Charged</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base amount</span>
                <span>{currency} {basePrice.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Service fee</span>
                <span>{currency} {serviceFee.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxes & fees</span>
                <span>{currency} {taxes.toLocaleString()}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold">
                <span>Total Charged</span>
                <span className="text-lg">{currency} {totalCharged.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="space-y-3">
            <h4 className="font-medium">Payment Timeline</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-sm">
                  <div className="font-medium">Payment Processed</div>
                  <div className="text-gray-600 text-xs">
                    {format(createdDate, 'MMM dd, yyyy - h:mm a')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm">
                  <div className="font-medium">
                    {booking.status === 'confirmed' ? 'Due Date (Met)' : 'Payment Due'}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {format(paymentDueDate, 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="text-sm">
                  <div className="font-medium">Check-in Date</div>
                  <div className="text-gray-600 text-xs">
                    {format(checkInDate, 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <div className="font-medium mb-1">Payment Method</div>
                <div>Card payment processed securely. Receipt sent to your email.</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'confirmed' && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // Handle receipt download or email
                  console.log('Download receipt');
                }}
              >
                Download Receipt
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsModal;