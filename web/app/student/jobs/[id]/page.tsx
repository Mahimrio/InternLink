"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Award,
  Plus
} from "lucide-react";
import { toast } from "sonner";

/* ────────────────────────────── Types ────────────────────────────── */

interface JobSkillDto {
  skillName: string;
  requiredImportanceWeight: number;
  weight: number;
}

interface JobDetailDto {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  coreDescription: string;
  selectionCriteria: string;
  locationType: string;
  deadLine: string;
  hasApplied: boolean;
  requiredSkills: JobSkillDto[];
}

interface ResumeDto {
  id: string;
  documentPath: string;
  lastModified: string;
  downloadUrl?: string | null;
}

/* ────────────────────────── Helpers ───────────────────────────────── */

function formatRelativeDeadline(deadlineStr: string): { text: string; isUrgent: boolean; fullDate: string } {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  const fullDate = deadline.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (diffMs <= 0) {
    return { text: "Expired", isUrgent: true, fullDate };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 48) {
    return { text: `Closes in ${diffHours}h`, isUrgent: true, fullDate };
  }

  return { text: `Closes in ${diffDays} days`, isUrgent: false, fullDate };
}

function getSkillWeightLabel(weight: number): { label: string; color: string } {
  switch (weight) {
    case 5:
      return { label: "Must-Have (Critical)", color: "bg-teal-600 text-white" };
    case 4:
      return { label: "Highly Required", color: "bg-teal-500 text-white" };
    case 3:
      return { label: "Preferred", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300" };
    case 2:
      return { label: "Nice-to-Have", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
    default:
      return { label: "Bonus", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  }
}

/* ────────────────────────── Page Component ───────────────────────── */

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<JobDetailDto | null>(null);
  const [resumes, setResumes] = useState<ResumeDto[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAppliedLocally, setHasAppliedLocally] = useState(false);

  useEffect(() => {
    if (!accessToken && !isAuthLoading) {
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        setIsLoading(true);
        const [jobRes, resumesRes] = await Promise.allSettled([
          apiClient<JobDetailDto>(`/api/student/jobs/${jobId}`, { token: accessToken }),
          apiClient<ResumeDto[]>(`/api/student/resumes`, { token: accessToken }),
        ]);

        if (jobRes.status === "fulfilled") {
          setJob(jobRes.value);
          setHasAppliedLocally(jobRes.value.hasApplied);
        } else {
          toast.error("Job not found or is no longer available.");
          router.push("/student/jobs");
          return;
        }

        if (resumesRes.status === "fulfilled") {
          const list = resumesRes.value || [];
          // Filter to finalized resumes (non-empty documentPath)
          const finalized = list.filter((r) => r.documentPath && r.documentPath.trim() !== "");
          setResumes(finalized);
          if (finalized.length > 0) {
            setSelectedResumeId(finalized[0].id);
          }
        }
      } catch {
        toast.error("Failed to load job details.");
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadData();
    }
  }, [accessToken, isAuthLoading, jobId, router]);

  const handleApply = async () => {
    if (!accessToken || !job) return;

    if (resumes.length === 0) {
      toast.error("Please finalize a resume first before applying.");
      return;
    }

    const resumeToUse = selectedResumeId || resumes[0]?.id;
    if (!resumeToUse) {
      toast.error("Please select a finalized resume to attach.");
      return;
    }

    try {
      setIsApplying(true);
      await apiClient(`/api/student/jobs/${job.id}/apply`, {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({ resumeId: resumeToUse }),
      });

      setHasAppliedLocally(true);
      toast.success("Application submitted successfully!");
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to submit application.";
      toast.error(errorMsg);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <PageContainer className="py-8 space-y-6">
        <Skeleton className="h-6 w-32 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!job) {
    return null;
  }

  const deadlineInfo = formatRelativeDeadline(job.deadLine);
  const isApplied = hasAppliedLocally || job.hasApplied;

  return (
    <PageContainer className="py-8 space-y-6">
      {/* ── Back button ── */}
      <div>
        <Link
          href="/student/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to all internships
        </Link>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) — Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="glass-hero rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
                <MapPin className="size-3" />
                {job.locationType}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                  deadlineInfo.isUrgent
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                }`}
              >
                {deadlineInfo.isUrgent ? (
                  <AlertTriangle className="size-3 text-rose-500" />
                ) : (
                  <Clock className="size-3" />
                )}
                {deadlineInfo.text} ({deadlineInfo.fullDate})
              </span>
            </div>

            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {job.title}
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-1.5">
                <Building2 className="size-4 text-teal-600" />
                <span>{job.companyName}</span>
              </p>
            </div>

            {isApplied && (
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-2.5 text-xs text-teal-800 dark:text-teal-200">
                <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                <span>
                  You have applied for this position. Track status updates in{" "}
                  <Link href="/student/applications" className="font-semibold underline">
                    My Applications
                  </Link>
                  .
                </span>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="size-4 text-teal-600" />
              Role Description
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.coreDescription}
            </div>
          </div>

          {/* Selection Criteria Section */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="size-4 text-teal-600" />
              Selection Criteria & Requirements
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.selectionCriteria}
            </div>
          </div>

          {/* Required Skills & Importance */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="size-4 text-teal-600" />
              Required Skills & Priority
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.requiredSkills.map((sk) => {
                const weight = sk.requiredImportanceWeight || sk.weight || 3;
                const weightMeta = getSkillWeightLabel(weight);

                return (
                  <div
                    key={sk.skillName}
                    className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {sk.skillName}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${weightMeta.color}`}>
                        {weightMeta.label}
                      </span>
                    </div>

                    {/* 5-dot weight visualizer */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            level <= weight
                              ? "bg-teal-500 shadow-sm shadow-teal-500/30"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) — Sticky Apply Card */}
        <div className="space-y-6">
          <div className="glass-card-featured rounded-2xl p-6 space-y-5 sticky top-6">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-teal-700 dark:text-teal-400">
                Application Action
              </span>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Apply for Position
              </h3>
            </div>

            {/* Resume Selection or Builder Link */}
            {resumes.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="size-4 text-amber-600" />
                  No Finalized Resume Found
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                  You must build and finalize an ATS resume before submitting your application.
                </p>
                <Link href="/student/resumes/builder" className="block pt-1">
                  <Button size="sm" className="w-full text-xs font-semibold btn-gradient-animate text-white">
                    <Plus className="size-3.5 mr-1.5" />
                    Build & Finalize Resume
                  </Button>
                </Link>
              </div>
            ) : resumes.length === 1 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">Attached Resume</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="size-3.5 text-teal-600" />
                  Primary Finalized Resume
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Resume to Attach:
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {resumes.map((r, i) => (
                    <option key={r.id} value={r.id}>
                      Resume #{i + 1} ({new Date(r.lastModified).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Main Apply Button */}
            {isApplied ? (
              <Button
                disabled
                className="w-full h-11 text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700 cursor-not-allowed"
              >
                <CheckCircle2 className="size-4 mr-1.5 text-teal-600" />
                Already Applied
              </Button>
            ) : resumes.length === 0 ? (
              <Button
                disabled
                className="w-full h-11 text-xs font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
              >
                Finalize a Resume First
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="w-full h-11 text-xs font-semibold btn-gradient-animate text-white shadow-lg shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isApplying ? "Submitting Application..." : "Submit Application Now"}
              </Button>
            )}

            {/* Security Guarantee */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-teal-500" /> Verified employer posting
              </p>
              <p className="flex items-center gap-1">
                <Award className="size-3 text-amber-500" /> Matches student career board guidelines
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
