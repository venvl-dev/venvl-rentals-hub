// Script to test the new simplified amenities system
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('Please copy .env.example to .env and set your Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testNewAmenitiesSystem() {
  try {
    console.log('🧪 Testing new amenities system...\n');

    // Test 1: Check amenities table structure
    console.log('📋 Test 1: Checking amenities table structure...');
    const { data: amenities, error: amenitiesError } = await supabase
      .from('amenities')
      .select('*')
      .order('category', { ascending: true });

    if (amenitiesError) {
      console.error('❌ Error fetching amenities:', amenitiesError);
      return;
    }

    console.log(`✅ Found ${amenities.length} amenities`);
    
    // Group by category
    const categoryCounts = amenities.reduce((acc, amenity) => {
      acc[amenity.category] = (acc[amenity.category] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Category breakdown:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} amenities`);
    });

    // Test 2: Check property amenities
    console.log('\n📋 Test 2: Checking property amenities...');
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, amenities')
      .limit(5);

    if (propertiesError) {
      console.error('❌ Error fetching properties:', propertiesError);
      return;
    }

    console.log(`✅ Found ${properties.length} properties to check`);
    
    let validAmenities = 0;
    let invalidAmenities = 0;
    const amenityIds = new Set(amenities.map(a => a.id));

    properties.forEach(property => {
      console.log(`\n🏠 Property: ${property.title}`);
      console.log(`   Amenities: ${property.amenities?.join(', ') || 'None'}`);
      
      if (property.amenities) {
        property.amenities.forEach(amenityId => {
          if (amenityIds.has(amenityId)) {
            validAmenities++;
          } else {
            invalidAmenities++;
            console.log(`   ❌ Invalid amenity: ${amenityId}`);
          }
        });
      }
    });

    console.log(`\n📊 Amenities validation:
   ✅ Valid amenities: ${validAmenities}
   ❌ Invalid amenities: ${invalidAmenities}`);

    // Test 3: Check amenity usage statistics
    console.log('\n📋 Test 3: Amenity usage statistics...');
    const { data: allProperties, error: allPropertiesError } = await supabase
      .from('properties')
      .select('amenities');

    if (allPropertiesError) {
      console.error('❌ Error fetching all properties:', allPropertiesError);
      return;
    }

    const amenityUsage = {};
    amenities.forEach(amenity => {
      amenityUsage[amenity.id] = {
        name: amenity.name,
        category: amenity.category,
        count: 0
      };
    });

    allProperties.forEach(property => {
      if (property.amenities) {
        property.amenities.forEach(amenityId => {
          if (amenityUsage[amenityId]) {
            amenityUsage[amenityId].count++;
          }
        });
      }
    });

    console.log('📊 Top amenities by usage:');
    const sortedAmenities = Object.entries(amenityUsage)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10);

    sortedAmenities.forEach(([id, data]) => {
      console.log(`   ${data.name} (${data.category}): ${data.count} properties`);
    });

    // Test 4: Check if all categories are represented
    console.log('\n📋 Test 4: Category representation check...');
    const expectedCategories = ['essential', 'comfort', 'entertainment'];
    const actualCategories = [...new Set(amenities.map(a => a.category))];
    
    const missingCategories = expectedCategories.filter(cat => !actualCategories.includes(cat));
    const extraCategories = actualCategories.filter(cat => !expectedCategories.includes(cat));

    if (missingCategories.length === 0 && extraCategories.length === 0) {
      console.log('✅ All expected categories are present');
    } else {
      if (missingCategories.length > 0) {
        console.log(`❌ Missing categories: ${missingCategories.join(', ')}`);
      }
      if (extraCategories.length > 0) {
        console.log(`⚠️  Extra categories: ${extraCategories.join(', ')}`);
      }
    }

    console.log('\n🎉 New amenities system test completed!');
    console.log(`\n📊 Summary:
   - Total amenities: ${amenities.length}
   - Categories: ${Object.keys(categoryCounts).length}
   - Properties checked: ${properties.length}
   - Valid amenity references: ${validAmenities}
   - Invalid amenity references: ${invalidAmenities}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNewAmenitiesSystem(); 
