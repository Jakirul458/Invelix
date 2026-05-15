import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { supabase } from '@/integrations/supabase/client';
import { Profile, SubscriptionStatus } from '@/types/subscription';
import { getSubscriptionStatus } from '@/lib/subscription-helpers';

/**
 * Hook to manage and monitor subscription status
 */
export const useSubscriptionStatus = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchSubscriptionStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setProfile(data as Profile);
          setSubscriptionStatus(getSubscriptionStatus(data as Profile));
        }
      } catch (err) {
        console.error('Error fetching subscription status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription status');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();

    // Set up real-time subscription with Supabase
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as Profile);
            setSubscriptionStatus(getSubscriptionStatus(payload.new as Profile));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    profile,
    subscriptionStatus,
    loading,
    error,
    refetch: () => {
      if (user?.id) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setProfile(data as Profile);
              setSubscriptionStatus(getSubscriptionStatus(data as Profile));
            }
          });
      }
    }
  };
};

/**
 * Hook to check if user can access dashboard
 */
export const useCanAccessDashboard = () => {
  const { subscriptionStatus, loading } = useSubscriptionStatus();

  return {
    canAccess: subscriptionStatus?.canAccessDashboard ?? false,
    reason: subscriptionStatus ? {
      accountStatus: subscriptionStatus.accountStatus,
      subscriptionStatus: subscriptionStatus.subscriptionStatus,
      isTrialActive: subscriptionStatus.isTrialActive,
      isSubscriptionActive: subscriptionStatus.isSubscriptionActive,
      trialDaysRemaining: subscriptionStatus.trialDaysRemaining
    } : null,
    loading
  };
};
