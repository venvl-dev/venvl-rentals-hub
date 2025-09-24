// Image optimization and caching utilities
class ImageCache {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  private maxCacheSize = 50; // Maximum number of cached images

  // Load and cache an image
  async loadImage(src: string): Promise<HTMLImageElement> {
    // Check if image is already cached
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Check if image is currently being loaded
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Create loading promise
    const loadingPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      // Try with CORS first, fallback without CORS if it fails
      const tryLoadWithCors = () => {
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
          try {
            await img.decode(); // Wait for decoding to complete
            this.addToCache(src, img);
            this.loadingPromises.delete(src);
            resolve(img);
          } catch (decodeError) {
            // Decoding failed after successful load, try without CORS
            console.error('Image decode failed with CORS:', decodeError);
            tryLoadWithoutCors();
          }
        };

        img.onerror = () => {
          // Network error with CORS, try without CORS
          console.error('Image network error with CORS');
          tryLoadWithoutCors();
        };

        img.src = src;
      };

      const tryLoadWithoutCors = () => {
        const imgNoCors = new Image();

        imgNoCors.onload = async () => {
          try {
            await imgNoCors.decode(); // Wait for decoding to complete
            this.addToCache(src, imgNoCors);
            this.loadingPromises.delete(src);
            resolve(imgNoCors);
          } catch (decodeError) {
            // Decoding failed without CORS, finally reject
            console.error('Image decode failed without CORS:', decodeError);
            this.loadingPromises.delete(src);
            reject(new Error(`Failed to load and decode image: ${src}`));
          }
        };

        imgNoCors.onerror = () => {
          // Network error without CORS, finally reject
          console.error('Image network error without CORS');
          this.loadingPromises.delete(src);
          reject(new Error(`Failed to load image: ${src}`));
        };

        imgNoCors.src = src;
      };

      // Start with CORS attempt
      tryLoadWithCors();
    });

    this.loadingPromises.set(src, loadingPromise);
    return loadingPromise;
  }

  // Add image to cache with LRU eviction
  private addToCache(src: string, img: HTMLImageElement): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(src, img);
  }

  // Preload multiple images
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map((url) => this.loadImage(url).catch(() => null));
    await Promise.allSettled(promises);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number; loadingCount: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      loadingCount: this.loadingPromises.size,
    };
  }
}

// Create singleton instance
export const imageCache = new ImageCache();

// Image optimization functions
export interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export function optimizeImageUrl(
  url: string,
  options: ImageOptimizationOptions = {},
): string {
  if (!url || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }

  const {
    quality = 85,
    width,
    height,
    format = 'auto',
    fit = 'cover',
  } = options;

  // For local images, return as-is
  if (url.startsWith('/') || url.startsWith('./')) {
    return url;
  }

  // Check if this is a CORS-problematic domain (like Pinterest)
  const corsProblematicDomains = ['i.pinimg.com', 'pinterest.com'];
  const urlObj = new URL(url);

  if (
    corsProblematicDomains.some((domain) => urlObj.hostname.includes(domain))
  ) {
    // Use our image proxy for CORS-problematic domains
    const proxyUrl = `https://xhzgistgvcbmcfczcrib.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
    return proxyUrl;
  }

  // For other external URLs, add optimization parameters
  const separator = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams();

  if (quality < 100) params.set('q', quality.toString());
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (format !== 'auto') params.set('f', format);
  if (fit !== 'cover') params.set('fit', fit);

  const paramString = params.toString();
  return paramString ? `${url}${separator}${paramString}` : url;
}

// Progressive image loading with low-quality placeholder
export function generateLowQualityPlaceholder(
  originalUrl: string,
  width: number = 10,
  height: number = 10,
): string {
  return optimizeImageUrl(originalUrl, {
    quality: 10,
    width,
    height,
    format: 'jpeg',
  });
}

// Preload critical images for better performance
export async function preloadCriticalImages(
  imageUrls: string[],
): Promise<void> {
  const criticalUrls = imageUrls.slice(0, 6); // Preload first 6 images
  await imageCache.preloadImages(criticalUrls);
}

// Image format detection and conversion
export function getOptimalImageFormat(): 'webp' | 'jpeg' {
  // Check if browser supports WebP
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  try {
    const webpSupported = canvas
      .toDataURL('image/webp')
      .startsWith('data:image/webp');
    return webpSupported ? 'webp' : 'jpeg';
  } catch {
    return 'jpeg';
  }
}

// Lazy loading with Intersection Observer
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {},
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, defaultOptions);
}

// Image loading utility with retry mechanism
export async function loadImageWithRetry(
  src: string,
  maxRetries: number = 3,
): Promise<HTMLImageElement> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await imageCache.loadImage(src);
    } catch (error) {
      lastError = error as Error;
      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000),
      );
    }
  }

  throw lastError!;
}

// Batch image preloading for property cards
export async function preloadPropertyImages(
  properties: Array<{ images: string[] }>,
  maxImages: number = 20,
): Promise<void> {
  const allImages = properties
    .flatMap((property) => property.images)
    .filter(Boolean)
    .slice(0, maxImages);

  await preloadCriticalImages(allImages);
}

// Utility to check if image is in cache
export function isImageCached(src: string): boolean {
  return imageCache.getCacheStats().size > 0 && imageCache['cache'].has(src);
}

// Clear image cache when memory is low
export function setupMemoryManagement(): void {
  // Clear cache when page is about to be unloaded
  window.addEventListener('beforeunload', () => {
    imageCache.clearCache();
  });

  // Clear cache when memory usage is high (if supported)
  if ('memory' in performance) {
    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        imageCache.clearCache();
      }
    };

    setInterval(checkMemory, 30000); // Check every 30 seconds
  }
}

// Initialize memory management
setupMemoryManagement();
