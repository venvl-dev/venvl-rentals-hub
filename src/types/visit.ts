export interface ListingVisit {
  id: string;
  user_id: string;
  property_id: string;
  visited_at: string;
  created_at: string;
}

export interface VisitedListing {
  property_id: string;
  title: string;
  property_type: 'apartment' | 'house' | 'villa' | 'studio' | 'cabin' | 'loft';
  price_per_night: number;
  city: string;
  images: string[];
  last_visited_at: string;
  visit_count: number;
}

export interface PropertyVisitStats {
  total_visits: number;
  unique_visitors: number;
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
}

export interface TrackVisitParams {
  propertyId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export interface GetVisitedListingsParams {
  limit?: number;
  offset?: number;
}
