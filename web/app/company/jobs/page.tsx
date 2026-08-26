"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Ban, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { useCompanyProfile } from "@/lib/company-context";
import {
  CompanyJob,
  PagedResult,
  computeJobStatus,
  JOB_STATUS_CONFIG,
  LOCATION_TYPE_LABELS,
} from "@/lib/company";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationRequiredPanel } from "@/components/company/verification-required-panel";
import { CloseJobDialog } from "@/components/company/close-job-dialog";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function CompanyJobsPage() {
  const { accessToken } = useAuth();
  const { profile, isLoading: isProfileLoading } = useCompanyProfile();
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [closeTarget, setCloseTarget] = useState<CompanyJob | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const isVerified = profile?.verificationStatus === "Verified";

  const loadJobs = useCallback(async () => {
    if (!accessToken) return;
    try {
      // Await first so no setState runs synchronously inside the calling effect.
      const data = await apiClient<PagedResult<CompanyJob>>(
        "/api/company/jobs?page=1&pageSize=50",
        { token: accessToken }
      );
      setJobs(data.items);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to load job postings");
    } finally {
      setIsLoadingJobs(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isProfileLoading && isVerified) {
      // Intentional one-shot fetch on mount; state is set only after the awaited request.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadJobs();
    }
  }, [isProfileLoading, isVerified, loadJobs]);

  const handleConfirmClose = async () => {
    if (!closeTarget) return;
    try {
      setIsClosing(true);
      await apiClient(`/api/company/jobs/${closeTarget.id}/close`, {
        method: "POST",
        token: accessToken,
      });
      setJobs((prev) =>
        prev.map((j) => (j.id === closeTarget.id ? { ...j, isClosed: true } : j))
      );
      toast.success("Job posting closed");
      setCloseTarget(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to close the job posting");
    } finally {
      setIsClosing(false);
    }
  };

  if (isProfileLoading) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </PageContainer>
    );
  }

  const header = (
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Job Postings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage the internships your company offers.
        </p>
      </div>
      {isVerified && (
        <Button
          render={<Link href="/company/jobs/new" />}
          nativeButton={false}
          className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white shadow-sm"
        >
          <Plus className="mr-1.5 size-4" />
          New Job
        </Button>
      )}
    </div>
  );

  if (!isVerified) {
    return (
      <PageContainer>
        {header}
        <VerificationRequiredPanel status={profile?.verificationStatus ?? "Pending"} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {header}

      {isLoadingJobs ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : jobs.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Briefcase className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">No job postings yet</h2>
              <p className="text-sm text-muted-foreground">
                Publish your first internship to start receiving applications.
              </p>
            </div>
            <Button
              render={<Link href="/company/jobs/new" />}
              nativeButton={false}
              className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white shadow-sm"
            >
              <Plus className="mr-1.5 size-4" />
              New Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const status = computeJobStatus(job);
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="pl-4 font-medium">{job.title}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            JOB_STATUS_CONFIG[status]
                          )}
                        >
                          {status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {LOCATION_TYPE_LABELS[job.locationType] ?? job.locationType}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(job.deadLine)}</TableCell>
                      <TableCell className="text-muted-foreground">{job.requiredSkills.length}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            render={<Link href={`/company/jobs/${job.id}/edit`} />}
                            nativeButton={false}
                          >
                            <Pencil className="mr-1 size-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setCloseTarget(job)}
                            disabled={job.isClosed}
                          >
                            <Ban className="mr-1 size-3.5" />
                            Close
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CloseJobDialog
        open={closeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isClosing) setCloseTarget(null);
        }}
        jobTitle={closeTarget?.title ?? ""}
        isClosing={isClosing}
        onConfirm={handleConfirmClose}
      />
    </PageContainer>
  );
}
