# Storage Policies Setup Guide (UI Method)

## ⚠️ Important Note
Storage policies cannot be created via SQL Editor due to permission restrictions. Follow this UI-based method instead.

---

## Step 1: Go to Storage in Supabase Dashboard

1. Open your Supabase Dashboard
2. Click **"Storage"** in the left sidebar
3. Click on the **"booking-documents"** bucket

---

## Step 2: Create Policies

Click on **"Policies"** tab at the top

### Policy 1: Guests can upload IDs for their bookings

1. Click **"New Policy"**
2. Select **"For full customization"** → Start from scratch
3. Fill in:
   - **Policy name**: `Guests can upload IDs for their bookings`
   - **Allowed operation**: Check ✅ **INSERT**
   - **Target roles**: `authenticated`
   - **USING expression**: Leave empty
   - **WITH CHECK expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (storage.foldername(name))[1] = 'guest-ids'
   AND EXISTS (
     SELECT 1 FROM bookings
     WHERE bookings.id::text = (storage.foldername(name))[2]
     AND bookings.guest_id = auth.uid()
   )
   ```
4. Click **"Review"** → **"Save Policy"**

---

### Policy 2: Guests can read their own IDs

1. Click **"New Policy"** again
2. Select **"For full customization"** → Start from scratch
3. Fill in:
   - **Policy name**: `Guests can read their own IDs`
   - **Allowed operation**: Check ✅ **SELECT**
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (storage.foldername(name))[1] = 'guest-ids'
   AND EXISTS (
     SELECT 1 FROM bookings
     WHERE bookings.id::text = (storage.foldername(name))[2]
     AND bookings.guest_id = auth.uid()
   )
   ```
   - **WITH CHECK expression**: Leave empty
4. Click **"Review"** → **"Save Policy"**

---

### Policy 3: Admins and hosts can read guest IDs

1. Click **"New Policy"** again
2. Select **"For full customization"** → Start from scratch
3. Fill in:
   - **Policy name**: `Admins and hosts can read guest IDs`
   - **Allowed operation**: Check ✅ **SELECT**
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (storage.foldername(name))[1] = 'guest-ids'
   AND (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role = 'super_admin'
     )
     OR
     EXISTS (
       SELECT 1 FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE b.id::text = (storage.foldername(name))[2]
       AND p.host_id = auth.uid()
     )
   )
   ```
   - **WITH CHECK expression**: Leave empty
4. Click **"Review"** → **"Save Policy"**

---

### Policy 4: Guests can delete their own IDs (Optional)

1. Click **"New Policy"** again
2. Select **"For full customization"** → Start from scratch
3. Fill in:
   - **Policy name**: `Guests can delete their own IDs`
   - **Allowed operation**: Check ✅ **DELETE**
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'booking-documents'
   AND (storage.foldername(name))[1] = 'guest-ids'
   AND EXISTS (
     SELECT 1 FROM bookings
     WHERE bookings.id::text = (storage.foldername(name))[2]
     AND bookings.guest_id = auth.uid()
   )
   ```
   - **WITH CHECK expression**: Leave empty
4. Click **"Review"** → **"Save Policy"**

---

## Step 3: Verify Policies

After creating all policies, you should see them listed in the Policies tab:

- ✅ Guests can upload IDs for their bookings (INSERT)
- ✅ Guests can read their own IDs (SELECT)
- ✅ Admins and hosts can read guest IDs (SELECT)
- ✅ Guests can delete their own IDs (DELETE)

---

## Quick Test

After creating policies, test if they work:

1. Make a test booking and complete payment
2. Try uploading an ID on the upload page
3. If successful, policies are working! ✅
4. If you get permission errors, double-check the policies

---

## Troubleshooting

**Problem**: "new row violates row-level security policy"
- **Solution**: Check the policy expressions are correct
- Make sure `booking-documents` bucket exists
- Verify user is authenticated

**Problem**: Cannot save policy
- **Solution**: Check SQL syntax in expressions
- Remove any trailing semicolons
- Make sure all parentheses are balanced

---

## Alternative Method: Disable RLS (NOT RECOMMENDED for production)

If you want to test quickly (development only):

1. Go to Storage → booking-documents → Policies
2. Click **"Disable RLS"** toggle
3. **⚠️ WARNING**: This makes all files publicly accessible!
4. Only use for testing, re-enable RLS before production

---

That's it! Your storage policies are now set up. 🎉
