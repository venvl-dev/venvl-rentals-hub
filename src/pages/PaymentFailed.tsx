/**
 * PaymentFailed Component
 * Displayed when payment fails or is cancelled
 */

import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get error details from URL if available
  const errorMessage = searchParams.get('message') || 'Payment was not completed';
  const errorCode = searchParams.get('code');

  const handleRetry = () => {
    // Try to get pending booking to retry
    const pendingBookingStr = sessionStorage.getItem('pendingBooking');
    if (pendingBookingStr) {
      const pendingBooking = JSON.parse(pendingBookingStr);
      // Navigate back to property page
      navigate(`/property/${pendingBooking.property.id}`);
    } else {
      // Go to homepage
      navigate('/');
    }
  };

  const handleGoHome = () => {
    sessionStorage.removeItem('pendingBooking');
    navigate('/');
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='max-w-2xl w-full'
      >
        <Card className='rounded-3xl shadow-2xl p-8 sm:p-12'>
          <div className='text-center space-y-6'>
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className='flex justify-center'
            >
              <div className='w-24 h-24 bg-red-100 rounded-full flex items-center justify-center'>
                <XCircle className='w-12 h-12 text-red-600' />
              </div>
            </motion.div>

            {/* Title */}
            <div className='space-y-2'>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>
                Payment Failed
              </h1>
              <p className='text-lg text-gray-600'>{errorMessage}</p>
              {errorCode && (
                <p className='text-sm text-gray-500'>Error code: {errorCode}</p>
              )}
            </div>

            {/* Error Details */}
            <div className='bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4'>
              <div className='flex items-start gap-3'>
                <HelpCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div className='text-left space-y-2'>
                  <h3 className='font-semibold text-red-900'>
                    What happened?
                  </h3>
                  <p className='text-sm text-red-800'>
                    Your payment could not be processed. This might happen for
                    several reasons:
                  </p>
                  <ul className='text-sm text-red-800 space-y-1 list-disc list-inside'>
                    <li>Insufficient funds in your account</li>
                    <li>Card details were entered incorrectly</li>
                    <li>Your bank declined the transaction</li>
                    <li>Payment was cancelled</li>
                    <li>Network connection issue</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reassurance Message */}
            <div className='bg-blue-50 border border-blue-200 rounded-2xl p-4'>
              <p className='text-sm text-blue-800'>
                <strong>Don't worry!</strong> Your card was not charged, and no
                booking was created. You can try again or choose a different payment
                method.
              </p>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3 pt-4'>
              <Button
                onClick={handleRetry}
                className='w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-semibold py-4 text-base rounded-2xl shadow-lg'
              >
                <RefreshCw className='w-5 h-5 mr-2' />
                Try Again
              </Button>

              <Button
                onClick={handleGoHome}
                variant='outline'
                className='w-full border-2 hover:border-gray-300 py-4 text-base rounded-2xl'
              >
                <ArrowLeft className='w-5 h-5 mr-2' />
                Go to Homepage
              </Button>
            </div>

            {/* Support Link */}
            <div className='pt-4 border-t'>
              <p className='text-sm text-gray-600'>
                Need help?{' '}
                <a
                  href='mailto:support@venvl.com'
                  className='text-blue-600 hover:text-blue-700 font-medium underline'
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
