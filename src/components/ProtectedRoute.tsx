import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import SubscriptionExpired from "@/components/subscription/SubscriptionExpired";
import SuspendedAccount from "@/components/subscription/SuspendedAccount";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Owner app shell: account must be active and trial or paid subscription valid.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuthStore();
  const { profile, subscriptionStatus, loading } = useSubscriptionStatus();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!subscriptionStatus || !profile) {
    return <Navigate to="/subscribe" replace />;
  }

  if (subscriptionStatus.accountStatus === "suspended") {
    return <SuspendedAccount />;
  }

  if (subscriptionStatus.canAccessDashboard) {
    return <>{children}</>;
  }

  const trialEndedWithoutPay =
    profile.subscription_status === "trial" &&
    !!profile.trial_end_date &&
    new Date() >= new Date(profile.trial_end_date);

  if (
    trialEndedWithoutPay ||
    subscriptionStatus.subscriptionStatus === "expired" ||
    (subscriptionStatus.subscriptionStatus === "active" && !subscriptionStatus.isSubscriptionActive)
  ) {
    return <SubscriptionExpired />;
  }

  return <SubscriptionExpired />;
}
