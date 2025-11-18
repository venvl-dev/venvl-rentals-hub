export interface Wishlist {
  id: string;
  user_id: string;
  property_id: string;
  list_name: string;
  action_source?: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistProperty {
  wishlist_id: string;
  property_id: string;
  title: string;
  property_type: 'apartment' | 'house' | 'villa' | 'studio' | 'cabin' | 'loft';
  price_per_night: number;
  city: string;
  images: string[];
  action_source?: string;
  added_at: string;
}

export interface AddToWishlistParams {
  propertyId: string;
  listName?: string;
  actionSource?: 'detail_page' | 'search_results' | 'map_view' | 'similar_properties' | string;
}

export interface RemoveFromWishlistParams {
  propertyId: string;
  listName?: string;
}

export interface GetWishlistParams {
  listName?: string;
  limit?: number;
  offset?: number;
}

export interface WishlistEventPayload {
  property_id: string;
  list_name: string;
  action_source?: string;
}

export interface AddToWishlistResponse {
  id: string;
  is_new: boolean;
  message: string;
}

export interface RemoveFromWishlistResponse {
  was_deleted: boolean;
  message: string;
}
