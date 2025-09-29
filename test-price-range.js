// Test script to verify price range functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPriceRange() {
  console.log('🧪 Testing Price Range Functionality');

  // Test 1: Get all properties and their rental types
  const { data: allProperties, error: allError } = await supabase
    .from('properties')
    .select('id, title, rental_type, monthly_price, daily_price, price_per_night, is_active, approval_status')
    .eq('is_active', true)
    .eq('approval_status', 'approved');

  if (allError) {
    console.error('❌ Error fetching properties:', allError);
    return;
  }

  console.log(`📊 Total active/approved properties: ${allProperties?.length || 0}`);

  // Group by rental type
  const rentalTypeCounts = {};
  allProperties?.forEach(p => {
    const type = p.rental_type || 'null';
    rentalTypeCounts[type] = (rentalTypeCounts[type] || 0) + 1;
  });

  console.log('📋 Rental type distribution:', rentalTypeCounts);

  // Test 2: Simulate daily price range calculation
  console.log('\n🔍 TESTING DAILY PRICE RANGE:');
  const dailyProperties = allProperties?.filter(p => p.rental_type === 'daily') || [];
  const dailyPrices = dailyProperties
    .map(p => p.daily_price || p.price_per_night)
    .filter(price => price && price > 0);

  if (dailyPrices.length > 0) {
    console.log(`📊 Daily properties found: ${dailyProperties.length}`);
    console.log(`💰 Daily price range: ${Math.min(...dailyPrices)} - ${Math.max(...dailyPrices)}`);
    console.log(`💰 Sample daily prices:`, dailyPrices.slice(0, 5));
  } else {
    console.log('❌ No daily properties found');
  }

  // Test 3: Simulate monthly price range calculation
  console.log('\n🔍 TESTING MONTHLY PRICE RANGE:');
  const monthlyProperties = allProperties?.filter(p =>
    p.rental_type === 'monthly' || p.rental_type === 'both'
  ) || [];

  const monthlyPrices = [];
  monthlyProperties.forEach(p => {
    if (p.monthly_price && p.monthly_price > 0) {
      monthlyPrices.push(p.monthly_price);
    } else if (p.rental_type === 'monthly' || p.rental_type === 'both') {
      // Estimate monthly price from daily
      const dailyPrice = p.daily_price || p.price_per_night;
      if (dailyPrice && dailyPrice > 0) {
        monthlyPrices.push(Math.round(dailyPrice * 25));
      }
    }
  });

  if (monthlyPrices.length > 0) {
    console.log(`📊 Monthly properties found: ${monthlyProperties.length}`);
    console.log(`💰 Monthly price range: ${Math.min(...monthlyPrices)} - ${Math.max(...monthlyPrices)}`);
    console.log(`💰 Sample monthly prices:`, monthlyPrices.slice(0, 5));
  } else {
    console.log('❌ No monthly properties found');
  }

  // Test 4: Show sample properties with their pricing
  console.log('\n🏠 SAMPLE PROPERTIES:');
  allProperties?.slice(0, 5).forEach(p => {
    console.log(`${p.title} (${p.rental_type}):`);
    console.log(`  Daily: ${p.daily_price || p.price_per_night || 'N/A'}`);
    console.log(`  Monthly: ${p.monthly_price || 'N/A'}`);
  });
}

testPriceRange().catch(console.error);