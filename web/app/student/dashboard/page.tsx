"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  FileText,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  Briefcase,
  Layers,
  Download,
  Clock,
  ChevronRight,
  Award,
  Building2,
  MapPin,
  ArrowUpRight,
  Plus,
  Compass,
  FileCheck2
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
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
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

  const displayName = profile
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

  return (
    <PageContainer className="py-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 relative">
      {/* Background Animated Gradient Mesh for Glassmorphic Reflections */}
      <div className="fixed top-12 right-10 -z-10 h-96 w-96 rounded-full bg-teal-400/20 dark:bg-teal-600/15 blur-[120px] pointer-events-none animate-pulse duration-1000" />
      <div className="fixed bottom-12 left-10 -z-10 h-96 w-96 rounded-full bg-amber-400/15 dark:bg-amber-600/10 blur-[130px] pointer-events-none animate-pulse duration-1000" />

      {/* 1. Header Card - Glassmorphism with Gradient Top Accent */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-teal-950/5 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:border-teal-400/40">
        {/* Subtle Top Accent Shimmer */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-amber-400" />

        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 dark:from-teal-300 dark:to-teal-100 bg-clip-text text-transparent">
              {displayName}
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {profile?.department ? `${profile.department} • ` : ""}
            Manage your resumes, track internship applications, and view match scores.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/student/profile">
            <Button
              variant="outline"
              size="sm"
              className="h-9 font-medium text-xs border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all hover:scale-105 active:scale-95"
            >
              <User className="size-3.5 mr-1.5 text-slate-500" />
              My Profile
            </Button>
          </Link>
          <Link href="/student/resumes/builder">
            <Button
              size="sm"
              className="h-9 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium text-xs shadow-md shadow-teal-700/20 btn-gradient-animate transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="size-3.5 mr-1.5" />
              New Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row - 4 Glassmorphic Animated Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Applications */}
        <div className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-950/10 hover:border-teal-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Applications
            </span>
            <div className="size-9 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-200/70 dark:border-teal-900 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Briefcase className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              0
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-teal-600 inline-block animate-pulse" />
              Active submissions
            </p>
          </div>
        </div>

        {/* Metric 2: Resumes */}
        <div className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-950/10 hover:border-teal-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              ATS Resumes
            </span>
            <div className="size-9 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-200/70 dark:border-teal-900 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <FileText className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {resumes.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-teal-600 inline-block" />
              Compiled documents
            </p>
          </div>
        </div>

        {/* Metric 3: Skills */}
        <div className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-950/10 hover:border-teal-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Skills Added
            </span>
            <div className="size-9 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-200/70 dark:border-teal-900 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Layers className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {totalSkillsCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-teal-600 inline-block" />
              Technical proficiencies
            </p>
          </div>
        </div>

        {/* Metric 4: CGPA */}
        <div className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-950/10 hover:border-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Academic CGPA
            </span>
            <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200/70 dark:border-amber-900 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Award className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {profile?.cgpa ? Number(profile.cgpa).toFixed(2) : "0.00"}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1 font-sans">/ 4.00</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
              Institutional record
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Body: 2-Column Glassmorphic Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Fast Actions & Resumes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions (4 Animated Glassmorphic Tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tile 1: Resume Builder */}
            <Link
              href="/student/resumes/builder"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-950/10 hover:border-teal-400"
            >
              <div className="space-y-2.5">
                <div className="size-9 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-200/70 dark:border-teal-900 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <FileText className="size-4.5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  Resume Builder
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Create ATS-optimized resumes with our 5-step wizard and export to PDF.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
                Start wizard <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Tile 2: Browse Internships */}
            <Link
              href="/student/jobs"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-950/10 hover:border-teal-400"
            >
              <div className="space-y-2.5">
                <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Search className="size-4.5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  Browse Internships
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Explore verified employer openings tailored to your university major.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
                Explore openings <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Tile 3: Profile */}
            <Link
              href="/student/profile"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-950/10 hover:border-teal-400"
            >
              <div className="space-y-2.5">
                <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <User className="size-4.5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  Academic Profile
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Update your CGPA, department specialization, and technical bio.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
                Edit details <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Tile 4: Assessments */}
            <Link
              href="/student/assessments"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-950/10 hover:border-amber-400"
            >
              <div className="space-y-2.5">
                <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200/70 dark:border-amber-900 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Award className="size-4.5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  Skill Assessments
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Take technical quizzes to earn verified skill badges for your profile.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-4 flex items-center gap-1">
                Take quiz <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Recent Resumes Glassmorphic List */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="size-4.5 text-teal-600" />
                  Recent Resumes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Compiled QuestPDF drafts stored in your cloud account
                </p>
              </div>
              <Link href="/student/resumes">
                <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-800 dark:text-teal-400">
                  View all ({resumes.length}) <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {resumes.length === 0 ? (
              <div className="py-8 text-center rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="size-7 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No resumes yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Create your first resume to apply for verified internships.
                </p>
                <Link href="/student/resumes/builder" className="inline-block mt-3">
                  <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs shadow-xs">
                    Create Resume
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {resumes.slice(0, 3).map((r, i) => (
                  <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200/70 dark:border-teal-900">
                        <FileText className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Resume Draft #{i + 1}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
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
                        <Button variant="outline" size="sm" className="h-8 text-xs border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                          Edit
                        </Button>
                      </Link>
                      {r.downloadUrl ? (
                        <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white shadow-xs">
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

        {/* Right 1 Column: Opportunities & Advice */}
        <div className="space-y-6">
          {/* Matched Jobs Glassmorphic Card */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Sparkles className="size-3 text-amber-600" />
                AI Job Match
              </span>
              <span className="text-[11px] text-slate-400 font-mono">CSE 3200</span>
            </div>

            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                Recommended Roles
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Opportunities matching your declared skill set.
              </p>
            </div>

            {/* Role 1 */}
            <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md space-y-1.5 hover:border-teal-400 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    .NET Backend Engineer Intern
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building2 className="size-3 text-teal-600" /> Brain Station 23
                  </p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  95%
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> Dhaka (Hybrid)
                </span>
                <span>•</span>
                <span>BDT 25,000</span>
              </div>
            </div>

            {/* Role 2 */}
            <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md space-y-1.5 hover:border-teal-400 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Full Stack React & C# Developer
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building2 className="size-3 text-teal-600" /> Therap BD
                  </p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  90%
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> Remote
                </span>
                <span>•</span>
                <span>BDT 30,000</span>
              </div>
            </div>

            <Link href="/student/jobs" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full text-xs border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                Explore All Openings <ArrowUpRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Clean Tip Box */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm space-y-1.5">
            <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-teal-600" />
              Career Advisory Tip
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ensure your resume has at least 3 rated skills before applying to increase match ranking for campus recruitment drives.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
