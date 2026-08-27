"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { PageContainer } from "@/components/shared/page-container";
import { VerifiedSkillBadge } from "@/components/shared/verified-skill-badge";
import { AdvisingNotesList, CounselorFeedbackItem } from "@/components/shared/advising-notes-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertCircle,
  ShieldCheck,
  Award,
  MessageSquare
} from "lucide-react";

interface ProfileDto {
  firstName: string;
  lastName: string;
  cgpa: number;
  institutionalId: string;
  department: string;
  biography: string | null;
  interests: string | null;
  verifiedSkills?: string[];
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
  const [advisingNotes, setAdvisingNotes] = useState<CounselorFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
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

  const bioValue = useWatch({ control, name: "biography" }) || "";

  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    let isMounted = true;
    async function fetchData() {
      try {
        setIsLoading(true);
        const [profileData, notesData] = await Promise.all([
          apiClient<ProfileDto>("/api/student/profile", { token: accessToken }),
          apiClient<CounselorFeedbackItem[]>("/api/student/advising-notes", {
            token: accessToken,
          }).catch(() => [] as CounselorFeedbackItem[]),
        ]);

        if (!isMounted) return;

        setProfile(profileData);
        setAdvisingNotes(notesData || []);
        reset({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          cgpa: profileData.cgpa || 0,
          department: profileData.department || "",
          biography: profileData.biography || "",
          interests: profileData.interests || "",
          institutionalId: profileData.institutionalId || "",
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        const error = err as { message?: string };
        toast.error(error.message || "Failed to load student profile");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSaving(true);
      const updated = await apiClient<ProfileDto>("/api/student/profile", {
        method: "PUT",
        token: accessToken,
        body: JSON.stringify(values),
      });
      setProfile((prev) => ({
        ...updated,
        verifiedSkills: prev?.verifiedSkills || updated.verifiedSkills || [],
      }));
      reset(values);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <PageContainer className="py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[500px] lg:col-span-2 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Profile & Advising
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your verified academic profile, skill endorsements, and view counselor advising notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200">
            <CheckCircle2 className="mr-1 size-3.5" /> Verified Student
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Read-Only Academic Credentials & Verified Badges */}
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-teal-600" />
                <CardTitle className="font-heading text-lg">Academic Records</CardTitle>
              </div>
              <CardDescription>
                Verified institutional credentials tied to your university enrollment.
              </CardDescription>
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

          {/* ── Verified Skills Card ── */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-teal-600" />
                  <CardTitle className="font-heading text-base">Verified Skills</CardTitle>
                </div>
                <Link href="/student/assessments" className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1">
                  Assessments <Award className="size-3" />
                </Link>
              </div>
              <CardDescription className="text-xs">
                Skills officially verified through timed assessments (≥ 70% score).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.verifiedSkills && profile.verifiedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.verifiedSkills.map((skill) => (
                    <VerifiedSkillBadge key={skill} skillName={skill} size="md" />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No verified skill badges yet.
                  </p>
                  <Link href="/student/assessments" className="inline-block">
                    <Button size="sm" variant="outline" className="text-xs h-8 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800">
                      <Award className="size-3.5 mr-1" />
                      Take Skill Assessments
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabbed Workspace for Profile Edit & Advising Notes */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-2 max-w-sm h-10 p-1 bg-slate-100 dark:bg-slate-800/70 border border-border/60 rounded-lg">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 shadow-2xs"
              >
                <User className="size-3.5" /> Edit Profile
              </TabsTrigger>
              <TabsTrigger
                value="advising"
                className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 shadow-2xs"
              >
                <MessageSquare className="size-3.5" /> Advising Notes ({advisingNotes.length})
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="animate-in fade-in duration-300">
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
            </TabsContent>

            {/* Advising Notes Tab */}
            <TabsContent value="advising" className="space-y-4 animate-in fade-in duration-300">
              <Card className="border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-teal-600" />
                    <CardTitle className="font-heading text-xl">Counselor Advising Notes</CardTitle>
                  </div>
                  <CardDescription>
                    Guidance, feedback, and action items provided by university career counselors during advising sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvisingNotesList
                    notes={advisingNotes}
                    emptyTitle="No Advising Notes Yet"
                    emptyMessage="You have not had any recorded counseling sessions yet. Reach out to a career counselor to schedule an appointment."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
}
