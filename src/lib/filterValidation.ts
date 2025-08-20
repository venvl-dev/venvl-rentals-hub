import { SearchFilters, AdvancedFilters } from '@/hooks/useFilterStore';
import { isValidAmenityId } from './amenitiesUtils';

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateSearchFilters = (filters: SearchFilters): FilterValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate guests
  if (filters.guests < 1) {
    errors.push('Number of guests must be at least 1');
  } else if (filters.guests > 20) {
    warnings.push('Large number of guests may limit available properties');
  }

  // Validate dates
  if (filters.checkIn && filters.checkOut) {
    const checkIn = new Date(filters.checkIn);
    const checkOut = new Date(filters.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      errors.push('Check-in date cannot be in the past');
    }

    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }

    const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (filters.bookingType === 'daily' && daysDiff > 30) {
      warnings.push('Long stays may have better monthly rates');
    }

    if (filters.bookingType === 'monthly' && daysDiff < 28) {
      warnings.push('Short stays may be better suited for daily booking');
    }
  }

  // Validate booking type specific fields
  if (filters.bookingType === 'monthly' && filters.duration) {
    if (filters.duration < 1) {
      errors.push('Monthly duration must be at least 1 month');
    } else if (filters.duration > 12) {
      warnings.push('Very long stays may require special arrangements');
    }
  }

  if (filters.bookingType === 'flexible' && filters.flexibleOption) {
    const validFlexibleOptions = ['weekend', 'week', 'month', 'any'];
    if (!validFlexibleOptions.includes(filters.flexibleOption)) {
      errors.push('Invalid flexible option selected');
    }
  }

  // Validate location
  if (filters.location && filters.location.length < 2) {
    warnings.push('Location search may be too short for accurate results');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateAdvancedFilters = (filters: AdvancedFilters): FilterValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate price range
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    
    if (min < 0) {
      errors.push('Minimum price cannot be negative');
    }
    
    if (max <= min) {
      errors.push('Maximum price must be greater than minimum price');
    }
    
    if (min > 10000) {
      warnings.push('High minimum price may significantly limit results');
    }
    
    if (max - min < 10) {
      warnings.push('Very narrow price range may limit results');
    }
  }

  // Validate property types
  if (filters.propertyTypes) {
    const validPropertyTypes = ['apartment', 'house', 'villa', 'studio', 'cabin', 'loft', 'condo', 'townhouse'];
    const invalidTypes = filters.propertyTypes.filter(type => !validPropertyTypes.includes(type));
    
    if (invalidTypes.length > 0) {
      errors.push(`Invalid property types: ${invalidTypes.join(', ')}`);
    }
    
    if (filters.propertyTypes.length > 5) {
      warnings.push('Selecting many property types may not effectively narrow results');
    }
  }

  // Validate amenities
  if (filters.amenities) {
    const invalidAmenities = filters.amenities.filter(amenity => !isValidAmenityId(amenity));
    
    if (invalidAmenities.length > 0) {
      errors.push(`Invalid amenities: ${invalidAmenities.join(', ')}`);
    }
    
    if (filters.amenities.length > 10) {
      warnings.push('Selecting many amenities may overly restrict results');
    }
  }

  // Validate bedrooms and bathrooms
  if (filters.bedrooms !== null) {
    if (filters.bedrooms < 1) {
      errors.push('Number of bedrooms must be at least 1');
    } else if (filters.bedrooms > 10) {
      warnings.push('Large number of bedrooms may significantly limit results');
    }
  }

  if (filters.bathrooms !== null) {
    if (filters.bathrooms < 1) {
      errors.push('Number of bathrooms must be at least 1');
    } else if (filters.bathrooms > 8) {
      warnings.push('Large number of bathrooms may significantly limit results');
    }
  }

  // Validate booking type
  if (filters.bookingType) {
    const validBookingTypes = ['daily', 'monthly', 'flexible'];
    if (!validBookingTypes.includes(filters.bookingType)) {
      errors.push('Invalid booking type selected');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateCombinedFilters = (
  searchFilters: SearchFilters, 
  advancedFilters: AdvancedFilters
): FilterValidationResult => {
  const searchValidation = validateSearchFilters(searchFilters);
  const advancedValidation = validateAdvancedFilters(advancedFilters);

  const errors = [...searchValidation.errors, ...advancedValidation.errors];
  const warnings = [...searchValidation.warnings, ...advancedValidation.warnings];

  // Cross-validation checks
  const effectiveBookingType = advancedFilters.bookingType || searchFilters.bookingType;
  
  // Check for conflicts between search and advanced booking types
  if (advancedFilters.bookingType && 
      searchFilters.bookingType !== advancedFilters.bookingType) {
    warnings.push(`Advanced filter booking type (${advancedFilters.bookingType}) overrides search booking type (${searchFilters.bookingType})`);
  }

  // Check for overly restrictive combinations
  const restrictiveFactors = [
    searchFilters.location?.trim() ? 1 : 0,
    searchFilters.guests > 4 ? 1 : 0,
    advancedFilters.priceRange && 
    (advancedFilters.priceRange[1] - advancedFilters.priceRange[0]) < 1000 ? 1 : 0,
    advancedFilters.propertyTypes && advancedFilters.propertyTypes.length <= 2 ? 1 : 0,
    advancedFilters.amenities && advancedFilters.amenities.length >= 5 ? 1 : 0,
    advancedFilters.bedrooms && advancedFilters.bedrooms >= 4 ? 1 : 0,
    advancedFilters.bathrooms && advancedFilters.bathrooms >= 3 ? 1 : 0,
  ].reduce((sum, factor) => sum + factor, 0);

  if (restrictiveFactors >= 4) {
    warnings.push('Many restrictive filters are applied - consider relaxing some criteria if you get few results');
  }

  // Check for logical inconsistencies
  if (searchFilters.guests > 8 && 
      advancedFilters.propertyTypes && 
      advancedFilters.propertyTypes.includes('studio')) {
    warnings.push('Studio apartments may not accommodate many guests');
  }

  if (effectiveBookingType === 'monthly' && 
      searchFilters.checkIn && searchFilters.checkOut) {
    const daysDiff = Math.ceil(
      (new Date(searchFilters.checkOut).getTime() - new Date(searchFilters.checkIn).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    if (daysDiff < 28) {
      warnings.push('Monthly booking type with short date range may not find suitable properties');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const sanitizeSearchFilters = (filters: SearchFilters): SearchFilters => {
  return {
    ...filters,
    location: filters.location?.trim() || '',
    guests: Math.max(1, Math.min(20, filters.guests || 1)),
    duration: filters.duration ? Math.max(1, Math.min(12, filters.duration)) : undefined,
  };
};

export const sanitizeAdvancedFilters = (filters: AdvancedFilters): AdvancedFilters => {
  const sanitized = { ...filters };

  // Sanitize price range
  if (sanitized.priceRange) {
    const [min, max] = sanitized.priceRange;
    sanitized.priceRange = [
      Math.max(0, min),
      Math.max(min + 10, max)
    ];
  }

  // Sanitize property types
  if (sanitized.propertyTypes) {
    const validPropertyTypes = ['apartment', 'house', 'villa', 'studio', 'cabin', 'loft', 'condo', 'townhouse'];
    sanitized.propertyTypes = sanitized.propertyTypes.filter(type => validPropertyTypes.includes(type));
    if (sanitized.propertyTypes.length === 0) {
      sanitized.propertyTypes = null;
    }
  }

  // Sanitize amenities
  if (sanitized.amenities) {
    sanitized.amenities = sanitized.amenities.filter(amenity => isValidAmenityId(amenity));
    if (sanitized.amenities.length === 0) {
      sanitized.amenities = null;
    }
  }

  // Sanitize bedrooms and bathrooms
  if (sanitized.bedrooms !== null) {
    sanitized.bedrooms = Math.max(1, Math.min(10, sanitized.bedrooms));
  }

  if (sanitized.bathrooms !== null) {
    sanitized.bathrooms = Math.max(1, Math.min(8, sanitized.bathrooms));
  }

  return sanitized;
};