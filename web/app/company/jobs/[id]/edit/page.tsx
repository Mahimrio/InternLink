"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { useCompanyProfile } from "@/lib/company-context";
import { CompanyJob, SkillOption } from "@/lib/company";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JobForm } from "@/components/company/job-form";
import { VerificationRequiredPanel } from "@/components/company/verification-required-panel";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const { profile, isLoading: isProfileLoading } = useCompanyProfile();
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [job, setJob] = useState<CompanyJob | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isVerified = profile?.verificationStatus === "Verified";

  useEffect(() => {
    if (!accessToken || !isVerified) return;
    (async () => {
      try {
        setIsLoadingData(true);
        const [skillData, jobData] = await Promise.all([
          apiClient<SkillOption[]>("/api/company/skills", { token: accessToken }),
          apiClient<CompanyJob>(`/api/company/jobs/${id}`, { token: accessToken }),
        ]);
        setSkills(skillData);
        setJob(jobData);
      } catch (err: unknown) {
        const e = err as { message?: string; status?: number };
        if (e.status === 404) {
          setNotFound(true);
        } else {
          toast.error(e.message || "Failed to load the job posting");
        }
      } finally {
        setIsLoadingData(false);
      }
    })();
  }, [accessToken, isVerified, id]);

  return (
    <PageContainer narrow className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/company/jobs" />}
        nativeButton={false}
        className="mb-4 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Job Postings
      </Button>

      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Edit Job Posting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details of your internship. Approved postings stay live after edits.
        </p>
      </div>

      {isProfileLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !isVerified ? (
        <VerificationRequiredPanel status={profile?.verificationStatus ?? "Pending"} />
      ) : notFound ? (
        <Card className="border-border/70">
          <CardContent className="py-16 text-center">
            <h2 className="font-heading text-lg font-semibold">Job not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This posting doesn&apos;t exist or doesn&apos;t belong to your company.
            </p>
            <Button
              render={<Link href="/company/jobs" />}
              nativeButton={false}
              variant="outline"
              className="mt-4"
            >
              Back to Job Postings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Job Details</CardTitle>
            <CardDescription>Changes are saved immediately once you submit.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData || !job ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <JobForm skillOptions={skills} initialJob={job} />
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
