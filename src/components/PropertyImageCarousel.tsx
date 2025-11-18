import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
  className?: string;
  showBadges?: boolean;
  badges?: React.ReactNode;
  onImageChange?: () => void;
}

const PropertyImageCarousel = ({
  images,
  title,
  className = '',
  showBadges = true,
  badges,
  onImageChange,
}: PropertyImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    onImageChange?.();
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    onImageChange?.();
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    onImageChange?.();
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && images.length > 1) {
      prevImage();
    }
  };

  // Handle case where there are no images
  if (!images || images.length === 0) {
    return (
      <div
        className={`relative bg-gray-200 rounded-2xl shadow-lg ${className}`}
      >
        <div className='w-full h-96 flex items-center justify-center text-gray-500'>
          <span>No images available</span>
        </div>
      </div>
    );
  }

  // If only one image, show it without navigation
  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={images[0] || '/placeholder.svg'}
          alt={title}
          className='w-full h-96 object-cover rounded-2xl shadow-lg'
        />
        {showBadges && badges && (
          <div className='absolute top-4 left-4 right-4 flex justify-between items-start'>
            {badges}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Main Image */}
      <img
        src={images[currentImageIndex] || '/placeholder.svg'}
        alt={`${title} - Image ${currentImageIndex + 1}`}
        className='w-full h-96 object-cover rounded-2xl shadow-lg'
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Badges */}
      {showBadges && badges && (
        <div className='absolute top-4 left-4 right-4 flex justify-between items-start z-10'>
          {badges}
        </div>
      )}

      {/* Navigation Arrows */}
      <Button
        variant='secondary'
        size='icon'
        className='absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10'
        onClick={prevImage}
        aria-label='Previous image'
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>

      <Button
        variant='secondary'
        size='icon'
        className='absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10'
        onClick={nextImage}
        aria-label='Next image'
      >
        <ChevronRight className='h-4 w-4' />
      </Button>

      {/* Image Counter */}
      <div className='absolute top-4 right-4 z-10'>
        <Badge className='bg-black/60 text-white border-0 backdrop-blur-sm'>
          {currentImageIndex + 1} / {images.length}
        </Badge>
      </div>

      {/* Dot Indicators */}
      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10'>
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentImageIndex
                ? 'bg-white shadow-md'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => goToImage(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Keyboard Navigation & Touch Area */}
      <div
        className='absolute inset-0 focus:outline-none'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevImage();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextImage();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label='Image carousel. Use arrow keys to navigate or swipe to change images.'
      />
    </div>
  );
};

export default PropertyImageCarousel;
