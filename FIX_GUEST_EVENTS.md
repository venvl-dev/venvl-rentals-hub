# Fix for guest_events Column Error

## Problem
The `log_guest_event` function was trying to insert into columns that don't exist in your `guest_events` table.

## Solution
Apply the fix migration that simplifies the function to only use existing columns.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of:
   ```
   supabase/migrations/20251118000001-fix-guest-events-function.sql
   ```
5. Click **Run**

### Option 2: Using npx

```bash
npx supabase db push
```

## What This Fix Does

1. **Simplifies `log_guest_event` function**
   - Removes optional parameters that may not exist (`session_id`, `device_type`, `user_agent`)
   - Only inserts required columns: `type`, `payload`, `user_id`

2. **Updates wishlist functions**
   - `add_to_wishlist` - Updated to use simplified event logging
   - `remove_from_wishlist` - Updated to use simplified event logging

## After Applying

1. Restart your dev server (if it's still running):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. Test the wishlist feature:
   - Click heart icon on a property
   - Check that no errors occur
   - Verify event is logged in database

## Verify Events Are Being Logged

Run this query in Supabase SQL Editor:

```sql
SELECT id, type, payload, user_id, ts
FROM guest_events
WHERE type IN ('wishlist_add', 'wishlist_remove')
ORDER BY ts DESC
LIMIT 10;
```

You should see your wishlist events with payload like:
```json
{
  "property_id": "uuid-here",
  "list_name": "default",
  "action_source": "detail_page"
}
```

## Note

If you need to track additional event metadata (like session_id, device_type, etc.), you'll need to:

1. First add those columns to the `guest_events` table
2. Then update the `log_guest_event` function to include them

For now, the basic event tracking (type, payload, user_id, timestamp) is working.
