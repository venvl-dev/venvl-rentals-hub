import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, format } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Percent,
  Ticket,
  XCircle,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface PromoCode {
  id: string;
  code: string;
  value: number;
  expiry_date: string | null;
  relative_expiry_months: number | null;
  created_at: string;
  allow_multi_account: boolean | null;
}

interface PromoCodeSelectorProps {
  userId: string;
  onSelect: (promoCodeId: string | null) => void;
  selectedPromoCodeId?: string | null;
  totalPrice?: number;
  checkIn?: Date | null;
  checkOut?: Date | null;
}

const PromoCodeSelector = ({
  userId,
  onSelect,
  selectedPromoCodeId,
  totalPrice,
  checkIn,
  checkOut,
}: PromoCodeSelectorProps) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedPromoCodeId || null,
  );
  const [hiddenPromoCodesCount, setHiddenPromoCodesCount] = useState(0);
  const location = useLocation();

  const isExpired = useCallback((promoCode: PromoCode): boolean => {
    const calculateExpiryDate = (code: PromoCode): Date | null => {
      if (code.expiry_date) {
        return new Date(code.expiry_date);
      }
      if (code.relative_expiry_months) {
        return addMonths(
          new Date(code.created_at),
          code.relative_expiry_months,
        );
      }
      return null;
    };

    const expiryDate = calculateExpiryDate(promoCode);
    if (!expiryDate) return false;
    return expiryDate < new Date();
  }, []);

  const fetchUserPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_promo_codes')
        .select(
          `
          *,
          promo_codes (*)
        `,
        )
        .eq('profile_id', userId);

      if (error) throw error;

      const codes =
        data
          ?.map((item) => {
            return {
              ...item.promo_codes,
              expiry_date: item.expiry_date,
            };
          })
          .filter(Boolean) || [];

      // Filter out expired codes
      let validCodes = codes.filter((code: PromoCode) => !isExpired(code));

      // Track how many promo codes are hidden due to overlapping bookings
      let hiddenCount = 0;

      // Filter out promo codes that are used in overlapping bookings
      if (checkIn && checkOut) {
        const checkInStr = checkIn.toISOString().split('T')[0];
        const checkOutStr = checkOut.toISOString().split('T')[0];

        // Fetch bookings that use promo codes and overlap with the selected dates
        const { data: overlappingBookings, error: bookingsError } =
          await supabase
            .from('bookings')
            .select('promo_code_id, booking_range')
            .not('promo_code_id', 'is', null)
            .in('status', ['pending', 'confirmed', 'checked_in'])
            .overlaps('booking_range', `[${checkInStr},${checkOutStr})`);

        if (bookingsError) {
          console.error('Error fetching overlapping bookings:', bookingsError);
        } else if (overlappingBookings && overlappingBookings.length > 0) {
          // Extract promo code IDs that are in use
          const usedPromoCodeIds = new Set(
            overlappingBookings.map((booking) => booking.promo_code_id),
          );

          // Count how many of the user's valid codes are being filtered out
          hiddenCount = validCodes.filter((code: PromoCode) =>
            usedPromoCodeIds.has(code.id),
          ).length;

          // Filter out promo codes that are already in use
          validCodes = validCodes.filter(
            (code: PromoCode) => !usedPromoCodeIds.has(code.id),
          );

          console.log('Filtered out promo codes in use:', {
            total: codes.length,
            afterExpiry: validCodes.length,
            hiddenDueToOverlap: hiddenCount,
            usedPromoCodeIds: Array.from(usedPromoCodeIds),
          });
        }
      }

      setHiddenPromoCodesCount(hiddenCount);
      setPromoCodes(validCodes);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, [userId, checkIn, checkOut, isExpired]);

  useEffect(() => {
    fetchUserPromoCodes();
  }, [fetchUserPromoCodes]);

  useEffect(() => {
    if (selectedPromoCodeId !== undefined) {
      setSelectedId(selectedPromoCodeId);
    }
  }, [selectedPromoCodeId]);

  const calculateExpiryDate = (promoCode: PromoCode): Date | null => {
    if (promoCode.expiry_date) {
      return new Date(promoCode.expiry_date);
    }
    if (promoCode.relative_expiry_months) {
      return addMonths(
        new Date(promoCode.created_at),
        promoCode.relative_expiry_months,
      );
    }
    return null;
  };

  const calculateDiscount = (code: PromoCode): number => {
    if (!totalPrice) return 0;
    return Math.round((totalPrice * code.value) / 100);
  };

  const handleSelect = (promoCodeId: string) => {
    if (selectedId === promoCodeId) {
      setSelectedId(null);
      onSelect(null);
    } else {
      setSelectedId(promoCodeId);
      onSelect(promoCodeId);
    }
  };

  // Hide promo code selector until both check-in and check-out dates are selected
  if (!checkIn || !checkOut) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Ticket className='w-5 h-5' />
            Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (promoCodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Ticket className='w-5 h-5' />
            Promo Code
          </CardTitle>
          <CardDescription>
            You don't have any active promo codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hiddenPromoCodesCount > 0 && (
            <div className='flex items-start gap-2 p-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <AlertCircle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
              <span className='text-sm text-amber-800'>
                {hiddenPromoCodesCount} promo code
                {hiddenPromoCodesCount > 1 ? 's are' : ' is'} unavailable for
                your selected dates (already in use)
              </span>
            </div>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              const currentPath = location.pathname;
              window.location.href = `/apply-promo?returnUrl=${encodeURIComponent(currentPath)}`;
            }}
            className='w-full'
          >
            <Plus className='w-4 h-4 mr-2' />
            Add New Promo Code
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Ticket className='w-5 h-5' />
          Apply Promo Code
        </CardTitle>
        <CardDescription>
          Select a promo code to apply to this booking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <div className='max-h-[300px] overflow-y-auto space-y-2 pr-2'>
            {promoCodes.map((code) => {
              const expiryDate = calculateExpiryDate(code);
              const discount = calculateDiscount(code);
              const isSelected = selectedId === code.id;

              return (
                <button
                  key={code.id}
                  onClick={() => handleSelect(code.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-primary/50 bg-white'
                  }`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-2'>
                        <code className='text-base font-bold font-mono bg-primary/10 px-2 py-1 rounded'>
                          {code.code}
                        </code>
                        {isSelected && (
                          <CheckCircle2 className='w-5 h-5 text-primary flex-shrink-0' />
                        )}
                      </div>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2 text-sm'>
                          <Percent className='w-4 h-4 text-gray-500' />
                          <span className='font-semibold text-green-600'>
                            {code.value}% OFF
                          </span>
                          {totalPrice && (
                            <span className='text-gray-600'>
                              (Save ${discount})
                            </span>
                          )}
                        </div>
                        {expiryDate && (
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Calendar className='w-4 h-4' />
                            <span>
                              Valid until {format(expiryDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hidden promo codes info */}
          {hiddenPromoCodesCount > 0 && (
            <div className='flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <AlertCircle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
              <span className='text-sm text-amber-800'>
                {hiddenPromoCodesCount} promo code
                {hiddenPromoCodesCount > 1 ? 's are' : ' is'} unavailable for
                your selected dates (already in use)
              </span>
            </div>
          )}

          {/* Add new promo code link */}
          <div className='pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                const currentPath = location.pathname;
                window.location.href = `/apply-promo?returnUrl=${encodeURIComponent(currentPath)}`;
              }}
              className='w-full'
            >
              <Plus className='w-4 h-4 mr-2' />
              Add New Promo Code
            </Button>
          </div>

          {selectedId && (
            <div className='pt-3 border-t'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setSelectedId(null);
                  onSelect(null);
                }}
                className='w-full'
              >
                <XCircle className='w-4 h-4 mr-2' />
                Remove Promo Code
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromoCodeSelector;
