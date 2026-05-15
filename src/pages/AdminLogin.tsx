import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
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
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (loading) return null;

  if (session && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      setTimeout(() => navigate("/admin"), 300);
    } catch (e: unknown) {
      toast({
        title: "Sign-in failed",
        description: e instanceof Error ? e.message : "Sign-in failed",
        variant: "destructive",
      });
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

      toast({
        title: "Check your inbox",
        description: `We sent a password reset link to ${email}.`,
      });
    } catch (e: unknown) {
      toast({
        title: "Could not send reset email",
        description: e instanceof Error ? e.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  const emailErr = form.formState.errors.email;
  const passwordErr = form.formState.errors.password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 relative overflow-hidden">

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />

        <div
          className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div
          className="absolute bottom-[-120px] left-1/3 w-[32rem] h-[32rem] bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">

        

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 grid place-items-center shadow-[0_0_25px_rgba(34,211,238,0.7)] animate-pulse">
            <Shield className="h-6 w-6 text-black" />
          </div>

          <span className="text-2xl font-black tracking-[0.15em] bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            INVELIX ADMIN
          </span>
        </div>

        {/* Login Card */}
        <Card className="border border-cyan-500/20 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,255,0.18)] p-8 rounded-3xl">

          <h1 className="text-3xl font-bold text-center mb-2 text-cyan-100">
            Administrator Login
          </h1>

          <p className="text-center text-sm text-cyan-200/70 mb-8">
            Restricted area. Authorized personnel only.
          </p>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-cyan-100 font-medium"
              >
                Email
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="Enter your admin email"
                className="bg-black/40 border-cyan-500/20 text-white placeholder:text-cyan-200/30 focus-visible:ring-cyan-400"
                {...form.register("email")}
              />

              {emailErr && (
                <p className="text-xs text-red-400">
                  {emailErr.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-cyan-100 font-medium"
              >
                Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pr-10 bg-black/40 border-cyan-500/20 text-white placeholder:text-cyan-200/30 focus-visible:ring-cyan-400"
                  {...form.register("password")}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyan-200/60 hover:text-white rounded-md"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {passwordErr && (
                <p className="text-xs text-red-400">
                  {passwordErr.message}
                </p>
              )}

              <div className="pt-1 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="text-xs text-cyan-300 hover:text-cyan-100 hover:underline disabled:opacity-60"
                >
                  {sendingReset ? "Sending..." : "Forgot password?"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.8)]"
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}

              Sign in to Console

            </Button>
            {/* Back Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-cyan-300 hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_8px_cyan] group"
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform">

            </span>

            <span className="text-sm font-medium">
              Back to Business Login
            </span>
          </button>
        </div>
          </form>
        </Card>
      </div>
    </div>
  );
}