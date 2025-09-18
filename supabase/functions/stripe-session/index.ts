// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// import Stripe from 'https://esm.sh/stripe@13.11.0'

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// }

// serve(async (req) => {
//   // Handle CORS preflight requests
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders })
//   }

//   try {
//     // Initialize Stripe
//     const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
//       apiVersion: '2023-10-16',
//     })

//     // Get request data
//     const { amount, currency, booking } = await req.json()

//     // Create Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [{
//         price_data: {
//           currency: currency || 'egp',
//           product_data: {
//             name: booking.property.title,
//             description: `${booking.checkIn} to ${booking.checkOut}`,
//           },
//           unit_amount: Math.round(amount * 100), // Convert to cents
//         },
//         quantity: 1,
//       }],
//       mode: 'payment',
//       success_url: `${req.headers.get('origin')}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.headers.get('origin')}/property/${booking.property.id}`,
//       metadata: {
//         property_id: booking.property.id,
//         guest_id: booking.guest_id || '',
//         booking_data: JSON.stringify(booking)
//       }
//     })

//     return new Response(
//       JSON.stringify({ sessionId: session.id }),
//       { 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//         status: 200,
//       },
//     )
//   } catch (error) {
//     console.error('Error creating Stripe session:', error)
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//         status: 400,
//       },
//     )
//   }
// })