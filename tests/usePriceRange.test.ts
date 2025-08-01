import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock supabase client - use vi.hoisted for proper hoisting
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom }
}));

// Import after the mock
import { usePriceRange } from '@/hooks/usePriceRange';

function mockSupabaseResponse(data: any[], error: any = null) {
  mockFrom.mockReturnValue({
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

  it('returns fallback range when no data', async () => {
    mockSupabaseResponse([]);
    const { result } = renderHook(() => usePriceRange('daily'));
    await waitFor(() => !result.current.loading);
    expect(result.current.priceRange).toEqual({ min: 50, max: 2000, distribution: [] });
  });

  it('computes min and max from data with padding', async () => {
    const data = [
      { price_per_night: 100, daily_price: 90, monthly_price: 2000 },
      { price_per_night: 150, daily_price: 0, monthly_price: 3000 }
    ];
    mockSupabaseResponse(data);
    const { result } = renderHook(() => usePriceRange('daily'));
    await waitFor(() => !result.current.loading);
    // The hook adds 3% padding: min = 90 * 0.97 = 87.3, max = 150 * 1.02 = 153
    expect(result.current.priceRange.min).toBe(87);
    expect(result.current.priceRange.max).toBe(153);
  });

  it('handles fetch errors gracefully', async () => {
    mockSupabaseResponse([], { message: 'error' });
    const { result } = renderHook(() => usePriceRange('daily'));
    await waitFor(() => !result.current.loading);
    // With error, the hook should return null
    expect(result.current.priceRange).toBeNull();
  });
});
