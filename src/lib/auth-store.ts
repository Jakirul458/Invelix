import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "owner";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role | null;
  isActive: boolean;
  loading: boolean;
  loginDate: string | null;
  setAuth: (session: Session | null, role: Role | null, isActive: boolean) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
  clearExpiredSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      role: null,
      isActive: false,
      loading: true,
      loginDate: null,
      setAuth: (session, role, isActive) => {
        if (session) {
          // Store the login date when setting auth
          const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
          set({ session, user: session?.user ?? null, role, isActive, loading: false, loginDate: today });
        } else {
          set({ session: null, user: null, role: null, isActive: false, loading: false, loginDate: null });
        }
      },
      setLoading: (v) => set({ loading: v }),
      reset: () =>
        set({
          session: null,
          user: null,
          role: null,
          isActive: false,
          loading: false,
          loginDate: null,
        }),
      clearExpiredSession: () => {
        const state = get();
        if (state.session && state.loginDate) {
          const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
          // If the date has changed or more than 24 hours has passed, clear the session
          if (today !== state.loginDate) {
            set({
              session: null,
              user: null,
              role: null,
              isActive: false,
              loading: false,
              loginDate: null,
            });
          }
        }
      },
    }),
    {
      name: "auth-store",
    }
  )
);
