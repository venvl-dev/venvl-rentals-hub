import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PriceRange {
  min: number;
  max: number;
  distribution: number[];
}

export const usePriceRange = (
  bookingType?: "daily" | "monthly",
  debug = true
) => {
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: 0,
    max: 10000,
    distribution: [],
  });

  // More realistic fallback ranges based on typical Egyptian rental market
  const fallbackRange = {
    min: bookingType === "monthly" ? 3000 : 100, // Updated minimums
    max: bookingType === "monthly" ? 50000 : 3000, // Updated maximums
    distribution: [],
  };

  // Add a force refresh capability
  const forceRefresh = useRef(false);
  const [loading, setLoading] = useState(true);
  const prevBookingTypeRef = useRef<string | undefined>();
  const realtimeSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPriceData = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching price range for booking type:", bookingType);
        console.log("📊 Current priceRange state:", priceRange);

        // Use direct query to get ALL active, approved properties for accurate price range
        const { data, error } = await supabase
          .from("properties")
          .select(
            "price_per_night, daily_price, monthly_price, title, booking_types, rental_type"
          )
          .eq("is_active", true)
          .eq("approval_status", "approved");

        if (error) {
          console.error("❌ Error fetching properties:", error);
          console.log("📝 Data received:", data);
          console.log("🔄 Component mounted:", mounted);
          return;
        }

        if (!data || !mounted) {
          console.log("⚠️ No data or component unmounted:", {
            data: !!data,
            mounted,
          });
          return;
        }

        console.log("✅ Fetched properties data:", data.length, "properties");
        console.log("📋 Raw properties data:", data);

        // Extract prices based on booking type with better error handling
        const prices: number[] = [];

        data.forEach((property, index) => {
          try {
            console.log(
              `🏠 Processing property ${index + 1}: ${property.title}`
            );
            console.log(`📋 Property prices:`, {
              price_per_night: property.price_per_night,
              daily_price: property.daily_price,
              monthly_price: property.monthly_price,
            });

            if (bookingType === "daily") {
              // For daily booking, use daily_price or fallback to price_per_night
              const dailyPrice =
                property.daily_price || property.price_per_night;
              console.log(`💰 Daily price for ${property.title}:`, dailyPrice);
              if (
                dailyPrice &&
                typeof dailyPrice === "number" &&
                dailyPrice > 0
              ) {
                prices.push(dailyPrice);
                console.log(`✅ Added daily price: ${dailyPrice}`);
              } else {
                console.log(`❌ Skipped daily price (invalid): ${dailyPrice}`);
              }
            } else if (bookingType === "monthly") {
              // For monthly booking, use monthly_price only for properties that actually support monthly rental
              const supportsMonthly =
                (Array.isArray(property.booking_types) &&
                  property.booking_types.includes("monthly")) ||
                property.rental_type === "monthly" ||
                property.rental_type === "both";

              console.log(`💰 Monthly check for ${property.title}:`, {
                monthly_price: property.monthly_price,
                booking_types: property.booking_types,
                rental_type: property.rental_type,
                supportsMonthly,
              });

              if (
                supportsMonthly &&
                property.monthly_price &&
                typeof property.monthly_price === "number" &&
                property.monthly_price > 0
              ) {
                prices.push(property.monthly_price);
                console.log(
                  `✅ Added monthly price: ${property.monthly_price}`
                );
              } else {
                console.log(
                  `❌ Skipped monthly price (unsupported or invalid):`,
                  {
                    monthly_price: property.monthly_price,
                    supportsMonthly,
                  }
                );
              }
            } else {
              // Default: include all available prices (convert monthly to daily for comparison)
              if (
                property.price_per_night &&
                typeof property.price_per_night === "number" &&
                property.price_per_night > 0
              ) {
                prices.push(property.price_per_night);
              }
              if (
                property.daily_price &&
                typeof property.daily_price === "number" &&
                property.daily_price > 0
              ) {
                prices.push(property.daily_price);
              }
              if (
                property.monthly_price &&
                typeof property.monthly_price === "number" &&
                property.monthly_price > 0
              ) {
                prices.push(Math.round(property.monthly_price / 30));
              }
            }
          } catch (error) {
            console.warn(
              "❌ Error processing property price:",
              property,
              error
            );
          }
        });

        console.log("Extracted prices:", prices);

        if (prices.length === 0) {
          console.log("⚠️ No prices found for booking type:", bookingType);
          console.log("📊 Using fallback range due to no valid prices");

          console.log("🔄 Fallback range set:", fallbackRange);

          if (mounted) {
            setPriceRange(fallbackRange);
          }
          return;
        }

        // Calculate exact min/max from actual data - NO PADDING for accurate filtering
        const actualMin = Math.min(...prices);
        const actualMax = Math.max(...prices);

        console.log("Calculated price range:", {
          min: actualMin,
          max: actualMax,
          priceCount: prices.length,
        });

        if (mounted) {
          setPriceRange({
            min: actualMin,
            max: actualMax,
            distribution: [], // Could be enhanced later with histogram data
          });
        }
      } catch (error) {
        console.error("Price range fetch error:", error);
        if (mounted) {
          // Fallback range based on booking type
          setPriceRange(fallbackRange);
        }
      } finally {
        // Add a small delay to prevent rapid state changes
        timeoutId = setTimeout(() => {
          if (mounted) {
            setLoading(false);
            prevBookingTypeRef.current = bookingType;
          }
        }, 100);
      }
    };

    // Set up real-time subscription for price changes (skip in test environment)
    const setupRealtimeSubscription = () => {
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe();
      }

      // Skip real-time subscription in test environment
      if (typeof window === "undefined" || process.env.NODE_ENV === "test") {
        return;
      }

      try {
        realtimeSubscriptionRef.current = supabase
          .channel("price-range-updates")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "properties",
              filter: "is_active=eq.true",
            },
            (payload) => {
              console.log(
                "Property change detected, refetching price range:",
                payload
              );
              // Debounce the refetch to avoid too many calls
              if (timeoutId) clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                fetchPriceData();
              }, 500);
            }
          )
          .subscribe();
      } catch (error) {
        console.warn("Failed to set up real-time subscription:", error);
      }
    };

    // Fetch once on mount and when bookingType changes
    fetchPriceData();
    setupRealtimeSubscription();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe();
      }
    };
  }, [bookingType]);

  return {
    priceRange: priceRange.min > 0 ? priceRange : null, // Only return valid ranges
    loading,
  };
};
