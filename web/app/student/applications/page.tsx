"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { ApplicationFunnel } from "@/components/student/application-funnel";
import { getStatusConfig, ApplicationStatus } from "@/lib/application-status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Building2,
  Calendar,
  Search,
  ArrowRight,
  CheckCircle2,
  FileText,
  Clock,
  Filter,
  ExternalLink,
  Award,
  Layers
} from "lucide-react";

/* ────────────────────────────── Types ────────────────────────────── */

interface ApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  submittedAt: string;
  attachedResumeId?: string | null;
}

/* ────────────────────────── Page Component ───────────────────────── */

export default function StudentApplicationsPage() {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken && !isAuthLoading) {
      setIsLoading(false);
      return;
    }

    async function loadApplications() {
      try {
        setIsLoading(true);
        const data = await apiClient<ApplicationItem[]>(`/api/student/applications`, {
          token: accessToken,
        });
        setApplications(data || []);
      } catch {
        // Graceful error handling
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadApplications();
    }
  }, [accessToken, isAuthLoading]);

  const filtered = activeTab === "All"
    ? applications
    : applications.filter(
        (a) => a.applicationStatus.toLowerCase() === activeTab.toLowerCase()
      );

  // Metric counts
  const totalApplied = applications.length;
  const inReviewCount = applications.filter(
    (a) => a.applicationStatus === "Applied" || a.applicationStatus === "Screened"
  ).length;
  const scheduledCount = applications.filter((a) => a.applicationStatus === "Scheduled").length;
  const offeredCount = applications.filter((a) => a.applicationStatus === "Offered").length;

  return (
    <PageContainer className="py-8 space-y-7">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 mb-2">
            <ClipboardList className="size-3.5" />
            Application Funnel Tracker
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your recruitment stages, interview invitations, and employer offers in real-time.
          </p>
        </div>

        <Link href="/student/jobs">
          <Button size="sm" className="btn-gradient-animate text-white text-xs font-semibold shadow-md shadow-teal-600/20">
            <Search className="size-3.5 mr-1.5" />
            Discover More Jobs
          </Button>
        </Link>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", val: totalApplied, sub: "Across all companies", icon: Layers, color: "teal" },
          { label: "In Active Review", val: inReviewCount, sub: "Applied & screened", icon: Clock, color: "blue" },
          { label: "Interviews Scheduled", val: scheduledCount, sub: "Upcoming rounds", icon: Calendar, color: "amber" },
          { label: "Offers Extended", val: offeredCount, sub: "Successful placements", icon: Award, color: "emerald" },
        ].map((m) => {
          const Icon = m.icon;
          const cardBorder =
            m.color === "emerald"
              ? "glass-card border-l-4 border-l-emerald-500"
              : m.color === "amber"
              ? "glass-card-amber"
              : m.color === "blue"
              ? "glass-card border-l-4 border-l-blue-500"
              : "glass-card-teal";

          return (
            <div key={m.label} className={`${cardBorder} rounded-2xl p-4.5 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {m.label}
                </span>
                <Icon className="size-4 text-slate-400" />
              </div>
              <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {m.val}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 dark:border-slate-800">
        {["All", "Applied", "Screened", "Scheduled", "Offered", "Rejected"].map((tab) => {
          const isActive = activeTab === tab;
          const count =
            tab === "All"
              ? applications.length
              : applications.filter((a) => a.applicationStatus.toLowerCase() === tab.toLowerCase()).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                  : "bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-800"
              }`}
            >
              {tab}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Application Cards List ── */}
      {isLoading || isAuthLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="size-8" />
          </div>
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-slate-200">
            {activeTab === "All" ? "No applications yet" : `No applications in '${activeTab}' status`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {activeTab === "All"
              ? "Browse verified internship openings and submit your first application."
              : "Applications will move to this stage as recruiters review your profile."}
          </p>
          {activeTab === "All" && (
            <Link href="/student/jobs" className="inline-block pt-1">
              <Button size="sm" className="btn-gradient-animate text-white text-xs font-semibold">
                <Search className="size-3.5 mr-1.5" />
                Browse Open Internships
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const statusConfig = getStatusConfig(app.applicationStatus);
            const submittedDate = new Date(app.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={app.id}
                className="glass-card rounded-2xl p-5 sm:p-6 space-y-5 transition-all duration-200 hover:shadow-md border border-slate-200/80 dark:border-slate-800"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                        {app.jobTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Building2 className="size-3.5 text-teal-600" />
                      <span className="font-medium">{app.companyName}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-slate-400" /> Submitted on {submittedDate}
                      </span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.colorClasses.badgeBg} ${statusConfig.colorClasses.badgeText} ${statusConfig.colorClasses.badgeBorder}`}
                    >
                      <span className={`size-2 rounded-full ${statusConfig.colorClasses.dotBg}`} />
                      {statusConfig.label}
                    </span>

                    <Link href={`/student/jobs/${app.jobId}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-500 hover:text-teal-700">
                        <ExternalLink className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Horizontal Funnel Stepper */}
                <div className="px-2 sm:px-6">
                  <ApplicationFunnel status={app.applicationStatus} />
                </div>

                {/* Footer notes */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-teal-600" />
                    {statusConfig.description}
                  </span>

                  <Link
                    href={`/student/jobs/${app.jobId}`}
                    className="font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    View Job Posting <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
