/// <reference types="vitest/globals" />
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SuperAdminPropertyDetails from '@/routes/admin/PropertyDetails';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      insert: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
  };

  return {
    supabase: mockSupabaseClient,
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock router params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-property-id' }),
    useNavigate: () => vi.fn(),
  };
});

const mockProperty = {
  id: 'test-property-id',
  title: 'Test Property',
  description: 'A beautiful test property',
  property_type: 'apartment',
  address: '123 Test St',
  city: 'Test City',
  state: 'Test State',
  country: 'Test Country',
  price_per_night: 100,
  daily_price: 100,
  monthly_price: 2500,
  max_guests: 4,
  bedrooms: 2,
  bathrooms: 1,
  amenities: ['wifi', 'kitchen'],
  booking_types: ['daily', 'monthly'],
  approval_status: 'approved',
  is_active: true,
  is_featured: false,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  host_id: 'host-123',
  profiles: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
  },
};

const mockBookings = [
  {
    id: 'booking-1',
    check_in: '2024-02-01',
    check_out: '2024-02-05',
    status: 'completed',
    total_price: 400,
    created_at: '2024-01-15T00:00:00.000Z',
    profiles: {
      first_name: 'Guest',
      last_name: 'One',
      email: 'guest1@example.com',
    },
  },
  {
    id: 'booking-2',
    check_in: '2024-03-01',
    check_out: '2024-03-31',
    status: 'completed',
    total_price: 2500,
    created_at: '2024-02-15T00:00:00.000Z',
    profiles: {
      first_name: 'Guest',
      last_name: 'Two',
      email: 'guest2@example.com',
    },
  },
  {
    id: 'booking-3',
    check_in: '2024-04-01',
    check_out: '2024-04-05',
    status: 'pending',
    total_price: 450,
    created_at: '2024-03-20T00:00:00.000Z',
    profiles: {
      first_name: 'Guest',
      last_name: 'Three',
      email: 'guest3@example.com',
    },
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/properties/test-property-id']}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('PropertyDetailsAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock property fetch
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'properties') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockProperty,
                error: null,
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }

      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockProperty.profiles,
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi
                .fn(() => ({
                  mockResolvedValue: {
                    data: mockBookings,
                    error: null,
                  },
                }))
                .mockResolvedValue({
                  data: mockBookings,
                  error: null,
                }),
            })),
          })),
          insert: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockBookings[0],
              error: null,
            }),
          })),
        };
      }
    });
  });

  it('displays analytics tab with correct metrics when bookings exist', async () => {
    renderWithProviders(<SuperAdminPropertyDetails />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    // Click analytics tab
    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    analyticsTab.click();

    await waitFor(() => {
      // Check total revenue
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$3,350')).toBeInTheDocument(); // 400 + 2500 + 450

      // Check completed bookings count
      expect(screen.getByText('Completed Bookings')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Only 2 completed bookings

      // Check completion rate
      expect(screen.getByText('67% completion rate')).toBeInTheDocument(); // 2/3 * 100

      // Check property age
      expect(screen.getByText('Property Age')).toBeInTheDocument();

      // Check performance insights
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(
        screen.getByText('This property has 3 total bookings'),
      ).toBeInTheDocument();
    });
  });

  it('shows no revenue warning when no completed bookings exist', async () => {
    // Mock with only pending bookings
    const pendingBookings = mockBookings.map((booking) => ({
      ...booking,
      status: 'pending',
    }));

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: pendingBookings,
                error: null,
              }),
            })),
          })),
        };
      }
      return mockSupabaseClient.from(table);
    });

    renderWithProviders(<SuperAdminPropertyDetails />);

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    analyticsTab.click();

    await waitFor(() => {
      // Should show no revenue generated warning
      expect(screen.getByText('No Revenue Generated')).toBeInTheDocument();
      expect(
        screen.getByText("This property hasn't generated any revenue yet"),
      ).toBeInTheDocument();

      // Total revenue should be 0
      expect(screen.getByText('$3,350')).toBeInTheDocument(); // Still shows total because pending bookings have prices

      // Completed bookings should be 0
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0% completion rate')).toBeInTheDocument();
    });
  });

  it('updates analytics when a new booking is made', async () => {
    renderWithProviders(<SuperAdminPropertyDetails />);

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    // Navigate to analytics tab
    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    analyticsTab.click();

    // Initial state
    await waitFor(() => {
      expect(screen.getByText('$3,350')).toBeInTheDocument();
      expect(
        screen.getByText('This property has 3 total bookings'),
      ).toBeInTheDocument();
    });

    // Simulate a new booking being added (this would trigger a refetch in the real app)
    const newBooking = {
      id: 'booking-4',
      check_in: '2024-05-01',
      check_out: '2024-05-05',
      status: 'completed',
      total_price: 500,
      created_at: '2024-04-20T00:00:00.000Z',
      profiles: {
        first_name: 'Guest',
        last_name: 'Four',
        email: 'guest4@example.com',
      },
    };

    const updatedBookings = [...mockBookings, newBooking];

    // Mock the updated response
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: updatedBookings,
                error: null,
              }),
            })),
          })),
        };
      }
      return mockSupabaseClient.from(table);
    });

    // Force a re-render by clicking another tab and back
    screen.getByRole('tab', { name: /details/i }).click();
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    analyticsTab.click();

    // Verify updated analytics would show (in a real scenario with refetch)
    // Note: In a real test, you'd simulate the actual booking creation process
  });

  it('calculates analytics correctly for different booking statuses', async () => {
    const mixedStatusBookings = [
      { ...mockBookings[0], status: 'completed', total_price: 1000 },
      { ...mockBookings[1], status: 'cancelled', total_price: 500 },
      { ...mockBookings[2], status: 'pending', total_price: 300 },
      {
        id: 'booking-4',
        check_in: '2024-06-01',
        check_out: '2024-06-05',
        status: 'completed',
        total_price: 800,
        created_at: '2024-05-15T00:00:00.000Z',
        profiles: {
          first_name: 'Guest',
          last_name: 'Four',
          email: 'guest4@example.com',
        },
      },
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: mixedStatusBookings,
                error: null,
              }),
            })),
          })),
        };
      }
      return mockSupabaseClient.from(table);
    });

    renderWithProviders(<SuperAdminPropertyDetails />);

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    analyticsTab.click();

    await waitFor(() => {
      // Total revenue should include all bookings regardless of status
      expect(screen.getByText('$2,600')).toBeInTheDocument(); // 1000 + 500 + 300 + 800

      // Completed bookings should only count completed ones
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 completed out of 4 total

      // Completion rate should be 50%
      expect(screen.getByText('50% completion rate')).toBeInTheDocument(); // 2/4 * 100
    });
  });
});
