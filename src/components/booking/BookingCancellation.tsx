import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Booking } from '@/types/booking';

interface BookingCancellationProps {
  booking: Booking;
  onCancel: () => void;
  onSuccess: () => void;
}

const BookingCancellation = ({
  booking,
  onCancel,
  onSuccess,
}: BookingCancellationProps) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);

    try {
      // Check if booking can be cancelled
      const { data: canCancel } = await supabase.rpc('can_cancel_booking', {
        booking_id: booking.id,
      });

      if (!canCancel) {
        toast.error('This booking cannot be cancelled');
        return;
      }

      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason.trim(),
          cancelled_at: new Date().toISOString(),
          cancelled_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Booking cancelled successfully');
      onSuccess();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const checkInDate = new Date(booking.check_in);
  const today = new Date();
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-red-500' />
            Cancel Booking
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h3 className='font-medium text-yellow-800 mb-2'>Booking Details</h3>
          <div className='text-sm text-yellow-700 space-y-1'>
            <p>
              <strong>Property:</strong> {booking.property?.title}
            </p>
            <p>
              <strong>Check-in:</strong> {checkInDate.toLocaleDateString()}
            </p>
            <p>
              <strong>Days until check-in:</strong> {daysUntilCheckIn}
            </p>
            <p>
              <strong>Total paid:</strong> ${booking.total_price}
            </p>
          </div>
        </div>

        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h3 className='font-medium text-red-800 mb-2'>Cancellation Policy</h3>
          <div className='text-sm text-red-700 space-y-2'>
            <p>Please review the cancellation terms:</p>
            <ul className='list-disc list-inside space-y-1'>
              <li>
                Cancellations more than 7 days before check-in: Full refund
              </li>
              <li>Cancellations 3-7 days before check-in: 50% refund</li>
              <li>Cancellations less than 3 days before check-in: No refund</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='reason'>Reason for cancellation *</Label>
            <Textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Please provide a reason for cancelling this booking...'
              className='mt-2'
              rows={4}
              required
            />
          </div>

          <div className='flex gap-4 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              className='flex-1'
            >
              Keep Booking
            </Button>
            <Button
              type='submit'
              variant='destructive'
              className='flex-1'
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingCancellation;
