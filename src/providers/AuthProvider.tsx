import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, type Role } from "@/lib/auth-store";

async function loadProfile(userId: string): Promise<{ role: Role | null; isActive: boolean }> {
  const [{ data: roleRow }, { data: ownerRow }, { data: profileRow }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("owners").select("is_active").eq("id", userId).maybeSingle(),
    supabase.from("profiles").select("account_status").eq("id", userId).maybeSingle(),
  ]);

  const role = (roleRow?.role as Role) ?? null;
  const ownerActive = ownerRow?.is_active ?? false;
  const profileActive = profileRow?.account_status === "active";

  // Legacy: before profiles migration, treat owner row as sole gate
  const isActive =
    role === "admin"
      ? true
      : profileRow == null
        ? ownerActive
        : ownerActive && profileActive;

  return { role, isActive };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, reset, setLoading, clearExpiredSession } = useAuthStore();

  useEffect(() => {
    // Check for expired session first (date change or 24 hours passed)
    clearExpiredSession();

    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        reset();
        return;
      }
      // Defer Supabase calls to avoid deadlocks
      setTimeout(() => {
        loadProfile(session.user.id).then(({ role, isActive }) => {
          // Admins are always considered active
          setAuth(session, role, role === "admin" ? true : isActive);
        });
      }, 0);
    });

    // THEN initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      loadProfile(session.user.id).then(({ role, isActive }) => {
        setAuth(session, role, role === "admin" ? true : isActive);
      });
    });

    // Check for date change every minute and auto-logout if needed
    const checkExpireInterval = setInterval(() => {
      clearExpiredSession();
    }, 60000); // Check every minute

    return () => {
      sub.subscription.unsubscribe();
      clearInterval(checkExpireInterval);
    };
  }, [setAuth, reset, setLoading, clearExpiredSession]);

  return <>{children}</>;
};
