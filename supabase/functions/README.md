# PayTabs Supabase Edge Functions

This folder contains the Supabase Edge Functions for PayTabs payment integration.

## Functions

### 1. paytabs-payment
Creates a PayTabs payment session and returns a redirect URL.

**Endpoint:** `/functions/v1/paytabs-payment`

**Request:**
```json
{
  "amount": 1500,
  "currency": "EGP",
  "bookingDetails": {
    "propertyId": "123",
    "propertyTitle": "Luxury Apartment",
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-20",
    "guests": 2,
    "bookingType": "daily"
  },
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+201234567890"
  },
  "returnUrl": "https://yourdomain.com/payment-callback",
  "cancelUrl": "https://yourdomain.com/payment-failed"
}
```

**Response:**
```json
{
  "success": true,
  "redirectUrl": "https://secure-egy.paytabs.com/payment/page/...",
  "transactionRef": "TST2234500000123",
  "message": "Payment session created successfully"
}
```

### 2. paytabs-verify
Verifies a payment transaction with PayTabs.

**Endpoint:** `/functions/v1/paytabs-verify`

**Request:**
```json
{
  "transactionRef": "TST2234500000123"
}
```

**Response:**
```json
{
  "success": true,
  "transactionRef": "TST2234500000123",
  "paymentStatus": "paid",
  "amount": 1500,
  "currency": "EGP",
  "message": "Authorized",
  "paymentDetails": {
    "cardType": "Credit",
    "cardScheme": "Visa",
    "transactionTime": "2025-01-07T10:30:00Z"
  }
}
```

## Environment Variables

Add these to your Supabase project settings:

```bash
PAYTABS_PROFILE_ID=your_profile_id
PAYTABS_SERVER_KEY=your_server_key
PAYTABS_REGION=EGY
```

**How to add:**
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions → Environment Variables
3. Add each variable

## Deployment

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link your project

```bash
supabase link --project-ref your-project-ref
```

### Deploy functions

Deploy both functions:

```bash
# Deploy paytabs-payment function
supabase functions deploy paytabs-payment

# Deploy paytabs-verify function
supabase functions deploy paytabs-verify
```

Or deploy all at once:

```bash
supabase functions deploy
```

### Set environment variables

```bash
supabase secrets set PAYTABS_PROFILE_ID=your_profile_id
supabase secrets set PAYTABS_SERVER_KEY=your_server_key
supabase secrets set PAYTABS_REGION=EGY
```

## Testing

### Test locally

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve paytabs-payment --env-file .env.local
```

### Test with curl

```bash
# Test payment initiation
curl -X POST http://localhost:54321/functions/v1/paytabs-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "amount": 1500,
    "currency": "EGP",
    "bookingDetails": {
      "propertyId": "123",
      "propertyTitle": "Test Property",
      "checkIn": "2025-01-15",
      "checkOut": "2025-01-20",
      "guests": 2,
      "bookingType": "daily"
    },
    "customerInfo": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+201234567890"
    }
  }'
```

## Payment Status Codes

PayTabs uses the following response status codes:

- **A** = Authorized/Approved (Success)
- **H** = Hold (Awaiting capture)
- **P** = Pending
- **V** = Voided (Cancelled)
- **D** = Declined (Failed)
- **E** = Error (Failed)

Our functions map these to:
- `paid` - Payment successful (A)
- `authorized` - Payment authorized but not captured (H)
- `pending` - Payment pending (P)
- `cancelled` - Payment cancelled (V)
- `failed` - Payment failed (D, E, or other)

## Debugging

### View function logs

```bash
supabase functions logs paytabs-payment
supabase functions logs paytabs-verify
```

### Common issues

**Issue: "PayTabs credentials not configured"**
- Check environment variables are set
- Verify secrets with: `supabase secrets list`

**Issue: CORS errors**
- Functions automatically handle CORS
- Check if OPTIONS requests are allowed

**Issue: 401 Unauthorized**
- Check Authorization header is included
- Use Supabase anon key or service key

## Security Notes

1. **Never expose Server Key** - Only use in Edge Functions
2. **Always verify payments server-side** - Never trust client data
3. **Use HTTPS** - PayTabs requires HTTPS for callbacks
4. **Validate amounts** - Always verify payment amounts match booking amounts

## PayTabs API Documentation

- Support Portal: https://support.paytabs.com
- API Documentation: Check PayTabs support portal
- Test cards: Available in PayTabs merchant dashboard

## Troubleshooting

### Payment initiation fails

1. Check PayTabs credentials
2. Verify region code (EGY for Egypt)
3. Check all required fields are provided
4. View function logs for detailed errors

### Payment verification fails

1. Check transaction reference is valid
2. Verify payment was actually processed
3. Check PayTabs dashboard for transaction status

## Support

For issues with:
- **Supabase Functions**: Check Supabase docs
- **PayTabs API**: Contact PayTabs support
- **Integration**: Check PAYTABS_INTEGRATION.md in project root
