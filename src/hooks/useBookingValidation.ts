
import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';

interface UseBookingValidationProps {
  bookingMode: 'daily' | 'monthly';
  checkIn?: Date;
  checkOut?: Date;
  monthlyStartDate?: Date;
  monthlyDuration: number;
  minNights?: number;
  minMonths?: number;
  totalPrice: number;
}

export const useBookingValidation = ({
  bookingMode,
  checkIn,
  checkOut,
  monthlyStartDate,
  monthlyDuration,
  minNights,
  minMonths,
  totalPrice,
}: UseBookingValidationProps) => {
  const validation = useMemo(() => {
    const errors: string[] = [];
    let canProceed = true;

    if (bookingMode === 'daily') {
      if (!checkIn || !checkOut) {
        errors.push('Please select check-in and check-out dates');
        canProceed = false;
      } else {
        const nights = differenceInDays(checkOut, checkIn);
        if (minNights && nights < minNights) {
          errors.push(`Minimum stay is ${minNights} night${minNights > 1 ? 's' : ''}`);
          canProceed = false;
        }
      }
    } else if (bookingMode === 'monthly') {
      if (!monthlyStartDate) {
        errors.push('Please select a start date');
        canProceed = false;
      }
      if (minMonths && monthlyDuration < minMonths) {
        errors.push(`Minimum stay is ${minMonths} month${minMonths > 1 ? 's' : ''}`);
        canProceed = false;
      }
    }

    if (totalPrice === 0) {
      canProceed = false;
    }

    return {
      isValid: canProceed && errors.length === 0,
      errors,
      canProceed,
    };
  }, [bookingMode, checkIn, checkOut, monthlyStartDate, monthlyDuration, minNights, minMonths, totalPrice]);

  return validation;
};
