# Subscription System - Quick Reference

## File Structure

```
src/
├── types/
│   └── subscription.ts          # TypeScript interfaces
├── lib/
│   ├── subscription-helpers.ts  # Core subscription logic
│   └── paytm-service.ts         # Payment service
├── hooks/
│   ├── useSubscriptionStatus.ts # Real-time status
│   └── usePaytmCheckout.ts      # Paytm loader
├── components/
│   ├── ProtectedRoute.tsx       # Route protection
│   └── subscription/
│       ├── TrialPopup.tsx       # Welcome popup
│       ├── SubscriptionExpired.tsx
│       └── SuspendedAccount.tsx
├── pages/
│   ├── AuthNew.tsx              # Updated auth (rename to Auth.tsx)
│   └── Subscribe.tsx            # Payment page

supabase/
├── functions/
│   ├── initiate-paytm-transaction/index.ts
│   └── verify-paytm-payment/index.ts
└── migrations/
    └── (Database schema in docs/SUPABASE_SCHEMA.sql)

docs/
├── SUBSCRIPTION_SETUP_GUIDE.md  # Complete setup
└── SUPABASE_SCHEMA.sql          # Database migrations
```

## Key Functions

### Subscription Status
```typescript
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

const { subscriptionStatus, canAccessDashboard, profile } = useSubscriptionStatus();

// subscriptionStatus fields:
// - subscriptionStatus: 'trial' | 'active' | 'suspended' | 'expired'
// - trialDaysRemaining: number
// - isTrialActive: boolean
// - isSubscriptionActive: boolean
// - canAccessDashboard: boolean
// - accountStatus: 'active' | 'suspended'
```

### Payment Initiation
```typescript
import { initiatePaytmTransaction, openPaytmCheckout } from '@/lib/paytm-service';

// Step 1: Initiate transaction
const response = await initiatePaytmTransaction(
  userId,     // User ID
  2000,       // Amount in INR
  email,      // User email
  phone       // User phone
);

// Step 2: Open Paytm checkout
if (response.success) {
  openPaytmCheckout(
    response.orderId,
    response.txnToken,
    2000,
    email,
    phone,
    onSuccess,  // Callback on success
    onError     // Callback on error
  );
}
```

### Subscription Helpers
```typescript
import {
  isTrialActive,
  isSubscriptionActive,
  getTrialDaysRemaining,
  getSubscriptionPrice,
  createTrialPeriod,
  activateSubscription,
  suspendUserAccount
} from '@/lib/subscription-helpers';

// Check trial status
const trialActive = isTrialActive(profile);
const daysRemaining = getTrialDaysRemaining(profile);

// Get pricing
const price = getSubscriptionPrice(isFirstPurchase); // 2000 or 1000

// Admin actions
await activateSubscription(userId, subscriptionId);
await suspendUserAccount(userId);
```

## Usage Examples

### Protect a Route
```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Check Access in Component
```typescript
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

export default function MyComponent() {
  const { subscriptionStatus, canAccessDashboard } = useSubscriptionStatus();

  if (!canAccessDashboard) {
    return <div>Please upgrade</div>;
  }

  return <div>Your content</div>;
}
```

### Show Trial Popup
```typescript
import TrialPopup from '@/components/subscription/TrialPopup';

<TrialPopup
  isOpen={true}
  fullName="John Doe"
  onContinueTrial={() => navigate('/dashboard')}
  onSubscribeNow={() => navigate('/subscribe')}
/>
```

## Environment Variables

```bash
# Required for frontend
VITE_PAYTM_MID=YOUR_MERCHANT_ID
VITE_PAYTM_WEBSITE=YOUR_WEBSITE
VITE_PAYTM_ENVIRONMENT=production|sandbox

# Optional pricing override
VITE_SUBSCRIPTION_NEW=2000
VITE_SUBSCRIPTION_RENEWAL=1000
VITE_TRIAL_DURATION=14
```

## Database Tables

### profiles (extended)
```sql
- full_name: text
- phone: text
- subscription_status: 'trial' | 'active' | 'suspended' | 'expired'
- trial_start_date: timestamp
- trial_end_date: timestamp
- subscription_expires_at: timestamp
- account_status: 'active' | 'suspended'
```

### subscriptions
```sql
- user_id: uuid (FK to auth.users)
- order_id: text (unique, Paytm order ID)
- payment_id: text (Paytm transaction ID)
- amount: integer (in paise)
- payment_status: 'pending' | 'success' | 'failed'
- is_first_purchase: boolean
- current_period_start: timestamp
- current_period_end: timestamp
```

## API Endpoints (Edge Functions)

### POST /functions/v1/initiate-paytm-transaction
```json
Request: {
  "userId": "uuid",
  "orderId": "ORDER_xxx",
  "amount": 200000,
  "email": "user@example.com",
  "phone": "9999999999",
  "description": "Invelix Subscription"
}

Response: {
  "success": true,
  "txnToken": "token_xxx",
  "orderId": "ORDER_xxx"
}
```

### POST /functions/v1/verify-paytm-payment
```json
Request: {
  "orderId": "ORDER_xxx",
  "transactionId": "txn_xxx",
  "STATUS": "TXN_SUCCESS",
  "CHECKSUMHASH": "hash_xxx",
  ...
}

Response: {
  "success": true,
  "transactionId": "txn_xxx",
  "orderId": "ORDER_xxx",
  "amount": 200000
}
```

## Common Workflows

### User Signup Flow
1. User fills form (Full Name, Email, Phone, Password)
2. Submit → Edge Function creates user + profile
3. createTrialPeriod() → Sets trial_start_date + trial_end_date
4. Auto-login → Show TrialPopup
5. Click "Continue" → Redirect to /dashboard

### Payment Flow
1. Click "Subscribe Now" on /subscribe
2. initiatePaytmTransaction() → Get txnToken from Edge Function
3. openPaytmCheckout() → Show Paytm modal
4. User enters payment details
5. Paytm returns callback
6. verifyPaytmPayment() → Verify in Edge Function
7. Update subscription_status to 'active'
8. Redirect to /dashboard

### Trial Expiry Flow
1. User visits /dashboard
2. useSubscriptionStatus() detects trial_end_date < today
3. ProtectedRoute checks canAccessDashboard = false
4. Show SubscriptionExpired component
5. User clicks "Subscribe Now" → /subscribe

## Testing Checklist

- [ ] User can signup with all fields
- [ ] Trial popup shows after signup
- [ ] Trial countdown shows correct days
- [ ] Subscribe page loads pricing
- [ ] Paytm modal opens on payment click
- [ ] Payment verification updates DB
- [ ] Dashboard accessible after payment
- [ ] Trial expiry blocks access
- [ ] Suspended account shows correct page
- [ ] Admin can suspend user

## Troubleshooting

**Payment not working**: Check PAYTM_MERCHANT_KEY in Supabase secrets
**Trial not created**: Check createTrialPeriod error in logs
**Access denied**: Check subscription_status in profiles table
**Checksum error**: Verify PAYTM_MERCHANT_KEY matches dashboard

## Support

- Docs: `docs/SUBSCRIPTION_SETUP_GUIDE.md`
- Setup: Follow SUBSCRIPTION_SETUP_GUIDE.md step by step
- Issues: Check Edge Function logs in Supabase dashboard
