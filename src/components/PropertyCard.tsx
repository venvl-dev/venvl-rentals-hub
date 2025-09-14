import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Bed, Bath, Users, Star, Calendar, Clock, Eye, Archive } from 'lucide-react';
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
      
      // Preload next image with error handling
      try {
        const nextImg = new Image();
        nextImg.src = images[nextIndex];
      } catch (error) {
        console.warn('Failed to preload next image:', error);
      }
      
      // Preload previous image with error handling
      try {
        const prevImg = new Image();
        prevImg.src = images[prevIndex];
      } catch (error) {
        console.warn('Failed to preload previous image:', error);
      }
    }
  }, [currentImageIndex, images]);

  const rentalType = getRentalType(property);
  const badge = getRentalTypeBadge(rentalType);

  const getPricingDisplay = () => {
    switch (rentalType) {
      case 'daily':
        return (
          <div className="space-y-1">
            <div className="font-semibold text-lg text-gray-900">EGP {getDailyPrice(property)}/night</div>
            <div className="text-sm text-gray-500">EGP {getDailyPrice(property) * 30}/month</div>
          </div>
        );
      case 'monthly':
        return (
          <div className="space-y-1">
            <div className="font-semibold text-lg text-gray-900">EGP {getMonthlyPrice(property)}/month</div>
          </div>
        );
      case 'both':
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-lg text-gray-900">EGP {getDailyPrice(property)}/night</div>
            <div className="text-sm text-gray-500">EGP {getMonthlyPrice(property)}/month</div>
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <div className="font-semibold text-lg text-gray-900">EGP {property.price_per_night}/night</div>
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
      className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white h-full flex flex-col"
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
        
        {/* Status Badge - Clean dark badge like reference */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
            Active
          </Badge>
        </div>
      </div>

      {/* Content Area */}
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="p-6 pb-4 flex-1">
          {/* Title - Clean typography like reference */}
          <h3 className="font-semibold text-xl mb-1 line-clamp-2 text-gray-900">{property.title}</h3>

          {/* Location */}
          <p className="text-sm text-gray-500 mb-3">{property.city}, {property.state}</p>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 flex-1">{property.description}</p>

          <div className="space-y-3">
            {/* Pricing Section */}
            <div>
              {getPricingDisplay()}
            </div>

            {/* Property Details */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
              <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-xs">
                Flexible Booking
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 mt-auto">
          <div className="flex gap-2">
            <button
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <Eye className="h-4 w-4" />
              View
            </button>
            <button
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Edit
            </button>
            <button
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Pause
            </button>
            <button
              className="w-10 border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard; 
