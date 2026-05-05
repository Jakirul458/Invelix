import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 'signup' | 'signin' | 'account_activated' | 'account_deactivated' | 'profile_updated' | 'account_deleted' | 'signin_failed';

interface ActivityLogParams {
  ownerId: string;
  activityType: ActivityType;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failed';
}

/**
 * Log owner activity for audit trail and analytics
 * This function should be called from client side and uses service role in the database
 */
export async function logOwnerActivity({
  ownerId,
  activityType,
  description,
  ipAddress,
  userAgent,
  status = 'success',
}: ActivityLogParams) {
  try {
    // Get client IP if not provided (best effort)
    const finalIpAddress = ipAddress || (await getClientIp());
    const finalUserAgent = userAgent || navigator.userAgent;

    // Insert activity log via RPC function
    const { error } = await supabase.rpc('log_owner_activity', {
      owner_id: ownerId,
      activity_type: activityType,
      description,
      ip_address: finalIpAddress,
      user_agent: finalUserAgent,
      status,
    });

    if (error) {
      console.warn('Failed to log activity:', error);
      // Don't throw - activity logging shouldn't break the main flow
    }
  } catch (err) {
    console.warn('Activity logging error:', err);
  }
}

/**
 * Try to get client IP address (best effort)
 */
async function getClientIp(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

/**
 * Get activity logs for an owner
 */
export async function getOwnerActivityLogs(ownerId: string, limit = 50) {
  const { data, error } = await supabase
    .from('owner_activity_logs')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Format timestamp for display
 */
export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Get activity type label
 */
export function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    signup: 'Account Created',
    signin: 'Signed In',
    signin_failed: 'Sign In Failed',
    account_activated: 'Account Activated',
    account_deactivated: 'Account Deactivated',
    profile_updated: 'Profile Updated',
    account_deleted: 'Account Deleted',
  };
  return labels[type] || type;
}

/**
 * Get activity type color for UI
 */
export function getActivityColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    signup: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    signin: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    signin_failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    account_activated: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    account_deactivated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    profile_updated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    account_deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}
