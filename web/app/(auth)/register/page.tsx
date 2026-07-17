"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  Briefcase,
  Loader2,
  GraduationCap,
  Building2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mirror backend DTO + confirm password (client-only)
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*\d)(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/,
      "Must include an uppercase letter, a digit, and a special character."
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["Student", "Company"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  if (data.role === "Student") {
    if (!data.firstName || data.firstName.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "First name is required", path: ["firstName"] });
    }
    if (!data.lastName || data.lastName.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Last name is required", path: ["lastName"] });
    }
  }
  if (data.role === "Company") {
    if (!data.companyName || data.companyName.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company name is required", path: ["companyName"] });
    }
  }
});

function RegisterFormContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const defaultRole = searchParams.get("role") === "Company" ? "Company" : "Student";

  const { register, handleSubmit, formState: { errors }, setError, watch, control } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: defaultRole,
      firstName: "",
      lastName: "",
      companyName: "",
    },
  });

  const role = watch("role");

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsSubmitting(true);
    try {
      // Strip confirmPassword before sending to API — it's client-only validation
      const { confirmPassword: _confirmPassword, ...payload } = values;
      void _confirmPassword; // suppress unused warning

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.details) {
          Object.keys(data.details).forEach((key) => {
            const field = key.toLowerCase() as keyof typeof values;
            setError(field as Extract<keyof typeof values, string>, { message: (data.details as Record<string, string[]>)[key].join(", ") });
          });
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully!");
      router.push("/login");
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 py-12">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-teal-50 via-white to-amber-50/50" />
      <div className="fixed top-[-20%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-teal-200/30 blur-[100px] animate-pulse" />
      <div className="fixed bottom-[-20%] right-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-amber-200/30 blur-[100px] animate-pulse [animation-delay:2s]" />
      <div className="fixed top-[60%] left-[30%] -z-10 h-[350px] w-[350px] rounded-full bg-teal-100/20 blur-[80px] animate-pulse [animation-delay:3s]" />

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
            <User className="size-5 text-teal-600" />
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground/80">
            Join InternLink to connect with opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a...</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                      <TabsTrigger value="Student" className="gap-2 transition-all duration-200 data-[state=active]:shadow-sm">
                        <GraduationCap className="size-4" />
                        Student
                      </TabsTrigger>
                      <TabsTrigger value="Company" className="gap-2 transition-all duration-200 data-[state=active]:shadow-sm">
                        <Building2 className="size-4" />
                        Company
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-4 pt-2">
              {/* Student name fields */}
              {role === "Student" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                      <Input id="firstName" placeholder="John" className="pl-10 transition-shadow duration-200 focus:shadow-md focus:shadow-teal-500/10" {...register("firstName")} />
                    </div>
                    {errors.firstName && <p className="text-sm text-destructive animate-in fade-in duration-200">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="transition-shadow duration-200 focus:shadow-md focus:shadow-teal-500/10" {...register("lastName")} />
                    {errors.lastName && <p className="text-sm text-destructive animate-in fade-in duration-200">{errors.lastName.message}</p>}
                  </div>
                </div>
              )}

              {/* Company name field */}
              {role === "Company" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="companyName" className="text-sm font-medium">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input id="companyName" placeholder="Acme Corp" className="pl-10 transition-shadow duration-200 focus:shadow-md focus:shadow-teal-500/10" {...register("companyName")} />
                  </div>
                  {errors.companyName && <p className="text-sm text-destructive animate-in fade-in duration-200">{errors.companyName.message}</p>}
                </div>
              )}

              {/* Email */}
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
                {errors.email && <p className="text-sm text-destructive animate-in fade-in duration-200">{errors.email.message}</p>}
              </div>

              {/* Password */}
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
                {errors.password && <p className="text-sm text-destructive animate-in fade-in duration-200">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 transition-shadow duration-200 focus:shadow-md focus:shadow-teal-500/10"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors duration-200"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive animate-in fade-in duration-200">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate shadow-md shadow-teal-600/20 transition-all duration-300 hover:shadow-lg hover:shadow-teal-600/30 hover:brightness-110 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative mt-6 mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground animate-in fade-in duration-500 [animation-delay:300ms]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-teal-600 hover:text-teal-700 transition-colors duration-200 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bottom decorative text */}
      <p className="mt-8 text-xs text-muted-foreground/50 animate-in fade-in duration-1000 [animation-delay:500ms]">
        Secured with end-to-end encryption
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
