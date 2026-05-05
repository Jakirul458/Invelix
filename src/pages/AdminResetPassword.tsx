import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, { message: "Min 8 characters" }).max(72),
    confirm: z.string().min(8).max(72),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type FormData = z.infer<typeof schema>;

export default function AdminResetPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    // Supabase parses the recovery hash and emits PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check if a session already exists from the hash
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/admin/login");
    } catch (e: any) {
      toast({ title: "Could not update password", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-sidebar px-4 text-sidebar-foreground">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Invelix Admin</span>
        </div>

        <Card className="p-8 shadow-lg">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Set a new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a strong password you haven't used before.
          </p>

          {!ready ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying reset link…
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className="pr-10"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type={show ? "text" : "password"}
                  placeholder="Repeat your password"
                  {...form.register("confirm")}
                />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update password
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/login")}
              className="hover:text-foreground underline underline-offset-2"
            >
              Back to admin login
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
