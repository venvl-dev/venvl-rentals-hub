/**
 * TestIdUpload Component
 * Development page to test the ID upload flow without going through payment
 *
 * Usage: Navigate to /test-id-upload in your browser
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, TestTube } from 'lucide-react';

export default function TestIdUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [propertyTitle, setPropertyTitle] = useState('Test Property');

  const createTestBooking = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error('Please login first');
        navigate('/auth');
        return;
      }

      // Get a property ID (use first property or create test data)
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .limit(1)
        .single();

      if (propError || !properties) {
        toast.error('No properties found. Please create a property first.');
        return;
      }

      // Create test booking
      const totalGuests = adults + children;
      const checkIn = new Date();
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 3); // 3 days from now

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          property_id: properties.id,
          guest_id: user.id,
          check_in: checkIn.toISOString().split('T')[0],
          check_out: checkOut.toISOString().split('T')[0],
          guests: totalGuests,
          adults: adults,
          children: children,
          total_price: 1000,
          status: 'confirmed',
          payment_status: 'paid',
          payment_amount: 1000,
          currency: 'EGP',
          payment_method: 'test',
          booking_type: 'daily',
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating test booking:', bookingError);
        toast.error(`Failed to create test booking: ${bookingError.message}`);

        // Show detailed error for debugging
        console.error('Full error details:', {
          message: bookingError.message,
          details: bookingError.details,
          hint: bookingError.hint,
          code: bookingError.code
        });
        return;
      }

      toast.success('Test booking created!');

      // Redirect to ID upload page
      setTimeout(() => {
        navigate(`/upload-guest-ids/${booking.id}`);
      }, 500);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4'>
      <div className='max-w-2xl mx-auto'>
        <Card className='shadow-2xl border-2 border-purple-200'>
          <CardHeader className='bg-gradient-to-r from-purple-100 to-blue-100'>
            <CardTitle className='flex items-center gap-3 text-2xl'>
              <TestTube className='w-8 h-8 text-purple-600' />
              Test ID Upload Page
            </CardTitle>
            <p className='text-sm text-gray-600 mt-2'>
              Development tool to test the ID upload flow without payment
            </p>
          </CardHeader>

          <CardContent className='pt-6 space-y-6'>
            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
              <p className='text-sm text-amber-800'>
                <strong>⚠️ Development Only:</strong> This page creates a test booking
                and redirects you to the ID upload page. Use this to test the UI
                without going through the payment flow.
              </p>
            </div>

            <div className='space-y-4'>
              <div>
                <Label htmlFor='adults'>Number of Adults</Label>
                <Input
                  id='adults'
                  type='number'
                  min='1'
                  max='10'
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                  className='mt-2'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  This determines how many ID uploads will be required
                </p>
              </div>

              <div>
                <Label htmlFor='children'>Number of Children</Label>
                <Input
                  id='children'
                  type='number'
                  min='0'
                  max='10'
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                  className='mt-2'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Children don't need ID uploads
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-semibold mb-2'>Test Booking Summary:</h3>
                <ul className='text-sm space-y-1 text-gray-700'>
                  <li>• Total Guests: <strong>{adults + children}</strong></li>
                  <li>• Adults: <strong>{adults}</strong> (will need {adults} ID upload{adults > 1 ? 's' : ''})</li>
                  <li>• Children: <strong>{children}</strong> (no IDs needed)</li>
                  <li>• Check-in: <strong>Today</strong></li>
                  <li>• Check-out: <strong>3 days from now</strong></li>
                </ul>
              </div>
            </div>

            <Button
              onClick={createTestBooking}
              disabled={loading}
              className='w-full py-6 text-lg'
              size='lg'
            >
              {loading ? (
                <div className='flex items-center gap-2'>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Creating Test Booking...
                </div>
              ) : (
                'Create Test Booking & Go to ID Upload Page'
              )}
            </Button>

            <div className='border-t pt-4'>
              <h3 className='font-semibold mb-2 text-sm'>What happens next:</h3>
              <ol className='text-xs space-y-2 text-gray-600 list-decimal list-inside'>
                <li>Creates a test booking in the database with your specified guest counts</li>
                <li>Redirects you to <code className='bg-gray-100 px-1 rounded'>/upload-guest-ids/:bookingId</code></li>
                <li>You can test uploading IDs without going through payment</li>
                <li>Files will be saved to Supabase Storage (for real!)</li>
              </ol>
            </div>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <p className='text-sm text-blue-800'>
                <strong>💡 Tip:</strong> After testing, you can delete test bookings
                from the Supabase dashboard or your bookings page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
