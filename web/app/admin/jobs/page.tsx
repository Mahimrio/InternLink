"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Briefcase, Loader2, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { AdminJob, PagedResult } from "@/lib/admin";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DESCRIPTION_PREVIEW = 220;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function AdminJobsPage() {
  const { accessToken } = useAuth();
  const [approved, setApproved] = useState(false);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      toast.success(`“${job.title}” approved`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to approve job");
    } finally {
      setPendingId(null);
    }
  };

  const isPendingQueue = !approved;

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Job Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve internship postings before they become visible to students.
        </p>
      </div>

      <div className="mb-6">
        <Tabs
          value={approved ? "approved" : "pending"}
          onValueChange={(value) => setApproved(value === "approved")}
        >
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Briefcase className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">
                {isPendingQueue ? "Approval queue is clear" : "No approved jobs"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isPendingQueue
                  ? "Every submitted internship has been reviewed."
                  : "Approved postings will appear here."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const busy = pendingId === job.id;
            const isOpen = expanded.has(job.id);
            const isLong = job.description.length > DESCRIPTION_PREVIEW;
            const shownText =
              isOpen || !isLong
                ? job.description
                : `${job.description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…`;
            return (
              <Card key={job.id} className="border-border/70 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-heading text-lg font-semibold leading-tight">{job.title}</h2>
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
                    {isPendingQueue && (
                      <Button
                        className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
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
