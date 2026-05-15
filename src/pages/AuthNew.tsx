// import { useState } from "react";
// import { Link, Navigate, useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuthStore } from "@/lib/auth-store";
// import { createTrialPeriod } from "@/lib/subscription-helpers";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { toast } from "@/hooks/use-toast";
// import { Loader2, Eye, EyeOff } from "lucide-react";
// import { BrandLogo } from "@/components/BrandLogo";
// import { cn } from "@/lib/utils";
// import TrialPopup from "@/components/subscription/TrialPopup";

// const signinSchema = z.object({
//   email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
//   password: z.string().min(8, { message: "Min 8 characters" }).max(72),
// });

// const signupSchema = z.object({
//   fullName: z.string().min(2, { message: "Enter your full name" }).max(255),
//   email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
//   phone: z.string().regex(/^[0-9]{10}$/, { message: "Enter a valid 10-digit phone number" }),
//   password: z.string().min(8, { message: "Min 8 characters" }).max(72),
// });

// type SigninFormData = z.infer<typeof signinSchema>;
// type SignupFormData = z.infer<typeof signupSchema>;

// export default function Auth() {
//   const [mode, setMode] = useState<"signin" | "signup">("signin");
//   const [submitting, setSubmitting] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [remember, setRemember] = useState(
//     typeof window !== "undefined" ? localStorage.getItem("invelix_remember") === "1" : false
//   );
//   const [sendingReset, setSendingReset] = useState(false);
//   const [showTrialPopup, setShowTrialPopup] = useState(false);
//   const [newUserFullName, setNewUserFullName] = useState("");
  
//   const navigate = useNavigate();
//   const { session, loading } = useAuthStore();

//   const signinForm = useForm<SigninFormData>({
//     resolver: zodResolver(signinSchema),
//     defaultValues: { email: "", password: "" },
//     mode: "onChange",
//   });

//   const signupForm = useForm<SignupFormData>({
//     resolver: zodResolver(signupSchema),
//     defaultValues: { fullName: "", email: "", phone: "", password: "" },
//     mode: "onChange",
//   });

//   if (loading) return null;
//   if (session) return <Navigate to="/" replace />;

//   const handleSignin = async (values: SigninFormData) => {
//     setSubmitting(true);
//     try {
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email: values.email,
//         password: values.password,
//       });

//       if (error) throw error;

//       localStorage.setItem("invelix_remember", remember ? "1" : "0");
//       navigate("/dashboard");
//     } catch (e: any) {
//       toast({ title: "Authentication error", description: e.message, variant: "destructive" });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleSignup = async (values: SignupFormData) => {
//     setSubmitting(true);
//     try {
//       // Create auth user
//       const { data, error } = await supabase.auth.signUp({
//         email: values.email,
//         password: values.password,
//         options: { 
//           emailRedirectTo: `${window.location.origin}/`,
//           data: {
//             full_name: values.fullName,
//             phone: values.phone
//           }
//         },
//       });

//       if (error) throw error;

//       if (!data.user?.id) {
//         throw new Error("Failed to create user account");
//       }

//       // Create profile with signup info
//       const { error: profileError } = await supabase
//         .from("profiles")
//         .upsert({
//           id: data.user.id,
//           full_name: values.fullName,
//           phone: values.phone,
//           email: values.email,
//           account_status: "active"
//         });

//       if (profileError) throw profileError;

//       // Create trial period (14 days)
//       const { error: trialError } = await createTrialPeriod(data.user.id);
//       if (trialError) throw new Error(trialError);

//       // Auto sign in the user
//       const { error: signinError } = await supabase.auth.signInWithPassword({
//         email: values.email,
//         password: values.password,
//       });

//       if (signinError) {
//         toast({
//           title: "Account created",
//           description: "Please sign in with your credentials.",
//           variant: "default"
//         });
//         setMode("signin");
//         return;
//       }

//       // Show trial popup
//       setNewUserFullName(values.fullName);
//       setShowTrialPopup(true);
//     } catch (e: any) {
//       console.error("Signup error:", e);
//       toast({ 
//         title: "Signup failed", 
//         description: e.message, 
//         variant: "destructive" 
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleTrialContinue = () => {
//     setShowTrialPopup(false);
//     navigate("/dashboard");
//   };

//   const handleTrialSubscribe = () => {
//     setShowTrialPopup(false);
//     navigate("/subscribe");
//   };

//   const handleForgotPassword = async () => {
//     const email = signinForm.getValues("email").trim();
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
//       toast({ 
//         title: "Could not send reset email", 
//         description: e.message, 
//         variant: "destructive" 
//       });
//     } finally {
//       setSendingReset(false);
//     }
//   };

//   const isSignin = mode === "signin";
//   const form = isSignin ? signinForm : signupForm;

//   const emailVal = isSignin 
//     ? signinForm.watch("email") 
//     : signupForm.watch("email");
//   const passwordVal = isSignin 
//     ? signinForm.watch("password") 
//     : signupForm.watch("password");
//   const fullNameVal = isSignin ? "" : signupForm.watch("fullName");
//   const phoneVal = isSignin ? "" : signupForm.watch("phone");

//   const canSubmit = isSignin
//     ? emailVal.trim().length > 0 && passwordVal.length > 0 && !submitting
//     : fullNameVal.length > 0 && emailVal.trim().length > 0 && phoneVal.length === 10 && passwordVal.length > 0 && !submitting;

//   const emailErr = form.formState.errors.email;
//   const passwordErr = form.formState.errors.password;

//   return (
//     <>
//       <div className="min-h-screen grid place-items-center bg-gradient-auth px-4 py-10">
//         <div className="w-full max-w-md">
//           <div className="flex items-center gap-3 justify-center mb-8">
//             <BrandLogo size={48} className="shadow-glow rounded-[12px]" />
//             <span className="text-2xl font-semibold tracking-tight">Invelix</span>
//           </div>

//           <Card className="p-9 shadow-lg border-border/60 rounded-2xl">
//             <h1 className="text-2xl font-semibold tracking-tight mb-2 leading-snug">
//               {isSignin
//                 ? "Manage your business, all in one place"
//                 : "Create your business account"}
//             </h1>
//             <p className="text-sm text-muted-foreground mb-7">
//               {isSignin
//                 ? "Track products, control stock, and generate invoices with ease."
//                 : "Start managing stock & invoices in minutes. Get 14 days free trial!"}
//             </p>

//             <form 
//               onSubmit={isSignin 
//                 ? signinForm.handleSubmit(handleSignin)
//                 : signupForm.handleSubmit(handleSignup)
//               } 
//               className="space-y-5"
//             >
//               {!isSignin && (
//                 <div className="space-y-2">
//                   <Label htmlFor="fullName">Full Name</Label>
//                   <Input
//                     id="fullName"
//                     type="text"
//                     placeholder="Enter your full name"
//                     autoComplete="name"
//                     aria-invalid={!!signupForm.formState.errors.fullName}
//                     className={cn(
//                       signupForm.formState.errors.fullName && 
//                       "border-destructive focus-visible:ring-destructive"
//                     )}
//                     {...signupForm.register("fullName")}
//                   />
//                   {signupForm.formState.errors.fullName && (
//                     <p className="text-xs text-destructive">
//                       {signupForm.formState.errors.fullName.message}
//                     </p>
//                   )}
//                 </div>
//               )}

//               <div className="space-y-2">
//                 <Label htmlFor="email">Email address</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="Enter your email"
//                   autoComplete="email"
//                   aria-invalid={!!emailErr}
//                   className={cn(emailErr && "border-destructive focus-visible:ring-destructive")}
//                   {...form.register("email")}
//                 />
//                 {emailErr && <p className="text-xs text-destructive">{emailErr.message}</p>}
//               </div>

//               {!isSignin && (
//                 <div className="space-y-2">
//                   <Label htmlFor="phone">Phone Number</Label>
//                   <Input
//                     id="phone"
//                     type="tel"
//                     placeholder="10-digit mobile number"
//                     autoComplete="tel"
//                     aria-invalid={!!signupForm.formState.errors.phone}
//                     className={cn(
//                       signupForm.formState.errors.phone && 
//                       "border-destructive focus-visible:ring-destructive"
//                     )}
//                     {...signupForm.register("phone")}
//                   />
//                   {signupForm.formState.errors.phone && (
//                     <p className="text-xs text-destructive">
//                       {signupForm.formState.errors.phone.message}
//                     </p>
//                   )}
//                 </div>
//               )}

//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <div className="relative">
//                   <Input
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     autoComplete={isSignin ? "current-password" : "new-password"}
//                     aria-invalid={!!passwordErr}
//                     className={cn(
//                       "pr-10",
//                       passwordErr && "border-destructive focus-visible:ring-destructive"
//                     )}
//                     {...form.register("password")}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword((v) => !v)}
//                     className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md"
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                     tabIndex={-1}
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-4 w-4" />
//                     ) : (
//                       <Eye className="h-4 w-4" />
//                     )}
//                   </button>
//                 </div>
//                 {passwordErr && (
//                   <p className="text-xs text-destructive">{passwordErr.message}</p>
//                 )}

//                 {isSignin && (
//                   <div className="flex items-center justify-between pt-1">
//                     <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
//                       <Checkbox
//                         checked={remember}
//                         onCheckedChange={(c) => setRemember(c === true)}
//                       />
//                       Remember me
//                     </label>
//                     <button
//                       type="button"
//                       onClick={handleForgotPassword}
//                       disabled={sendingReset}
//                       className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
//                     >
//                       {sendingReset ? "Sending…" : "Forgot password?"}
//                     </button>
//                   </div>
//                 )}
//               </div>

//               <Button type="submit" className="w-full h-11" disabled={!canSubmit}>
//                 {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
//                 {isSignin ? "Sign in to dashboard" : "Create account"}
//               </Button>
//             </form>

//             <div className="mt-7 text-center text-sm text-muted-foreground">
//               {isSignin ? (
//                 <>
//                   Don't have an account?{" "}
//                   <button
//                     onClick={() => setMode("signup")}
//                     className="text-primary font-medium hover:underline"
//                   >
//                     Create your business account
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   Already have one?{" "}
//                   <button
//                     onClick={() => setMode("signin")}
//                     className="text-primary font-medium hover:underline"
//                   >
//                     Sign in
//                   </button>
//                 </>
//               )}
//             </div>
//           </Card>

//           <p className="text-center text-xs text-muted-foreground mt-6">
//             <Link to="/admin/login" className="hover:text-foreground underline underline-offset-2">
//               Admin? Sign in here
//             </Link>
//           </p>
//         </div>
//       </div>

//       {/* Trial Popup */}
//       <TrialPopup
//         isOpen={showTrialPopup}
//         fullName={newUserFullName}
//         onContinueTrial={handleTrialContinue}
//         onSubscribeNow={handleTrialSubscribe}
//       />
//     </>
//   );
// }
