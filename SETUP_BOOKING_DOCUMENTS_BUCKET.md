# Setup Guide: booking-documents Storage Bucket

## Overview
The `booking-documents` bucket is required for storing guest ID documents and passports during the booking process.

---

## Step 1: Create the Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `xhzgistgvcbmcfczcrib`
3. Click **Storage** in the left sidebar
4. Click **"New bucket"** or **"Create bucket"** button

### Bucket Configuration:

- **Name**: `booking-documents`
- **Public bucket**: ❌ **NO** (Keep it private for security)
- **File size limit**: `5242880` (5MB in bytes)
- **Allowed MIME types**: `image/jpeg,image/jpg,image/png,application/pdf`

5. Click **"Create bucket"**

---

## Step 2: Set Up Storage Policies

⚠️ **Important**: Storage policies MUST be created through the UI, not SQL Editor.

### Go to Policies Tab

1. In Storage, click on the **"booking-documents"** bucket
2. Click the **"Policies"** tab at the top
3. You should see "No policies yet" message

---

### Policy 1: Guests can upload IDs for their bookings

**Purpose**: Allow authenticated guests to upload IDs to temporary folders

1. Click **"New Policy"**
2. Select **"For full customization"** → **"Create a policy"**
3. Fill in:

   - **Policy name**: `Guests can upload IDs for their bookings`
   - **Policy command**: Select **INSERT**
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (
     (storage.foldername(name))[1] = 'temp-guest-ids'
     OR
     (
       (storage.foldername(name))[1] = 'guest-ids'
       AND EXISTS (
         SELECT 1 FROM bookings
         WHERE bookings.id::text = (storage.foldername(name))[2]
         AND bookings.guest_id = auth.uid()
       )
     )
   )
   ```

4. Click **"Review"** → **"Save policy"**

---

### Policy 2: Guests can read their own IDs

**Purpose**: Allow guests to view/download their uploaded documents

1. Click **"New Policy"**
2. Select **"For full customization"** → **"Create a policy"**
3. Fill in:

   - **Policy name**: `Guests can read their own IDs`
   - **Policy command**: Select **SELECT**
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (
     (storage.foldername(name))[1] = 'temp-guest-ids'
     OR
     (
       (storage.foldername(name))[1] = 'guest-ids'
       AND EXISTS (
         SELECT 1 FROM bookings
         WHERE bookings.id::text = (storage.foldername(name))[2]
         AND bookings.guest_id = auth.uid()
       )
     )
   )
   ```

4. Click **"Review"** → **"Save policy"**

---

### Policy 3: Hosts can read guest IDs for their properties

**Purpose**: Allow property hosts to view guest IDs for verification

1. Click **"New Policy"**
2. Select **"For full customization"** → **"Create a policy"**
3. Fill in:

   - **Policy name**: `Hosts can read guest IDs for their properties`
   - **Policy command**: Select **SELECT**
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (storage.foldername(name))[1] = 'guest-ids'
   AND EXISTS (
     SELECT 1 FROM bookings b
     JOIN properties p ON p.id = b.property_id
     WHERE b.id::text = (storage.foldername(name))[2]
     AND p.host_id = auth.uid()
   )
   ```

4. Click **"Review"** → **"Save policy"**

---

### Policy 4: Admins can read all guest IDs

**Purpose**: Allow super admins to access all documents for moderation

1. Click **"New Policy"**
2. Select **"For full customization"** → **"Create a policy"**
3. Fill in:

   - **Policy name**: `Admins can read all guest IDs`
   - **Policy command**: Select **SELECT**
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND EXISTS (
     SELECT 1 FROM profiles
     WHERE profiles.id = auth.uid()
     AND profiles.role = 'super_admin'
   )
   ```

4. Click **"Review"** → **"Save policy"**

---

### Policy 5: Guests can delete their own IDs (Optional)

**Purpose**: Allow guests to remove uploaded documents if needed

1. Click **"New Policy"**
2. Select **"For full customization"** → **"Create a policy"**
3. Fill in:

   - **Policy name**: `Guests can delete their own IDs`
   - **Policy command**: Select **DELETE**
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (
     (storage.foldername(name))[1] = 'temp-guest-ids'
     OR
     (
       (storage.foldername(name))[1] = 'guest-ids'
       AND EXISTS (
         SELECT 1 FROM bookings
         WHERE bookings.id::text = (storage.foldername(name))[2]
         AND bookings.guest_id = auth.uid()
       )
     )
   )
   ```

4. Click **"Review"** → **"Save policy"**

---

## Step 3: Verify Setup

After creating all policies, you should see them listed in the Policies tab:

- ✅ Guests can upload IDs for their bookings (INSERT)
- ✅ Guests can read their own IDs (SELECT)
- ✅ Hosts can read guest IDs for their properties (SELECT)
- ✅ Admins can read all guest IDs (SELECT)
- ✅ Guests can delete their own IDs (DELETE) - Optional

---

## Step 4: Test the Upload

1. Go to your application
2. Start a new booking
3. Go to the payment page
4. Try uploading an ID document
5. Complete the payment
6. Go to "My Bookings" and click "View IDs/Passport"

If you can see your uploaded documents, everything is working! ✅

---

## Troubleshooting

### Error: "Bucket not found"
- **Solution**: Make sure you created the bucket with the exact name: `booking-documents`
- Check you're in the correct Supabase project

### Error: "new row violates row-level security policy"
- **Solution**: Double-check the policy expressions
- Make sure you're logged in as an authenticated user
- Verify the bucket_id in policies matches exactly: `booking-documents`

### Error: "Access denied" or "Permission denied"
- **Solution**: Verify all policies are created and enabled
- Check that you created policies for both INSERT and SELECT operations
- Make sure the bucket is NOT public (security requirement)

### Files upload but can't be viewed
- **Solution**: Check the SELECT policies are set up correctly
- Verify the file URLs in the database match the actual storage paths

---

## Quick Test (Development Only)

If you want to test quickly without policies:

1. Go to Storage → booking-documents → Configuration
2. Toggle **"Disable RLS"** (Row Level Security)
3. ⚠️ **WARNING**: This makes all files accessible to anyone!
4. **Only use for testing**, re-enable RLS before production

---

## Folder Structure

The app uses this folder structure in the bucket:

```
booking-documents/
├── temp-guest-ids/           # Temporary uploads before booking is confirmed
│   ├── temp-{timestamp}-{random}/
│   │   ├── main-guest-{timestamp}.jpg
│   │   └── adult-1-{timestamp}.jpg
│   └── ...
└── guest-ids/                # Permanent storage after booking confirmation
    ├── {booking-id}/
    │   ├── main-guest-{timestamp}.jpg
    │   ├── adult-1-{timestamp}.pdf
    │   └── adult-2-{timestamp}.png
    └── ...
```

---

## Security Notes

- ✅ Bucket is **private** (not public)
- ✅ Only authenticated users can upload
- ✅ Users can only see their own documents
- ✅ Hosts can only see documents for their properties
- ✅ Admins can see all documents
- ✅ Files are encrypted at rest by Supabase
- ✅ URLs are signed and temporary

---

## Need Help?

If you're still having issues:

1. Check the Supabase Dashboard → Storage → booking-documents → Policies
2. Verify all 4-5 policies are created and enabled
3. Check browser console for detailed error messages
4. Try creating a test upload with RLS temporarily disabled
5. Re-enable RLS after confirming upload works

---

That's it! Your booking documents storage is now set up. 🎉
