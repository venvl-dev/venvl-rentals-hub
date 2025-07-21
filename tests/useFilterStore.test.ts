import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { useFilterStore } from '@/hooks/useFilterStore';
import VenvlAdvancedFilters from '@/components/search/VenvlAdvancedFilters';

const mockUsePriceRange = vi.fn();
vi.mock('@/hooks/usePriceRange', () => ({
  usePriceRange: (...args: any[]) => mockUsePriceRange(...args),
}));

describe('useFilterStore', () => {
  beforeEach(() => {
    mockUsePriceRange.mockReturnValue({ priceRange: { min: 0, max: 1000 }, loading: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates and clears filters correctly', () => {
    const { result } = renderHook(() => useFilterStore());
    act(() => {
      result.current.updateSearchFilters({ location: 'NYC', guests: 3 });
      result.current.updateAdvancedFilters({ bedrooms: 2 });
    });
    expect(result.current.searchFilters.location).toBe('NYC');
    expect(result.current.searchFilters.guests).toBe(3);
    expect(result.current.advancedFilters.bedrooms).toBe(2);

    act(() => {
      result.current.clearAdvancedFilters();
    });
    expect(result.current.advancedFilters.bedrooms).toBeNull();
    expect(result.current.searchFilters.location).toBe('NYC');

    act(() => {
      result.current.clearAllFilters();
    });
    expect(result.current.searchFilters.location).toBe('');
    expect(result.current.searchFilters.guests).toBe(1);
    expect(result.current.advancedFilters.priceRange).toBeNull();
  });

  it('keeps price range after modal reopen', () => {
    const { result } = renderHook(() => useFilterStore());

    act(() => {
      result.current.updateAdvancedFilters({ priceRange: [100, 500] });
    });

    act(() => {
      result.current.syncPriceRange();
    });

    expect(result.current.advancedFilters.priceRange).toEqual([100, 500]);
  });

  it('reset button clears filters in the store', () => {
    const { result } = renderHook(() => useFilterStore());

    act(() => {
      result.current.updateAdvancedFilters({ priceRange: [50, 150], bedrooms: 2 });
    });

    render(
      <VenvlAdvancedFilters
        onFiltersChange={result.current.updateAdvancedFilters}
        onClose={() => {}}
        initialFilters={result.current.advancedFilters}
      />
    );

    const resetBtn = screen.getByText('Reset');
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(result.current.advancedFilters).toEqual({
      priceRange: null,
      propertyTypes: null,
      amenities: null,
      bedrooms: null,
      bathrooms: null,
      bookingType: null,
    });
  });
});
