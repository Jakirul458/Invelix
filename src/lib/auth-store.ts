import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "owner";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role | null;
  isActive: boolean;
  loading: boolean;
  setAuth: (session: Session | null, role: Role | null, isActive: boolean) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  isActive: false,
  loading: true,
  setAuth: (session, role, isActive) =>
    set({ session, user: session?.user ?? null, role, isActive, loading: false }),
  setLoading: (v) => set({ loading: v }),
  reset: () => set({ session: null, user: null, role: null, isActive: false, loading: false }),
}));
