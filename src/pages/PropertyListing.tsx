import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MapPin, Bed, Bath, Users, Star, Calendar, Clock } from 'lucide-react';
import Header from '@/components/Header';
import RefactoredBookingWidget from '@/components/booking/RefactoredBookingWidget';
import PropertyPriceDisplay from '@/components/PropertyPriceDisplay';
import { 
  getRentalType, 
  getDailyPrice, 
  getMonthlyPrice, 
  getRentalTypeBadge,
  getAvailableBookingTypes,
  type PropertyRentalData 
} from '@/lib/rentalTypeUtils';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  monthly_price?: number;
  daily_price?: number;
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
  booking_types?: string[];
  rental_type?: string;
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
  }, []);

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
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="bg-gray-200 h-96 rounded-2xl"></div>
            <div className="space-y-3">
              <div className="bg-gray-200 h-8 w-3/4 rounded"></div>
              <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
            <p className="text-gray-600">The property you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  // Use unified rental type utilities with defensive logic
  const propertyWithDefaults: Property & PropertyRentalData = {
    ...property,
    booking_types: property.booking_types || [],
    rental_type: property.rental_type || undefined,
  };

  const rentalType = getRentalType(propertyWithDefaults);
  const availableBookingTypes = getAvailableBookingTypes(propertyWithDefaults);
  const rentalBadge = getRentalTypeBadge(rentalType);
  const dailyPrice = getDailyPrice(propertyWithDefaults);
  const monthlyPrice = getMonthlyPrice(propertyWithDefaults);

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Hero Image */}
            <div className="mb-6 relative">
              <img
                src={property.images[0] || '/placeholder.svg'}
                alt={property.title}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
              
              {/* Rental Type Badge on Image */}
              <div className="absolute top-4 left-4">
                <Badge className={`${rentalBadge.color} shadow-lg`}>
                  {rentalBadge.label}
                </Badge>
              </div>

              {/* Rating Badge */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-gray-900 border-0 shadow-lg backdrop-blur-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                  4.9
                </Badge>
              </div>
            </div>

            {/* Property Details */}
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

              {/* Property Type and Rental Type Badges */}
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="secondary" className="rounded-full bg-black text-white">
                  {property.property_type}
                </Badge>
                
                {/* Show individual booking type badges for specific rental types */}
                {rentalType === 'daily' && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full">
                    <Calendar className="h-3 w-3 mr-1" />
                    Daily Stays
                  </Badge>
                )}
                {rentalType === 'monthly' && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 rounded-full">
                    <Clock className="h-3 w-3 mr-1" />
                    Monthly Stays
                  </Badge>
                )}
                {rentalType === 'both' && (
                  <>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full">
                      <Calendar className="h-3 w-3 mr-1" />
                      Daily
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 border-green-200 rounded-full">
                      <Clock className="h-3 w-3 mr-1" />
                      Monthly
                    </Badge>
                  </>
                )}
              </div>

              {/* Pricing Display using centralized component */}
              <div className="mb-6">
                <PropertyPriceDisplay property={propertyWithDefaults} />
              </div>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">About this property</h2>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
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

            {/* Booking Requirements - Show only relevant requirements */}
            {(property.min_nights || property.min_months) && (
              <>
                <Separator className="my-6" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Booking Requirements</h2>
                  <div className="space-y-2">
                    {/* Only show daily requirements if property supports daily bookings */}
                    {property.min_nights && (rentalType === 'daily' || rentalType === 'both') && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <p className="text-gray-700">
                          Minimum stay: {property.min_nights} night{property.min_nights > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    {/* Only show monthly requirements if property supports monthly bookings */}
                    {property.min_months && (rentalType === 'monthly' || rentalType === 'both') && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <p className="text-gray-700">
                          Minimum monthly stay: {property.min_months} month{property.min_months > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Booking Widget */}
          <div className="lg:col-span-1">
            <RefactoredBookingWidget 
              property={propertyWithDefaults} 
              user={user}
              onBookingInitiated={(bookingData) => {
                console.log('Booking initiated:', bookingData);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyListing;
