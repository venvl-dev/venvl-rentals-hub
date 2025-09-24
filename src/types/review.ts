export interface Review {
  id: string;
  booking_id: string;
  guest_id: string;
  property_id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;

  // Joined data
  property?: {
    title: string;
    images: string[];
  };
}
