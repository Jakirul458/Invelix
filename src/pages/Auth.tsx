// import { useState } from "react";
// import { Link, Navigate, useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuthStore } from "@/lib/auth-store";
// import { logOwnerActivity } from "@/lib/activity-logger";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { toast } from "@/hooks/use-toast";
// import { Loader2, Eye, EyeOff } from "lucide-react";
// import { BrandLogo } from "@/components/BrandLogo";
// import { cn } from "@/lib/utils";

// const schema = z.object({
//   email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
//   password: z.string().min(8, { message: "Min 8 characters" }).max(72),
// });
// type FormData = z.infer<typeof schema>;

// export default function Auth() {
//   const [mode, setMode] = useState<"signin" | "signup">("signin");
//   const [submitting, setSubmitting] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [remember, setRemember] = useState(
//     typeof window !== "undefined" ? localStorage.getItem("invelix_remember") === "1" : false
//   );
//   const [sendingReset, setSendingReset] = useState(false);
//   const navigate = useNavigate();
//   const { session, loading } = useAuthStore();

//   const form = useForm<FormData>({
//     resolver: zodResolver(schema),
//     defaultValues: { email: "", password: "" },
//     mode: "onChange",
//   });

//   const emailVal = form.watch("email");
//   const passwordVal = form.watch("password");
//   const canSubmit = emailVal.trim().length > 0 && passwordVal.length > 0 && !submitting;

//   if (loading) return null;
//   if (session) return <Navigate to="/" replace />;

//   const onSubmit = async (values: FormData) => {
//     setSubmitting(true);
//     try {
//       if (mode === "signup") {
//         const { data, error } = await supabase.auth.signUp({
//           email: values.email,
//           password: values.password,
//           options: { emailRedirectTo: `${window.location.origin}/` },
//         });
//         if (error) throw error;

//         // Log signup activity if user was created
//         if (data.user?.id) {
//           await logOwnerActivity({
//             ownerId: data.user.id,
//             activityType: 'signup',
//             description: `New account created with email: ${values.email}`,
//           });
//         }

//         toast({
//           title: "Account created",
//           description: "An admin must activate your account before you can use the app.",
//         });
//       } else {
//         const { data, error } = await supabase.auth.signInWithPassword({
//           email: values.email,
//           password: values.password,
//         });
//         if (error) {
//           // Log failed signin attempt
//           const { data: owner } = await supabase
//             .from("owners")
//             .select("id")
//             .eq("email", values.email)
//             .maybeSingle();
          
//           if (owner?.id) {
//             await logOwnerActivity({
//               ownerId: owner.id,
//               activityType: 'signin_failed',
//               description: error.message,
//               status: 'failed',
//             });
//           }
//           throw error;
//         }

//         localStorage.setItem("invelix_remember", remember ? "1" : "0");

//         // Update last signin time and count
//         const userId = data.user?.id;
//         if (userId) {
//           // Log successful signin
//           await logOwnerActivity({
//             ownerId: userId,
//             activityType: 'signin',
//             description: `Signed in from email: ${values.email}`,
//           });

//           // Update owner's last_signin_at and signin_count
//           const { data: owner } = await supabase
//             .from("owners")
//             .select("signin_count")
//             .eq("id", userId)
//             .maybeSingle();

//           const currentCount = owner?.signin_count || 0;
//           await supabase
//             .from("owners")
//             .update({
//               last_signin_at: new Date().toISOString(),
//               signin_count: currentCount + 1,
//             })
//             .eq("id", userId);

//           // First-time user check: do they have an owner profile filled in?
//           const { data: ownerProfile } = await supabase
//             .from("owners")
//             .select("business_name")
//             .eq("id", userId)
//             .maybeSingle();

//           if (!ownerProfile || !ownerProfile.business_name) {
//             toast({
//               title: "Welcome to Invelix",
//               description: "No business found. Let's set up your store.",
//             });
//             navigate("/settings");
//             return;
//           }
//         }
//         navigate("/");
//       }
//     } catch (e: any) {
//       toast({ title: "Authentication error", description: e.message, variant: "destructive" });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleForgotPassword = async () => {
//     const email = form.getValues("email").trim();
//     if (!email) {
//       toast({
//         title: "Enter your email first",
//         description: "Type your email above, then click Forgot password.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setSendingReset(true);
//     try {
//       const { error } = await supabase.auth.resetPasswordForEmail(email, {
//         redirectTo: `${window.location.origin}/reset-password`,
//       });
//       if (error) throw error;
//       toast({
//         title: "Check your inbox",
//         description: `We sent a password reset link to ${email}.`,
//       });
//     } catch (e: any) {
//       toast({ title: "Could not send reset email", description: e.message, variant: "destructive" });
//     } finally {
//       setSendingReset(false);
//     }
//   };

//   const emailErr = form.formState.errors.email;
//   const passwordErr = form.formState.errors.password;

//   return (
//     <div className="min-h-screen grid place-items-center bg-gradient-auth px-4 py-10">
//       <div className="w-full max-w-md">
//         <div className="flex items-center gap-3 justify-center mb-8">
//           <BrandLogo size={48} className="shadow-glow rounded-[12px]" />
//           <span className="text-2xl font-semibold tracking-tight">Invelix</span>
//         </div>

//         <Card className="p-9 shadow-lg border-border/60 rounded-2xl">
//           <h1 className="text-2xl font-semibold tracking-tight mb-2 leading-snug">
//             {mode === "signin"
//               ? "Manage your business, all in one place"
//               : "Create your business account"}
//           </h1>
//           <p className="text-sm text-muted-foreground mb-7">
//             {mode === "signin"
//               ? "Track products, control stock, and generate invoices with ease."
//               : "Start managing stock & invoices in minutes."}
//           </p>

//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email address</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 autoComplete="email"
//                 aria-invalid={!!emailErr}
//                 className={cn(emailErr && "border-destructive focus-visible:ring-destructive")}
//                 {...form.register("email")}
//               />
//               {emailErr && <p className="text-xs text-destructive">{emailErr.message}</p>}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <div className="relative">
//                 <Input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Enter your password"
//                   autoComplete={mode === "signin" ? "current-password" : "new-password"}
//                   aria-invalid={!!passwordErr}
//                   className={cn(
//                     "pr-10",
//                     passwordErr && "border-destructive focus-visible:ring-destructive"
//                   )}
//                   {...form.register("password")}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((v) => !v)}
//                   className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                   tabIndex={-1}
//                 >
//                   {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                 </button>
//               </div>
//               {passwordErr && <p className="text-xs text-destructive">{passwordErr.message}</p>}

//               {mode === "signin" && (
//                 <div className="flex items-center justify-between pt-1">
//                   <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
//                     <Checkbox
//                       checked={remember}
//                       onCheckedChange={(c) => setRemember(c === true)}
//                     />
//                     Remember me
//                   </label>
//                   <button
//                     type="button"
//                     onClick={handleForgotPassword}
//                     disabled={sendingReset}
//                     className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
//                   >
//                     {sendingReset ? "Sending…" : "Forgot password?"}
//                   </button>
//                 </div>
//               )}
//             </div>

//             <Button type="submit" className="w-full h-11" disabled={!canSubmit}>
//               {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
//               {mode === "signin" ? "Sign in to dashboard" : "Create account"}
//             </Button>
//           </form>

//           <div className="mt-7 text-center text-sm text-muted-foreground">
//             {mode === "signin" ? (
//               <>
//                 Don't have an account?{" "}
//                 <button
//                   onClick={() => setMode("signup")}
//                   className="text-primary font-medium hover:underline"
//                 >
//                   Create your business account
//                 </button>
//               </>
//             ) : (
//               <>
//                 Already have one?{" "}
//                 <button
//                   onClick={() => setMode("signin")}
//                   className="text-primary font-medium hover:underline"
//                 >
//                   Sign in
//                 </button>
//               </>
//             )}
//           </div>
//         </Card>

//         <p className="text-center text-xs text-muted-foreground mt-6">
//           <Link to="/admin/login" className="hover:text-foreground underline underline-offset-2">
//             Admin? Sign in here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }






import { useState, useEffect, useRef } from "react";
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
import { Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(8, { message: "Min 8 characters" }).max(72),
});
type FormData = z.infer<typeof schema>;

// Neural Network Background Component
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.6,
    }));

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // Update + draw nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Pull toward mouse slightly
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          n.vx += (dx / dist) * 0.02;
          n.vy += (dy / dist) * 0.02;
          n.vx = Math.max(-1.2, Math.min(1.2, n.vx));
          n.vy = Math.max(-1.2, Math.min(1.2, n.vy));
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(180, 100%, 70%, 0.9)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "hsla(180, 100%, 50%, 0.8)";
        ctx.fill();
      }

      // Draw connections
      ctx.shadowBlur = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            const alpha = (1 - d / 130) * 0.35;
            ctx.strokeStyle = `hsla(190, 100%, 60%, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // Mouse line
        const mdx = nodes[i].x - mouse.x, mdy = nodes[i].y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 180) {
          ctx.strokeStyle = `hsla(280, 100%, 70%, ${(1 - md / 180) * 0.5})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

const taglines = [
  "⚡ Powering your business grid...",
  "🚀 Where inventory meets velocity",
  "🛡️ Business mode: Engaged",
  "💫 Track. Manage. Conquer.",
  "🔥 Your digital command center",
];

const greetings = ["👋 Hello Boss!", "🌟 Welcome Back!", "☕ Ready to rule?", "🎯 Let's get to work!"];

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(
    typeof window !== "undefined" ? localStorage.getItem("invelix_remember") === "1" : false
  );
  const [sendingReset, setSendingReset] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [logoClicks, setLogoClicks] = useState(0);
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

  useEffect(() => {
    const t = setInterval(() => setTaglineIdx(i => (i + 1) % taglines.length), 2800);
    const g = setInterval(() => setGreetingIdx(i => (i + 1) % greetings.length), 3500);
    return () => { clearInterval(t); clearInterval(g); };
  }, []);

  const handleLogoClick = () => {
    const n = logoClicks + 1;
    setLogoClicks(n);
    if (n === 5) toast({ title: "🎉 You found the secret!", description: "Stay awesome, Business Owner!" });
    else if (n === 10) toast({ title: "🦄 Easter egg unlocked!", description: "You're a legend! 🚀" });
  };

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

        const userId = data.user?.id;
        if (userId) {
          await logOwnerActivity({
            ownerId: userId,
            activityType: 'signin',
            description: `Signed in from email: ${values.email}`,
          });

          const { data: owner } = await supabase
            .from("owners")
            .select("signin_count")
            .eq("id", userId)
            .maybeSingle();

          // const currentCount = owner?.signin_count || 0;
          // await supabase
          //   .from("owners")
          //   .update({
          //     last_signin_at: new Date().toISOString(),
          //     signin_count: currentCount + 1,
          //   })
          //   .eq("id", userId);

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
        toast({ title: "🚀 Welcome back!", description: "Let's get to work!" });
        navigate("/");
      }
    } catch (e) {
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
        title: "📧 Check your inbox",
        description: `We sent a password reset link to ${email}.`,
      });
    } catch (e) {
      toast({ title: "Could not send reset email", description: e.message, variant: "destructive" });
    } finally {
      setSendingReset(false);
    }
  };

  const emailErr = form.formState.errors.email;
  const passwordErr = form.formState.errors.password;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
      <NeuralBackground />
      {/* Animated Gradient Background */}
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

  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.08),transparent_40%)]" />
</div>
      <Sparkles className="absolute top-10 left-10 w-6 h-6 text-primary/40 animate-float z-10 pointer-events-none" />
      <Sparkles className="absolute bottom-20 right-16 w-8 h-8 text-secondary/40 animate-float z-10 pointer-events-none" style={{ animationDelay: "1s" }} />
      <Sparkles className="absolute top-1/3 right-10 w-5 h-5 text-primary/30 animate-float z-10 pointer-events-none" style={{ animationDelay: "2s" }} />

      <Card className="w-full max-w-md p-8 relative z-10 overflow-hidden rounded-3xl border border-cyan-400/20 bg-black/25 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,255,255,0.15)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-500/5 before:via-transparent before:to-purple-500/5 before:pointer-events-none">
        <div className="flex flex-col items-center mb-6 text-center">
          <div 
            onClick={handleLogoClick}
            className="cursor-pointer hover:scale-110 hover:rotate-6 transition-transform select-none"
          >
            <BrandLogo 
              size={96} 
              className="drop-shadow-[0_0_25px_hsl(var(--primary)/0.7)] animate-float rounded-[12px]" 
            />
          </div>
          <h1 className="text-4xl font-black tracking-[0.35em] text-center mt-4 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">
  INVELIX
</h1>
          <div className="w-48 h-[2px] mt-3 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_20px_rgba(0,255,255,0.8)]" />
          <p key={`g-${greetingIdx}`} className="text-sm text-secondary mt-3 font-semibold animate-in fade-in slide-in-from-bottom-1">
            {greetings[greetingIdx]}
          </p>
          <p key={`t-${taglineIdx}`} className="text-xs text-muted-foreground mt-2 h-4 animate-in fade-in">
            {taglines[taglineIdx]}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-cyan-100 font-medium">
  Email address
</Label>
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
            <Label htmlFor="password" className="text-cyan-100 font-medium">
  Password
</Label>
            
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
                  {/* <Checkbox
                    checked={remember}
                    onCheckedChange={(c) => setRemember(c === true)}
                  />
                  Remember me */}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
                >
                  {sendingReset ? "Sending…" : "🔑 Forgot password?"}
                </button>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all duration-300" 
            disabled={!canSubmit}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === "signin" ? "🔓 Let's Work!" : "✨ Create account"}
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

        <p className="text-xs text-center text-muted-foreground mt-4">
          Tip: Click the logo… something fun might happen ✨
        </p>

        {/* <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/admin/login" className="hover:text-foreground underline underline-offset-2">
            Admin? Sign in here
          </Link>
        </p> */}
      </Card>
    </div>
  );
}