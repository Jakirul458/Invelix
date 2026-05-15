// SUPABASE SCHEMA - Run these SQL queries in your Supabase dashboard

-- 1. Update profiles table to include subscription fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial'; -- 'trial', 'active', 'suspended', 'expired'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending'; -- 'pending', 'active', 'suspended'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  payment_id TEXT,
  amount INTEGER NOT NULL, -- Amount in paise (multiply by 100)
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  is_first_purchase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON subscriptions(order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only authenticated users can insert" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
