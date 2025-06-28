
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Bed, Bath, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    price_per_night: number;
    monthly_price?: number;
    images: string[];
    city: string;
    state: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
    booking_types?: string[];
    min_nights?: number;
    min_months?: number;
  };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/property/${property.id}`);
  };

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'daily': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monthly': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'flexible':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const bookingTypes = property.booking_types || ['daily'];
  const hasMultipleTypes = bookingTypes.length > 1;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card 
        className="cursor-pointer overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
        onClick={handleClick}
      >
        <div className="aspect-square relative overflow-hidden">
          <motion.img
            src={property.images[0] || '/placeholder.svg'}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300"
            whileHover={{ scale: 1.1 }}
          />
          
          {/* Booking Type Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {bookingTypes.map((type) => (
              <Badge
                key={type}
                className={`text-xs px-2 py-1 rounded-full font-medium ${getBookingTypeColor(type)}`}
              >
                {type === 'daily' ? 'Daily' : type === 'monthly' ? 'Monthly' : 'Flexible'}
              </Badge>
            ))}
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-white/90 text-gray-900 border-0 shadow-lg">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              4.9
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Location */}
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{property.city}, {property.state}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">
              {property.title}
            </h3>
            
            {/* Property Details */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                <span>{property.bathrooms}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{property.max_guests}</span>
              </div>
              <Badge variant="outline" className="text-xs rounded-full">
                {property.property_type}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {property.description}
            </p>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ${property.price_per_night}
                  </span>
                  <span className="text-gray-600 text-sm">/ night</span>
                </div>
                
                {hasMultipleTypes && property.monthly_price && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-700">
                      ${property.monthly_price}
                    </div>
                    <div className="text-xs text-gray-500">/ month</div>
                  </div>
                )}
              </div>

              {/* Minimum Stay Info */}
              {(property.min_nights || property.min_months) && (
                <div className="text-xs text-gray-500 space-y-1">
                  {property.min_nights && (
                    <div>Min. stay: {property.min_nights} night{property.min_nights > 1 ? 's' : ''}</div>
                  )}
                  {property.min_months && (
                    <div>Min. monthly: {property.min_months} month{property.min_months > 1 ? 's' : ''}</div>
                  )}
                </div>
              )}
            </div>

            {/* Book Now Button */}
            <motion.button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-2xl transition-colors duration-200 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Book Now
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PropertyCard;
