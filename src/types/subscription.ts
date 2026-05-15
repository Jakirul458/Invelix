// TypeScript Types and Interfaces for Subscription System

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "owner" | "admin";
  account_status: "pending" | "active" | "suspended";
  subscription_status: "trial" | "active" | "suspended" | "expired";
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_expires_at: string | null;
  trial_popup_acknowledged?: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  order_id: string;
  payment_id: string | null;
  amount: number;
  payment_status: "pending" | "success" | "failed";
  current_period_start: string | null;
  current_period_end: string | null;
  is_first_purchase: boolean;
  created_at: string;
}

export interface SubscriptionStatus {
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
  trialDaysRemaining: number;
  subscriptionExpiresAt: string | null;
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'expired';
  accountStatus: 'pending' | 'active' | 'suspended';
  canAccessDashboard: boolean;
  isFirstPurchase: boolean;
}

export interface PaytmInitiateResponse {
  success: boolean;
  txnToken?: string;
  orderId?: string;
  amount?: number;
  mid?: string;
  error?: string;
}

export interface PaytmVerifyResponse {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  amount?: number;
  error?: string;
}

export interface CreateSignupPayload {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

export interface AdminUserRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  account_status: string;
  subscription_status: string;
  trial_expiry_date: string | null;
  subscription_expiry_date: string | null;
  created_date: string;
}
