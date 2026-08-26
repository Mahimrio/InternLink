"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, Loader2, Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({
  code: z.string().length(6, "OTP must be 6 digits"),
});

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [otpToken, setOtpToken] = useState<string>("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [otpCodeValue, setOtpCodeValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setAuthData } = useAuth();

  const { register, handleSubmit, formState: { errors }, setError } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { handleSubmit: handleOtpSubmit, formState: { errors: otpErrors }, setError: setOtpError, setValue } = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.details) {
          Object.keys(data.details).forEach((key) => {
            const field = key.toLowerCase() as keyof typeof values;
            setError(field, { message: data.details[key].join(", ") });
          });
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      if (data.otpRequired && data.otpToken) {
        setOtpToken(data.otpToken);
        if (data.debugOtp) {
          setDebugOtp(data.debugOtp);
          setValue("code", data.debugOtp);
          setOtpCodeValue(data.debugOtp);
        }
        setStep("otp");
        toast.info("Please check your email for the verification code.");
      }
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpToken, code: values.code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");

      setAuthData(data.accessToken, data.role);
      toast.success("Login successful!");
      
      const rolePath = data.role.toLowerCase();
      router.push(`/${rolePath}/dashboard`);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "An unexpected error occurred");
      setOtpError("code", { message: "Invalid or expired OTP" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-teal-50 via-white to-amber-50/50" />
      <div className="fixed top-[-20%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-teal-200/30 blur-[100px] animate-pulse" />
      <div className="fixed bottom-[-20%] right-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-amber-200/30 blur-[100px] animate-pulse [animation-delay:2s]" />
      <div className="fixed top-[40%] right-[20%] -z-10 h-[300px] w-[300px] rounded-full bg-teal-100/20 blur-[80px] animate-pulse [animation-delay:4s]" />

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg shadow-teal-500/25 transition-transform duration-300 hover:scale-110">
          <Briefcase className="size-7 text-white" />
        </div>
        <span className="font-heading text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent">
          InternLink
        </span>
      </div>

      {/* Card */}
      <Card className="w-full max-w-md border-border/40 bg-white/80 shadow-xl shadow-teal-900/5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-6 duration-700 [animation-delay:150ms]">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2">
            {step === "login" ? (
              <Lock className="size-5 text-teal-600" />
            ) : (
              <ShieldCheck className="size-5 text-teal-600" />
            )}
            <CardTitle className="text-2xl font-bold">
              {step === "login" ? "Welcome back" : "Verify Identity"}
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground/80">
            {step === "login"
              ? "Enter your credentials to access your account."
              : "We've sent a 6-digit code to your email."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "login" ? (
            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    className="pl-10 transition-shadow duration-200 focus:shadow-md focus:shadow-teal-500/10"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 transition-shadow duration-200 focus:shadow-md focus:shadow-teal-500/10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors duration-200"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.password.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate shadow-md shadow-teal-600/20 transition-all duration-300 hover:shadow-lg hover:shadow-teal-600/30 hover:brightness-110 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-teal-50 p-4">
                  <Mail className="size-8 text-teal-600 animate-bounce [animation-duration:2s]" />
                </div>
                <Label className="text-sm font-medium">One-Time Password</Label>

                {debugOtp && (
                  <div className="w-full rounded-lg bg-teal-500/10 border border-teal-500/30 p-3 text-center text-xs animate-in fade-in zoom-in-95 duration-300">
                    <p className="font-semibold text-teal-800 dark:text-teal-300">🛠️ Debug Verification Code</p>
                    <p className="text-xl font-mono font-bold tracking-widest text-teal-700 dark:text-teal-300 my-1">
                      {debugOtp}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("code", debugOtp);
                        setOtpCodeValue(debugOtp);
                      }}
                      className="text-xs text-teal-700 dark:text-teal-300 underline font-medium hover:opacity-80 transition-opacity"
                    >
                      Auto-filled (Click if not applied)
                    </button>
                  </div>
                )}

                <InputOTP
                  maxLength={6}
                  value={otpCodeValue}
                  onChange={(val) => {
                    setOtpCodeValue(val);
                    setValue("code", val);
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {otpErrors.code && <p className="text-sm text-destructive animate-in fade-in duration-200">{otpErrors.code.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate shadow-md shadow-teal-600/20 transition-all duration-300 hover:shadow-lg hover:shadow-teal-600/30 hover:brightness-110 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  "Verify Code"
                )}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="relative mt-6 mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
          </div>

          {step === "login" && (
            <div className="text-center text-sm text-muted-foreground animate-in fade-in duration-500 [animation-delay:300ms]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-teal-600 hover:text-teal-700 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom decorative text */}
      <p className="mt-8 text-xs text-muted-foreground/50 animate-in fade-in duration-1000 [animation-delay:500ms]">
        Secured with end-to-end encryption
      </p>
    </div>
  );
}
