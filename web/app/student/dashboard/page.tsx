"use client";

import { useAuth } from "@/lib/auth-context";
import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { User, FileText, Sparkles } from "lucide-react";

export default function StudentDashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full max-w-2xl rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  const displayName = user.name || user.unique_name || user.email || "Student";

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {displayName}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          This is your student dashboard. Here you can track your internship applications, upload resumes, and view skill assessments.
        </p>
        
        {/* Quick Action Banner */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-2">
          <a
            href="/student/profile"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="size-10 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                <User className="size-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-700">
                Update Profile
              </h3>
              <p className="text-xs text-muted-foreground">
                Maintain your CGPA, department, and career biography.
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
              Edit profile &rarr;
            </span>
          </a>

          <a
            href="/student/resumes/builder"
            className="group flex flex-col justify-between rounded-xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/20 dark:to-slate-900 p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="size-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <FileText className="size-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-700">
                Resume Builder
              </h3>
              <p className="text-xs text-muted-foreground">
                Step-by-step ATS wizard with QuestPDF compiler.
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-4 flex items-center gap-1">
              Start builder &rarr;
            </span>
          </a>

          <a
            href="/student/resumes"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Sparkles className="size-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-700">
                My Resumes
              </h3>
              <p className="text-xs text-muted-foreground">
                View, download, and manage finalized PDF drafts.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-4 flex items-center gap-1">
              View catalog &rarr;
            </span>
          </a>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Active Applications</h3>
            <p className="text-3xl font-bold font-heading text-teal-700">0</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Saved Jobs</h3>
            <p className="text-3xl font-bold font-heading text-teal-700">0</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Assessment Badges</h3>
            <p className="text-3xl font-bold font-heading text-amber-600">0</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
