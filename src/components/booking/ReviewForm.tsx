import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Star } from 'lucide-react';
import { Booking } from '@/types/booking';
import { logReviewEvent } from '@/utils/reviewEventLogger';

interface ReviewFormProps {
  booking: Booking;
  onCancel: () => void;
  onSuccess: () => void;
}

const ReviewForm = ({ booking, onCancel, onSuccess }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('reviews').insert({
        booking_id: booking.id,
        property_id: booking.property_id,
        guest_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      // Track review event after successful submission
      logReviewEvent(booking.id, booking.property_id, rating);

      toast.success('Review submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <CardTitle className='flex items-center gap-2'>
            <Star className='h-5 w-5 text-yellow-500' />
            Write a Review
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
          <h3 className='font-medium mb-2'>Your Stay</h3>
          <div className='flex gap-4'>
            <div className='aspect-square w-16 h-16 rounded-lg overflow-hidden'>
              <img
                src={booking.property?.images?.[0] || '/placeholder.svg'}
                alt={booking.property?.title}
                className='w-full h-full object-cover'
              />
            </div>
            <div>
              <p className='font-medium'>{booking.property?.title}</p>
              <p className='text-sm text-gray-600'>
                {new Date(booking.check_in).toLocaleDateString()} -{' '}
                {new Date(booking.check_out).toLocaleDateString()}
              </p>
              <p className='text-sm text-gray-600'>
                {booking.guests} guest{booking.guests > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <Label className='text-base font-medium mb-3 block'>
              How was your stay? *
            </Label>
            <div className='flex gap-2'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setRating(star)}
                  className='p-1 hover:scale-110 transition-transform'
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className='text-sm text-gray-600 mt-2'>
                {rating === 1 && 'Terrible'}
                {rating === 2 && 'Poor'}
                {rating === 3 && 'Average'}
                {rating === 4 && 'Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='comment'>Tell us about your experience</Label>
            <Textarea
              id='comment'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='Share details about your stay, what you liked, and any suggestions for improvement...'
              className='mt-2'
              rows={5}
            />
          </div>

          <div className='flex gap-4 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='flex-1'
              disabled={loading || rating === 0}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
