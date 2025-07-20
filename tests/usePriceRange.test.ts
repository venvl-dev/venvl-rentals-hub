import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { usePriceRange } from '@/hooks/usePriceRange';

// Helpers to mock supabase client
const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock }
}));

function mockSupabaseResponse(data: any[], error: any = null) {
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data, error })
      })
    })
  });
}

describe('usePriceRange', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns default range when no data', async () => {
    mockSupabaseResponse([]);
    const { result } = renderHook(() => usePriceRange('daily'));
    await waitFor(() => !result.current.loading);
    expect(result.current.priceRange).toEqual({ min: 0, max: 10000, distribution: [] });
  });

  it('computes min and max from data', async () => {
    const data = [
      { price_per_night: 100, daily_price: 90, monthly_price: 2000 },
      { price_per_night: 150, daily_price: 0, monthly_price: 3000 }
    ];
    mockSupabaseResponse(data);
    const { result } = renderHook(() => usePriceRange('daily'));
    await waitFor(() => !result.current.loading);
    expect(result.current.priceRange.min).toBe(90);
    expect(result.current.priceRange.max).toBe(150);
  });

  it('handles fetch errors gracefully', async () => {
    mockSupabaseResponse([], { message: 'error' });
    const { result } = renderHook(() => usePriceRange('daily'));
    await waitFor(() => !result.current.loading);
    expect(result.current.priceRange).toEqual({ min: 0, max: 10000, distribution: [] });
  });
});
