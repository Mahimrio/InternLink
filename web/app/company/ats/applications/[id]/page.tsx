"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  GraduationCap,
  Building2,
  CalendarClock,
  Link2,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { AtsApplicantDetail } from "@/lib/ats";
import { PageContainer } from "@/components/shared/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationFunnel } from "@/components/student/application-funnel";
import { VerifiedSkillBadge } from "@/components/shared/verified-skill-badge";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function AtsApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const [detail, setDetail] = useState<AtsApplicantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const data = await apiClient<AtsApplicantDetail>(`/api/company/ats/applications/${id}`, {
          token: accessToken,
        });
        setDetail(data);
      } catch (err: unknown) {
        const e = err as { message?: string; status?: number };
        if (e.status === 404) {
          setNotFound(true);
        } else {
          toast.error(e.message || "Failed to load applicant");
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken, id]);

  return (
    <PageContainer narrow className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/company/ats"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2 text-muted-foreground" })}
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Pipeline
      </Link>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : notFound || !detail ? (
        <Card className="border-border/70">
          <CardContent className="py-16 text-center">
            <h2 className="font-heading text-lg font-semibold">Applicant not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This application doesn&apos;t exist or doesn&apos;t belong to your company.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary block */}
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">{detail.studentName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Applied to <span className="font-medium text-foreground">{detail.jobTitle}</span> ·{" "}
              {formatDateTime(detail.submittedAt)}
            </p>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="py-4">
              <ApplicationFunnel status={detail.applicationStatus} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-border/70">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{detail.department || "—"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  <GraduationCap className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CGPA</p>
                  <p className="text-sm font-medium">{Number(detail.cgpa).toFixed(2)} / 4.00</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <BadgeCheck className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verified skills</p>
                  <p className="text-sm font-medium">{detail.verifiedSkills.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resume + skill gap actions */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <FileText className="size-5 text-primary" />
                Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              {detail.resumeDownloadUrl ? (
                <a
                  href={detail.resumeDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ className: "bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white" })}
                >
                  <Download className="mr-1.5 size-4" />
                  Download Resume
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This applicant hasn&apos;t attached a finalized resume.
                </p>
              )}
              {/* "View Skill Gap" intentionally omitted until Prompt 34 (Skill Gap) ships —
                  avoids a dead link to a route that doesn't exist yet. */}
            </CardContent>
          </Card>

          {/* Verified skills */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Verified Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.verifiedSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No verified skills yet (a skill is verified once an assessment scores 70+).
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.verifiedSkills.map((skill) => (
                    <VerifiedSkillBadge key={skill} skill={skill} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview (if scheduled) */}
          {detail.interview && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <CalendarClock className="size-5 text-amber-600" />
                  Interview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Scheduled for: </span>
                  <span className="font-medium">{formatDateTime(detail.interview.scheduledDateTime)}</span>
                </p>
                {detail.interview.contextMeetingLink && (
                  <p className="flex items-center gap-1.5">
                    <Link2 className="size-4 text-muted-foreground" />
                    <a
                      href={detail.interview.contextMeetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {detail.interview.contextMeetingLink}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}
