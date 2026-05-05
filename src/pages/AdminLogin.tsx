import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { logOwnerActivity } from "@/lib/activity-logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});
type FormData = z.infer<typeof schema>;

export default function AdminLogin() {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();
  const { session, role, loading } = useAuthStore();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (loading) return null;
  if (session && role === "admin") return <Navigate to="/admin" replace />;

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        // Try to find owner and log failed attempt
        const { data: owner } = await supabase
          .from("owners")
          .select("id")
          .eq("email", values.email)
          .maybeSingle();
        
        if (owner?.id) {
          await logOwnerActivity({
            ownerId: owner.id,
            activityType: 'signin_failed',
            description: `Admin console signin failed: ${error.message}`,
            status: 'failed',
          });
        }
        throw error;
      }

      // Log successful admin signin
      if (data.user?.id) {
        await logOwnerActivity({
          ownerId: data.user.id,
          activityType: 'signin',
          description: 'Admin console access',
        });
      }

      // small delay for role load via listener
      setTimeout(() => navigate("/admin"), 300);
    } catch (e: any) {
      toast({ title: "Sign-in failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues("email").trim();
    if (!email) {
      toast({
        title: "Enter your email first",
        description: "Type your admin email above, then click Forgot password.",
        variant: "destructive",
      });
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) throw error;

      // Log forgot password attempt
      const { data: owner } = await supabase
        .from("owners")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      
      if (owner?.id) {
        await logOwnerActivity({
          ownerId: owner.id,
          activityType: 'signin',
          description: 'Password reset requested for admin console',
        });
      }

      toast({
        title: "Check your inbox",
        description: `We sent a password reset link to ${email}.`,
      });
    } catch (e: any) {
      toast({ title: "Could not send reset email", description: e.message, variant: "destructive" });
    } finally {
      setSendingReset(false);
    }
  };

  const emailErr = form.formState.errors.email;
  const passwordErr = form.formState.errors.password;

  return (
    <div className="min-h-screen grid place-items-center bg-sidebar px-4 text-sidebar-foreground">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-sidebar-foreground">Invelix Admin</span>
        </div>

        <Card className="p-8 shadow-lg">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Administrator sign-in</h1>
          <p className="text-sm text-muted-foreground mb-6">Restricted area. Authorized personnel only.</p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your admin email"
                {...form.register("email")}
              />
              {emailErr && <p className="text-xs text-destructive">{emailErr.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErr && <p className="text-xs text-destructive">{passwordErr.message}</p>}
              <div className="pt-1 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="text-xs text-primary font-medium hover:underline disabled:opacity-60"
                >
                  {sendingReset ? "Sending…" : "Forgot password?"}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sign in to console
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
