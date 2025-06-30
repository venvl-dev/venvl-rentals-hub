import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MapPin, Bed, Bath, Users } from 'lucide-react';
import Header from '@/components/Header';
import BookingWidget from '@/components/booking/BookingWidget';
import DynamicBookingWidget from '@/components/booking/DynamicBookingWidget';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  monthly_price?: number;
  images: string[];
  city: string;
  state: string;
  country: string;
  address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  booking_types: string[];
  min_nights?: number;
  min_months?: number;
  blocked_dates?: string[];
}

const PropertyListing = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Check for pending booking data after auth
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking && user) {
      const bookingData = JSON.parse(pendingBooking);
      if (bookingData.propertyId === id) {
        // Restore booking state
        localStorage.removeItem('pendingBooking');
        // You could set state here to restore the booking form
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Property not found</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img
                src={property.images[0] || '/placeholder.svg'}
                alt={property.title}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{property.address}, {property.city}, {property.state}, {property.country}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  <span>{property.bedrooms} bedrooms</span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  <span>{property.bathrooms} bathrooms</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Up to {property.max_guests} guests</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="rounded-full">
                  {property.property_type}
                </Badge>
                {property.booking_types?.map(type => (
                  <Badge key={type} variant="outline" className="rounded-full">
                    {type === 'daily' ? 'Daily stays' : 
                     type === 'monthly' ? 'Monthly stays' : 
                     'Flexible stays'}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">About this property</h2>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Booking Requirements */}
            {(property.min_nights || property.min_months) && (
              <>
                <Separator className="my-6" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Booking Requirements</h2>
                  <div className="space-y-2">
                    {property.min_nights && (
                      <p className="text-gray-700">
                        Minimum stay: {property.min_nights} night{property.min_nights > 1 ? 's' : ''}
                      </p>
                    )}
                    {property.min_months && (
                      <p className="text-gray-700">
                        Minimum monthly stay: {property.min_months} month{property.min_months > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-1">
            <DynamicBookingWidget property={property} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyListing;
