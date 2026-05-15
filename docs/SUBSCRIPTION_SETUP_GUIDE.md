# Invelix Subscription System Setup Guide

## Overview

This guide covers the complete setup of the subscription system for Invelix SaaS platform with Paytm payment gateway integration.

## Architecture Components

### 1. **Database Schema** (`docs/SUPABASE_SCHEMA.sql`)

Two main tables:

**profiles table** (extended):
- `full_name` - User's full name
- `phone` - 10-digit phone number
- `subscription_status` - 'trial' | 'active' | 'suspended' | 'expired'
- `trial_start_date` - When trial started (ISO 8601)
- `trial_end_date` - When trial ends (ISO 8601)
- `subscription_expires_at` - When paid subscription expires
- `account_status` - 'active' | 'suspended' | 'deleted'

**subscriptions table**:
- `user_id` - Reference to auth.users
- `order_id` - Paytm order ID
- `payment_id` - Paytm transaction ID
- `amount` - Payment amount in paise
- `payment_status` - 'pending' | 'success' | 'failed'
- `current_period_start` - Subscription period start
- `current_period_end` - Subscription period end (1 year)
- `is_first_purchase` - Boolean flag
- `created_at` - Record creation timestamp

### 2. **TypeScript Types** (`src/types/subscription.ts`)

Core interfaces for type safety:
- `Profile` - User profile with subscription fields
- `Subscription` - Payment and subscription record
- `SubscriptionStatus` - Combined status view
- `PaytmInitiateResponse` - Payment initiation response
- `PaytmVerifyResponse` - Payment verification response

### 3. **Core Subscription Logic** (`src/lib/subscription-helpers.ts`)

Key functions:

```typescript
// Status Checks
isTrialActive(profile): boolean
isSubscriptionActive(profile): boolean
getTrialDaysRemaining(profile): number
getSubscriptionStatus(profile): SubscriptionStatus

// First Purchase Detection
isFirstPurchase(userId): Promise<boolean>

// Pricing Logic
getSubscriptionPrice(isFirstTime: boolean): number
// Returns: 2000 INR (first purchase) | 1000 INR (renewal)

// Lifecycle Management
createTrialPeriod(userId): Promise<{error?: string}>
activateSubscription(userId, subscriptionId): Promise<void>
suspendUserAccount(userId): Promise<void>
extendSubscriptionExpiry(userId, additionalDays): Promise<void>
```

### 4. **React Hooks**

**useSubscriptionStatus** (`src/hooks/useSubscriptionStatus.ts`):
- Real-time subscription status monitoring
- Automatic refetch on auth changes
- Returns subscription status and can-access-dashboard flag

**usePaytmCheckout** (`src/hooks/usePaytmCheckout.ts`):
- Dynamically loads Paytm Checkout JS library
- Handles script injection and cleanup

### 5. **Payment Service** (`src/lib/paytm-service.ts`)

Frontend payment integration:
- `initiatePaytmTransaction()` - Calls Edge Function to get txnToken
- `verifyPaytmPayment()` - Calls Edge Function to verify payment
- `openPaytmCheckout()` - Opens Paytm modal
- `createSubscriptionRecord()` - Creates subscription DB record

### 6. **Supabase Edge Functions**

**initiate-paytm-transaction** (`supabase/functions/initiate-paytm-transaction/`):
```
POST /initiate-paytm-transaction
Input: { userId, orderId, amount, email, phone, description }
Output: { success, txnToken, orderId }
Security: Server-side, keeps PAYTM_MERCHANT_KEY secret
```

**verify-paytm-payment** (`supabase/functions/verify-paytm-payment/`):
```
POST /verify-paytm-payment
Input: { Paytm callback response }
Output: { success, transactionId, orderId, amount }
Security: Validates checksum server-side, updates DB
```

### 7. **React Components**

**TrialPopup** (`src/components/subscription/TrialPopup.tsx`):
- Shows after signup
- Displays trial benefits
- Options: "Continue Free Trial" or "Subscribe Now"

**SuspendedAccount** (`src/components/subscription/SuspendedAccount.tsx`):
- Shows when account is suspended
- Contact support button
- Data preservation message

**SubscriptionExpired** (`src/components/subscription/SubscriptionExpired.tsx`):
- Shows when trial/subscription expires
- Pricing information
- Subscribe button

**ProtectedRoute** (`src/components/ProtectedRoute.tsx`):
- Wraps protected pages
- Checks subscription status
- Routes based on status:
  - Trial expired → SubscriptionExpired
  - Account suspended → SuspendedAccount
  - Active → Render children

### 8. **Updated Auth Page** (`src/pages/AuthNew.tsx`)

Enhanced signup form with:
- Full Name field
- Email field
- Phone number field (10 digits validation)
- Password field
- Auto-login after signup
- Trial popup display
- Creates 14-day trial automatically

### 9. **Subscribe Page** (`src/pages/Subscribe.tsx`)

Payment and subscription management:
- Shows annual plan (₹2000 first, ₹1000 renewal)
- Monthly plan (coming soon)
- Integrates with Paytm checkout
- Shows subscription benefits
- FAQ section

## Setup Steps

### Step 1: Database Setup

1. Connect to Supabase project
2. Run migrations in `docs/SUPABASE_SCHEMA.sql`:
   ```sql
   -- Alter profiles table
   -- Create subscriptions table
   -- Create RLS policies
   ```
3. Verify tables and columns in Supabase dashboard

### Step 2: Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in required variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Paytm (Frontend)
VITE_PAYTM_MID=YOUR_MERCHANT_ID
VITE_PAYTM_WEBSITE=YOUR_WEBSITE
VITE_PAYTM_ENVIRONMENT=production

# Paytm (Backend/Edge Functions - in Supabase secrets)
PAYTM_MERCHANT_KEY=your_merchant_key
PAYTM_CALLBACK_URL=https://yourdomain.com/api/paytm-callback

# Subscription Pricing
VITE_SUBSCRIPTION_NEW=2000
VITE_SUBSCRIPTION_RENEWAL=1000

# Trial
VITE_TRIAL_DURATION=14
```

### Step 3: Paytm Configuration

1. **Get Paytm Merchant Credentials**:
   - Login to Paytm Dashboard
   - Go to Settings → Developer Settings
   - Get MERCHANT_ID and MERCHANT_KEY
   - Get API keys

2. **Add Secrets to Supabase**:
   - Go to Supabase Dashboard
   - Settings → Secrets
   - Add: PAYTM_MERCHANT_KEY
   - Add: PAYTM_CALLBACK_URL

3. **Whitelist Domains**:
   - Add your domain to Paytm whitelist in dashboard

### Step 4: Deploy Edge Functions

1. **Setup Supabase CLI**:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref xxx
   ```

2. **Deploy Functions**:
   ```bash
   supabase functions deploy initiate-paytm-transaction
   supabase functions deploy verify-paytm-payment
   ```

3. **Test Functions**:
   - Use Supabase Dashboard to test endpoints
   - Verify CORS headers are correct

### Step 5: Update Auth Page

Replace old Auth.tsx with AuthNew.tsx:

```bash
# Option 1: Rename
mv src/pages/Auth.tsx src/pages/AuthOld.tsx
mv src/pages/AuthNew.tsx src/pages/Auth.tsx

# Option 2: Update imports in App.tsx
import Auth from "@/pages/AuthNew";
```

### Step 6: Update App Routes

Routes already updated in `src/App.tsx`:
- `/auth` - Auth page (new signup flow)
- `/subscribe` - Payment page (protected by RequireAuth)
- `/dashboard` - Protected by ProtectedRoute (checks subscription)
- All other dashboard routes protected

### Step 7: Install Dependencies

Ensure all dependencies are installed:

```bash
npm install
# or
bun install
```

Required packages already in package.json:
- react-hook-form
- zod
- zustand (for auth store)

### Step 8: Test Flow

1. **Signup Test**:
   - Go to `/auth`
   - Switch to "Create account"
   - Fill in form (Full Name, Email, 10-digit Phone, Password)
   - Click "Create account"
   - See Trial Popup
   - Click "Continue Free Trial"
   - Should be in dashboard

2. **Trial Expiry Test**:
   - Modify trial_end_date in DB to today
   - Refresh `/dashboard`
   - Should show SubscriptionExpired page

3. **Payment Test** (Sandbox):
   - Go to `/subscribe` (from dashboard or direct)
   - Click "Subscribe Now"
   - Use Paytm sandbox credentials
   - Complete payment flow
   - Verify subscription_status changes to 'active'

4. **Account Suspension Test**:
   - Update account_status to 'suspended' in DB
   - Refresh `/dashboard`
   - Should show SuspendedAccount page

## Database Row Level Security (RLS)

The schema includes RLS policies:

1. **profiles**: Users can only read their own profile
2. **subscriptions**: Users can only read their own subscription records
3. Both tables: Only authenticated users can access

## Paytm Integration Notes

### Security Best Practices

1. **Never expose PAYTM_MERCHANT_KEY** in frontend code
2. **Always verify checksums** on backend (Edge Functions)
3. **Always verify transaction** before updating subscription
4. **Use server-side transaction timeout** (5-10 mins)

### Checksum Verification

The Edge Function verifies:
1. Checksum hash matches calculated value
2. Transaction status is TXN_SUCCESS
3. Amount matches original request
4. Order ID exists in database

### Payment Flow

```
User → Frontend (Subscribe.tsx)
↓
Frontend calls initiatePaytmTransaction()
↓
Edge Function (generate checksum, get txnToken)
↓
Frontend opens Paytm modal
↓
User enters payment details
↓
Paytm returns to frontend callback
↓
Frontend calls verifyPaytmPayment()
↓
Edge Function (verify checksum, update DB)
↓
Frontend redirects to success/error page
```

## Admin Dashboard Updates

Admin should be able to see user subscriptions:

**Recommended Admin Features**:
- View all users with subscription status
- Manual subscription activation
- Trial extension (add days)
- Account suspension/reactivation
- Payment history

**Implementation**:
- Update `/admin` dashboard to query subscriptions table
- Add admin-specific RLS policies if needed
- Create admin functions for manual updates

## Monitoring & Maintenance

### Regular Checks

1. **Daily**: Monitor failed payments (payment_status = 'failed')
2. **Weekly**: Check expired trials/subscriptions
3. **Monthly**: Review subscription metrics

### Database Maintenance

1. **Backup** before major changes
2. **Monitor** database size
3. **Clean up** old failed payment attempts
4. **Archive** old subscription records

## Troubleshooting

### Common Issues

**1. "Payment gateway not available"**
- Verify Paytm script loaded: Check browser console
- Verify VITE_PAYTM_ENVIRONMENT is correct
- Verify whitelist domains in Paytm dashboard

**2. "Failed to initiate payment"**
- Check Edge Function logs in Supabase
- Verify PAYTM_MERCHANT_KEY in secrets
- Verify userId exists in profiles table

**3. "Trial not created after signup"**
- Check createTrialPeriod function error handling
- Verify profiles table has new user record
- Check browser console for errors

**4. "Checksum verification failed"**
- Verify PAYTM_MERCHANT_KEY matches dashboard
- Check Paytm environment (sandbox vs production)
- Verify order ID format

### Debug Mode

Enable debug logging:
```typescript
// In paytm-service.ts
console.log('Initiating transaction:', { userId, amount, orderId });
console.log('Paytm response:', response);
```

## Migration from Old System

If migrating from existing system:

1. **Create profiles table** entries for existing users
2. **Set subscription_status** to 'active' for paying users
3. **Set subscription_status** to 'trial' for free users
4. **Update subscription_expires_at** based on current plan
5. **Create subscription records** for payment history
6. **Test trial expiry** logic with sample data

## Support & Documentation

- **Paytm Docs**: https://business.paytm.com/api-docs/
- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security

## Compliance

Ensure compliance with:
- ✅ GDPR (data protection)
- ✅ PCI DSS (payment security)
- ✅ Terms of Service (refunds, cancellations)
- ✅ RBI Guidelines (payment processing)

## Next Steps

After setup completion:

1. ✅ Test complete payment flow
2. ✅ Setup admin dashboard for subscription management
3. ✅ Configure email notifications (trial ending, payment failed)
4. ✅ Setup webhook for Paytm callbacks
5. ✅ Create user documentation
6. ✅ Create admin documentation
7. ✅ Setup monitoring and alerts
8. ✅ Deploy to production

## Support Contact

For issues or questions:
- Email: support@invelix.com
- Dashboard: https://yourdomain.com/admin
