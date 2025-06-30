
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Bed, Bath, Users, Calendar, Clock } from 'lucide-react';
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
    rental_type?: string;
    min_nights?: number;
    min_months?: number;
  };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/property/${property.id}`);
  };

  const getRentalType = () => {
    if (property.rental_type) return property.rental_type;
    if (property.booking_types?.length === 1) return property.booking_types[0];
    if (property.booking_types?.includes('daily') && property.booking_types?.includes('monthly')) return 'both';
    return 'daily';
  };

  const rentalType = getRentalType();

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'daily': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monthly': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'both':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPricingDisplay = () => {
    switch (rentalType) {
      case 'daily':
        return (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              EGP {property.price_per_night}
            </span>
            <span className="text-gray-600 text-sm">/ night</span>
          </div>
        );
      case 'monthly':
        return (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              EGP {property.monthly_price}
            </span>
            <span className="text-gray-600 text-sm">/ month</span>
          </div>
        );
      case 'both':
        return (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  EGP {property.price_per_night}
                </span>
                <span className="text-gray-600 text-sm">/ night</span>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-700">
                  EGP {property.monthly_price}
                </div>
                <div className="text-xs text-gray-500">/ month</div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              EGP {property.price_per_night}
            </span>
            <span className="text-gray-600 text-sm">/ night</span>
          </div>
        );
    }
  };

  const getRentalBadges = () => {
    const badges = [];
    
    if (rentalType === 'daily') {
      badges.push({ type: 'daily', label: 'Daily Stays', icon: Calendar });
    } else if (rentalType === 'monthly') {
      badges.push({ type: 'monthly', label: 'Monthly Stays', icon: Clock });
    } else if (rentalType === 'both') {
      badges.push({ type: 'daily', label: 'Daily', icon: Calendar });
      badges.push({ type: 'monthly', label: 'Monthly', icon: Clock });
    }
    
    return badges;
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card 
        className="cursor-pointer overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group"
        onClick={handleClick}
      >
        <div className="aspect-square relative overflow-hidden">
          <motion.img
            src={property.images[0] || '/placeholder.svg'}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Rental Type Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {getRentalBadges().map((badge, index) => {
              const IconComponent = badge.icon;
              return (
                <motion.div
                  key={badge.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${getBookingTypeColor(badge.type)}`}>
                    <IconComponent className="h-3 w-3" />
                    {badge.label}
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-white/90 text-gray-900 border-0 shadow-lg backdrop-blur-sm">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              4.9
            </Badge>
          </div>

          {/* VENVL Brand Badge */}
          <div className="absolute bottom-4 right-4">
            <Badge className="bg-black text-white border-0 shadow-lg font-semibold tracking-wide">
              VENVL
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
              <Badge variant="outline" className="text-xs rounded-full capitalize">
                {property.property_type}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {property.description}
            </p>

            {/* Dynamic Pricing */}
            <div className="space-y-2">
              {getPricingDisplay()}

              {/* Minimum Stay Info */}
              {(property.min_nights || property.min_months) && (
                <div className="text-xs text-gray-500 space-y-1">
                  {property.min_nights && rentalType !== 'monthly' && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Min. stay: {property.min_nights} night{property.min_nights > 1 ? 's' : ''}
                    </div>
                  )}
                  {property.min_months && rentalType !== 'daily' && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Min. monthly: {property.min_months} month{property.min_months > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Book Now Button */}
            <motion.button
              className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <span>Book Now</span>
              <motion.div
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -5 }}
                animate={{ x: 0 }}
              >
                →
              </motion.div>
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PropertyCard;
