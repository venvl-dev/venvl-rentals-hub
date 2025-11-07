/**
 * PaymentCallback Component
 * Handles the redirect back from PayTabs after payment attempt
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { payTabsService } from '@/services/paytabs.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get transaction reference from URL parameters
        const tranRef = searchParams.get('tranRef');
        const respStatus = searchParams.get('respStatus');
        const respMessage = searchParams.get('respMessage');

        if (!tranRef) {
          throw new Error('No transaction reference found');
        }

        // Get pending booking from session storage
        const pendingBookingStr = sessionStorage.getItem('pendingBooking');
        if (!pendingBookingStr) {
          throw new Error('No pending booking found');
        }

        const pendingBooking = JSON.parse(pendingBookingStr);

        // Verify payment with backend
        setMessage('Confirming payment status...');
        const verificationResult = await payTabsService.verifyPayment({
          transactionRef: tranRef,
        });

        if (verificationResult.success && verificationResult.paymentStatus === 'paid') {
          // Payment successful - create booking
          setMessage('Creating your booking...');

          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
              property_id: pendingBooking.property.id,
              guest_id: (await supabase.auth.getUser()).data.user?.id,
              check_in: pendingBooking.checkIn,
              check_out: pendingBooking.checkOut,
              guests: pendingBooking.guests,
              total_price: pendingBooking.finalTotal,
              status: 'confirmed',
              payment_status: 'paid',
              payment_amount: pendingBooking.finalTotal,
              currency: 'EGP',
              payment_method: 'card',
              booking_type: pendingBooking.bookingType,
              duration_months: pendingBooking.duration,
              promo_code_id: pendingBooking.promo_code_id,
              payment_transaction_ref: tranRef,
            })
            .select()
            .single();

          if (bookingError) {
            console.error('Booking creation error:', bookingError);
            throw new Error('Failed to create booking');
          }

          // Clear session storage
          sessionStorage.removeItem('pendingBooking');

          // Show success
          setStatus('success');
          setMessage('Payment successful! Redirecting to confirmation...');
          toast.success('Booking confirmed!');

          // Redirect to booking confirmation
          setTimeout(() => {
            navigate(`/booking-confirmation/${booking.id}`);
          }, 2000);
        } else {
          // Payment failed
          throw new Error(
            verificationResult.message ||
              respMessage ||
              'Payment verification failed'
          );
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(
          error instanceof Error ? error.message : 'Payment verification failed'
        );
        toast.error('Payment failed');

        // Redirect to payment failed page after delay
        setTimeout(() => {
          navigate('/payment-failed');
        }, 3000);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full'
      >
        <div className='text-center space-y-6'>
          {/* Status Icon */}
          <div className='flex justify-center'>
            {status === 'verifying' && (
              <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center'>
                <Loader2 className='w-10 h-10 text-blue-600 animate-spin' />
              </div>
            )}
            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center'
              >
                <CheckCircle2 className='w-10 h-10 text-green-600' />
              </motion.div>
            )}
            {status === 'failed' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'
              >
                <XCircle className='w-10 h-10 text-red-600' />
              </motion.div>
            )}
          </div>

          {/* Status Message */}
          <div className='space-y-2'>
            <h1 className='text-2xl font-bold text-gray-900'>
              {status === 'verifying' && 'Processing Payment'}
              {status === 'success' && 'Payment Successful!'}
              {status === 'failed' && 'Payment Failed'}
            </h1>
            <p className='text-gray-600'>{message}</p>
          </div>

          {/* Loading Progress */}
          {status === 'verifying' && (
            <div className='space-y-2'>
              <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                <motion.div
                  className='h-full bg-blue-600'
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className='text-sm text-gray-500'>Please wait...</p>
            </div>
          )}

          {/* Additional Info */}
          {status === 'failed' && (
            <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
              <p className='text-sm text-red-800'>
                Don't worry, your card was not charged. Please try again or contact
                support if the issue persists.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
