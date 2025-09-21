
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Calendar, MapPin, Users, Download, Share2, MessageCircle, CreditCard, X } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface BookingConfirmationProps {
  booking: {
    id: string;
    booking_reference: string;
    property: {
      id: string;
      title: string;
      images: string[];
      city: string;
      state: string;
      address: string;
    };
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    booking_type: string;
    status: string;
    created_at: string;
  };
}

const BookingConfirmation = ({ booking }: BookingConfirmationProps) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showReceiptPopup, setShowReceiptPopup] = useState(false);

  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = differenceInDays(checkOut, checkIn);

  useEffect(() => {
    // Auto-show details after animation
    const timer = setTimeout(() => setShowDetails(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadReceipt = () => {
    // Simulate receipt download
    const receiptData = `
VENVL Booking Confirmation
Reference: ${booking.booking_reference}
Property: ${booking.property.title}
Check-in: ${format(checkIn, 'MMM dd, yyyy')}
Check-out: ${format(checkOut, 'MMM dd, yyyy')}
Guests: ${booking.guests}
Total: EGP ${booking.total_price}
Status: ${booking.status}
    `;

    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VENVL-${booking.booking_reference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReceiptWithPopup = () => {
    setShowReceiptPopup(true);
  };

  const confirmDownload = () => {
    handleDownloadReceipt();
    setShowReceiptPopup(false);
  };


  return (
    <div className="max-w-3xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Success Animation */}
        <motion.div
          className="text-center space-y-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full"
            initial={{ rotate: -180 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Check className="h-10 w-10 text-green-600" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Booking confirmed!</h1>
            <p className="text-gray-600">Your reservation has been successfully processed</p>
            <Badge className="bg-black text-white text-sm px-4 py-2">
              Reference: {booking.booking_reference}
            </Badge>
          </div>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="rounded-3xl shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your booking details</h2>
                  <p className="text-sm text-gray-600 mt-1">Everything you need for your stay</p>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Property Overview */}
              <div className="flex gap-4">
                <img
                  src={booking.property.images[0] || '/placeholder.svg'}
                  alt={booking.property.title}
                  className="w-24 h-24 rounded-2xl object-cover shadow-md"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">{booking.property.title}</h3>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{booking.property.city}, {booking.property.state}</span>
                  </div>
                  <Badge variant="outline" className="border-gray-300">
                    {booking.booking_type === 'daily' ? 'Daily stay' : 'Monthly stay'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Trip Information */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: showDetails ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Check-in</span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{format(checkIn, 'MMM dd')}</div>
                    <div className="text-sm text-gray-600">{format(checkIn, 'EEEE, yyyy')}</div>
                    <div className="text-sm text-gray-500">After 3:00 PM</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Check-out</span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{format(checkOut, 'MMM dd')}</div>
                    <div className="text-sm text-gray-600">{format(checkOut, 'EEEE, yyyy')}</div>
                    <div className="text-sm text-gray-500">Before 11:00 AM</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Guests</span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{booking.guests}</div>
                    <div className="text-sm text-gray-600">
                      {booking.guests === 1 ? 'guest' : 'guests'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {nights} {nights === 1 ? 'night' : 'nights'}
                    </div>
                  </div>
                </div>
              </motion.div>

              <Separator />

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-900">Payment summary</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total paid</span>
                  <span className="font-bold text-lg">EGP {booking.total_price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {booking.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={() => setShowPaymentDetails(true)}
            variant="outline"
            className="w-full border-2 hover:border-gray-300 py-3 rounded-2xl"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Payment details
          </Button>

          <Button
            onClick={handleDownloadReceiptWithPopup}
            variant="outline"
            className="w-full border-2 hover:border-gray-300 py-3 rounded-2xl"
          >
            <Download className="h-4 w-4 mr-2" />
            Download receipt
          </Button>

          <Button
            onClick={() => navigator.share?.({
              title: 'VENVL Booking',
              text: `My booking confirmation: ${booking.booking_reference}`,
              url: window.location.href
            })}
            variant="outline"
            className="w-full border-2 hover:border-gray-300 py-3 rounded-2xl"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share booking
          </Button>

          <Button
            onClick={() => navigate('/guest/bookings')}
            className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white py-3 rounded-2xl"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            View all bookings
          </Button>
        </motion.div>

        {/* Important Information */}
        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <h4 className="font-semibold text-blue-900 mb-3">Important information</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Check-in instructions will be sent 24 hours before arrival</li>
            <li>• Please bring a valid ID for verification</li>
            <li>• Contact the host directly for any special requests</li>
            <li>• Free cancellation until 24 hours before check-in</li>
          </ul>
        </motion.div>
      </motion.div>

      {/* Payment Details Popup */}
      {showPaymentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                <Button
                  onClick={() => setShowPaymentDetails(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Payment Details Content */}
              <div className="space-y-4">
                {/* Payment Status */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Status</h4>
                  <div className="text-center">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-sm px-3 py-1">
                      Pending
                    </Badge>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm text-gray-600">Reference:</div>
                    <div className="font-mono font-medium text-gray-900">VNV-20250921-4048</div>
                  </div>
                </div>

                {/* Amount Charged */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Amount Charged</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base amount</span>
                      <span className="text-gray-900">EGP 320</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service fee</span>
                      <span className="text-gray-900">EGP 32</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes & fees</span>
                      <span className="text-gray-900">EGP 16</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Charged</span>
                      <span>EGP 368</span>
                    </div>
                  </div>
                </div>

                {/* Payment Timeline */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Timeline</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-gray-900">Payment Processed</div>
                      <div className="text-sm text-gray-600">Sep 21, 2025 - 8:00 PM</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Payment Due</div>
                      <div className="text-sm text-gray-600">Sep 20, 2025</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Check-in Date</div>
                      <div className="text-sm text-gray-600">Sep 21, 2025</div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Method</h4>
                  <div className="text-sm text-gray-600">
                    Card payment processed securely. Receipt sent to your email.
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowPaymentDetails(false)}
                className="w-full mt-6 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white py-3 rounded-2xl"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Receipt Download Popup */}
      {showReceiptPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Download Receipt</h3>
                <Button
                  onClick={() => setShowReceiptPopup(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Download Icon */}
              <div className="text-center mb-6">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Download className="h-8 w-8 text-blue-600" />
                </motion.div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to download your receipt?</h4>
                <p className="text-gray-600 text-sm">Your booking receipt will be downloaded as a text file with all the booking details.</p>
              </div>

              {/* Receipt Preview */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h5 className="font-semibold text-gray-900 mb-3">Receipt includes:</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Booking reference: {booking.booking_reference}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Property details and location
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Check-in and check-out dates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Total amount paid: EGP {booking.total_price}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Booking status and guest count
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowReceiptPopup(false)}
                  variant="outline"
                  className="flex-1 border-2 hover:border-gray-300 py-3 rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDownload}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-2xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BookingConfirmation;
