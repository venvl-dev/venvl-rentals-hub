# PayTabs Payment Gateway Integration - Frontend Guide

This document explains the PayTabs integration for the VENVL Rentals Hub frontend.

## Overview

PayTabs has been integrated as the payment gateway for processing card payments in Egyptian Pounds (EGP). The integration uses the **Hosted Payment Page** method, where users are redirected to PayTabs' secure payment page.

---

## Prerequisites

### 1. PayTabs Account Setup

You need to create a PayTabs merchant account:

1. Visit: https://merchant-egypt.paytabs.com/merchant/home
2. Sign up for a merchant account
3. Complete verification process
4. Get your credentials from the dashboard

### 2. Required Credentials

After signup, retrieve these credentials:

- **Profile ID** (Merchant ID)
- **Server Key** (Secret key - for backend only)
- **Client Key** (Public key - for frontend)
- **Region Code**: `EGY` (for Egypt)

---

## Environment Configuration

### Step 1: Update `.env` File

Add your PayTabs credentials to your `.env` file:

```env
# PayTabs Configuration
VITE_PAYTABS_PROFILE_ID=your_profile_id_here
VITE_PAYTABS_CLIENT_KEY=your_client_key_here
VITE_PAYTABS_REGION=EGY
VITE_PAYTABS_CURRENCY=EGP

# Backend credentials (for Supabase Edge Functions)
PAYTABS_SERVER_KEY=your_server_key_here
```

**Important Security Notes:**
- Never commit `.env` file to git
- `VITE_` prefix makes variables available to frontend
- `PAYTABS_SERVER_KEY` should ONLY be used in backend (Supabase Edge Functions)
- Client Key is safe to expose in frontend code

---

## Frontend Architecture

### File Structure

```
src/
├── types/
│   └── paytabs.ts                 # TypeScript types for PayTabs
├── services/
│   └── paytabs.service.ts         # PayTabs API service
├── components/
│   └── booking/
│       └── BookingSummary.tsx     # Updated with PayTabs integration
└── pages/
    ├── PaymentCallback.tsx        # Handles redirect from PayTabs
    └── PaymentFailed.tsx          # Error/cancellation page
```

---

## How It Works

### Payment Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Booking   │ ───> │  Initiate    │ ───> │   PayTabs   │ ───> │   Callback   │
│   Summary   │      │  Payment     │      │   Payment   │      │     Page     │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘
                              │                     │                     │
                              v                     v                     v
                     Backend creates          User enters          Verify & Create
                     payment session         card details          Booking
```

### Step-by-Step Process

1. **User clicks "Pay now"** in BookingSummary component
2. **Frontend calls** `payTabsService.initiatePayment()`
3. **Backend creates** PayTabs payment session (via Supabase Edge Function)
4. **Backend returns** redirect URL to PayTabs
5. **Frontend stores** booking data in sessionStorage
6. **User redirected** to PayTabs secure payment page
7. **User enters** card details and completes payment
8. **PayTabs processes** payment
9. **User redirected back** to `/payment-callback` with transaction reference
10. **Frontend verifies** payment with backend
11. **Backend confirms** payment status with PayTabs
12. **Frontend creates** booking in database
13. **User sees** booking confirmation

---

## Key Components

### 1. PayTabs Service (`src/services/paytabs.service.ts`)

Handles all PayTabs API interactions:

```typescript
// Initialize payment
const response = await payTabsService.initiatePayment({
  amount: 1500,
  currency: 'EGP',
  bookingDetails: { /* ... */ },
  customerInfo: { /* ... */ }
});

// Verify payment after redirect
const result = await payTabsService.verifyPayment({
  transactionRef: 'TST2234500000123'
});
```

**Key Methods:**
- `initiatePayment()` - Creates payment session
- `verifyPayment()` - Verifies transaction after redirect
- `isConfigured()` - Checks if credentials are set

### 2. BookingSummary Component

Updated to integrate PayTabs:

**Changes Made:**
- Added PayTabs service import
- Added user authentication check
- Added payment initiation logic
- Added loading state for payment processing
- Stores booking data in sessionStorage before redirect

**Key Code:**
```typescript
const handlePayment = async () => {
  if (paymentMethod === 'card') {
    // Initiate PayTabs payment
    const response = await payTabsService.initiatePayment(paymentRequest);

    if (response.success) {
      // Store booking for retrieval after redirect
      sessionStorage.setItem('pendingBooking', JSON.stringify(booking));

      // Redirect to PayTabs
      window.location.href = response.redirectUrl;
    }
  }
};
```

### 3. Payment Callback Page

Handles return from PayTabs:

**URL Format:**
```
https://yourdomain.com/payment-callback?tranRef=TST2234500000123&respStatus=A&respMessage=Authorised
```

**Process:**
1. Extracts transaction reference from URL
2. Retrieves pending booking from sessionStorage
3. Verifies payment with backend
4. Creates booking in database
5. Redirects to booking confirmation

### 4. Payment Failed Page

Displayed when payment fails or is cancelled:

**Features:**
- User-friendly error message
- Explanation of common failure reasons
- "Try Again" button
- "Go Home" option
- Support contact link

---

## Testing

### Sandbox Mode

PayTabs provides a sandbox environment for testing:

1. Use sandbox credentials from PayTabs dashboard
2. Test cards are available in PayTabs documentation
3. No real charges are made in sandbox mode

### Test Card Numbers (Check PayTabs Docs)

```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
```

### Testing Checklist

- [ ] Payment initiation works
- [ ] Redirect to PayTabs occurs
- [ ] Payment success creates booking
- [ ] Payment failure shows error page
- [ ] Cancellation redirects correctly
- [ ] Booking data persists correctly
- [ ] Transaction reference is stored
- [ ] Email notifications sent (if configured)

---

## Backend Requirements

### Supabase Edge Functions Needed

You need to create two Supabase Edge Functions:

#### 1. `paytabs-payment` Function

Creates PayTabs payment session:

```typescript
// Request body
{
  amount: number,
  currency: string,
  bookingDetails: { /* ... */ },
  customerInfo: { /* ... */ },
  returnUrl: string,
  cancelUrl: string
}

// Response
{
  success: boolean,
  redirectUrl: string,
  transactionRef: string
}
```

#### 2. `paytabs-verify` Function

Verifies payment status:

```typescript
// Request body
{
  transactionRef: string
}

// Response
{
  success: boolean,
  transactionRef: string,
  paymentStatus: string,
  amount: number,
  bookingId?: string
}
```

**Note:** Backend implementation is separate and required for full integration.

---

## Database Schema Updates

### Required Columns in `bookings` Table

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS:
- payment_status TEXT DEFAULT 'pending'
- payment_amount NUMERIC
- payment_method TEXT  -- 'card' or 'cash'
- payment_transaction_ref TEXT  -- PayTabs transaction reference
- currency TEXT DEFAULT 'EGP'
```

---

## Error Handling

### Frontend Error Cases

1. **PayTabs Not Configured**
   - Check: `payTabsService.isConfigured()`
   - Error: "Payment system is not configured"
   - Solution: Add credentials to `.env`

2. **User Not Authenticated**
   - Check: `if (!user)`
   - Error: "Please log in to complete payment"
   - Solution: Redirect to login

3. **Payment Initiation Failed**
   - Catch API errors
   - Show toast notification
   - Keep user on booking summary page

4. **Payment Verification Failed**
   - Show on callback page
   - Redirect to payment failed page
   - Don't create booking

### User-Facing Error Messages

```typescript
// Good error messages
"Payment system is not configured. Please contact support."
"Please log in to complete payment"
"Failed to initiate payment. Please try again."

// Bad error messages (avoid)
"Error 500"
"NULL pointer exception"
"Unknown error"
```

---

## Security Considerations

### Frontend Security

1. **Never expose Server Key**
   - Only use in backend
   - Don't include in frontend code
   - Use environment variables properly

2. **Validate User Input**
   - Check all booking data
   - Validate amounts
   - Sanitize customer info

3. **SessionStorage**
   - Clear after booking creation
   - Don't store sensitive card data
   - Only store booking references

4. **HTTPS Required**
   - PayTabs requires HTTPS
   - Redirect URLs must be HTTPS
   - Local development: Use ngrok or similar

### Backend Security

1. **Verify all payments server-side**
   - Never trust frontend data
   - Always verify with PayTabs API
   - Check transaction amounts

2. **Idempotency**
   - Prevent duplicate bookings
   - Check transaction reference before creating booking
   - Handle race conditions

---

## Troubleshooting

### Common Issues

**Issue: "PayTabs is not configured"**
- **Cause:** Missing environment variables
- **Fix:** Add credentials to `.env` file and restart dev server

**Issue: Redirect doesn't work**
- **Cause:** Invalid redirect URL
- **Fix:** Ensure URLs are HTTPS and properly formatted

**Issue: Payment verification fails**
- **Cause:** Backend function not deployed
- **Fix:** Deploy Supabase Edge Functions

**Issue: Booking not created after payment**
- **Cause:** Session storage cleared or verification failed
- **Fix:** Check browser console for errors

### Debug Mode

Enable debug logging:

```typescript
// In paytabs.service.ts, add:
console.log('Payment request:', paymentRequest);
console.log('Payment response:', response);
```

Check browser console and network tab for API calls.

---

## Next Steps

### What You Need to Complete

1. **Get PayTabs Credentials**
   - Sign up at PayTabs Egypt
   - Get Profile ID, Server Key, Client Key
   - Add to `.env` file

2. **Create Backend Functions**
   - `paytabs-payment` - Initiate payment
   - `paytabs-verify` - Verify payment
   - Deploy to Supabase

3. **Update Database**
   - Add payment columns to bookings table
   - Add indexes for performance

4. **Test End-to-End**
   - Test in sandbox mode
   - Verify all flows work
   - Check error handling

5. **Go Live**
   - Switch to production credentials
   - Update redirect URLs
   - Monitor transactions

---

## Support and Documentation

- **PayTabs Support Portal:** https://support.paytabs.com
- **PayTabs Egypt:** https://merchant-egypt.paytabs.com
- **API Documentation:** Check PayTabs support portal for latest docs
- **VENVL Support:** support@venvl.com

---

## Additional Resources

### PayTabs Integration Types

1. **Hosted Payment Page** (Currently Implemented)
   - Users redirected to PayTabs
   - Simplest integration
   - PCI compliant by default

2. **Managed Form** (Alternative)
   - Embedded iframe
   - Users stay on your site
   - More complex implementation

3. **Own Form** (Advanced)
   - Custom payment form
   - Full control over UI
   - Requires PCI compliance

### Currency Support

Currently configured for EGP (Egyptian Pound), but PayTabs supports 165+ currencies. To add more:

```typescript
// In paytabs.service.ts
currency: userCurrency || 'EGP'
```

---

## Changelog

### v1.0.0 (Initial Integration)
- Added PayTabs service
- Updated BookingSummary component
- Created PaymentCallback page
- Created PaymentFailed page
- Added TypeScript types
- Added router configuration

---

**Last Updated:** 2025-01-07
**Integration Status:** Frontend Complete (Backend Required)
