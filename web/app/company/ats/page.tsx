"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, Users, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CompanyJob, PagedResult } from "@/lib/company";
import { AtsApplicationListItem, AtsStatus, ATS_COLUMNS } from "@/lib/ats";
import { APPLICATION_STATUS_CONFIG } from "@/lib/application-status";
import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvanceStatusMenu } from "@/components/company/advance-status-menu";
import { ScheduleInterviewDialog } from "@/components/company/schedule-interview-dialog";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function AtsBoardPage() {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [applications, setApplications] = useState<AtsApplicationListItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<AtsApplicationListItem | null>(null);

  const loadJobs = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await apiClient<PagedResult<CompanyJob>>(
        "/api/company/jobs?page=1&pageSize=100",
        { token: accessToken }
      );
      setJobs(data.items);
    } catch {
      // Non-fatal: the filter just won't populate.
    }
  }, [accessToken]);

  const loadApplications = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const query = selectedJobId === "all" ? "" : `&jobId=${selectedJobId}`;
      const data = await apiClient<PagedResult<AtsApplicationListItem>>(
        `/api/company/ats/applications?page=1&pageSize=100${query}`,
        { token: accessToken }
      );
      setApplications(data.items);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to load applicants");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedJobId]);

  useEffect(() => {
    if (accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadJobs();
    }
  }, [accessToken, loadJobs]);

  useEffect(() => {
    if (accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadApplications();
    }
  }, [accessToken, loadApplications]);

  const grouped = useMemo(() => {
    const g: Record<string, AtsApplicationListItem[]> = {};
    for (const col of ATS_COLUMNS) g[col] = [];
    for (const a of applications) {
      (g[a.applicationStatus] ??= []).push(a);
    }
    return g;
  }, [applications]);

  const putStatus = useCallback(
    async (applicationId: string, next: AtsStatus, extra?: Record<string, string>) => {
      try {
        setUpdatingId(applicationId);
        await apiClient(`/api/company/ats/applications/${applicationId}/status`, {
          method: "PUT",
          token: accessToken,
          body: JSON.stringify({ newStatus: next, ...extra }),
        });
        // Update in place so the card moves columns without a manual refresh.
        setApplications((prev) =>
          prev.map((a) => (a.applicationId === applicationId ? { ...a, applicationStatus: next } : a))
        );
        toast.success(`Moved to ${APPLICATION_STATUS_CONFIG[next].label}`);
        return true;
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e.message || "Failed to update status");
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [accessToken]
  );

  const handleAdvance = (app: AtsApplicationListItem, next: AtsStatus) => {
    if (next === "Scheduled") {
      setScheduleTarget(app);
      return;
    }
    putStatus(app.applicationId, next);
  };

  const handleConfirmSchedule = async (scheduledDateTimeIso: string, contextMeetingLink: string) => {
    if (!scheduleTarget) return;
    const ok = await putStatus(scheduleTarget.applicationId, "Scheduled", {
      scheduledDateTime: scheduledDateTimeIso,
      contextMeetingLink,
    });
    if (ok) setScheduleTarget(null);
  };

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">ATS Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track applicants across your hiring stages and advance them through the pipeline.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Filter className="size-3.5" />
            Filter by job
          </div>
          <Select value={selectedJobId} onValueChange={(v) => setSelectedJobId(v ?? "all")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ATS_COLUMNS.map((c) => (
            <Skeleton key={c} className="h-80 w-72 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ATS_COLUMNS.map((col) => {
            const cfg = APPLICATION_STATUS_CONFIG[col];
            const colApps = grouped[col] ?? [];
            return (
              <div key={col} className="flex w-72 shrink-0 flex-col">
                <div
                  className={cn(
                    "mb-3 flex items-center justify-between rounded-lg border px-3 py-2",
                    cfg.colorClasses.badgeBg,
                    cfg.colorClasses.badgeBorder
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", cfg.colorClasses.dotBg)} />
                    <span className={cn("text-sm font-semibold", cfg.colorClasses.badgeText)}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className={cn("text-xs font-medium", cfg.colorClasses.badgeText)}>
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colApps.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
                      No applicants
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.applicationId}
                        className="rounded-lg border border-border/70 bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <Link
                          href={`/company/ats/applications/${app.applicationId}`}
                          className="block"
                        >
                          <p className="font-medium leading-tight">{app.studentName}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {app.jobTitle}
                          </p>
                        </Link>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(app.submittedAt)}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            title="Verified skills"
                          >
                            <BadgeCheck className="size-3" />
                            {app.verifiedSkillCount}
                          </span>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <AdvanceStatusMenu
                            currentStatus={app.applicationStatus}
                            disabled={updatingId === app.applicationId}
                            onSelect={(next) => handleAdvance(app, next)}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && applications.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-border/60 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <p className="font-medium">No applicants yet</p>
          <p className="text-sm text-muted-foreground">
            Applicants appear here as students apply to your job postings.
          </p>
        </div>
      )}

      <ScheduleInterviewDialog
        open={scheduleTarget !== null}
        onOpenChange={(open) => {
          if (!open && !updatingId) setScheduleTarget(null);
        }}
        studentName={scheduleTarget?.studentName ?? ""}
        isSubmitting={scheduleTarget !== null && updatingId === scheduleTarget.applicationId}
        onConfirm={handleConfirmSchedule}
      />
    </PageContainer>
  );
}
