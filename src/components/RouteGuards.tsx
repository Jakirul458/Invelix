import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

const FullScreenLoader = () => (
  <div className="min-h-screen grid place-items-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthStore();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
};

export const RequireOwner = ({ children }: { children: React.ReactNode }) => {
  const { session, role, isActive, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/auth" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (!isActive) return <Navigate to="/pending" replace />;
  return <>{children}</>;
};

export const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { session, role, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/admin/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};
