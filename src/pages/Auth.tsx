import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(8, { message: "Min 8 characters" }).max(72),
});
type FormData = z.infer<typeof schema>;

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(
    typeof window !== "undefined" ? localStorage.getItem("invelix_remember") === "1" : false
  );
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();
  const { session, loading } = useAuthStore();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const emailVal = form.watch("email");
  const passwordVal = form.watch("password");
  const canSubmit = emailVal.trim().length > 0 && passwordVal.length > 0 && !submitting;

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;

        // Log signup activity if user was created
        if (data.user?.id) {
          await logOwnerActivity({
            ownerId: data.user.id,
            activityType: 'signup',
            description: `New account created with email: ${values.email}`,
          });
        }

        toast({
          title: "Account created",
          description: "An admin must activate your account before you can use the app.",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) {
          // Log failed signin attempt
          const { data: owner } = await supabase
            .from("owners")
            .select("id")
            .eq("email", values.email)
            .maybeSingle();
          
          if (owner?.id) {
            await logOwnerActivity({
              ownerId: owner.id,
              activityType: 'signin_failed',
              description: error.message,
              status: 'failed',
            });
          }
          throw error;
        }

        localStorage.setItem("invelix_remember", remember ? "1" : "0");

        // Update last signin time and count
        const userId = data.user?.id;
        if (userId) {
          // Log successful signin
          await logOwnerActivity({
            ownerId: userId,
            activityType: 'signin',
            description: `Signed in from email: ${values.email}`,
          });

          // Update owner's last_signin_at and signin_count
          const { data: owner } = await supabase
            .from("owners")
            .select("signin_count")
            .eq("id", userId)
            .maybeSingle();

          const currentCount = owner?.signin_count || 0;
          await supabase
            .from("owners")
            .update({
              last_signin_at: new Date().toISOString(),
              signin_count: currentCount + 1,
            })
            .eq("id", userId);

          // First-time user check: do they have an owner profile filled in?
          const { data: ownerProfile } = await supabase
            .from("owners")
            .select("business_name")
            .eq("id", userId)
            .maybeSingle();

          if (!ownerProfile || !ownerProfile.business_name) {
            toast({
              title: "Welcome to Invelix",
              description: "No business found. Let's set up your store.",
            });
            navigate("/settings");
            return;
          }
        }
        navigate("/");
      }
    } catch (e: any) {
      toast({ title: "Authentication error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues("email").trim();
    if (!email) {
      toast({
        title: "Enter your email first",
        description: "Type your email above, then click Forgot password.",
        variant: "destructive",
      });
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
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
    <div className="min-h-screen grid place-items-center bg-gradient-auth px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <BrandLogo size={48} className="shadow-glow rounded-[12px]" />
          <span className="text-2xl font-semibold tracking-tight">Invelix</span>
        </div>

        <Card className="p-9 shadow-lg border-border/60 rounded-2xl">
          <h1 className="text-2xl font-semibold tracking-tight mb-2 leading-snug">
            {mode === "signin"
              ? "Manage your business, all in one place"
              : "Create your business account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-7">
            {mode === "signin"
              ? "Track products, control stock, and generate invoices with ease."
              : "Start managing stock & invoices in minutes."}
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                aria-invalid={!!emailErr}
                className={cn(emailErr && "border-destructive focus-visible:ring-destructive")}
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
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  aria-invalid={!!passwordErr}
                  className={cn(
                    "pr-10",
                    passwordErr && "border-destructive focus-visible:ring-destructive"
                  )}
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

              {mode === "signin" && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(c) => setRemember(c === true)}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={sendingReset}
                    className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
                  >
                    {sendingReset ? "Sending…" : "Forgot password?"}
                  </button>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={!canSubmit}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === "signin" ? "Sign in to dashboard" : "Create account"}
            </Button>
          </form>

          <div className="mt-7 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  Create your business account
                </button>
              </>
            ) : (
              <>
                Already have one?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/admin/login" className="hover:text-foreground underline underline-offset-2">
            Admin? Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
