# Storage Setup Guide

This guide will help you set up the required Supabase storage buckets for the VENVL application.

## Required Buckets

You need to create two storage buckets in your Supabase project:

### 1. property-images
- **Purpose**: Store property listing images
- **File size limit**: 5MB per file
- **Allowed file types**: JPEG, PNG, GIF, WebP
- **Public access**: Yes

### 2. property-videos
- **Purpose**: Store property listing videos
- **File size limit**: 50MB per file
- **Allowed file types**: MP4, MOV, AVI, QuickTime
- **Public access**: Yes

## Manual Setup (Recommended)

### Step 1: Create Buckets

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `xhzgistgvcbmcfczcrib`
3. Navigate to **Storage** in the left sidebar
4. Click **Create Bucket**

For each bucket:

**property-images:**
- Name: `property-images`
- Public bucket: ✅ Yes
- File size limit: `5242880` (5MB)
- Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

**property-videos:**
- Name: `property-videos`
- Public bucket: ✅ Yes
- File size limit: `52428800` (50MB)
- Allowed MIME types: `video/mp4,video/mov,video/avi,video/quicktime`

### Step 2: Set Up Security Policies

For each bucket, you need to create RLS (Row Level Security) policies:

1. Go to **Storage** → **Policies**
2. Click **New Policy** for each bucket

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images'); -- or 'property-videos'
```

**Policy 2: Allow public read access**
```sql
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'property-images'); -- or 'property-videos'
```

**Policy 3: Allow users to delete their own files**
```sql
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'property-images'); -- or 'property-videos'
```

## Automated Setup (Alternative)

If you have the service role key, you can run the automated setup script:

### Step 1: Add Service Role Key

Add your service role key to `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 2: Run Setup Script

```bash
node scripts/setup-storage-buckets.js
```

## Verification

After setup, verify the buckets work by:

1. Going to **Storage** in your Supabase dashboard
2. Checking that both buckets appear in the list
3. Testing file upload in the application

## Troubleshooting

### "Bucket not found" error
- Ensure bucket names are exactly: `property-images` and `property-videos`
- Check that buckets are created in the correct Supabase project

### "Access denied" error
- Verify RLS policies are set up correctly
- Check that buckets are marked as public
- Ensure you're authenticated when uploading files

### File upload fails
- Check file size limits (5MB for images, 50MB for videos)
- Verify file types are allowed
- Check browser console for detailed error messages

## Need Help?

If you encounter issues:
1. Check the Supabase dashboard logs
2. Verify your environment variables
3. Ensure your internet connection is stable
4. Check browser console for JavaScript errors