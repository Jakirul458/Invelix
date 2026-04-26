import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, type Role } from "@/lib/auth-store";

async function loadProfile(userId: string): Promise<{ role: Role | null; isActive: boolean }> {
  const [{ data: roleRow }, { data: ownerRow }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("owners").select("is_active").eq("id", userId).maybeSingle(),
  ]);
  return {
    role: (roleRow?.role as Role) ?? null,
    isActive: ownerRow?.is_active ?? false,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, reset, setLoading } = useAuthStore();

  useEffect(() => {
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

    return () => sub.subscription.unsubscribe();
  }, [setAuth, reset, setLoading]);

  return <>{children}</>;
};
