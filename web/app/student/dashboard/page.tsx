"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  User,
  FileText,
  Sparkles,
  Search,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Layers,
  Download,
  Clock,
  ChevronRight,
  Award,
  Zap,
  Building2,
  MapPin
} from "lucide-react";

interface StudentProfile {
  firstName: string;
  lastName: string;
  cgpa: number;
  institutionalId: string;
  department: string;
  biography: string | null;
  interests: string | null;
}

interface ResumeItem {
  id: string;
  lastModified: string;
  downloadUrl: string | null;
  dynamicJsonData: string | null;
}

export default function StudentDashboardPage() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken && !isAuthLoading) {
      setIsLoading(false);
      return;
    }

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        // Fetch Profile and Resumes in parallel
        const [profileData, resumesData] = await Promise.allSettled([
          apiClient<StudentProfile>("/api/student/profile", { token: accessToken }),
          apiClient<ResumeItem[]>("/api/student/resumes", { token: accessToken }),
        ]);

        if (profileData.status === "fulfilled") {
          setProfile(profileData.value);
        }
        if (resumesData.status === "fulfilled") {
          setResumes(resumesData.value || []);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadDashboardData();
    }
  }, [accessToken, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <PageContainer className="py-8">
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  const studentName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.name || user?.unique_name || "Student";

  const totalSkillsCount = resumes.reduce((acc, r) => {
    try {
      if (r.dynamicJsonData) {
        const parsed = JSON.parse(r.dynamicJsonData);
        return Math.max(acc, parsed.skills?.length || 0);
      }
    } catch {
      // Ignore
    }
    return acc;
  }, 0);

  // Profile strength calculation
  let profileStrength = 40;
  if (profile?.biography) profileStrength += 20;
  if (profile?.department) profileStrength += 15;
  if (profile?.interests) profileStrength += 15;
  if (resumes.length > 0) profileStrength += 10;
  profileStrength = Math.min(100, profileStrength);

  return (
    <PageContainer className="py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Background Ambience Orbs */}
      <div className="fixed top-[-10%] right-[-5%] -z-10 h-[400px] w-[400px] rounded-full bg-teal-200/20 blur-[120px] dark:bg-teal-900/10 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] -z-10 h-[350px] w-[350px] rounded-full bg-amber-200/20 blur-[120px] dark:bg-amber-900/10 pointer-events-none" />

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-teal-950/10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-teal-500/20 text-teal-200 border-teal-400/30 px-3 py-1 font-medium backdrop-blur-md">
                <CheckCircle2 className="size-3.5 mr-1.5 text-teal-300" />
                Verified University Student
              </Badge>
              {profile?.institutionalId && (
                <span className="font-mono text-xs text-teal-200/80 bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-800/60">
                  ID: {profile.institutionalId}
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              Welcome back, {studentName}
            </h1>
            <p className="text-teal-100/90 text-sm sm:text-base leading-relaxed text-pretty">
              {profile?.department || "Computer Science & Engineering"} • Track your career readiness, build ATS-optimized resumes with QuestPDF, and apply for verified internships.
            </p>

            {/* Profile Completion Bar */}
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-200 mb-1.5">
                <span>Profile Strength</span>
                <span>{profileStrength}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-teal-950/80 overflow-hidden border border-teal-700/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-teal-300 transition-all duration-1000 ease-out"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link href="/student/resumes/builder">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-transform active:scale-[0.98]">
                <Sparkles className="size-4 mr-2" />
                Build New Resume
              </Button>
            </Link>
            <Link href="/student/profile">
              <Button variant="outline" className="w-full border-teal-300/30 bg-teal-950/40 text-teal-100 hover:bg-teal-900/60 hover:text-white backdrop-blur-sm">
                <User className="size-4 mr-2" />
                Manage Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Applications */}
        <Card className="border-border/70 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Applications
            </CardTitle>
            <div className="size-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <Briefcase className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">0</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-teal-600 font-medium">Ready</span> to apply for openings
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: ATS Resumes */}
        <Card className="border-border/70 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              ATS Resumes
            </CardTitle>
            <div className="size-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <FileText className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              {resumes.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-teal-600 font-medium">{resumes.length > 0 ? "Compiled" : "0 Drafts"}</span> in Supabase Storage
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Configured Skills */}
        <Card className="border-border/70 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Skills Verified
            </CardTitle>
            <div className="size-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              {totalSkillsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-teal-600 font-medium">Relational</span> skill records
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Academic CGPA */}
        <Card className="border-border/70 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current CGPA
            </CardTitle>
            <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Award className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold font-mono text-amber-800 dark:text-amber-300">
              {profile?.cgpa ? Number(profile.cgpa).toFixed(2) : "0.00"}
              <span className="text-xs font-normal text-muted-foreground ml-1">/ 4.00</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Official University Record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Action Hub & Live Resumes List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Quick Action Tiles & Recent Resumes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Action Hub */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="size-5 text-teal-600" />
                Student Workflow Hub
              </h2>
              <span className="text-xs text-muted-foreground">Essential Tools</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tile 1: Resume Wizard */}
              <Link
                href="/student/resumes/builder"
                className="group relative overflow-hidden rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/70 via-white to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                    <FileText className="size-5" />
                  </div>
                  <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 text-[10px]">
                    QuestPDF In-Memory
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                  Resume Builder Wizard
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Progressive 5-step ATS compiler with live database skill matrix sync.
                </p>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
                  Launch builder <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* Tile 2: Browse Jobs */}
              <Link
                href="/student/jobs"
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <Search className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Live Catalog
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                  Browse Internships
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Explore verified tech vacancies, filter by skill tags and apply seamlessly.
                </p>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
                  Explore jobs <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* Tile 3: Update Profile */}
              <Link
                href="/student/profile"
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <User className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Academic Record
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                  Student Profile
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Update your CGPA, department specialization, and technical bio.
                </p>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
                  Edit profile <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* Tile 4: Skill Assessments */}
              <Link
                href="/student/assessments"
                className="group relative overflow-hidden rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-sm transition-all hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <BookOpen className="size-5" />
                  </div>
                  <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-[10px]">
                    Badges
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  Skill Assessments
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Take verified coding quizzes to earn university merit badges.
                </p>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-4 flex items-center gap-1">
                  Take assessment <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          {/* Recent Resumes Card List */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileText className="size-5 text-teal-600" />
                  Recent ATS Resumes
                </CardTitle>
                <CardDescription>
                  Compiled PDF documents saved in your cloud storage
                </CardDescription>
              </div>
              <Link href="/student/resumes">
                <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800 text-xs">
                  View all ({resumes.length}) <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent>
              {resumes.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-dashed">
                  <FileText className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No resumes created yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Use our step-by-step wizard to compile your first verified ATS resume.
                  </p>
                  <Link href="/student/resumes/builder" className="inline-block mt-4">
                    <Button size="sm" className="bg-teal-700 text-white btn-gradient-animate text-xs">
                      Create First Resume
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {resumes.slice(0, 3).map((r, i) => (
                    <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            ATS Resume Draft #{i + 1}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="size-3" />
                            {new Date(r.lastModified).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/student/resumes/builder?resumeId=${r.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            Edit
                          </Button>
                        </Link>
                        {r.downloadUrl ? (
                          <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="h-8 text-xs bg-teal-700 text-white">
                              <Download className="size-3 mr-1.5" /> PDF
                            </Button>
                          </a>
                        ) : (
                          <Link href={`/student/resumes/builder?resumeId=${r.id}`}>
                            <Button size="sm" variant="secondary" className="h-8 text-xs">
                              Finalize
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: AI Career Matching & Opportunities Preview */}
        <div className="space-y-6">
          {/* AI Matching Feature Spotlight Card */}
          <Card className="border-teal-200/80 dark:border-teal-900/60 shadow-sm bg-gradient-to-br from-teal-50/60 to-white dark:from-slate-900 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[11px] font-semibold">
                  <Sparkles className="size-3 mr-1 text-amber-500" />
                  AI Match Engine
                </Badge>
                <span className="text-xs text-muted-foreground">Beta</span>
              </div>
              <CardTitle className="font-heading text-lg mt-2">
                Top Internship Matches
              </CardTitle>
              <CardDescription className="text-xs">
                Matched against your declared skills ({totalSkillsCount > 0 ? `${totalSkillsCount} skills` : "add skills in resume"})
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-1">
              {/* Sample Match Role 1 */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      .NET Backend Engineer Intern
                    </h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="size-3 text-teal-600" /> TechNest Solutions
                    </p>
                  </div>
                  <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 text-[10px] font-bold">
                    95% Match
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" /> Dhaka (Hybrid) • BDT 25,000/mo
                </div>
              </div>

              {/* Sample Match Role 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Full Stack React & C# Developer
                    </h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="size-3 text-teal-600" /> CloudPeak Systems
                    </p>
                  </div>
                  <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 text-[10px] font-bold">
                    90% Match
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" /> Remote • BDT 30,000/mo
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Link href="/student/jobs" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50">
                  Explore Matching Openings <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* University Counseling Tip */}
          <Card className="border-border/70 shadow-sm bg-slate-50/60 dark:bg-slate-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-sm font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-teal-600" />
                Career Advisor Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Keep your CGPA and bio updated before submitting applications. Recruiters on InternLink filter candidates with active ATS-ready resumes first.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
