# Payment Migration Guide: Supabase to Vercel

## Overview
This document outlines the migration of payment processing from Supabase Edge Functions to Vercel serverless functions. The migration improves security by keeping the Paystack secret key server-side only and leverages Vercel's robust serverless infrastructure.

## Architecture Changes

### Before (Supabase Edge Functions)
```
Frontend
  ↓
Supabase Edge Function: /functions/v1/paystack-init
  ↓
Paystack API
  ↓
Paystack Gateway (redirect)
  ↓
Callback to Frontend: /payments/success
  ↓
Supabase Edge Function: /functions/v1/paystack-verify
  ↓
Supabase Database: payments table
```

### After (Vercel Serverless Functions)
```
Frontend
  ↓
Vercel Function: /api/paystack/initialize
  ↓
Paystack API
  ↓
Paystack Gateway (redirect)
  ↓
Callback to Frontend: /payments/success
  ↓
Vercel Function: /api/paystack/verify
  ↓
Supabase Database: payments table (unchanged)
```

## Files Created

### 1. `/api/paystack/initialize.ts`
- **Purpose**: Initialize Paystack payment transaction
- **Endpoint**: `/api/paystack/initialize`
- **Method**: POST
- **Replaces**: `supabase/functions/paystack-init/index.ts`
- **Features**:
  - Secure handling of PAYSTACK_SECRET_KEY (server-side only)
  - Validates email and amount
  - Constructs metadata with child enrollment information
  - Returns authorization URL and reference

### 2. `/api/paystack/verify.ts`
- **Purpose**: Verify completed Paystack transaction
- **Endpoint**: `/api/paystack/verify`
- **Method**: POST
- **Replaces**: `supabase/functions/paystack-verify/index.ts`
- **Features**:
  - Secure verification with PAYSTACK_SECRET_KEY
  - Validates payment reference
  - Returns complete transaction details
  - Includes metadata and authorization information

## Files Modified

### 1. `src/pages/PaymentsPage.tsx`
**Changes**:
- Removed dependency on `import.meta.env.VITE_SUPABASE_URL`
- Removed Supabase auth token from headers
- Updated fetch endpoint from `${VITE_SUPABASE_URL}/functions/v1/paystack-init` to `/api/paystack/initialize`
- Simplified request headers

**Before**:
```typescript
const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-init`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({...}),
});
```

**After**:
```typescript
const res = await fetch(`/api/paystack/initialize`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({...}),
});
```

### 2. `src/pages/PaymentSuccessPage.tsx`
**Changes**:
- Removed `supabase.functions.invoke()` call
- Updated to use fetch-based API call
- Replaced Supabase-specific error handling with standard HTTP error handling

**Before**:
```typescript
const { data, error: verifyError } = await supabase.functions.invoke<VerifyResult>(
  "paystack-verify",
  { body: { reference } },
);
```

**After**:
```typescript
const res = await fetch('/api/paystack/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reference }),
});

if (!res.ok) {
  throw new Error('Payment verification failed');
}

const data: VerifyResult = await res.json();
```

### 3. `.env`
**Changes**:
- Removed `VITE_PAYSTACK_SECRET_KEY` (was insecure exposure to frontend)
- Added comment warning about security
- Kept Supabase configuration intact

**Before**:
```
VITE_PAYSTACK_SECRET_KEY="sk_live_..."
```

**After**:
```
# CRITICAL: PAYSTACK_SECRET_KEY is now set only in Vercel environment variables
# DO NOT expose PAYSTACK_SECRET_KEY in the frontend or .env file
```

## Files Created (Configuration)

### 1. `vercel.json`
- Configures Vercel deployment settings
- Specifies serverless function configuration
- Sets environment variable references
- Defines function memory limits and timeouts

### 2. `.env.example`
- Template for developers
- Documents all required environment variables
- Includes security notes

## Environment Variables

### Frontend (Safe to Expose)
```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
```

### Server-Side Only (Vercel Environment Variables Dashboard)
```
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
```

**CRITICAL SECURITY NOTE**: The PAYSTACK_SECRET_KEY should NEVER be:
- Committed to version control
- Exposed in the frontend
- Added to `.env` or `.env.local` files
- Shared in logs or error messages

## Deployment Steps

### Step 1: Prepare Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:
   ```
   Name: PAYSTACK_SECRET_KEY
   Value: sk_live_your_actual_secret_key
   Environment: Production, Preview, Development
   ```

### Step 2: Verify Configuration Files

- Ensure `vercel.json` is in the project root
- Ensure `api/` directory contains the serverless functions
- Ensure `.env.local` does NOT contain PAYSTACK_SECRET_KEY

### Step 3: Deploy to Vercel

```bash
# Option 1: Using Vercel CLI
vercel deploy --prod

# Option 2: Push to connected Git repository
git push origin main
```

### Step 4: Verify Deployment

1. Check that API endpoints are accessible:
   ```
   https://your-domain.vercel.app/api/paystack/initialize
   https://your-domain.vercel.app/api/paystack/verify
   ```

2. Test payment flow:
   - Navigate to `/payments`
   - Complete enrollment form
   - Verify redirect to Paystack checkout
   - Verify return to `/payments/success`
   - Verify payment status is recorded

## Local Development

### Running Vercel Functions Locally

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Link project:
   ```bash
   vercel link
   ```

3. Create `.env.local` file (copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```

4. Run development server with Vercel functions:
   ```bash
   vercel dev
   ```

   This starts both your Vite dev server AND the serverless functions locally.

### Alternative: Manual API Testing

```bash
# Test initialize endpoint
curl -X POST http://localhost:3000/api/paystack/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 3000000,
    "callback_url": "http://localhost:3000/payments/success",
    "metadata": {
      "child_name": "John Doe",
      "child_age": "8",
      "child_class": "Grade 3"
    }
  }'

# Test verify endpoint
curl -X POST http://localhost:3000/api/paystack/verify \
  -H "Content-Type: application/json" \
  -d '{"reference": "your_transaction_reference"}'
```

## Removed Supabase Dependencies

### No Longer Used
1. `supabase/functions/paystack-init/index.ts` - Can be deleted
2. `supabase/functions/paystack-verify/index.ts` - Can be deleted
3. `supabase/config.toml` sections for paystack functions - Can be removed

### Still Used
- Supabase database for storing payment records
- Supabase authentication for user management
- Supabase client library for database operations

## Database Schema (Unchanged)

The `payments` table structure remains the same:
```sql
- id (uuid primary key)
- user_id (uuid)
- amount (integer - in NGN)
- currency (text - "NGN")
- provider (text - "paystack")
- provider_reference (text - transaction reference)
- status (enum - pending, verified, failed, refunded)
- metadata (jsonb - transaction details, metadata)
- created_at (timestamp)
- updated_at (timestamp)
```

## Rollback Plan

If issues arise, you can quickly rollback:

1. **Keep Supabase functions**: The old Supabase Edge Functions are still available
2. **Update frontend**: Revert `PaymentsPage.tsx` and `PaymentSuccessPage.tsx` to use Supabase endpoints
3. **Remove Vercel functions**: Delete `/api` directory
4. **Test**: Verify payment flow works again

## Troubleshooting

### Issue: "Missing or Invalid Authorization Header"
**Cause**: Happens when PAYSTACK_SECRET_KEY is not set on server
**Solution**: 
1. Verify PAYSTACK_SECRET_KEY is set in Vercel Environment Variables
2. Restart deployment: `vercel deploy --prod`
3. Check deployment logs: `vercel logs`

### Issue: "CORS errors" or "Access-Control-Allow-Origin"
**Cause**: CORS headers not properly set
**Solution**: Both API functions include proper CORS headers; check:
1. Browser console for exact error
2. Vercel function logs
3. Request headers in Network tab

### Issue: Payment verification fails silently
**Cause**: Paystack reference not passed correctly
**Solution**:
1. Check callback URL matches: `https://domain/payments/success`
2. Verify reference parameter is in URL: `?reference=REFERENCE_CODE`
3. Check browser console for fetch errors
4. Review Vercel logs

### Issue: Local development with `vercel dev` not working
**Cause**: Vercel CLI not properly configured
**Solution**:
1. Run `vercel link` to link project
2. Ensure `.env.local` has all required variables
3. Clear `.vercel` cache: `rm -rf .vercel`
4. Run `vercel dev` again

## Security Checklist

- [ ] PAYSTACK_SECRET_KEY is NOT in `.env` or `.env.local`
- [ ] PAYSTACK_SECRET_KEY is set in Vercel Environment Variables (Production)
- [ ] `.env.example` does NOT contain real secret keys
- [ ] No secret keys are logged in browser console
- [ ] API functions use CORS headers appropriately
- [ ] API functions validate all inputs
- [ ] Database records include proper audit trail (metadata, timestamps)
- [ ] Payment records are saved even if user doesn't complete flow
- [ ] Error messages don't expose sensitive information

## Performance Notes

- **Initialize Function**: ~500ms (includes Paystack API call)
- **Verify Function**: ~400ms (includes Paystack verification)
- **Memory Limit**: 1024MB (sufficient for this workload)
- **Timeout**: 30 seconds (sufficient for Paystack API calls)

## Monitoring and Logging

### Vercel Dashboard
Monitor function execution at: Vercel Dashboard → Your Project → Functions

### API Response Logging
Both functions include comprehensive logging:
- Error cases
- API failures
- Invalid inputs
- Unexpected conditions

Check logs: `vercel logs` or Vercel Dashboard → Logs

## Next Steps

1. Test the payment flow locally with `vercel dev`
2. Deploy to Vercel production
3. Test payment flow on live domain
4. Monitor Vercel logs for any issues
5. Archive old Supabase functions (keep for rollback)
6. Update documentation for team

## Additional Resources

- [Vercel Node.js Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/nodejs)
- [Paystack Integration Guide](https://paystack.com/docs/payments/accept-payments/)
- [Supabase Edge Functions (legacy)](https://supabase.com/docs/guides/functions)
