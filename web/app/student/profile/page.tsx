"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  BookOpen,
  Lock,
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ProfileDto {
  firstName: string;
  lastName: string;
  cgpa: number;
  institutionalId: string;
  department: string;
  biography: string | null;
  interests: string | null;
}

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  cgpa: z.number().min(0, "CGPA cannot be negative").max(4.0, "CGPA cannot exceed 4.00"),
  department: z.string().max(150, "Department cannot exceed 150 characters").optional(),
  biography: z.string().max(2000, "Biography cannot exceed 2000 characters").optional(),
  interests: z.string().max(1000, "Interests cannot exceed 1000 characters").optional(),
  institutionalId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function StudentProfilePage() {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      cgpa: 0,
      department: "",
      biography: "",
      interests: "",
      institutionalId: "",
    },
  });

  const bioValue = watch("biography") || "";

  useEffect(() => {
    if (!accessToken && !isAuthLoading) {
      setIsLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setIsLoading(true);
        const data = await apiClient<ProfileDto>("/api/student/profile", {
          token: accessToken,
        });
        setProfile(data);
        reset({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          cgpa: data.cgpa || 0,
          department: data.department || "",
          biography: data.biography || "",
          interests: data.interests || "",
          institutionalId: data.institutionalId || "",
        });
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || "Failed to load student profile");
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken, isAuthLoading, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSaving(true);
      const updated = await apiClient<ProfileDto>("/api/student/profile", {
        method: "PUT",
        token: accessToken,
        body: JSON.stringify(values),
      });

      setProfile(updated);
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
        cgpa: updated.cgpa,
        department: updated.department,
        biography: updated.biography || "",
        interests: updated.interests || "",
        institutionalId: updated.institutionalId,
      });
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to save profile changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <PageContainer className="py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card className="border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your academic credentials, background summary, and career preferences.
          </p>
        </div>
        {profile && (
          <Badge variant="outline" className="w-fit px-3 py-1 bg-teal-50/50 border-teal-200 text-teal-800 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300 font-medium">
            <CheckCircle2 className="size-3.5 mr-1.5 text-teal-600" />
            Verified University Student
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic ID Card */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border/70 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/60">
            <CardHeader className="pb-4">
              <div className="size-12 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-2">
                <GraduationCap className="size-6" />
              </div>
              <CardTitle className="font-heading text-xl">Academic Record</CardTitle>
              <CardDescription>Official institution identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Institutional ID</span>
                  <Lock className="size-3 text-amber-600" />
                </div>
                <p className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                  {profile?.institutionalId || "N/A"}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3 shrink-0 text-amber-500" />
                  Locked post-registration for academic integrity.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 space-y-1">
                <span className="text-xs font-medium text-teal-800 dark:text-teal-300">Department</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {profile?.department || "Not specified"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 space-y-1">
                <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Current CGPA</span>
                <p className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200">
                  {profile?.cgpa ? Number(profile.cgpa).toFixed(2) : "0.00"}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/ 4.00</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5 text-teal-600" />
                <CardTitle className="font-heading text-xl">Profile Details</CardTitle>
              </div>
              <CardDescription>
                Update your personal information and biography to showcase your background to prospective employers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="e.g. Tariq"
                      {...register("firstName")}
                      className={errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="e.g. Ahmed"
                      {...register("lastName")}
                      className={errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department / Program</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="department"
                        className="pl-9"
                        placeholder="e.g. Computer Science & Engineering"
                        {...register("department")}
                      />
                    </div>
                    {errors.department && (
                      <p className="text-xs text-destructive">{errors.department.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cgpa">CGPA (Scale 0.00 - 4.00)</Label>
                    <Input
                      id="cgpa"
                      type="number"
                      step="0.01"
                      min="0.00"
                      max="4.00"
                      {...register("cgpa", { valueAsNumber: true })}
                      className={errors.cgpa ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.cgpa && (
                      <p className="text-xs text-destructive">{errors.cgpa.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Interests & Specializations</Label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="interests"
                      className="pl-9"
                      placeholder="e.g. Distributed Systems, Cloud Architecture, Next.js, AI Engineering"
                      {...register("interests")}
                    />
                  </div>
                  {errors.interests && (
                    <p className="text-xs text-destructive">{errors.interests.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="biography">Professional Biography</Label>
                    <span className={`text-xs ${bioValue.length > 2000 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      {bioValue.length} / 2000
                    </span>
                  </div>
                  <Textarea
                    id="biography"
                    rows={5}
                    placeholder="Write a concise overview of your technical background, career goals, and relevant projects..."
                    {...register("biography")}
                    className={errors.biography ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.biography && (
                    <p className="text-xs text-destructive">{errors.biography.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving || !isDirty}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white shadow-sm min-w-[140px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 size-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
