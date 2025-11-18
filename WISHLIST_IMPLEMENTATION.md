# Wishlist Feature Implementation

This document describes the implementation of the wishlist feature for tracking guest property preferences.

## Overview

The wishlist feature allows authenticated users to save properties they're interested in, enabling better recommendations and user experience. All wishlist actions are logged as events for analytics purposes.

## Acceptance Criteria Met

- ✅ Event types: `wishlist_add`, `wishlist_remove`
- ✅ Payload: `{property_id, list_name, action_source}`
- ✅ Wishlist depth tracked in `guest_profiles.wishlist_count`
- ✅ Duplicate adds are idempotent (no-op, timestamp updated)
- ✅ Removed item re-added generates new timestamp
- ✅ Dependencies: Uses existing `guest_events` table and creates new `wishlists` table

## Database Schema

### New Table: `wishlists`

```sql
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  property_id UUID REFERENCES properties(id),
  list_name TEXT DEFAULT 'default',
  action_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, property_id, list_name)
);
```

### Updated Table: `guest_profiles`

Added column:
- `wishlist_count INTEGER` - Tracks total items in user's wishlist

### Event Tracking: `guest_events`

Events are logged with type:
- `wishlist_add` - When property is added to wishlist
- `wishlist_remove` - When property is removed from wishlist

Payload structure:
```json
{
  "property_id": "uuid",
  "list_name": "default",
  "action_source": "detail_page" // or "search_results", "map_view", etc.
}
```

## Database Functions

### `add_to_wishlist(target_property_id, p_list_name, p_action_source)`
- Adds property to wishlist (idempotent)
- Updates `guest_profiles.wishlist_count` on new additions
- Logs `wishlist_add` event for new additions only
- Returns: `{id, is_new, message}`

### `remove_from_wishlist(target_property_id, p_list_name)`
- Removes property from wishlist
- Decrements `guest_profiles.wishlist_count`
- Logs `wishlist_remove` event
- Returns: `{was_deleted, message}`

### `get_user_wishlist(p_list_name, limit_count, offset_count)`
- Retrieves user's wishlist with property details
- Returns property information with wishlist metadata
- Supports pagination

### `is_in_wishlist(target_property_id, p_list_name)`
- Checks if property is in user's wishlist
- Returns boolean

### `get_wishlist_count(p_list_name)`
- Gets count of items in wishlist
- Can filter by list name or get total across all lists

### `log_guest_event(event_type, event_payload, ...)`
- Generic function for logging guest events
- Used internally by wishlist functions

## Application Layer

### Types (`src/types/wishlist.ts`)
- `Wishlist` - Database record type
- `WishlistProperty` - Wishlist item with property details
- `AddToWishlistParams` - Parameters for adding to wishlist
- `RemoveFromWishlistParams` - Parameters for removing from wishlist
- `WishlistEventPayload` - Event payload structure

### Service Layer (`src/lib/wishlistService.ts`)

The `WishlistService` class provides methods:
- `addToWishlist(params)` - Add property to wishlist
- `removeFromWishlist(params)` - Remove property from wishlist
- `getWishlist(params)` - Get user's wishlist
- `isInWishlist(propertyId, listName)` - Check wishlist status
- `getWishlistCount(listName?)` - Get count of wishlist items
- `toggleWishlist(params)` - Toggle property in wishlist

### React Hooks (`src/hooks/useWishlist.ts`)

- `useWishlist(params)` - Query hook for fetching wishlist
- `useIsInWishlist(propertyId, listName)` - Query hook for checking status
- `useWishlistCount(listName?)` - Query hook for count
- `useAddToWishlist()` - Mutation hook for adding
- `useRemoveFromWishlist()` - Mutation hook for removing
- `useToggleWishlist()` - Mutation hook for toggling

### Components

#### `WishlistButton` (`src/components/wishlist/WishlistButton.tsx`)
Reusable button component for adding/removing properties from wishlist.

Props:
- `propertyId` - ID of the property
- `listName` - Optional list name (default: 'default')
- `actionSource` - Source of the action (e.g., 'detail_page', 'search_results')
- `variant` - Button variant
- `size` - Button size
- `className` - Additional CSS classes
- `showLabel` - Whether to show "Saved"/"Save" label

Features:
- Shows filled heart when property is in wishlist
- Redirects to auth if user not logged in
- Shows loading state during API calls
- Provides visual feedback on hover

#### Wishlist Page (`src/pages/Wishlist.tsx`)
Full page for viewing and managing wishlist.

Features:
- Grid layout of saved properties
- Property cards with images and details
- Remove button on each card
- Click card to navigate to property details
- Empty state with call to action
- Loading skeletons
- Error handling

## Usage Examples

### Adding Wishlist Button to Property Card

```tsx
import { WishlistButton } from '@/components/wishlist/WishlistButton';

<PropertyCard>
  {/* ... property content ... */}
  <WishlistButton
    propertyId={property.id}
    actionSource="search_results"
    size="icon"
  />
</PropertyCard>
```

### Using in Property Detail Page

```tsx
import { WishlistButton } from '@/components/wishlist/WishlistButton';

<div className="property-header">
  <h1>{property.title}</h1>
  <WishlistButton
    propertyId={property.id}
    actionSource="detail_page"
    showLabel={true}
  />
</div>
```

### Programmatic Wishlist Management

```tsx
import { useToggleWishlist } from '@/hooks/useWishlist';

const MyComponent = () => {
  const toggleWishlist = useToggleWishlist();

  const handleSave = () => {
    toggleWishlist.mutate({
      propertyId: 'property-uuid',
      listName: 'default',
      actionSource: 'map_view'
    });
  };

  return <button onClick={handleSave}>Toggle Wishlist</button>;
};
```

## Edge Cases Handled

1. **Duplicate Adds**: Calling `add_to_wishlist` multiple times is idempotent
   - Does not create duplicate entries
   - Updates `updated_at` timestamp
   - Does not increment `wishlist_count`
   - Does not log duplicate events

2. **Remove Non-Existent Item**: Returns `was_deleted: false` without error

3. **Re-adding Removed Item**: Creates new entry with fresh timestamp

4. **Unauthenticated Users**:
   - Button shows but redirects to login
   - Database functions reject anonymous requests

5. **Deleted Properties**: Wishlist page filters out inactive/deleted properties

6. **Concurrent Updates**: Unique constraint prevents race conditions

## Security

- Row Level Security (RLS) policies enforce data isolation
- Users can only view/modify their own wishlists
- All database functions use `auth.uid()` for user context
- `SECURITY DEFINER` functions have proper authorization checks

## Performance Considerations

- Indexes on frequently queried columns:
  - `idx_wishlists_user_id`
  - `idx_wishlists_property_id`
  - `idx_wishlists_user_list`
  - `idx_wishlists_created_at`
  - `idx_guest_profiles_wishlist_count`

- Query caching via React Query:
  - Wishlist: 1 minute stale time
  - Status check: 30 seconds stale time
  - Count: 1 minute stale time

- Automatic cache invalidation on mutations

## Migration

To apply the schema changes:

```bash
# Run the migration
supabase db push

# Or apply specific migration
supabase migration up
```

The migration file is located at:
`supabase/migrations/20251118000000-add-wishlist-tracking.sql`

## Testing Checklist

- [ ] User can add property to wishlist from detail page
- [ ] User can add property to wishlist from search results
- [ ] Duplicate adds don't create new entries
- [ ] User can remove property from wishlist
- [ ] Wishlist count updates correctly
- [ ] Events are logged properly in `guest_events` table
- [ ] Wishlist page displays saved properties
- [ ] Clicking property card navigates to detail page
- [ ] Empty state shows when no properties saved
- [ ] Unauthenticated users redirected to login
- [ ] RLS policies prevent unauthorized access
- [ ] Re-adding removed item creates new timestamp

## Analytics Queries

### Most Wishlisted Properties
```sql
SELECT
  p.title,
  p.city,
  COUNT(w.id) as wishlist_count
FROM properties p
JOIN wishlists w ON w.property_id = p.id
GROUP BY p.id, p.title, p.city
ORDER BY wishlist_count DESC
LIMIT 10;
```

### Wishlist Conversion Rate
```sql
SELECT
  COUNT(DISTINCT w.user_id) as users_with_wishlists,
  COUNT(DISTINCT b.guest_id) as users_with_bookings,
  ROUND(
    COUNT(DISTINCT b.guest_id)::NUMERIC /
    NULLIF(COUNT(DISTINCT w.user_id), 0) * 100,
    2
  ) as conversion_rate
FROM wishlists w
LEFT JOIN bookings b ON b.guest_id = w.user_id;
```

### Action Source Distribution
```sql
SELECT
  action_source,
  COUNT(*) as count
FROM wishlists
WHERE action_source IS NOT NULL
GROUP BY action_source
ORDER BY count DESC;
```

## Future Enhancements

- [ ] Multiple named wishlists (e.g., "Summer Vacation", "Work Trip")
- [ ] Wishlist sharing via URL
- [ ] Email notifications for price drops on wishlisted properties
- [ ] Wishlist-based recommendations
- [ ] Batch operations (clear all, remove multiple)
- [ ] Wishlist analytics dashboard for users

## Related Files

- Migration: `supabase/migrations/20251118000000-add-wishlist-tracking.sql`
- Types: `src/types/wishlist.ts`
- Service: `src/lib/wishlistService.ts`
- Hooks: `src/hooks/useWishlist.ts`
- Button: `src/components/wishlist/WishlistButton.tsx`
- Page: `src/pages/Wishlist.tsx`
- Routes: `src/App.tsx`
