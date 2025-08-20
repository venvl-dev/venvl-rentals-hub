import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  report_type: 'users' | 'properties' | 'bookings' | 'revenue' | 'moderation'
  format: 'csv' | 'json'
  date_from?: string
  date_to?: string
  filters?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const exportRequest: ExportRequest = await req.json()
    
    // Validate request
    if (!exportRequest.report_type || !exportRequest.format) {
      return new Response(
        JSON.stringify({ error: 'report_type and format are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let data: any[] = []
    let filename = ''

    // Generate data based on report type
    switch (exportRequest.report_type) {
      case 'users':
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            first_name,
            last_name,
            role,
            is_active,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })

        if (usersError) throw usersError
        data = users || []
        filename = `users_export_${new Date().toISOString().split('T')[0]}`
        break

      case 'properties':
        let dateFilter = ''
        if (exportRequest.date_from && exportRequest.date_to) {
          dateFilter = `.gte('created_at', '${exportRequest.date_from}').lte('created_at', '${exportRequest.date_to}')`
        }

        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select(`
            id,
            title,
            city,
            state,
            country,
            property_type,
            price_per_night,
            daily_price,
            monthly_price,
            max_guests,
            bedrooms,
            bathrooms,
            approval_status,
            is_active,
            created_at,
            profiles!properties_host_id_fkey(email, first_name, last_name)
          `)
          .order('created_at', { ascending: false })

        if (propertiesError) throw propertiesError
        
        // Flatten the data for export
        data = (properties || []).map(property => ({
          id: property.id,
          title: property.title,
          city: property.city,
          state: property.state,
          country: property.country,
          property_type: property.property_type,
          price_per_night: property.price_per_night,
          daily_price: property.daily_price,
          monthly_price: property.monthly_price,
          max_guests: property.max_guests,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          approval_status: property.approval_status,
          is_active: property.is_active,
          created_at: property.created_at,
          host_email: property.profiles?.email,
          host_name: `${property.profiles?.first_name || ''} ${property.profiles?.last_name || ''}`.trim()
        }))
        
        filename = `properties_export_${new Date().toISOString().split('T')[0]}`
        break

      case 'bookings':
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            check_in,
            check_out,
            guests,
            total_price,
            status,
            booking_type,
            created_at,
            property:properties(title, city, property_type),
            guest:profiles!bookings_guest_id_fkey(email, first_name, last_name)
          `)
          .order('created_at', { ascending: false })

        if (bookingsError) throw bookingsError
        
        data = (bookings || []).map(booking => ({
          id: booking.id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          guests: booking.guests,
          total_price: booking.total_price,
          status: booking.status,
          booking_type: booking.booking_type,
          created_at: booking.created_at,
          property_title: booking.property?.title,
          property_city: booking.property?.city,
          property_type: booking.property?.property_type,
          guest_email: booking.guest?.email,
          guest_name: `${booking.guest?.first_name || ''} ${booking.guest?.last_name || ''}`.trim()
        }))
        
        filename = `bookings_export_${new Date().toISOString().split('T')[0]}`
        break

      case 'revenue':
        // Generate revenue report
        const { data: revenueData, error: revenueError } = await supabase
          .from('bookings')
          .select(`
            id,
            total_price,
            created_at,
            status,
            property:properties(city, property_type, host_id)
          `)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })

        if (revenueError) throw revenueError
        
        data = (revenueData || []).map(booking => ({
          booking_id: booking.id,
          revenue: booking.total_price,
          commission: (booking.total_price * 0.1).toFixed(2), // 10% commission
          city: booking.property?.city,
          property_type: booking.property?.property_type,
          host_id: booking.property?.host_id,
          booking_date: booking.created_at
        }))
        
        filename = `revenue_export_${new Date().toISOString().split('T')[0]}`
        break

      case 'moderation':
        const { data: moderationData, error: moderationError } = await supabase
          .from('moderation_reports')
          .select(`
            id,
            report_type,
            description,
            status,
            priority,
            created_at,
            reporter:profiles!moderation_reports_reporter_id_fkey(email),
            reported_user:profiles!moderation_reports_reported_user_id_fkey(email),
            moderator:profiles!moderation_reports_moderator_id_fkey(email)
          `)
          .order('created_at', { ascending: false })

        if (moderationError) throw moderationError
        
        data = (moderationData || []).map(report => ({
          id: report.id,
          report_type: report.report_type,
          description: report.description,
          status: report.status,
          priority: report.priority,
          created_at: report.created_at,
          reporter_email: report.reporter?.email,
          reported_user_email: report.reported_user?.email,
          moderator_email: report.moderator?.email
        }))
        
        filename = `moderation_export_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Generate export based on format
    if (exportRequest.format === 'csv') {
      if (data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No data to export' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Convert to CSV
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    } else {
      // Return JSON
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`
        }
      })
    }

  } catch (error) {
    console.error('Error in export-reports function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})