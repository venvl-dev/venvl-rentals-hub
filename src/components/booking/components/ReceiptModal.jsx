import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  Calendar,
  MapPin,
  Users,
  Check,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const ReceiptModal = ({ booking, currency = 'EGP' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = differenceInDays(checkOut, checkIn);
  const createdDate = new Date(booking.created_at);

  const handleDownloadReceipt = () => {
    const receiptData = `
VENVL BOOKING RECEIPT
====================

Booking Reference: ${booking.booking_reference}
Date: ${format(createdDate, 'MMM dd, yyyy - h:mm a')}

PROPERTY DETAILS
Property: ${booking.property.title}
Location: ${booking.property.city}, ${booking.property.state}
Address: ${booking.property.address}

BOOKING DETAILS
Check-in: ${format(checkIn, 'MMM dd, yyyy')} (After 3:00 PM)
Check-out: ${format(checkOut, 'MMM dd, yyyy')} (Before 11:00 AM)
Duration: ${nights} ${nights === 1 ? 'night' : 'nights'}
Guests: ${booking.guests}
Booking Type: ${booking.booking_type === 'daily' ? 'Daily stay' : 'Monthly stay'}

PAYMENT SUMMARY
Total Amount: ${currency} ${Math.round(booking.total_price)}
Status: ${booking.status}

IMPORTANT INFORMATION
• Check-in instructions will be sent 24 hours before arrival
• Please bring a valid ID for verification
• Contact the host directly for any special requests
• Free cancellation until 24 hours before check-in

Thank you for choosing VENVL!
For support, contact us at support@venvl.com
    `;

    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VENVL-Receipt-${booking.booking_reference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close modal after download
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='flex-1 border-2 hover:border-gray-300 py-3 rounded-2xl'
        >
          <Download className='h-4 w-4 mr-2' />
          Download receipt
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-md max-h-[80vh] overflow-y-auto'>
        <DialogHeader className='pb-4'>
          <DialogTitle className='flex items-center gap-2 text-lg'>
            <FileText className='h-4 w-4' />
            Booking Receipt
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Header with Status */}
          <div className='text-center space-y-2'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full'>
              <Check className='h-6 w-6 text-green-600' />
            </div>
            <div>
              <h3 className='font-bold text-lg'>VENVL Receipt</h3>
              <Badge className='bg-black text-white text-sm px-3 py-1'>
                {booking.booking_reference}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Property Details */}
          <div className='space-y-3'>
            <h4 className='font-medium text-gray-900'>Property Details</h4>
            <div className='bg-gray-50 rounded-lg p-3 space-y-2'>
              <div className='font-medium'>{booking.property.title}</div>
              <div className='flex items-center text-sm text-gray-600'>
                <MapPin className='h-3 w-3 mr-1' />
                {booking.property.city}, {booking.property.state}
              </div>
              <div className='text-xs text-gray-500'>
                {booking.property.address}
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className='space-y-3'>
            <h4 className='font-medium text-gray-900'>Booking Details</h4>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div className='space-y-1'>
                <div className='flex items-center text-gray-600'>
                  <Calendar className='h-3 w-3 mr-1' />
                  Check-in
                </div>
                <div className='font-medium'>
                  {format(checkIn, 'MMM dd, yyyy')}
                </div>
                <div className='text-xs text-gray-500'>After 3:00 PM</div>
              </div>
              <div className='space-y-1'>
                <div className='flex items-center text-gray-600'>
                  <Calendar className='h-3 w-3 mr-1' />
                  Check-out
                </div>
                <div className='font-medium'>
                  {format(checkOut, 'MMM dd, yyyy')}
                </div>
                <div className='text-xs text-gray-500'>Before 11:00 AM</div>
              </div>
              <div className='space-y-1'>
                <div className='flex items-center text-gray-600'>
                  <Users className='h-3 w-3 mr-1' />
                  Guests
                </div>
                <div className='font-medium'>{booking.guests}</div>
              </div>
              <div className='space-y-1'>
                <div className='text-gray-600'>Duration</div>
                <div className='font-medium'>
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </div>
              </div>
            </div>
            <Badge variant='outline' className='border-gray-300'>
              {booking.booking_type === 'daily' ? 'Daily stay' : 'Monthly stay'}
            </Badge>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className='space-y-3'>
            <h4 className='font-medium text-gray-900'>Payment Summary</h4>
            <div className='bg-gray-50 rounded-lg p-3 space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Total Amount</span>
                <span className='font-bold text-lg'>
                  {currency} {Math.round(booking.total_price)}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Payment Status</span>
                <Badge className='bg-green-100 text-green-800 border-green-200'>
                  {booking.status}
                </Badge>
              </div>
              <div className='text-xs text-gray-500'>
                Processed on {format(createdDate, 'MMM dd, yyyy - h:mm a')}
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
            <h4 className='font-medium text-blue-900 mb-2 text-sm'>
              Important Information
            </h4>
            <ul className='space-y-1 text-xs text-blue-800'>
              <li>
                • Check-in instructions will be sent 24 hours before arrival
              </li>
              <li>• Please bring a valid ID for verification</li>
              <li>• Contact the host directly for any special requests</li>
              <li>• Free cancellation until 24 hours before check-in</li>
            </ul>
          </div>

          {/* Download Button */}
          <div className='pt-2'>
            <Button
              onClick={handleDownloadReceipt}
              className='w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white rounded-2xl'
            >
              <Download className='h-4 w-4 mr-2' />
              Download Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;
