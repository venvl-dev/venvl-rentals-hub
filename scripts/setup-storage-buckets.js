import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- VITE_SUPABASE_URL');
  if (!supabaseKey)
    console.error('- SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  console.error(
    '\nTo create buckets, you need the service role key from your Supabase dashboard.',
  );
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log(
    '⚠️  Using anon key - bucket creation may fail. Please use service role key for admin operations.\n',
  );
}

async function createStorageBuckets() {
  console.log('🚀 Setting up Supabase storage buckets...\n');

  const buckets = [
    {
      name: 'property-images',
      options: {
        public: true,
        fileSizeLimit: 5242880, // 5MB in bytes
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
      },
    },
    {
      name: 'property-videos',
      options: {
        public: true,
        fileSizeLimit: 52428800, // 50MB in bytes
        allowedMimeTypes: [
          'video/mp4',
          'video/mov',
          'video/avi',
          'video/quicktime',
        ],
      },
    },
  ];

  for (const bucket of buckets) {
    try {
      console.log(`📁 Creating bucket: ${bucket.name}`);

      // Try to create the bucket
      const { data, error } = await supabase.storage.createBucket(
        bucket.name,
        bucket.options,
      );

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ✅ Bucket '${bucket.name}' already exists`);
        } else {
          console.error(
            `   ❌ Error creating bucket '${bucket.name}':`,
            error.message,
          );
          continue;
        }
      } else {
        console.log(`   ✅ Successfully created bucket '${bucket.name}'`);
      }

      // Note: RLS policies need to be set up manually in Supabase Dashboard
      console.log(
        `📋 Please set up these RLS policies manually in Supabase Dashboard:`,
      );
      console.log(
        `   1. Allow authenticated users to INSERT into bucket '${bucket.name}'`,
      );
      console.log(`   2. Allow public SELECT from bucket '${bucket.name}'`);
      console.log(
        `   3. Allow users to DELETE their own files from bucket '${bucket.name}'`,
      );

      console.log();
    } catch (error) {
      console.error(`❌ Unexpected error with bucket '${bucket.name}':`, error);
    }
  }

  console.log('🎉 Storage bucket setup completed!\n');

  // Test bucket access
  console.log('🧪 Testing bucket access...');

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket.name).list();
      if (error) {
        console.error(
          `   ❌ Cannot access bucket '${bucket.name}':`,
          error.message,
        );
      } else {
        console.log(`   ✅ Bucket '${bucket.name}' is accessible`);
      }
    } catch (error) {
      console.error(
        `   ❌ Error testing bucket '${bucket.name}':`,
        error.message,
      );
    }
  }

  console.log('\n✨ Setup complete! Your storage buckets are ready to use.');
}

// Run the setup
createStorageBuckets().catch(console.error);
