import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMonthlyProperties() {
  console.log('🔍 Checking for monthly properties...')

  // Get all properties
  const { data: allProperties, error: allError } = await supabase
    .from('properties')
    .select('id, title, rental_type, monthly_price, is_active, approval_status')

  if (allError) {
    console.error('❌ Error fetching all properties:', allError)
    return
  }

  console.log(`📊 Total properties in database: ${allProperties?.length || 0}`)

  // Group properties by rental_type
  const rentalTypeCounts = {}
  allProperties?.forEach(p => {
    const type = p.rental_type || 'null'
    rentalTypeCounts[type] = (rentalTypeCounts[type] || 0) + 1
  })

  console.log('📋 Rental type breakdown:', rentalTypeCounts)

  // Get monthly properties specifically
  const { data: monthlyProperties, error: monthlyError } = await supabase
    .from('properties')
    .select('id, title, rental_type, monthly_price, is_active, approval_status')
    .eq('rental_type', 'monthly')

  if (monthlyError) {
    console.error('❌ Error fetching monthly properties:', monthlyError)
    return
  }

  console.log(`🏠 Monthly properties found: ${monthlyProperties?.length || 0}`)
  monthlyProperties?.forEach(p => {
    console.log(`  - ${p.title} (${p.id}) - Active: ${p.is_active}, Approved: ${p.approval_status}, Price: ${p.monthly_price}`)
  })

  // Check for properties with 'both' rental_type
  const { data: bothProperties, error: bothError } = await supabase
    .from('properties')
    .select('id, title, rental_type, monthly_price, daily_price, is_active, approval_status')
    .eq('rental_type', 'both')

  if (bothError) {
    console.error('❌ Error fetching both-type properties:', bothError)
    return
  }

  console.log(`🏠 'Both' type properties found: ${bothProperties?.length || 0}`)
  bothProperties?.forEach(p => {
    console.log(`  - ${p.title} (${p.id}) - Active: ${p.is_active}, Approved: ${p.approval_status}, Monthly: ${p.monthly_price}, Daily: ${p.daily_price}`)
  })
}

debugMonthlyProperties().catch(console.error)