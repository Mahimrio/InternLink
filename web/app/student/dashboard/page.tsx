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
  Briefcase,
  Layers,
  Download,
  Clock,
  ChevronRight,
  Award,
  Zap,
  Building2,
  MapPin,
  ArrowUpRight,
  GraduationCap
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
        // Graceful fallback
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
          <Skeleton className="h-48 w-full rounded-2xl" />
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

  // Dynamic profile completion
  let profileStrength = 40;
  if (profile?.biography) profileStrength += 20;
  if (profile?.department) profileStrength += 15;
  if (profile?.interests) profileStrength += 15;
  if (resumes.length > 0) profileStrength += 10;
  profileStrength = Math.min(100, profileStrength);

  return (
    <PageContainer className="py-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Ambient Glassmorphic Background Lights */}
      <div className="fixed top-20 right-10 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[100px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-20 left-10 -z-10 h-80 w-80 rounded-full bg-amber-400/10 blur-[120px] pointer-events-none animate-pulse" />

      {/* Hero Welcome Card - Refined Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 transition-all">
        {/* Subtle Top Gradient Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-teal-400 to-amber-400" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 shadow-xs">
                <CheckCircle2 className="size-3.5 text-teal-600 dark:text-teal-400" />
                Verified Student
              </span>
              {profile?.institutionalId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <GraduationCap className="size-3.5 text-slate-500" />
                  {profile.institutionalId}
                </span>
              )}
            </div>

            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-teal-700 to-teal-900 dark:from-teal-300 dark:to-teal-100 bg-clip-text text-transparent">
                  {studentName}
                </span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {profile?.department ? `${profile.department} • ` : ""}
                Ahsanullah University of Science and Technology. Track internship applications, compile ATS resumes, and build your career portfolio.
              </p>
            </div>

            {/* Profile Completion Meter */}
            <div className="pt-1 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Profile Readiness
                </span>
                <span className="font-semibold text-teal-700 dark:text-teal-300">{profileStrength}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-amber-400 transition-all duration-1000 ease-out"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link href="/student/resumes/builder">
              <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-md shadow-teal-700/20 btn-gradient-animate transition-all active:scale-[0.98]">
                <FileText className="size-4 mr-2" />
                Build ATS Resume
              </Button>
            </Link>
            <Link href="/student/profile">
              <Button
                variant="outline"
                className="w-full border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium backdrop-blur-sm"
              >
                <User className="size-4 mr-2 text-slate-500" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row - Glassmorphic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Applications */}
        <div className="group relative rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-md hover:border-teal-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Applications
            </span>
            <div className="size-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-900/40">
              <Briefcase className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">0</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-teal-500" />
              Active recruitment cycle
            </p>
          </div>
        </div>

        {/* Metric 2: ATS Resumes */}
        <div className="group relative rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-md hover:border-teal-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ATS Resumes
            </span>
            <div className="size-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-900/40">
              <FileText className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              {resumes.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-teal-500" />
              Compiled PDF documents
            </p>
          </div>
        </div>

        {/* Metric 3: Skills Verified */}
        <div className="group relative rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-md hover:border-teal-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Skills Matrix
            </span>
            <div className="size-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-900/40">
              <Layers className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              {totalSkillsCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-teal-500" />
              Linked technical proficiencies
            </p>
          </div>
        </div>

        {/* Metric 4: Academic CGPA */}
        <div className="group relative rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-md hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Academic CGPA
            </span>
            <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
              <Award className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {profile?.cgpa ? Number(profile.cgpa).toFixed(2) : "0.00"}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1 font-sans">/ 4.00</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-amber-500" />
              Institutional transcript scale
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Workflow Hub & AI Career Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Workflow Hub & Recent Resumes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Workflow Hub */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="size-5 text-teal-600" />
                Quick Actions
              </h2>
              <span className="text-xs text-slate-500">Fast Navigation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Action 1: Resume Builder */}
              <Link
                href="/student/resumes/builder"
                className="group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-lg hover:border-teal-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-900/40">
                      <FileText className="size-5" />
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60">
                      QuestPDF
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                    ATS Resume Builder
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Multi-step wizard with progressive draft saving and cloud PDF compilation.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                  Open builder <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Action 2: Browse Jobs */}
              <Link
                href="/student/jobs"
                className="group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-lg hover:border-teal-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <Search className="size-5" />
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Live
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                    Explore Internships
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Search openings, filter by required technical skills, and submit applications.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                  View vacancies <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Action 3: Profile */}
              <Link
                href="/student/profile"
                className="group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-lg hover:border-teal-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <User className="size-5" />
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Identity
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                    Academic Profile
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Manage CGPA records, institutional credentials, and career elevator pitch.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                  Edit profile <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Action 4: Skill Assessments */}
              <Link
                href="/student/assessments"
                className="group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-xs hover:shadow-lg hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
                      <Award className="size-5" />
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                      Certificates
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mt-4 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    Skill Assessments
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Complete technical quizzes to verify skills on university company boards.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Take tests <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Resumes Catalog Preview */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="size-4.5 text-teal-600" />
                  Recent ATS Resumes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compiled PDF documents ready for internship submissions
                </p>
              </div>
              <Link href="/student/resumes">
                <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-800 dark:text-teal-400">
                  View all ({resumes.length}) <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {resumes.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="size-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No resumes created yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Build and compile your first ATS resume with our step-by-step wizard.
                </p>
                <Link href="/student/resumes/builder" className="inline-block mt-4">
                  <Button size="sm" className="bg-teal-700 text-white text-xs shadow-sm">
                    Create Resume
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {resumes.slice(0, 3).map((r, i) => (
                  <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/40">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          ATS Resume #{i + 1}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
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
                          <Button size="sm" className="h-8 text-xs bg-teal-700 text-white hover:bg-teal-800 shadow-xs">
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
          </div>
        </div>

        {/* Right 1 Column: AI Career Matching & Opportunities */}
        <div className="space-y-6">
          {/* AI Matching Feature Card */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                <Sparkles className="size-3.5 text-amber-600" />
                AI Match Preview
              </span>
              <span className="text-[11px] text-slate-400 font-mono">CSE 3200</span>
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                Matched Opportunities
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recommended roles aligned with your configured skill set.
              </p>
            </div>

            {/* Role Card 1 */}
            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-800/60 space-y-2 hover:border-teal-400/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    .NET Core Backend Intern
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="size-3 text-teal-600" /> Brain Station 23
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200">
                  95% Match
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> Dhaka (Hybrid)
                </span>
                <span>•</span>
                <span>BDT 25,000/mo</span>
              </div>
            </div>

            {/* Role Card 2 */}
            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-800/60 space-y-2 hover:border-teal-400/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Full Stack React & C# Developer
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="size-3 text-teal-600" /> Therap BD
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200">
                  90% Match
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> Remote
                </span>
                <span>•</span>
                <span>BDT 30,000/mo</span>
              </div>
            </div>

            <Link href="/student/jobs" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40">
                Explore All Opportunities <ArrowUpRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Academic Counseling Note */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs p-5 space-y-2">
            <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="size-4 text-teal-600" />
              University Career Advisory
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete your resume skills step with honest proficiency ratings (1-5) to optimize match rankings across visiting recruitment partners.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
