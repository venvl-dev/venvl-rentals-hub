import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get PayTabs credentials from environment
    const profileId = Deno.env.get('PAYTABS_PROFILE_ID');
    const serverKey = Deno.env.get('PAYTABS_SERVER_KEY');
    const region = Deno.env.get('PAYTABS_REGION') || 'EGY';

    console.log('PayTabs verify config:', {
      hasProfileId: !!profileId,
      hasServerKey: !!serverKey,
      region,
    });

    if (!profileId || !serverKey) {
      throw new Error('PayTabs credentials not configured');
    }

    // Get transaction reference from request
    const requestBody = await req.json();
    const { transactionRef } = requestBody;

    console.log('Verify payment request:', { transactionRef, requestBody });

    if (!transactionRef) {
      throw new Error('Transaction reference is required');
    }

    // PayTabs API endpoint for transaction verification
    // Map region codes to full names for PayTabs URLs
    const regionMap: Record<string, string> = {
      'EGY': 'egypt',
      'SAU': 'saudi',
      'ARE': 'uae',
      'OMN': 'oman',
      'JOR': 'jordan',
    };

    const regionName = regionMap[region] || region.toLowerCase();
    const paytabsUrl = `https://secure-${regionName}.paytabs.com/payment/query`;

    console.log('PayTabs verify URL:', paytabsUrl);

    // Prepare verification request
    const verifyRequest = {
      profile_id: parseInt(profileId),  // Convert to number
      tran_ref: transactionRef,
    };

    console.log('Sending verify request to PayTabs:', verifyRequest);

    // Call PayTabs verification API
    const paytabsResponse = await fetch(paytabsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': serverKey,
      },
      body: JSON.stringify(verifyRequest),
    });

    if (!paytabsResponse.ok) {
      const errorText = await paytabsResponse.text();
      console.error('PayTabs API error response:', {
        status: paytabsResponse.status,
        statusText: paytabsResponse.statusText,
        body: errorText,
      });
      throw new Error(`PayTabs API error: ${paytabsResponse.status} - ${errorText}`);
    }

    const paytabsData = await paytabsResponse.json();
    console.log('PayTabs verification response:', JSON.stringify(paytabsData, null, 2));

    // Determine payment status
    let paymentStatus = 'failed';
    if (paytabsData.payment_result?.response_status === 'A') {
      // A = Authorized/Approved
      paymentStatus = 'paid';
    } else if (paytabsData.payment_result?.response_status === 'H') {
      // H = Hold (awaiting capture)
      paymentStatus = 'authorized';
    } else if (paytabsData.payment_result?.response_status === 'P') {
      // P = Pending
      paymentStatus = 'pending';
    } else if (paytabsData.payment_result?.response_status === 'V') {
      // V = Voided
      paymentStatus = 'cancelled';
    } else {
      // D = Declined, E = Error, etc.
      paymentStatus = 'failed';
    }

    const isSuccess = paymentStatus === 'paid' || paymentStatus === 'authorized';

    // Return verification response
    return new Response(
      JSON.stringify({
        success: isSuccess,
        transactionRef: transactionRef,
        paymentStatus: paymentStatus,
        amount: paytabsData.cart_amount || 0,
        currency: paytabsData.cart_currency || 'EGP',
        message: paytabsData.payment_result?.response_message || '',
        paymentDetails: {
          cardType: paytabsData.payment_info?.card_type,
          cardScheme: paytabsData.payment_info?.card_scheme,
          paymentDescription: paytabsData.payment_info?.payment_description,
          transactionTime: paytabsData.tran_time,
          responseCode: paytabsData.payment_result?.response_code,
          acquirerMessage: paytabsData.payment_result?.acquirer_message,
          acquirerRRN: paytabsData.payment_result?.acquirer_rrn,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying PayTabs payment:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to verify payment';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error stack:', errorStack);

    return new Response(
      JSON.stringify({
        success: false,
        transactionRef: '',
        paymentStatus: 'failed',
        amount: 0,
        currency: 'EGP',
        error: errorMessage,
        details: errorStack ? errorStack.split('\n').slice(0, 5).join('\n') : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,  // Return 200 even on error so we can see the error details
      }
    );
  }
});
