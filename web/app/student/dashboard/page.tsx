"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  FileCheck,
  BookOpen,
  TrendingUp,
  Zap,
  Target,
  CheckCircle2,
  Circle,
  CalendarDays,
  GraduationCap
} from "lucide-react";

/* ────────────────────────────── Types ────────────────────────────── */

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

/* ────────────────────────── Helpers ───────────────────────────────── */

function AmbientOrb({ className }: { className: string }) {
  return <div aria-hidden className={`absolute rounded-full pointer-events-none select-none ${className}`} />;
}

function StatusDot({ color = "bg-teal-500" }: { color?: string }) {
  return (
    <span className="relative flex size-2 shrink-0">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-40`} />
      <span className={`relative inline-flex size-2 rounded-full ${color}`} />
    </span>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(first?: string, last?: string): string {
  return `${(first || "S")[0]}${(last || "")[0] || ""}`.toUpperCase();
}

/* ────────────────────────── Main Component ───────────────────────── */

export default function StudentDashboardPage() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken && !isAuthLoading) { setIsLoading(false); return; }
    async function load() {
      try {
        setIsLoading(true);
        const [p, r] = await Promise.allSettled([
          apiClient<StudentProfile>("/api/student/profile", { token: accessToken }),
          apiClient<ResumeItem[]>("/api/student/resumes", { token: accessToken }),
        ]);
        if (p.status === "fulfilled") setProfile(p.value);
        if (r.status === "fulfilled") setResumes(r.value || []);
      } catch { /* graceful */ } finally { setIsLoading(false); }
    }
    if (accessToken) load();
  }, [accessToken, isAuthLoading]);

  const greeting = useMemo(() => getGreeting(), []);

  if (isAuthLoading || isLoading) {
    return (
      <PageContainer className="py-10">
        <div className="space-y-8">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[120px] rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ── Derived ── */
  const firstName = profile?.firstName || user?.name?.split(" ")[0] || "Student";
  const lastName = profile?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = getInitials(firstName, lastName);

  const skills: string[] = [];
  resumes.forEach(r => {
    try {
      if (r.dynamicJsonData) {
        const p = JSON.parse(r.dynamicJsonData);
        if (Array.isArray(p.skills)) p.skills.forEach((s: { name?: string }) => {
          if (s.name && !skills.includes(s.name)) skills.push(s.name);
        });
      }
    } catch { /* skip */ }
  });

  const steps = [
    { label: "Profile info", done: !!profile?.firstName },
    { label: "Academic CGPA", done: !!profile?.cgpa },
    { label: "First resume", done: resumes.length > 0 },
    { label: "3+ skills", done: skills.length >= 3 },
  ];
  const pct = steps.filter(s => s.done).length * 25;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient orbs — subtle depth, not visible color */}
      <AmbientOrb className="w-[600px] h-[600px] bg-teal-400/8 dark:bg-teal-500/6 blur-[160px] -top-52 -right-48 animate-float-slow" />
      <AmbientOrb className="w-[450px] h-[450px] bg-slate-300/10 dark:bg-slate-500/5 blur-[140px] top-[40%] -left-60 animate-float-slower" />
      <AmbientOrb className="w-[350px] h-[350px] bg-teal-300/6 dark:bg-teal-400/4 blur-[120px] bottom-10 right-[20%] animate-float-slow" />

      <PageContainer className="relative z-10 py-10 space-y-7">

        {/* ════════════════════════════════════════════════════════
            1. WELCOME HERO — Avatar + Time Greeting + Date
            ════════════════════════════════════════════════════════ */}
        <div className="animate-fade-up stagger-1 relative glass-hero rounded-2xl overflow-hidden">
          {/* Animated shimmer accent */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal-600 via-teal-400 to-amber-400 overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer-line" />
          </div>
          {/* Subtle corner depth */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-slate-200/30 dark:bg-slate-700/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="size-16 sm:size-[72px] rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xl shadow-teal-600/30 text-xl sm:text-2xl font-heading font-bold tracking-tight select-none ring-4 ring-white/40 dark:ring-slate-800/40">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-100/80 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 border border-teal-200/50 dark:border-teal-700/40">
                  <GraduationCap className="size-3" />
                  {profile?.department || "Student"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {today}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-[1.85rem] font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                {greeting},{" "}
                <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 dark:from-teal-300 dark:via-teal-200 dark:to-teal-400 bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>

              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                Track applications, build ATS resumes, and discover opportunities.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 sm:self-start sm:pt-1">
              <Link href="/student/profile">
                <Button variant="outline" size="sm" className="h-9 text-xs font-medium border-slate-300/70 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
                  <User className="size-3.5 mr-1.5 text-slate-500" />
                  Profile
                </Button>
              </Link>
              <Link href="/student/resumes/builder">
                <Button size="sm" className="h-9 text-xs font-semibold btn-gradient-animate text-white shadow-lg shadow-teal-600/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:shadow-xl hover:shadow-teal-600/35">
                  <Plus className="size-3.5 mr-1.5" />
                  New Resume
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            2. METRIC CARDS — Larger numbers, trend indicators
            ════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Applications", val: "0", sub: "Active submissions", icon: Briefcase, accent: "teal" as const, trend: null },
            { label: "ATS Resumes", val: String(resumes.length), sub: "Compiled documents", icon: FileText, accent: "teal" as const, trend: resumes.length > 0 ? `+${resumes.length} this month` : null },
            { label: "Skills Added", val: String(skills.length), sub: "Linked to profile", icon: Layers, accent: "teal" as const, trend: skills.length >= 3 ? "Strong profile" : "Add more skills" },
            { label: "Academic CGPA", val: profile?.cgpa ? Number(profile.cgpa).toFixed(2) : "0.00", sub: "/ 4.00 scale", icon: Award, accent: "amber" as const, trend: profile?.cgpa && profile.cgpa >= 3.5 ? "Dean's list eligible" : null },
          ].map((m, i) => {
            const Icon = m.icon;
            const cardClass = m.accent === "amber" ? "glass-card-amber" : "glass-card-teal";
            const iconGrad = m.accent === "amber"
              ? "from-amber-400 to-amber-600 shadow-amber-500/25"
              : "from-teal-500 to-teal-700 shadow-teal-600/25";
            return (
              <div key={m.label} className={`animate-fade-up stagger-${i + 2} group ${cardClass} rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{m.label}</span>
                  <div className={`size-9 rounded-xl bg-gradient-to-br ${iconGrad} text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="size-[18px]" />
                  </div>
                </div>
                <div className="font-heading text-[2rem] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                  {m.val}
                  {m.label === "Academic CGPA" && (
                    <span className="text-xs font-normal text-slate-400 ml-1 font-sans">{m.sub}</span>
                  )}
                </div>
                {m.label !== "Academic CGPA" && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                    <StatusDot color={m.accent === "amber" ? "bg-amber-500" : "bg-teal-500"} />
                    {m.sub}
                  </p>
                )}
                {m.trend && (
                  <p className={`text-[10px] font-medium mt-1.5 flex items-center gap-1 ${
                    m.trend.startsWith("+") || m.trend.includes("eligible") || m.trend.includes("Strong")
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}>
                    <TrendingUp className="size-3" />
                    {m.trend}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════
            3. MAIN BODY — 2/3 + 1/3 layout
            ════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left 2/3 ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions (2x2 grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Resume Builder — primary featured card */}
              <Link href="/student/resumes/builder" className="animate-fade-up stagger-5 group glass-card-featured rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/15 sm:row-span-2 flex flex-col">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                      <FileText className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                        Resume Builder
                      </h3>
                      <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400">Primary Tool</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Build ATS-optimized resumes with our progressive 5-step wizard. Compiles to professional PDF via QuestPDF with automatic cloud backup.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["5-Step Wizard", "QuestPDF", "Cloud Sync"].map(tag => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-teal-100/60 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200/40 dark:border-teal-800/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs font-semibold mt-5 flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                  Open builder
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-2" />
                </span>
              </Link>

              {/* Browse Internships */}
              <Link href="/student/jobs" className="animate-fade-up stagger-6 group glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10">
                <div className="space-y-2.5">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-teal-600/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                    <Search className="size-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-[15px] text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Browse Internships</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Explore verified employer openings tailored to your major.</p>
                </div>
                <span className="text-xs font-semibold mt-3 flex items-center gap-1 text-teal-600 dark:text-teal-400">
                  Explore <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1.5" />
                </span>
              </Link>

              {/* Two small tiles side by side */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/student/profile" className="animate-fade-up stagger-7 group glass-card rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10">
                  <div className="size-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-600/20 mb-2.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                    <User className="size-[18px]" />
                  </div>
                  <h3 className="font-heading font-semibold text-[13px] text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Profile</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Update credentials & bio</p>
                </Link>

                <Link href="/student/assessments" className="animate-fade-up stagger-8 group glass-card-amber rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10">
                  <div className="size-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mb-2.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                    <Award className="size-[18px]" />
                  </div>
                  <h3 className="font-heading font-semibold text-[13px] text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">Assessments</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Earn verified badges</p>
                </Link>
              </div>
            </div>

            {/* Recent Resumes */}
            <div className="animate-fade-up stagger-8 glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="size-[18px] text-teal-600" />
                    Recent Resumes
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Compiled QuestPDF documents in cloud storage</p>
                </div>
                <Link href="/student/resumes">
                  <Button variant="ghost" size="sm" className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors">
                    View all ({resumes.length})<ChevronRight className="size-3.5 ml-0.5" />
                  </Button>
                </Link>
              </div>

              {resumes.length === 0 ? (
                <div className="py-10 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200/80 dark:border-slate-800">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 text-teal-500 flex items-center justify-center mx-auto mb-3 border border-teal-200/50 dark:border-teal-800">
                    <FileText className="size-7" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No resumes yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Create your first ATS-optimized resume to apply for verified campus internships.
                  </p>
                  <Link href="/student/resumes/builder" className="inline-block mt-4">
                    <Button size="sm" className="btn-gradient-animate text-white text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.03] active:scale-[0.97]">
                      <Plus className="size-3.5 mr-1.5" />Create Resume
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/80 dark:divide-slate-800/50">
                  {resumes.slice(0, 3).map((r, i) => (
                    <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0 group/row">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-800 transition-transform duration-200 group-hover/row:scale-105">
                          <FileCheck className="size-[18px]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Resume Draft #{i + 1}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            {new Date(r.lastModified).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/student/resumes/builder?resumeId=${r.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs transition-all hover:scale-[1.03] active:scale-[0.97]">Edit</Button>
                        </Link>
                        {r.downloadUrl ? (
                          <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="h-8 text-xs btn-gradient-animate text-white shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.03] active:scale-[0.97]">
                              <Download className="size-3 mr-1.5" /> PDF
                            </Button>
                          </a>
                        ) : (
                          <Link href={`/student/resumes/builder?resumeId=${r.id}`}>
                            <Button size="sm" variant="secondary" className="h-8 text-xs transition-all hover:scale-[1.03] active:scale-[0.97]">Finalize</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right 1/3 ── */}
          <div className="space-y-5">
            {/* AI Career Matches */}
            <div className="animate-fade-up stagger-6 glass-card-teal rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-800 dark:from-amber-950/60 dark:to-amber-900/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 backdrop-blur-sm">
                  <Sparkles className="size-3 text-amber-500" />
                  AI Job Match
                </span>
                <Target className="size-4 text-teal-500/50" />
              </div>

              <h2 className="font-heading text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Recommended Roles</h2>

              {/* Role cards */}
              {[
                { title: ".NET Backend Engineer Intern", company: "Brain Station 23", loc: "Dhaka (Hybrid)", pay: "BDT 25,000", match: 95 },
                { title: "Full Stack React & C# Developer", company: "Therap BD", loc: "Remote", pay: "BDT 30,000", match: 90 },
              ].map((role) => (
                <div key={role.title} className="group/job p-3.5 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/40 space-y-2 transition-all duration-200 hover:border-teal-400/60 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover/job:text-teal-700 dark:group-hover/job:text-teal-300 transition-colors">{role.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="size-3 text-teal-600" /> {role.company}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm shadow-teal-500/25 shrink-0 tabular-nums">{role.match}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="size-3 text-teal-500" /> {role.loc}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="font-semibold text-teal-700 dark:text-teal-400">{role.pay}</span>
                  </div>
                </div>
              ))}

              <Link href="/student/jobs" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-medium border-teal-300/50 dark:border-teal-800/50 hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] hover:bg-teal-50/50 dark:hover:bg-teal-950/30">
                  Explore All Openings<ArrowUpRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Profile Completion */}
            <div className="animate-fade-up stagger-7 glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                    <TrendingUp className="size-4" />
                  </div>
                  <h3 className="font-heading text-xs font-semibold text-slate-900 dark:text-white">Profile Completion</h3>
                </div>
                <span className="font-heading text-sm font-bold text-teal-700 dark:text-teal-400 tabular-nums">{pct}%</span>
              </div>

              <div className="h-2.5 rounded-full bg-slate-100/80 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 shadow-sm shadow-teal-500/30 transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                {steps.map(s => (
                  <span key={s.label} className={`text-[11px] flex items-center gap-1.5 ${s.done ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {s.done
                      ? <CheckCircle2 className="size-3.5 text-teal-500 shrink-0" />
                      : <Circle className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    }
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Career Advisory */}
            <div className="animate-fade-up stagger-8 glass-card-amber rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <BookOpen className="size-4" />
                </div>
                <h3 className="font-heading text-xs font-semibold text-slate-900 dark:text-white">Career Advisory</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
                Add at least 3 rated skills to your resume before applying. Resumes with verified skills rank higher in campus recruitment matching.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
