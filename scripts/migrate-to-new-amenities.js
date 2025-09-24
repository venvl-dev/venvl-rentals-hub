// Script to migrate existing properties to the new amenities system
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    '❌ Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
  );
  console.error(
    'Please copy .env.example to .env and set your Supabase credentials.',
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

// Old to new amenity mapping
const amenityMapping = {
  WiFi: 'wifi',
  'Wi-Fi': 'wifi',
  Kitchen: 'kitchen',
  'Air Conditioning': 'air_conditioning',
  'Free Parking': 'parking',
  Parking: 'parking',
  Security: 'security',
  Heating: 'heating',
  'Washing Machine': 'washing_machine',
  Washer: 'washing_machine',
  'Private Entrance': 'private_entrance',
  Elevator: 'elevator',
  Workspace: 'workspace',
  Balcony: 'balcony',
  'Swimming Pool': 'pool',
  Pool: 'pool',
  'Pool Access': 'pool',
  'Dining Area': 'dining_area',
  Garden: 'garden',
  Terrace: 'terrace',
  Spa: 'spa',
  Gym: 'gym',
  Sauna: 'sauna',
  'Hot Tub': 'hot_tub',
  'Ocean View': 'ocean_view',
  'Mountain View': 'mountain_view',
  'City View': 'city_view',
  Fireplace: 'fireplace',
  Closet: 'closet',
  Iron: 'iron',
  TV: 'tv',
  'Gaming Console': 'gaming',
  Netflix: 'netflix',
  'Sound System': 'sound_system',
  Books: 'books',
  'Board Games': 'board_games',
  'Music Instruments': 'music_instruments',
  'Outdoor Games': 'outdoor_games',
  'BBQ Grill': 'bbq',
  BBQ: 'bbq',
  'Beach Access': 'beach_access',
  'Water Sports Equipment': 'water_sports',
  'Water Sports': 'water_sports',
  'Snorkeling Gear': 'water_sports',
  'Snorkeling Equipment': 'water_sports',
  Bicycles: 'bicycles',
};

// Valid amenity IDs in the new system
const validAmenityIds = [
  // Essential
  'wifi',
  'kitchen',
  'air_conditioning',
  'parking',
  'security',
  'heating',
  'washing_machine',
  'private_entrance',
  'elevator',
  'workspace',
  // Comfort
  'balcony',
  'pool',
  'dining_area',
  'garden',
  'terrace',
  'spa',
  'gym',
  'sauna',
  'hot_tub',
  'ocean_view',
  'mountain_view',
  'city_view',
  'fireplace',
  'closet',
  'iron',
  // Entertainment
  'tv',
  'gaming',
  'netflix',
  'sound_system',
  'books',
  'board_games',
  'music_instruments',
  'outdoor_games',
  'bbq',
  'beach_access',
  'water_sports',
  'bicycles',
];

async function migratePropertiesToNewAmenities() {
  try {
    console.log('🔄 Starting migration to new amenities system...\n');

    // Fetch all properties
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, title, amenities');

    if (fetchError) {
      console.error('❌ Error fetching properties:', fetchError);
      return;
    }

    console.log(`📋 Found ${properties.length} properties to migrate\n`);

    let totalUpdated = 0;
    let totalAmenitiesFixed = 0;
    let propertiesWithErrors = 0;

    for (const property of properties) {
      if (!property.amenities || property.amenities.length === 0) {
        console.log(`⏭️  Skipping property "${property.title}" - no amenities`);
        continue;
      }

      console.log(`\n🏠 Processing: ${property.title}`);
      console.log(`   Current amenities: ${property.amenities.join(', ')}`);

      // Map old amenities to new ones
      const newAmenities = [];
      let fixedCount = 0;

      for (const amenity of property.amenities) {
        // If it's already a valid new ID, keep it
        if (validAmenityIds.includes(amenity)) {
          newAmenities.push(amenity);
        }
        // If it maps to a new ID, use the mapping
        else if (amenityMapping[amenity]) {
          const newId = amenityMapping[amenity];
          if (!newAmenities.includes(newId)) {
            // Avoid duplicates
            newAmenities.push(newId);
            fixedCount++;
            console.log(`   ✅ Mapped: "${amenity}" → "${newId}"`);
          }
        }
        // Unknown amenity
        else {
          console.log(`   ⚠️  Unknown amenity: "${amenity}" (skipped)`);
        }
      }

      // Only update if there were changes
      if (fixedCount > 0 || newAmenities.length !== property.amenities.length) {
        console.log(`   📝 New amenities: ${newAmenities.join(', ')}`);

        const { error: updateError } = await supabase
          .from('properties')
          .update({ amenities: newAmenities })
          .eq('id', property.id);

        if (updateError) {
          console.error(
            `   ❌ Error updating property: ${updateError.message}`,
          );
          propertiesWithErrors++;
        } else {
          console.log(`   ✅ Updated successfully`);
          totalUpdated++;
          totalAmenitiesFixed += fixedCount;
        }
      } else {
        console.log(`   ✅ No changes needed`);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`\n📊 Summary:
   - Total properties processed: ${properties.length}
   - Properties updated: ${totalUpdated}
   - Total amenities fixed: ${totalAmenitiesFixed}
   - Properties with errors: ${propertiesWithErrors}`);

    if (propertiesWithErrors === 0) {
      console.log(`\n✅ All properties migrated successfully!`);
    } else {
      console.log(
        `\n⚠️  ${propertiesWithErrors} properties had errors during migration`,
      );
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migratePropertiesToNewAmenities();
