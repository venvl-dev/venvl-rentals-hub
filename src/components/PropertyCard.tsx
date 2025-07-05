import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Bed, Bath, Users, Star, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getRentalType, 
  getDailyPrice, 
  getMonthlyPrice, 
  getRentalTypeBadge,
  supportsBookingType,
  type PropertyRentalData 
} from '@/lib/rentalTypeUtils';
import { getTopAmenities, cleanAmenityIds } from '@/lib/amenitiesUtils';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    price_per_night: number;
    monthly_price?: number;
    daily_price?: number;
    images: string[];
    city: string;
    state: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
    amenities: string[];
    booking_types?: string[];
    rental_type?: string;
    min_nights?: number;
    min_months?: number;
  } & PropertyRentalData;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const cleanedAmenities = useMemo(
    () => cleanAmenityIds(property.amenities || []),
    [property.amenities]
  );

  const topAmenities = useMemo(
    () => getTopAmenities(cleanedAmenities, 3),
    [cleanedAmenities]
  );
  
  const handleClick = () => {
    navigate(`/property/${property.id}`);
  };

  const images = property.images?.length > 0 ? property.images : ['/placeholder.svg'];

  const nextImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && images.length > 1) {
      prevImage();
    }
  }, [touchStart, touchEnd, images.length, nextImage, prevImage]);

  // Preload next and previous images for smoother transitions
  useEffect(() => {
    if (images.length > 1) {
      const nextIndex = (currentImageIndex + 1) % images.length;
      const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
      
      // Preload next image
      const nextImg = new Image();
      nextImg.src = images[nextIndex];
      
      // Preload previous image
      const prevImg = new Image();
      prevImg.src = images[prevIndex];
    }
  }, [currentImageIndex, images]);

  const rentalType = getRentalType(property);
  const badge = getRentalTypeBadge(rentalType);

  const getPricingDisplay = () => {
    switch (rentalType) {
      case 'daily':
        return (
          <div className="h-24 flex flex-col justify-center space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                EGP {getDailyPrice(property)}
              </span>
              <span className="text-gray-600 text-sm">/ night</span>
            </div>
            {property.min_nights && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Min. stay: {property.min_nights} night{property.min_nights > 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      case 'monthly':
        return (
          <div className="h-24 flex flex-col justify-center space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                EGP {getMonthlyPrice(property)}
              </span>
              <span className="text-gray-600 text-sm">/ month</span>
            </div>
            {property.min_months && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Min. stay: {property.min_months} month{property.min_months > 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      case 'both':
        return (
          <div className="h-24 flex flex-col justify-center space-y-2">
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  EGP {getDailyPrice(property)}
                </span>
                <span className="text-gray-600 text-sm">/ night</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-semibold text-gray-700">
                  EGP {getMonthlyPrice(property)}
                </span>
                <span className="text-gray-500 text-xs">/ month</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {property.min_nights && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Min: {property.min_nights}n
                  </div>
                )}
                {property.min_months && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Min: {property.min_months}m
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-24 flex flex-col justify-center space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                EGP {property.price_per_night}
              </span>
              <span className="text-gray-600 text-sm">/ night</span>
            </div>
          </div>
        );
    }
  };

  const getRentalBadges = () => {
    const badges = [];
    
    if (rentalType === 'daily') {
      badges.push({ type: 'daily', label: 'Daily Stays', icon: Calendar, color: badge.color });
    } else if (rentalType === 'monthly') {
      badges.push({ type: 'monthly', label: 'Monthly Stays', icon: Clock, color: badge.color });
    } else if (rentalType === 'both') {
      badges.push({ type: 'daily', label: 'Daily', icon: Calendar, color: 'bg-blue-100 text-blue-800 border-blue-200' });
      badges.push({ type: 'monthly', label: 'Monthly', icon: Clock, color: 'bg-green-100 text-green-800 border-green-200' });
    }
    
    return badges;
  };

  return (
    <Card 
      className="cursor-pointer overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white h-full flex flex-col"
      onClick={handleClick}
    >
      {/* Image Carousel Container */}
      <div 
        className="aspect-[4/3] relative overflow-hidden flex-shrink-0 group select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Optimized Image with Lazy Loading */}
        <OptimizedImage
          src={images[currentImageIndex]}
          alt={property.title}
          className="w-full h-full object-cover"
          fallbackSrc="/placeholder.svg"
          lazy={true}
          quality={85}
          width={400}
          height={300}
          style={{ 
            transform: touchEnd && touchStart ? `translateX(${(touchEnd - touchStart) * 0.1}px)` : 'translateX(0)'
          }}
        />
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity duration-300 z-10 touch-manipulation"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-gray-900" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity duration-300 z-10 touch-manipulation"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-gray-900" />
            </button>
            
            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-white shadow-lg' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Rental Type Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {getRentalBadges().map((badgeItem, index) => {
            const IconComponent = badgeItem.icon;
            return (
              <Badge key={badgeItem.type} className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 backdrop-blur-sm ${badgeItem.color}`}>
                <IconComponent className="h-3 w-3" />
                <span className="hidden sm:inline">{badgeItem.label}</span>
                <span className="sm:hidden">{badgeItem.label.split(' ')[0]}</span>
              </Badge>
            );
          })}
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg backdrop-blur-sm text-xs px-2 py-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
            4.9
          </Badge>
        </div>

        {/* VENVL Brand Badge */}
        <div className="absolute bottom-3 right-3 z-10">
          <Badge className="bg-black text-white border-0 shadow-lg font-semibold tracking-wide text-xs px-2 py-1">
            VENVL
          </Badge>
        </div>
      </div>

      {/* Content Area */}
      <CardContent className="p-4 sm:p-4 lg:p-6 flex-1 flex flex-col">
        <div className="space-y-2 sm:space-y-3 flex-1">
          {/* Location */}
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{property.city}, {property.state}</span>
          </div>

          {/* Title - Single line only */}
          <h3 className="font-bold text-lg sm:text-lg lg:text-xl text-gray-900 truncate leading-tight" title={property.title}>
            {property.title}
          </h3>
          
          {/* Property Details */}
          <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{property.max_guests}</span>
            </div>
            <Badge variant="outline" className="text-xs rounded-full capitalize ml-auto">
              {property.property_type}
            </Badge>
          </div>

          {/* Top Amenities - Single line with horizontal scroll */}
          {topAmenities.length > 0 ? (
            <div className="w-full">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 scroll-smooth-x touch-pan-x">
                <div className="flex items-center gap-2 flex-nowrap min-w-0">
                  {topAmenities.slice(0, 5).map((amenity, index) => {
                    const IconComponent = amenity.icon;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full px-2 py-1 flex-shrink-0 whitespace-nowrap transition-colors duration-200"
                        title={amenity.name}
                      >
                        <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                          {IconComponent ? (
                            <IconComponent className="h-2.5 w-2.5 text-gray-700" strokeWidth={1.5} />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-700"></div>
                          )}
                        </div>
                        <span className="hidden sm:inline font-medium text-xs">
                          {amenity.name}
                        </span>
                      </div>
                    );
                  })}
                  {cleanedAmenities.length > 5 && (
                    <div className="flex items-center text-xs text-gray-500 rounded-full px-2 py-1 flex-shrink-0 bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
                      <span className="font-medium whitespace-nowrap">+{cleanedAmenities.length - 5}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">
              No amenities listed
            </div>
          )}

          {/* Description */}
          <p className="text-sm sm:text-sm lg:text-base text-gray-600 line-clamp-2 leading-relaxed flex-1">
            {property.description}
          </p>

          {/* Pricing Section */}
          <div className="mt-auto">
            {getPricingDisplay()}
          </div>
        </div>

        {/* Book Now Button */}
        <button
          className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-2xl transition-all duration-200 shadow-lg mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base hover:from-black hover:to-gray-900"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Book Now
        </button>
      </CardContent>
    </Card>
  );
};

export default PropertyCard; 