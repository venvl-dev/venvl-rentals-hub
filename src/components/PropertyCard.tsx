import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Users,
  Star,
  Calendar,
  Clock,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getBookingTypeLabel,
  getRentalTypeBadge,
  getPrimaryPrice,
  type PropertyRentalData,
} from '@/lib/rentalTypeUtils';
import { getTopAmenities, cleanAmenityIds } from '@/lib/amenitiesUtils';
import OptimizedImage from '@/components/ui/OptimizedImage';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel';
import { type CarouselApi } from '@/components/ui/carousel';

interface property {
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
}
interface PropertyCardProps {
  property: property & PropertyRentalData;
  index: number;
  properties: property[];
}

const PropertyCard = ({ property, properties, index }: PropertyCardProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [api, setApi] = React.useState<CarouselApi>();
  const [isGrabbing, setIsGrabbing] = useState(false);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrentImageIndex(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrentImageIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cleanedAmenities = useMemo(
    () => cleanAmenityIds(property.amenities || []),
    [property.amenities],
  );

  const topAmenities = useMemo(
    () => getTopAmenities(cleanedAmenities, 3),
    [cleanedAmenities],
  );

  const handleClick = () => {
    navigate(`/property/${property.id}`);
  };

  const images =
    property.images?.length > 0
      ? property.images
      : [
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        ];

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      api?.scrollNext();
    },
    [api],
  );

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      api?.scrollPrev();
    },
    [api],
  );

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

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
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
    },
    [touchStart, touchEnd, images.length, nextImage, prevImage],
  );

  // ✅ SIMPLIFIED: Use new booking type utilities
  const bookingTypes = property.booking_types || ['daily'];
  const bookingTypeLabel = getBookingTypeLabel(bookingTypes);
  const badge = getRentalTypeBadge(bookingTypes);
  const { price, unit } = getPrimaryPrice(property);

  // ✅ FLEXIBLE: Show both daily and monthly prices when available
  const getPricingDisplay = () => {
    const hasDaily = bookingTypes.includes('daily');
    const hasMonthly = bookingTypes.includes('monthly');
    const dailyPrice = property.daily_price || property.price_per_night || 0;
    const monthlyPrice = property.monthly_price || 0;

    // If both daily and monthly are available, show both prices
    if (hasDaily && hasMonthly && dailyPrice > 0 && monthlyPrice > 0) {
      return (
        <div className='h-24 flex flex-col justify-center space-y-1'>
          <div className='flex items-baseline space-x-2'>
            <span className='text-lg font-bold text-gray-900'>
              EGP {Math.round(dailyPrice)}
            </span>
            <span className='text-gray-600 text-xs'>/ night</span>
          </div>
          <div className='flex items-baseline space-x-2'>
            <span className='text-lg font-bold text-gray-900'>
              EGP {Math.round(monthlyPrice)}
            </span>
            <span className='text-gray-600 text-xs'>/ month</span>
          </div>
          <div className='flex items-center gap-3 text-xs text-gray-500'>
            {property.min_nights && (
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                Min. stay: {property.min_nights} night
                {property.min_nights > 1 ? 's' : ''}
              </div>
            )}
            {property.min_months && (
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                Min. lease: {property.min_months} month
                {property.min_months > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Otherwise, show single price as before
    return (
      <div className='h-24 flex flex-col justify-center space-y-2'>
        <div className='flex items-baseline space-x-2'>
          <span className='text-2xl font-bold text-gray-900'>
            EGP {Math.round(price)}
          </span>
          <span className='text-gray-600 text-sm'>/ {unit}</span>
        </div>
        {/* Show min requirements based on booking types */}
        {unit === 'night' && property.min_nights && (
          <div className='text-xs text-gray-500 flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            Min. stay: {property.min_nights} night
            {property.min_nights > 1 ? 's' : ''}
          </div>
        )}
        {unit === 'month' && property.min_months && (
          <div className='text-xs text-gray-500 flex items-center gap-1'>
            <Clock className='h-3 w-3' />
            Min. stay: {property.min_months} month
            {property.min_months > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  // ✅ SIMPLIFIED: Single badge using booking type label
  const getBadgeIcon = () => {
    if (bookingTypeLabel === 'Monthly') return Clock;
    if (bookingTypeLabel === 'Flexible') return Calendar; // Could use both icons but keep simple
    return Calendar; // Default for Daily
  };

  const sourcesToPreload: string[] = [];
  //  pre-loading images of previous and next images in the carousel
  if (currentImageIndex == 0) sourcesToPreload.push(images[1]);
  else if (currentImageIndex == images.length - 1)
    sourcesToPreload.push(images[currentImageIndex - 1]);
  else {
    if (images[currentImageIndex - 1])
      sourcesToPreload.push(images[currentImageIndex - 1]);
    if (images[currentImageIndex + 1])
      sourcesToPreload.push(images[currentImageIndex + 1]);
  }
  //  pre loading images of next 6 properties in the list
  if (properties.length > index + 6)
    sourcesToPreload.push(properties[index + 6].images[0]);
  if (index == 0) {
    for (let i = 1; i < 7; i++) {
      if (i >= properties.length - 1) break;
      sourcesToPreload.push(properties[i].images[0]);
    }
  }
  return (
    <Link to={`/property/${property.id}`} className='h-full cursor-pointer'>
      <Card
        className='   overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white h-full flex flex-col '
        // onClick={handleClick}
      >
        {/* Image Carousel Container */}
        <div
          className={`${isGrabbing ? 'cursor-grabbing' : 'cursor-pointer'} aspect-[4/3] relative overflow-hidden flex-shrink-0 group select-none `}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => setIsGrabbing(true)}
          onMouseUp={() => setIsGrabbing(false)}
          onMouseLeave={() => setIsGrabbing(false)}
        >
          <Carousel className='h-full ' setApi={setApi}>
            <CarouselContent className='h-full'>
              {images.map((src, idx) => (
                <CarouselItem key={src}>
                  <OptimizedImage
                    src={src}
                    alt={property.title}
                    className='w-full h-full object-cover'
                    fallbackSrc='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                    lazy={true}
                    quality={85}
                    width={400}
                    height={300}
                    preloadSources={sourcesToPreload}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* Optimized Image with Lazy Loading */}
            {/* <OptimizedImage
            src={images[currentImageIndex]}
            alt={property.title}
            className='w-full h-full object-cover'
            fallbackSrc='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            lazy={true}
            quality={85}
            width={400}
            height={300}
            preloadSources={sourcesToPreload}
            style={{
              transform:
                touchEnd && touchStart
                  ? `translateX(${(touchEnd - touchStart) * 0.1}px)`
                  : 'translateX(0)',
            }}
          /> */}
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <div
                  className={` cursor-default px-4 py-8 absolute left-0 top-1/2 transform -translate-y-1/2`}
                  //  stop routing
                  onClick={(e) => e.preventDefault()}
                >
                  {currentImageIndex > 0 && (
                    <button
                      onClick={prevImage}
                      className=' bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity duration-300 z-10 touch-manipulation'
                      aria-label='Previous image'
                    >
                      <ChevronLeft className='h-4 w-4 text-gray-900' />
                    </button>
                  )}
                </div>

                <div
                  className={`  cursor-default px-4 py-8 absolute right-0 top-1/2 transform -translate-y-1/2`}
                  onClick={(e) => e.preventDefault()}
                >
                  {currentImageIndex < images.length - 1 && (
                    <button
                      onClick={nextImage}
                      className=' bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity duration-300 z-10 touch-manipulation'
                      aria-label='Next image'
                    >
                      <ChevronRight className='h-4 w-4 text-gray-900' />
                    </button>
                  )}
                </div>

                {/* Enhanced Image Indicators */}
                <div className='absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 z-10'>
                  {images.map((_, index) => {
                    const distanceFromActive = Math.abs(
                      index - currentImageIndex,
                    );
                    const isActive = index === currentImageIndex;

                    // Progressive sizing based on distance from active dot
                    let size = 'w-1.5 h-1.5'; // smallest (furthest)
                    let opacity = 'opacity-20'; // most transparent

                    if (isActive) {
                      size = 'w-3 h-3'; // largest (active)
                      opacity = 'opacity-100'; // fully opaque
                    } else if (distanceFromActive === 1) {
                      size = 'w-2.5 h-2.5'; // medium-large
                      opacity = 'opacity-80';
                    } else if (distanceFromActive === 2) {
                      size = 'w-2 h-2'; // medium
                      opacity = 'opacity-60';
                    } else if (distanceFromActive === 3) {
                      size = 'w-1.5 h-1.5'; // small
                      opacity = 'opacity-40';
                    } else {
                      // Hide dots that are too far (distance > 3)
                      size = 'w-0 h-0';
                      opacity = 'opacity-0';
                    }

                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          api?.scrollTo(index);
                        }}
                        className={`
                        ${size} rounded-full transition-all duration-500 ease-out transform
                        ${opacity}
                        ${
                          isActive
                            ? 'bg-white shadow-lg scale-110 ring-2 ring-white/30'
                            : 'bg-white/70 hover:bg-white/90 hover:scale-105'
                        }
                        ${distanceFromActive > 3 ? 'invisible' : 'visible'}
                      `}
                        style={{
                          transitionProperty: 'all',
                          transitionTimingFunction:
                            'cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </Carousel>

          {/* Rental Type Badges */}
          <div className='absolute top-3 left-3 z-20 flex flex-row gap-1 max-w-[calc(100%-6rem)]'>
            {(() => {
              const hasDaily = bookingTypes.includes('daily');
              const hasMonthly = bookingTypes.includes('monthly');
              const badges = [];

              if (hasDaily) {
                badges.push(
                  <Badge
                    key='daily'
                    className='text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium flex items-center gap-0.5 backdrop-blur-sm bg-green-100 text-green-800 min-w-fit flex-shrink-0 shadow-sm'
                  >
                    <Calendar className='h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0' />
                    <span className='whitespace-nowrap'>Daily</span>
                  </Badge>,
                );
              }

              if (hasMonthly) {
                badges.push(
                  <Badge
                    key='monthly'
                    className='text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium flex items-center gap-0.5 backdrop-blur-sm bg-purple-100 text-purple-800 min-w-fit flex-shrink-0 shadow-sm'
                  >
                    <Clock className='h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0' />
                    <span className='whitespace-nowrap'>Monthly</span>
                  </Badge>,
                );
              }

              // Fallback to daily if no booking types specified
              if (badges.length === 0) {
                badges.push(
                  <Badge
                    key='daily-default'
                    className='text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium flex items-center gap-0.5 backdrop-blur-sm bg-green-100 text-green-800 min-w-fit flex-shrink-0 shadow-sm'
                  >
                    <Calendar className='h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0' />
                    <span className='whitespace-nowrap'>Daily</span>
                  </Badge>,
                );
              }

              return badges;
            })()}
          </div>

          {/* Rating Badge */}
          <div className='absolute top-3 right-3 z-10'>
            <Badge className='bg-white/95 text-gray-900 border-0 shadow-lg backdrop-blur-sm text-xs px-2 py-1'>
              <Star className='h-3 w-3 fill-yellow-400 text-yellow-400 mr-1' />
              4.9
            </Badge>
          </div>

          {/* VENVL Brand Badge */}
          <div className='absolute bottom-3 right-3 z-10'>
            <Badge className='bg-black text-white border-0 shadow-lg font-semibold tracking-wide text-xs px-2 py-1'>
              VENVL
            </Badge>
          </div>
        </div>

        {/* Content Area */}
        <CardContent className='p-4 sm:p-4 lg:p-6 flex-1 flex flex-col group hover:scale-[1.01] transition-transform duration-200'>
          <div className='space-y-2 sm:space-y-3 flex-1'>
            {/* Location */}
            <div className='flex items-center text-gray-600'>
              <MapPin className='h-4 w-4 mr-2 flex-shrink-0' />
              <span className='text-sm font-medium truncate'>
                {property.city}, {property.state}
              </span>
            </div>

            {/* Title - Single line only */}
            <h3
              className=' font-bold text-lg sm:text-lg lg:text-xl text-gray-900 truncate leading-tight'
              title={property.title}
            >
              {property.title}
            </h3>

            {/* Property Details */}
            <div className='flex items-center gap-3 text-sm text-gray-600 flex-wrap'>
              <div className='flex items-center gap-1'>
                <Bed className='h-4 w-4' />
                <span>{property.bedrooms}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Bath className='h-4 w-4' />
                <span>{property.bathrooms}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Users className='h-4 w-4' />
                <span>{property.max_guests}</span>
              </div>
              <Badge
                variant='outline'
                className='text-xs rounded-full capitalize ml-auto'
              >
                {property.property_type}
              </Badge>
            </div>

            {/* Top Amenities - Single line with horizontal scroll */}
            {topAmenities.length > 0 ? (
              <div className='w-full'>
                <div className='flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 scroll-smooth-x touch-pan-x'>
                  <div className='flex items-center gap-2 flex-nowrap min-w-0'>
                    {topAmenities.slice(0, 5).map((amenity, index) => {
                      const IconComponent = amenity.icon;

                      return (
                        <div
                          key={index}
                          className='flex items-center gap-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full px-2 py-1 flex-shrink-0 whitespace-nowrap transition-colors duration-200'
                          title={amenity.name}
                        >
                          <div className='w-3 h-3 flex items-center justify-center flex-shrink-0'>
                            {IconComponent ? (
                              <IconComponent
                                className='h-2.5 w-2.5 text-gray-700'
                                strokeWidth={1.5}
                              />
                            ) : (
                              <div className='w-2.5 h-2.5 rounded-full bg-gray-700'></div>
                            )}
                          </div>
                          <span className='hidden sm:inline font-medium text-xs'>
                            {amenity.name}
                          </span>
                        </div>
                      );
                    })}
                    {cleanedAmenities.length > 5 && (
                      <div className='flex items-center text-xs text-gray-500 rounded-full px-2 py-1 flex-shrink-0 bg-gray-100 hover:bg-gray-200 transition-colors duration-200'>
                        <span className='font-medium whitespace-nowrap'>
                          +{cleanedAmenities.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-xs text-gray-400 italic'>
                No amenities listed
              </div>
            )}

            {/* Description */}
            <p className='text-sm sm:text-sm lg:text-base text-gray-600 line-clamp-2 leading-relaxed flex-1'>
              {property.description}
            </p>

            {/* Pricing Section */}
            <div className='mt-auto'>{getPricingDisplay()}</div>
          </div>

          {/* Book Now Button */}
          <button
            className='w-full bg-gradient-to-r from-gray-900 to-black text-white font-semibold sm:font-extrabold lg:font-medium py-2 sm:py-4 lg:py-2 px-4 sm:px-8 lg:px-4 rounded-2xl lg:rounded-lg transition-all duration-200 shadow-lg sm:shadow-xl lg:shadow-sm mt-3 sm:mt-5 lg:mt-3 text-sm sm:text-base lg:text-sm tracking-normal sm:tracking-wide lg:tracking-normal uppercase sm:uppercase lg:normal-case hover:from-black hover:to-gray-900 hover:shadow-xl lg:hover:shadow-md transform hover:scale-[1.01] sm:hover:scale-[1.03] lg:hover:scale-[1.01] active:scale-[0.99]'
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Book Now
          </button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
