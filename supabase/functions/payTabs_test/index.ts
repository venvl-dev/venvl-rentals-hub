import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const profileId = Deno.env.get('PAYTABS_PROFILE_ID');
    const serverKey = Deno.env.get('PAYTABS_SERVER_KEY');
    const region = Deno.env.get('PAYTABS_REGION') || 'EGY';

    console.log('PayTabs Config Check:', {
      hasProfileId: !!profileId,
      hasServerKey: !!serverKey,
      region: region,
    });

    if (!profileId || !serverKey) {
      const errorMsg = `PayTabs credentials not configured. ProfileId: ${!!profileId}, ServerKey: ${!!serverKey}`;
      console.error(errorMsg);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get request data
    const requestBody = await req.json();

    // Support both booking_id (existing) and full payment data (new)
    let paymentData;

    if (requestBody.booking_id) {
      // Legacy: If booking_id is provided, fetch booking details
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          property:properties (
            id,
            title,
            city,
            state
          ),
          guest:profiles!guest_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', requestBody.booking_id)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      paymentData = {
        amount: booking.total_price || 0,
        currency: booking.currency || 'EGP',
        bookingDetails: {
          propertyId: booking.property.id,
          propertyTitle: booking.property.title,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          guests: booking.guests,
          bookingType: booking.booking_type || 'daily',
        },
        customerInfo: {
          name: booking.guest.full_name || booking.guest.email,
          email: booking.guest.email,
          phone: booking.guest.phone || '',
        },
        returnUrl: requestBody.returnUrl || `${req.headers.get('origin')}/payment-callback`,
        cancelUrl: requestBody.cancelUrl || `${req.headers.get('origin')}/payment-failed`,
      };
    } else {
      paymentData = requestBody;
    }

    const {
      amount,
      currency,
      bookingDetails,
      customerInfo,
      returnUrl,
      cancelUrl,
      metadata,
    } = paymentData;

    // Validate required fields
    if (!amount || !currency || !bookingDetails || !customerInfo) {
      throw new Error('Missing required payment fields');
    }

    // PayTabs API endpoint for Egypt
    const paytabsUrl = 'https://secure-egypt.paytabs.com/payment/request';

    console.log('Using PayTabs URL:', paytabsUrl);

    // Prepare PayTabs payment request
    const paymentRequest = {
      profile_id: parseInt(profileId),  // Convert to number
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: `booking_${Date.now()}`,
      cart_description: `Booking for ${bookingDetails.propertyTitle}`,
      cart_currency: currency,
      cart_amount: parseFloat(amount.toString()),  // Ensure it's a number

      // Customer details
      customer_details: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        street1: customerInfo.street1 || 'N/A',
        city: customerInfo.city || 'Cairo',
        state: customerInfo.state || 'Cairo',
        country: customerInfo.country || 'EG',
        zip: customerInfo.zip || '00000',
      },

      // Shipping details (same as billing for digital service)
      shipping_details: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        street1: customerInfo.street1 || 'N/A',
        city: customerInfo.city || 'Cairo',
        state: customerInfo.state || 'Cairo',
        country: customerInfo.country || 'EG',
        zip: customerInfo.zip || '00000',
      },

      // Return URLs
      return: returnUrl,
      callback: `${req.headers.get('origin')}/api/paytabs-webhook`,

      // Additional data
      user_defined: {
        booking_id: requestBody.booking_id || bookingDetails.propertyId,
        check_in: bookingDetails.checkIn,
        check_out: bookingDetails.checkOut,
        guests: bookingDetails.guests,
        booking_type: bookingDetails.bookingType,
        ...metadata,
      },

      // UI customization
      hide_shipping: true,
      framed: false,
    };

    console.log('Calling PayTabs API:', paytabsUrl);
    console.log('Payment request:', JSON.stringify(paymentRequest, null, 2));
    console.log('Using Server Key (first 10 chars):', serverKey.substring(0, 10));

    // Call PayTabs API
    // Use exact format from PayTabs documentation
    const paytabsResponse = await fetch(paytabsUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': serverKey,
      },
      body: JSON.stringify(paymentRequest),
    });

    if (!paytabsResponse.ok) {
      const errorText = await paytabsResponse.text();
      console.error('PayTabs API error:', errorText);
      throw new Error(`PayTabs API error: ${paytabsResponse.status} - ${errorText}`);
    }

    const paytabsData = await paytabsResponse.json();
    console.log('PayTabs response:', JSON.stringify(paytabsData, null, 2));

    if (!paytabsData.redirect_url) {
      console.error('PayTabs response missing redirect_url:', paytabsData);
      throw new Error(paytabsData.message || 'Failed to create payment session');
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: paytabsData.redirect_url,
        transactionRef: paytabsData.tran_ref,
        message: 'Payment session created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in payTabs_test:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create payment session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
