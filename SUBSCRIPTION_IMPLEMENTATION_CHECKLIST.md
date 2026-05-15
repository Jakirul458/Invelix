# Subscription System - Implementation Checklist

## Files Ready for Implementation ✅

### Core Files Created
- [x] Database migration schema (docs/SUPABASE_SCHEMA.sql)
- [x] TypeScript type definitions (src/types/subscription.ts)
- [x] Subscription helper functions (src/lib/subscription-helpers.ts)
- [x] Payment service layer (src/lib/paytm-service.ts)
- [x] Subscription status hook (src/hooks/useSubscriptionStatus.ts)
- [x] Paytm checkout loader (src/hooks/usePaytmCheckout.ts)
- [x] Protected route component (src/components/ProtectedRoute.tsx)
- [x] Trial popup component (src/components/subscription/TrialPopup.tsx)
- [x] Subscription expired page (src/components/subscription/SubscriptionExpired.tsx)
- [x] Suspended account page (src/components/subscription/SuspendedAccount.tsx)
- [x] Updated auth page (src/pages/AuthNew.tsx) - needs rename
- [x] Subscribe/payment page (src/pages/Subscribe.tsx)
- [x] Paytm initiation Edge Function (supabase/functions/initiate-paytm-transaction/index.ts)
- [x] Paytm verification Edge Function (supabase/functions/verify-paytm-payment/index.ts)
- [x] Environment variables template (.env.example)
- [x] App routes updated (src/App.tsx)

### Documentation Created
- [x] Complete setup guide (docs/SUBSCRIPTION_SETUP_GUIDE.md)
- [x] Quick reference (docs/SUBSCRIPTION_QUICK_REFERENCE.md)
- [x] Implementation summary (docs/IMPLEMENTATION_COMPLETE.md)
- [x] This checklist file

---

## Step-by-Step Setup

### STEP 1: Database Setup (30 mins)
**File**: `docs/SUPABASE_SCHEMA.sql`

- [ ] Login to Supabase dashboard
- [ ] Navigate to SQL Editor
- [ ] Open `docs/SUPABASE_SCHEMA.sql`
- [ ] Copy entire content
- [ ] Paste in Supabase SQL Editor
- [ ] Click "Run"
- [ ] Verify no errors
- [ ] Check in Data Editor:
  - [ ] profiles table has new columns (full_name, phone, subscription_status, etc.)
  - [ ] subscriptions table created
- [ ] Check in Auth section:
  - [ ] RLS policies are enabled on both tables

### STEP 2: Environment Configuration (15 mins)
**File**: `.env.local` (copy from `.env.example`)

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Supabase credentials:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
- [ ] Fill in Paytm frontend settings:
  - [ ] VITE_PAYTM_MID (your merchant ID)
  - [ ] VITE_PAYTM_WEBSITE (YOUR_WEBSITE)
  - [ ] VITE_PAYTM_ENVIRONMENT (production or sandbox)
- [ ] Add Paytm secrets in Supabase:
  - [ ] Go to Supabase Dashboard → Settings → Secrets
  - [ ] Add `PAYTM_MERCHANT_KEY`
  - [ ] Add `PAYTM_CALLBACK_URL`
  - [ ] Verify secrets saved

### STEP 3: Deploy Edge Functions (20 mins)
**Files**: `supabase/functions/*/index.ts`

- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link to project: `supabase link --project-ref [YOUR_PROJECT_REF]`
- [ ] Deploy initiate function:
  ```bash
  supabase functions deploy initiate-paytm-transaction
  ```
- [ ] Deploy verify function:
  ```bash
  supabase functions deploy verify-paytm-payment
  ```
- [ ] Test in Supabase dashboard:
  - [ ] Navigate to Functions section
  - [ ] Click on each function
  - [ ] View logs to verify deployment
  - [ ] Check CORS headers are correct

### STEP 4: Update Frontend Files (10 mins)
**Files**: `src/pages/Auth.tsx`, `src/App.tsx`

- [ ] Rename old auth: `mv src/pages/Auth.tsx src/pages/AuthOld.tsx`
- [ ] Rename new auth: `mv src/pages/AuthNew.tsx src/pages/Auth.tsx`
- [ ] Verify App.tsx routes:
  - [ ] Import statement for Auth (should auto-resolve)
  - [ ] `/subscribe` route present and protected
  - [ ] Dashboard routes wrapped with ProtectedRoute
  - [ ] All imports resolve without errors

### STEP 5: Install Dependencies (5 mins)

- [ ] Run: `npm install` (or `bun install`)
- [ ] Verify no errors
- [ ] Check all packages installed:
  ```bash
  npm ls react react-hook-form zod zustand
  ```

### STEP 6: Test Development Environment (15 mins)

- [ ] Start dev server: `npm run dev`
- [ ] Open browser: `http://localhost:5173`
- [ ] Check no console errors:
  - [ ] Open DevTools (F12)
  - [ ] Go to Console tab
  - [ ] No red errors visible

### STEP 7: Test Signup Flow (20 mins)
**Endpoint**: `http://localhost:5173/auth`

- [ ] Navigate to `/auth`
- [ ] Click "Create your business account"
- [ ] Fill in test data:
  - [ ] Full Name: "Test User"
  - [ ] Email: "test@example.com"
  - [ ] Phone: "9999999999"
  - [ ] Password: "TestPassword123"
- [ ] Click "Create account"
- [ ] Expected: Trial popup shows
- [ ] Click "Continue Free Trial"
- [ ] Expected: Redirects to `/dashboard`
- [ ] Check in database:
  - [ ] New row in profiles table
  - [ ] full_name, phone populated
  - [ ] subscription_status = 'trial'
  - [ ] trial_end_date = today + 14 days

### STEP 8: Test Payment Flow (15 mins)
**Endpoint**: `http://localhost:5173/subscribe`

**For Sandbox Testing with Paytm**:
- [ ] On `/subscribe` page
- [ ] Verify pricing shows correctly (₹2000)
- [ ] Click "Subscribe Now"
- [ ] Expected: Paytm checkout modal opens
- [ ] **Don't actually pay** - just verify modal appears
- [ ] If modal doesn't appear:
  - [ ] Check console for errors
  - [ ] Verify VITE_PAYTM_MID is set
  - [ ] Check Paytm domain is whitelisted

### STEP 9: Test Trial Expiry (10 mins)
**Manual Database Update**

- [ ] Go to Supabase dashboard
- [ ] In Data Editor, find the test user in profiles table
- [ ] Update `trial_end_date` to today (or yesterday)
- [ ] Visit `/dashboard` in app
- [ ] Expected: See "Trial Expired" page instead of dashboard
- [ ] Verify "Subscribe Now" button works

### STEP 10: Test Account Suspension (5 mins)
**Manual Database Update**

- [ ] In Supabase Data Editor, find test user
- [ ] Update `account_status` to 'suspended'
- [ ] Refresh `/dashboard` in app
- [ ] Expected: See "Account Suspended" page
- [ ] Verify message shown

---

## Troubleshooting

### Issue: "Database error" after migration
**Solution**:
- [ ] Check Supabase SQL logs for error
- [ ] Verify no syntax errors in SUPABASE_SCHEMA.sql
- [ ] Try running each migration separately
- [ ] Check table permissions

### Issue: "PAYTM_MERCHANT_KEY not found"
**Solution**:
- [ ] Verify secret added in Supabase Settings → Secrets
- [ ] Check exact spelling: `PAYTM_MERCHANT_KEY`
- [ ] Redeploy functions after adding secret
- [ ] Check function logs in Supabase dashboard

### Issue: "Payment gateway not available"
**Solution**:
- [ ] Check VITE_PAYTM_MID in .env.local
- [ ] Check VITE_PAYTM_ENVIRONMENT is 'sandbox' or 'production'
- [ ] Verify domain whitelisted in Paytm dashboard
- [ ] Check browser console for script loading errors

### Issue: "Trial not created after signup"
**Solution**:
- [ ] Check createTrialPeriod function in subscription-helpers.ts
- [ ] Look at browser console for errors
- [ ] Check Supabase function logs
- [ ] Verify profiles table insert worked

### Issue: Trial days showing wrong number
**Solution**:
- [ ] Check VITE_TRIAL_DURATION = 14 in .env
- [ ] Verify trial_end_date in database
- [ ] Check calculation in getTrialDaysRemaining()

### Issue: Routes not working
**Solution**:
- [ ] Verify all imports in App.tsx resolve
- [ ] Check BrowserRouter is at top level
- [ ] Verify no route conflicts
- [ ] Check React Router version compatibility

---

## Final Verification Checklist

### Before Going Live
- [ ] All migrations applied successfully
- [ ] Edge Functions deployed and working
- [ ] Environment variables set correctly
- [ ] Paytm secrets added to Supabase
- [ ] Auth page replaced (AuthNew.tsx → Auth.tsx)
- [ ] Dev environment working without errors
- [ ] Signup flow creates trial correctly
- [ ] Trial popup shows after signup
- [ ] Dashboard protected by subscription
- [ ] Payment page loads correctly
- [ ] Trial expiry blocks access
- [ ] Suspended account shows correctly
- [ ] No console errors on any page
- [ ] All new routes work correctly
- [ ] Database RLS policies working
- [ ] User can't access other users' data

### Documentation Review
- [ ] Read SUBSCRIPTION_SETUP_GUIDE.md completely
- [ ] Review SUBSCRIPTION_QUICK_REFERENCE.md
- [ ] Understand payment flow diagram
- [ ] Know how to debug Edge Functions
- [ ] Know database schema changes

### Admin Setup (Optional)
- [ ] Plan admin dashboard updates
- [ ] Create list of admin features needed
- [ ] Design subscription management UI
- [ ] Plan email notification system

---

## Success Criteria

✅ **Test Passes When**:
1. User can signup with Full Name, Email, Phone, Password
2. Trial popup appears after signup
3. User redirected to dashboard after accepting trial
4. Trial countdown shows correct days remaining
5. Trial end date prevents access to dashboard
6. Payment page shows correct pricing
7. Paytm checkout modal opens on payment click
8. Account suspension blocks access
9. No errors in browser console
10. All database updates working correctly

---

## Estimated Time

| Task | Time | Status |
|------|------|--------|
| Database Setup | 30 min | [ ] |
| Environment Config | 15 min | [ ] |
| Deploy Edge Functions | 20 min | [ ] |
| Update Frontend | 10 min | [ ] |
| Install Dependencies | 5 min | [ ] |
| Test Dev Environment | 15 min | [ ] |
| Test Signup Flow | 20 min | [ ] |
| Test Payment Flow | 15 min | [ ] |
| Test Trial Expiry | 10 min | [ ] |
| Test Suspension | 5 min | [ ] |
| **TOTAL** | **2-3 hours** | [ ] |

---

## Post-Implementation Tasks

### Short Term (Week 1)
- [ ] Monitor logs for errors
- [ ] Test with real Paytm account (sandbox)
- [ ] Verify all users can signup
- [ ] Test payment processing

### Medium Term (Week 2-3)
- [ ] Add admin dashboard subscription management
- [ ] Setup email notifications
- [ ] Create user documentation
- [ ] Setup monitoring and alerts

### Long Term (Month 1+)
- [ ] Add webhook support
- [ ] Plan upgrade/downgrade flows
- [ ] Review subscription metrics
- [ ] Optimize payment flow

---

## Support Contacts

- **Technical Issues**: Check logs in Supabase dashboard
- **Paytm Issues**: https://business.paytm.com/support
- **Supabase Issues**: https://supabase.com/docs
- **Local Documentation**: `docs/SUBSCRIPTION_SETUP_GUIDE.md`

---

**Checklist Version**: 1.0  
**Last Updated**: May 2026  
**Status**: Ready for Implementation
