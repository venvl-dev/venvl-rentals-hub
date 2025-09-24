import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Star, AlertCircle } from 'lucide-react';
import { Booking } from '@/types/booking';
import { Review } from '@/types/review';
import BookingCancellation from '@/components/booking/BookingCancellation';
import ReviewForm from '@/components/booking/ReviewForm';

const GuestBookings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate('/auth');
      return;
    }

    setUser(user);
    await Promise.all([fetchBookings(user.id), fetchReviews(user.id)]);
    setLoading(false);
  };

  const fetchBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          property:properties(title, images, city, state)
        `,
        )
        .eq('guest_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const fetchReviews = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          *,
          property:properties(title, images)
        `,
        )
        .eq('guest_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancellation(true);
  };

  const handleWriteReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewForm(true);
  };

  const onBookingCancelled = () => {
    if (user) {
      fetchBookings(user.id);
    }
    setShowCancellation(false);
    setSelectedBooking(null);
  };

  const onReviewSubmitted = () => {
    if (user) {
      fetchReviews(user.id);
    }
    setShowReviewForm(false);
    setSelectedBooking(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancel = (booking: Booking) => {
    const checkInDate = new Date(booking.check_in);
    const today = new Date();
    return (
      ['pending', 'confirmed'].includes(booking.status) && checkInDate > today
    );
  };

  const canReview = (booking: Booking) => {
    return (
      booking.status === 'completed' &&
      !reviews.some((r) => r.booking_id === booking.id)
    );
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>Loading your bookings...</div>
        </div>
      </div>
    );
  }

  if (showCancellation && selectedBooking) {
    return (
      <div>
        <Header />
        <div className='container mx-auto px-4 py-8'>
          <BookingCancellation
            booking={selectedBooking}
            onCancel={() => {
              setShowCancellation(false);
              setSelectedBooking(null);
            }}
            onSuccess={onBookingCancelled}
          />
        </div>
      </div>
    );
  }

  if (showReviewForm && selectedBooking) {
    return (
      <div>
        <Header />
        <div className='container mx-auto px-4 py-8'>
          <ReviewForm
            booking={selectedBooking}
            onCancel={() => {
              setShowReviewForm(false);
              setSelectedBooking(null);
            }}
            onSuccess={onReviewSubmitted}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-2'>
              <Calendar className='h-8 w-8' />
              My Bookings
            </h1>
            <p className='text-gray-600 mt-2'>
              Manage your reservations and reviews
            </p>
          </div>
        </div>

        <Tabs defaultValue='bookings' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='bookings' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value='reviews' className='flex items-center gap-2'>
              <Star className='h-4 w-4' />
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='bookings' className='space-y-6'>
            {bookings.length === 0 ? (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <Calendar className='h-16 w-16 text-gray-400 mb-4' />
                  <h3 className='text-xl font-semibold mb-2'>
                    No bookings yet
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Start exploring properties to make your first booking
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Explore Properties
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-4'>
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className='p-6'>
                      <div className='flex items-start justify-between'>
                        <div className='flex gap-4'>
                          <div className='aspect-square w-24 h-24 rounded-lg overflow-hidden'>
                            <img
                              src={
                                booking.property?.images?.[0] ||
                                '/placeholder.svg'
                              }
                              alt={booking.property?.title}
                              className='w-full h-full object-cover'
                            />
                          </div>

                          <div className='flex-1'>
                            <h3 className='font-semibold text-lg mb-2'>
                              {booking.property?.title}
                            </h3>

                            <div className='flex items-center gap-4 text-sm text-gray-600 mb-3'>
                              <div className='flex items-center gap-1'>
                                <MapPin className='h-4 w-4' />
                                {booking.property?.city},{' '}
                                {booking.property?.state}
                              </div>
                              <div className='flex items-center gap-1'>
                                <Users className='h-4 w-4' />
                                {booking.guests} guest
                                {booking.guests > 1 ? 's' : ''}
                              </div>
                              <div className='flex items-center gap-1'>
                                <Calendar className='h-4 w-4' />
                                {new Date(
                                  booking.check_in,
                                ).toLocaleDateString()}{' '}
                                -{' '}
                                {new Date(
                                  booking.check_out,
                                ).toLocaleDateString()}
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <Badge
                                className={`${getStatusColor(booking.status)} border-0`}
                              >
                                {booking.status}
                              </Badge>
                              <span className='font-medium text-lg'>
                                ${booking.total_price}
                              </span>
                            </div>

                            {booking.cancellation_reason && (
                              <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                                <div className='flex items-center gap-2 text-red-800'>
                                  <AlertCircle className='h-4 w-4' />
                                  <span className='font-medium'>
                                    Cancellation reason:
                                  </span>
                                </div>
                                <p className='text-red-700 mt-1'>
                                  {booking.cancellation_reason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className='flex flex-col gap-2'>
                          {canCancel(booking) && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleCancelBooking(booking)}
                              className='text-red-600 hover:text-red-700'
                            >
                              Cancel Booking
                            </Button>
                          )}

                          {canReview(booking) && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleWriteReview(booking)}
                            >
                              Write Review
                            </Button>
                          )}

                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              navigate(`/property/${booking.property_id}`)
                            }
                          >
                            View Property
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='reviews' className='space-y-6'>
            {reviews.length === 0 ? (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <Star className='h-16 w-16 text-gray-400 mb-4' />
                  <h3 className='text-xl font-semibold mb-2'>No reviews yet</h3>
                  <p className='text-gray-600'>
                    Complete your stays to leave reviews
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-4'>
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className='p-6'>
                      <div className='flex gap-4'>
                        <div className='aspect-square w-16 h-16 rounded-lg overflow-hidden'>
                          <img
                            src={
                              review.property?.images?.[0] || '/placeholder.svg'
                            }
                            alt={review.property?.title}
                            className='w-full h-full object-cover'
                          />
                        </div>

                        <div className='flex-1'>
                          <h3 className='font-semibold text-lg mb-2'>
                            {review.property?.title}
                          </h3>

                          <div className='flex items-center gap-2 mb-3'>
                            <div className='flex'>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className='text-sm text-gray-600'>
                              {new Date(
                                review.created_at || '',
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          {review.comment && (
                            <p className='text-gray-700'>{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GuestBookings;
