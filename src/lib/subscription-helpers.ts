import { supabase } from '@/integrations/supabase/client';
import { Profile, SubscriptionStatus } from '@/types/subscription';

/**
 * Check if trial is active for a user
 */
export const isTrialActive = (profile: Profile): boolean => {
  if (!profile.trial_end_date) return false;
  
  const trialEndDate = new Date(profile.trial_end_date);
  const now = new Date();
  
  return now < trialEndDate && profile.subscription_status === 'trial';
};

/**
 * Check if subscription is active
 */
export const isSubscriptionActive = (profile: Profile): boolean => {
  if (!profile.subscription_expires_at) return false;
  
  const expiryDate = new Date(profile.subscription_expires_at);
  const now = new Date();
  
  return now < expiryDate && profile.subscription_status === 'active';
};

/**
 * Get remaining trial days
 */
export const getTrialDaysRemaining = (profile: Profile): number => {
  if (!profile.trial_end_date) return 0;
  
  const trialEndDate = new Date(profile.trial_end_date);
  const now = new Date();
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysRemaining > 0 ? daysRemaining : 0;
};

/**
 * Get complete subscription status for a user
 */
export const getSubscriptionStatus = (profile: Profile): SubscriptionStatus => {
  const now = new Date();
  const trialEnd = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
  const trialWindowOk =
    profile.subscription_status === "trial" && trialEnd !== null && now < trialEnd;

  const subscriptionPaidOk =
    profile.subscription_status === "active" &&
    profile.subscription_expires_at !== null &&
    now < new Date(profile.subscription_expires_at);

  const trialDaysRemaining = getTrialDaysRemaining(profile);

  const suspended =
    profile.account_status === "suspended" || profile.subscription_status === "suspended";

  const canAccessDashboard =
    profile.account_status === "active" &&
    !suspended &&
    (trialWindowOk || subscriptionPaidOk);

  return {
    isTrialActive: trialWindowOk,
    isSubscriptionActive: subscriptionPaidOk,
    trialDaysRemaining,
    subscriptionExpiresAt: profile.subscription_expires_at,
    subscriptionStatus: profile.subscription_status,
    accountStatus: profile.account_status,
    canAccessDashboard,
    isFirstPurchase: !profile.subscription_expires_at,
  };
};

/**
 * Check if user has an active first purchase (for pricing logic)
 */
export const isFirstPurchase = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('payment_status', 'success')
      .limit(1);
    
    if (error) throw error;
    
    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking first purchase:', error);
    return true; // Default to first purchase on error
  }
};

/**
 * Get subscription pricing based on purchase type
 */
export const getSubscriptionPrice = (isFirstTime: boolean): number => {
  const newPrice = parseInt(import.meta.env.VITE_SUBSCRIPTION_NEW || '2000');
  const renewalPrice = parseInt(import.meta.env.VITE_SUBSCRIPTION_RENEWAL || '1000');
  
  return isFirstTime ? newPrice : renewalPrice;
};

/**
 * Create a trial period for new user
 */
export const createTrialPeriod = async (userId: string): Promise<boolean> => {
  try {
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'trial',
        trial_start_date: now.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        account_status: 'active'
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error creating trial period:', error);
    return false;
  }
};

/**
 * Activate subscription after successful payment
 */
export const activateSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<boolean> => {
  try {
    const now = new Date();
    const subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_expires_at: subscriptionEndDate.toISOString(),
        account_status: 'active'
      })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        payment_status: 'success',
        current_period_start: now.toISOString(),
        current_period_end: subscriptionEndDate.toISOString(),
        is_first_purchase: false
      })
      .eq('id', subscriptionId);
    
    if (subscriptionError) throw subscriptionError;
    
    return true;
  } catch (error) {
    console.error('Error activating subscription:', error);
    return false;
  }
};

/**
 * Suspend a user account
 */
export const suspendUserAccount = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        account_status: 'suspended',
        subscription_status: 'suspended'
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error suspending user account:', error);
    return false;
  }
};

/**
 * Extend subscription expiry date
 */
export const extendSubscriptionExpiry = async (
  userId: string,
  additionalDays: number = 365
): Promise<boolean> => {
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('subscription_expires_at')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentExpiry = data?.subscription_expires_at 
      ? new Date(data.subscription_expires_at)
      : new Date();
    
    const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_expires_at: newExpiry.toISOString(),
        subscription_status: 'active'
      })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error extending subscription:', error);
    return false;
  }
};
