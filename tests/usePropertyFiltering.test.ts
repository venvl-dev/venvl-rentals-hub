/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { usePropertyFiltering } from '@/hooks/usePropertyFiltering';
import type { CombinedFilters } from '@/hooks/useFilterStore';

describe('usePropertyFiltering', () => {
  const properties = [
    {
      id: '1',
      title: 'House',
      description: 'Nice',
      price_per_night: 100,
      daily_price: 90,
      monthly_price: 2000,
      images: [],
      city: 'Town',
      state: 'ST',
      country: 'US',
      property_type: 'house',
      bedrooms: 2,
      bathrooms: 1,
      max_guests: 4,
      amenities: ['wifi'],
      is_active: true,
      created_at: '',
      updated_at: '',
      rental_type :"both"

    },
    {
      id: '2',
      title: 'Apartment',
      description: 'Apt',
      price_per_night: 150,
      daily_price: 0,
      monthly_price: 3000,
      images: [],
      city: 'City',
      state: 'ST',
      country: 'US',
      property_type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      amenities: ['wifi', 'pool'],
      is_active: true,
      created_at: '',
      updated_at: '',
      rental_type :"monthly"
    },
    {
      id: '3',
      title: 'Cabin',
      description: 'Cabin',
      price_per_night: 80,
      daily_price: 0,
      monthly_price: 0,
      images: [],
      city: 'Forest',
      state: 'ST',
      country: 'US',
      property_type: 'cabin',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      amenities: [],
      is_active: true,
      created_at: '',
      updated_at: '',
      rental_type :"daily"

    },
  ];

  const baseFilters: CombinedFilters = {
    location: '',
    guests: 1,
    bookingType: 'daily',
    advancedFilters: {
      priceRange: null,
      propertyTypes: null,
      amenities: null,
      bedrooms: null,
      bathrooms: null,
      bookingType: null,
    },
  };

  it('returns empty list when no properties', () => {
    const { result } = renderHook(() => usePropertyFiltering([], baseFilters));
    expect(result.current.filteredProperties).toEqual([]);
  });

  it('filters by location and price range', () => {
    const filters = {
      ...baseFilters,
      location: 'city',
      advancedFilters: { ...baseFilters.advancedFilters, priceRange: [2500, 4000] as [number, number] ,bookingType :"monthly" },
    };
  
    const { result } = renderHook(() => usePropertyFiltering(properties, filters));
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].id).toBe('2');
  });

  it('excludes properties without monthly price when booking monthly', () => {
    const filters = {
      ...baseFilters,
      bookingType: 'monthly' as const,
      advancedFilters: { ...baseFilters.advancedFilters, bookingType: 'monthly', priceRange: [1000, 4000] as [number, number] },
    };
    const { result } = renderHook(() => usePropertyFiltering(properties, filters));
    
    expect(result.current.filteredProperties.length).toBe(2);
    const ids = result.current.filteredProperties.map(p => p.id);
    expect(ids).toContain('1');
    expect(ids).toContain('2');
    expect(ids).not.toContain('3');
  });
});
