import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { preloadPropertyImages, imageCache } from '@/lib/imageOptimization';

interface Property {
  id: string;
  images: string[];
}

export const useAuthImagePreload = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Handle auth state changes
  useEffect(() => {
    // Get initial auth state
    const getInitialAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting initial auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Clear image cache and preload state when user changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        imageCache.clearCache();
        setImagesPreloaded(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Preload images for properties
  const preloadImages = useCallback(
    async (properties: Property[]) => {
      if (imagesPreloaded || properties.length === 0) return;

      try {
        await preloadPropertyImages(properties, 12);
        setImagesPreloaded(true);
      } catch (error) {
        console.warn('Failed to preload images:', error);
      }
    },
    [imagesPreloaded],
  );

  // Force refresh images (useful after login)
  const refreshImages = useCallback(
    async (properties: Property[]) => {
      imageCache.clearCache();
      setImagesPreloaded(false);

      // Wait a bit for auth state to settle
      setTimeout(() => {
        preloadImages(properties);
      }, 500);
    },
    [preloadImages],
  );

  return {
    user,
    isLoading,
    imagesPreloaded,
    preloadImages,
    refreshImages,
  };
};
