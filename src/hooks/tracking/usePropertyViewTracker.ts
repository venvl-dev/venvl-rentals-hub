import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackPropertyView } from './useTrackPropertyView';

interface UsePropertyViewTrackerReturn {
  trackGalleryClick: () => void;
  galleryClicks: number;
}

const MINIMUM_DWELL_TIME_SECONDS = 5;
const DEBOUNCE_THRESHOLD_MS = 1000; // Prevent tracking if user leaves within 1 second
const UPDATE_INTERVAL_MS = 20000; // Send updates every 20 seconds if data changes

/**
 * Hook for tracking property view metrics including dwell time, scroll depth, and gallery clicks
 * @param propertyId - The ID of the property being viewed
 */
export const usePropertyViewTracker = (
  propertyId: string,
): UsePropertyViewTrackerReturn => {
  const { user } = useAuth();
  const { trackPropertyView } = useTrackPropertyView();

  // Tracking state
  const [galleryClicks, setGalleryClicks] = useState(0);
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);

  // Time tracking refs
  const mountTimeRef = useRef<number>(Date.now());
  const accumulatedDwellTimeRef = useRef<number>(0);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);
  const hasTrackedRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventIdRef = useRef<string | null>(null); // Store the event ID after first insert
  const galleryClicksRef = useRef<number>(0); // Track gallery clicks in ref for real-time access
  const maxScrollDepthRef = useRef<number>(0); // Track scroll depth in ref for real-time access
  const lastSentDataRef = useRef<{
    dwellSeconds: number;
    scrollDepth: number;
    galleryClicks: number;
  } | null>(null);

  /**
   * Calculate current dwell time in seconds
   */
  const calculateDwellTime = useCallback((): number => {
    const now = Date.now();
    if (isActiveRef.current) {
      const currentSessionTime = (now - lastActiveTimeRef.current) / 1000;
      return accumulatedDwellTimeRef.current + currentSessionTime;
    }
    return accumulatedDwellTimeRef.current;
  }, []);

  /**
   * Calculate scroll depth percentage
   */
  const calculateScrollDepth = useCallback((): number => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (documentHeight <= windowHeight) {
      return 100; // Page doesn't scroll
    }

    const scrollableHeight = documentHeight - windowHeight;
    const scrollPercentage = Math.round((scrollTop / scrollableHeight) * 100);

    return Math.min(100, Math.max(0, scrollPercentage));
  }, []);

  /**
   * Handle scroll depth tracking
   */
  const handleScroll = useCallback(() => {
    const currentDepth = calculateScrollDepth();
    maxScrollDepthRef.current = Math.max(
      maxScrollDepthRef.current,
      currentDepth,
    );
    setMaxScrollDepth(maxScrollDepthRef.current);
  }, [calculateScrollDepth]);

  /**
   * Handle visibility change (user switches tabs, minimizes browser, etc.)
   */
  const handleVisibilityChange = useCallback(() => {
    const now = Date.now();

    if (document.hidden) {
      // Page became hidden - pause tracking
      if (isActiveRef.current) {
        const sessionTime = (now - lastActiveTimeRef.current) / 1000;
        accumulatedDwellTimeRef.current += sessionTime;
        isActiveRef.current = false;
      }
    } else {
      // Page became visible - resume tracking
      if (!isActiveRef.current) {
        lastActiveTimeRef.current = now;
        isActiveRef.current = true;
      }
    }
  }, []);

  /**
   * Track gallery click
   */
  const trackGalleryClick = useCallback(() => {
    galleryClicksRef.current += 1;
    setGalleryClicks((prev) => prev + 1);
  }, []);

  /**
   * Floor dwell time to nearest 5 seconds
   */
  const floorToNearestFive = (value: number): number => {
    return Math.floor(value / 5) * 5;
  };

  /**
   * Floor scroll depth to nearest 10%
   */
  const floorToNearestTen = (value: number): number => {
    return Math.floor(value / 10) * 10;
  };

  /**
   * Check if data has changed enough to warrant sending an update
   */
  const hasDataChanged = useCallback(
    (dwellSeconds: number, scrollDepth: number, clicks: number): boolean => {
      if (!lastSentDataRef.current) {
        return true;
      }

      const lastData = lastSentDataRef.current;
      return (
        dwellSeconds !== lastData.dwellSeconds ||
        scrollDepth !== lastData.scrollDepth ||
        clicks !== lastData.galleryClicks
      );
    },
    [],
  );

  /**
   * Send tracking event to Supabase
   */
  const sendTrackingEvent = async (isFinalUpdate = false) => {
    // Skip if user not authenticated
    if (!user?.id) {
      return;
    }

    const rawDwellTime = calculateDwellTime();

    // Only send if dwell time meets minimum threshold
    if (
      floorToNearestFive(rawDwellTime) < MINIMUM_DWELL_TIME_SECONDS &&
      !isFinalUpdate
    ) {
      console.log(
        `Skipping property view tracking - dwell time (${rawDwellTime.toFixed(1)}s) below minimum (${MINIMUM_DWELL_TIME_SECONDS}s)`,
      );
      return;
    }

    // Floor the metrics for cleaner data (use refs for real-time values)
    const dwellSeconds = floorToNearestFive(rawDwellTime);
    const scrollDepth = floorToNearestTen(maxScrollDepthRef.current);
    const clicks = galleryClicksRef.current;

    // Check if data has changed since last send
    if (!isFinalUpdate && !hasDataChanged(dwellSeconds, scrollDepth, clicks)) {
      return;
    }

    // Store the data we're about to send
    lastSentDataRef.current = {
      dwellSeconds,
      scrollDepth,
      galleryClicks: clicks,
    };

    if (isFinalUpdate) {
      hasTrackedRef.current = true;
    }

    // Call trackPropertyView with eventId (null on first call, then the stored ID)
    const result = await trackPropertyView(
      {
        property_id: propertyId,
        dwell_seconds: dwellSeconds,
        scroll_depth_pct: scrollDepth,
        gallery_clicks: clicks,
      },
      eventIdRef.current,
    );

    // Store the event ID after first insert
    if (result && result.id && !eventIdRef.current) {
      eventIdRef.current = result.id;
      console.log('Stored event ID for future updates:', result.id);
    }
  };

  /**
   * Setup tracking on mount
   */
  useEffect(() => {
    // Skip if user not authenticated
    if (!user?.id) {
      return;
    }

    // Initialize tracking
    mountTimeRef.current = Date.now();
    lastActiveTimeRef.current = Date.now();
    accumulatedDwellTimeRef.current = 0;
    isActiveRef.current = true;
    hasTrackedRef.current = false;
    lastSentDataRef.current = null;
    eventIdRef.current = null; // Reset event ID for new page view
    galleryClicksRef.current = 0; // Reset gallery clicks counter
    maxScrollDepthRef.current = 0; // Reset scroll depth tracker

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial scroll depth calculation
    handleScroll();

    // Set up periodic update interval (every 20 seconds)
    updateIntervalRef.current = setInterval(() => {
      sendTrackingEvent(false);
    }, UPDATE_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear update interval
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Send final tracking event with debounce to avoid tracking rapid navigation
      debounceTimerRef.current = setTimeout(() => {
        sendTrackingEvent(true);
      }, DEBOUNCE_THRESHOLD_MS);
    };
  }, [user?.id]);

  return {
    trackGalleryClick,
    galleryClicks,
  };
};
