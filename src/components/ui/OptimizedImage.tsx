import {
  createLazyLoadObserver,
  generateLowQualityPlaceholder,
  getOptimalImageFormat,
  imageCache,
  isImageCached,
  optimizeImageUrl,
  type ImageOptimizationOptions,
} from '@/lib/imageOptimization';
import { cn } from '@/lib/utils';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Loader from './Loader';

interface OptimizedImageProps {
  src: string;
  preloadSources?: string[]; // URLs of images to preload
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  lazy?: boolean;
  quality?: number;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  progressive?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  preloadSources = [],
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  placeholder,
  lazy = true,
  quality = 85,
  width,
  height,
  onLoad,
  onError,
  style,
  progressive = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [currentSrc, setCurrentSrc] = useState(() => {
    if (!lazy) return src;

    if (placeholder) return placeholder;

    // Generate low-quality placeholder for progressive loading
    if (progressive && src) {
      return generateLowQualityPlaceholder(src, 20, 20);
    }

    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwbTAtNTBhNTAgNTAgMCAxIDEgMCAxMDBhNTAgNTAgMCAxIDEgMC0xMDBaIiBmaWxsPSIjZTVlN2ViIi8+Cjwvc3ZnPg==';
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Optimize image URL with best format and quality
  const optimizedSrc = useMemo(() => {
    const options: ImageOptimizationOptions = {
      quality,
      width,
      height,
      format: getOptimalImageFormat(),
      fit: 'cover',
    };

    return optimizeImageUrl(src, options);
  }, [src, quality, width, height]);

  preloadSources.forEach((src) => {
    const optimizedUrl = optimizeImageUrl(src, {
      quality,
      width,
      height,
      format: getOptimalImageFormat(),
      fit: 'cover',
    });

    imageCache.loadImage(optimizedUrl);
  });

  const isPlaceholder = optimizedSrc != currentSrc;
  // Handle image load
  const handleLoad = useCallback(() => {
    if (!isPlaceholder) setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad, isPlaceholder]);

  // Handle image error with fallback
  const handleError = useCallback(async () => {
    console.warn('Image failed to load (likely CORS):', currentSrc);
    setIsError(true);
    setIsLoaded(false);

    // Try fallback if available and not already using it
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      console.log('Using fallback image:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
      setIsError(false); // Reset error state when using fallback
      return;
    }

    onError?.();
  }, [currentSrc, fallbackSrc, onError]);

  // Intersection Observer setup
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    observerRef.current = createLazyLoadObserver(
      (entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      },
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy]);

  // Load actual image when in view
  useEffect(() => {
    if (!isInView || currentSrc === optimizedSrc) return;

    setIsLoaded(false);
    // Check if image is already cached
    if (isImageCached(optimizedSrc)) {
      setCurrentSrc(optimizedSrc);
      handleLoad();
      return;
    }

    // Load image through cache
    imageCache
      .loadImage(optimizedSrc)
      .then(() => {
        setCurrentSrc(optimizedSrc);
        handleLoad();
      })
      .catch(() => {
        handleError();
      });
  }, [isInView, optimizedSrc, currentSrc, handleLoad, handleError]);

  // Preload next image in sequence (for carousel)
  useEffect(() => {
    if (isLoaded && src !== optimizedSrc) {
      imageCache.loadImage(optimizedSrc).catch(() => {
        // Silently fail preloading
      });
    }
  }, [isLoaded, src, optimizedSrc]);

  const showLoadingOverlay = !isLoaded;

  return (
    <div className={cn('relative   ')}>
      {showLoadingOverlay && (
        <span className=' flex items-center justify-center absolute w-full h-full bg-black/50 top-0 left-0 z-20 '>
          <Loader />
        </span>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-all duration-500 ease-out',
          isLoaded ? 'opacity-100 scale-100' : 'opacity-70 scale-105',
          className,
        )}
        onLoad={handleLoad}
        onError={handleError}
        style={style}
        loading={lazy ? 'lazy' : 'eager'}
        decoding='async'
      />
      {/* Progressive loading overlay */}
      {progressive && !isLoaded && currentSrc !== optimizedSrc && (
        <div className='absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse' />
      )}
      {/* Loading skeleton */}
      {!isLoaded &&
        !isError &&
        currentSrc ===
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwbTAtNTBhNTAgNTAgMCAxIDEgMCAxMDBhNTAgNTAgMCAxIDEgMC0xMDBaIiBmaWxsPSIjZTVlN2ViIi8+Cjwvc3ZnPg==' && (
          <div className='absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center'>
            <div className='w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin'></div>
          </div>
        )}
      {/* Error state */}
      {isError && (
        <div className='absolute inset-0 bg-gray-100 flex items-center justify-center'>
          <div className='text-gray-400 text-center'>
            <svg
              className='w-8 h-8 mx-auto mb-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z'
              />
            </svg>
            <p className='text-xs'>Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
