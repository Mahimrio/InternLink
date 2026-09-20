"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Briefcase,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { AdminJob, PagedResult } from "@/lib/admin";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddExternalJobDialog } from "@/components/admin/add-external-job-dialog";

const DESCRIPTION_PREVIEW = 220;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

interface SyncResult {
  ingested: number;
  skipped: number;
  failed: number;
  sourcesQueried: string[];
}

export default function AdminJobsPage() {
  const { accessToken } = useAuth();
  const [approved, setApproved] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<"all" | "internal" | "external">("all");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await apiClient<PagedResult<AdminJob>>(
        `/api/admin/jobs?approved=${approved}&page=1&pageSize=50`,
        { token: accessToken }
      );
      setJobs(data.items);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, approved]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs();
  }, [loadJobs]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async (job: AdminJob) => {
    try {
      setPendingId(job.id);
      await apiClient(`/api/admin/jobs/${job.id}/approve`, {
        method: "POST",
        token: accessToken,
      });
      // Drop the approved job from the pending queue immediately.
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success(`"${job.title}" approved`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to approve job");
    } finally {
      setPendingId(null);
    }
  };

  const handleSyncExternal = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    try {
      const result = await apiClient<SyncResult>("/api/admin/jobs/external/sync", {
        method: "POST",
        token: accessToken,
      });
      toast.success(
        `Sync complete — ${result.ingested} new, ${result.skipped} skipped, ${result.failed} failed`
      );
      // Reload the list to show newly ingested jobs.
      await loadJobs();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const isPendingQueue = !approved;
  const filteredJobs = jobs.filter((j) => {
    if (sourceFilter === "internal") return j.source !== "External";
    if (sourceFilter === "external") return j.source === "External";
    return true;
  });

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Job Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve internship postings before they become visible to students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {accessToken && (
            <AddExternalJobDialog
              token={accessToken}
              onJobCreated={loadJobs}
            />
          )}

          {/* Sync external jobs button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncExternal}
            disabled={isSyncing}
            className="shrink-0 gap-1.5 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/40 font-medium"
          >
            {isSyncing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {isSyncing ? "Syncing…" : "Sync External Jobs"}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs
          value={approved ? "approved" : "pending"}
          onValueChange={(value) => setApproved(value === "approved")}
        >
          <TabsList>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="approved">Approved Live</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Source Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 text-xs">
          <button
            type="button"
            onClick={() => setSourceFilter("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              sourceFilter === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Sources
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("internal")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              sourceFilter === "internal"
                ? "bg-background text-teal-700 dark:text-teal-400 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Direct Postings
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("external")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              sourceFilter === "external"
                ? "bg-background text-violet-700 dark:text-violet-400 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            External (BDJobs/APIs)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Briefcase className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">
                {jobs.length === 0
                  ? isPendingQueue
                    ? "Approval queue is clear"
                    : "No approved jobs"
                  : "No postings match the selected filter"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {jobs.length === 0
                  ? isPendingQueue
                    ? "Every submitted internship has been reviewed."
                    : "Approved postings will appear here."
                  : `No ${sourceFilter === "external" ? "external" : "direct"} jobs found in this queue.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
              const busy = pendingId === job.id;
              const isOpen = expanded.has(job.id);
              const isLong = job.description.length > DESCRIPTION_PREVIEW;
              const shownText =
                isOpen || !isLong
                  ? job.description
                  : `${job.description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…`;
            const isExternal = job.source === "External";
            return (
              <Card key={job.id} className="border-border/70 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-heading text-lg font-semibold leading-tight">{job.title}</h2>
                        {isExternal && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              job.externalSourceName?.toLowerCase() === "bdjobs"
                                ? "bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                                : "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
                            }`}
                          >
                            <ExternalLink className="size-2.5" />
                            via {job.externalSourceName ?? "External"}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-4" />
                          {job.companyName}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{job.locationType}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>Deadline {formatDate(job.deadLine)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isExternal && job.externalApplyUrl && (
                        <a
                          href={job.externalApplyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                          Source
                        </a>
                      )}
                      {isPendingQueue && (
                        <Button
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => handleApprove(job)}
                          disabled={busy}
                        >
                          {busy ? (
                            <Loader2 className="mr-1.5 size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1.5 size-4" />
                          )}
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-sm whitespace-pre-line text-foreground/80">
                      {shownText || "No description provided."}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(job.id)}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        {isOpen ? (
                          <>
                            Show less <ChevronUp className="size-3.5" />
                          </>
                        ) : (
                          <>
                            View full <ChevronDown className="size-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
