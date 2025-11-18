# How to Apply the Wishlist Migration

Since Supabase CLI is not installed, you have two options:

## Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of this file:
   ```
   supabase/migrations/20251118000000-add-wishlist-tracking.sql
   ```
5. Click **Run** or press `Ctrl+Enter`
6. Verify success - you should see "Success. No rows returned"

## Option 2: Install Supabase CLI

### Install Supabase CLI:

**Windows (using npm):**
```bash
npm install -g supabase
```

**Windows (using scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Then run:
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Verify Migration Success

After applying the migration, verify it worked by running this query in SQL Editor:

```sql
-- Check if wishlists table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'wishlists'
);

-- Check if wishlist_count column exists in guest_profiles
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guest_profiles'
  AND column_name = 'wishlist_count';

-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'add_to_wishlist',
    'remove_from_wishlist',
    'get_user_wishlist',
    'is_in_wishlist',
    'get_wishlist_count',
    'log_guest_event'
  );
```

All queries should return results if the migration was successful.

## Update TypeScript Types

After the migration is applied, you'll need to regenerate your Supabase types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/integrations/supabase/types.ts
```

Or manually add the wishlist types to your existing types file.

## Troubleshooting

If you get errors about duplicate objects, it means parts of the migration already exist. You can:

1. Drop existing objects first (be careful in production!)
2. Modify the migration to use `CREATE OR REPLACE` for functions
3. Skip the parts that already exist

For help, check the error message in the Supabase Dashboard SQL Editor.
