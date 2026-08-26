"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { useCompanyProfile } from "@/lib/company-context";
import { SkillOption } from "@/lib/company";
import { PageContainer } from "@/components/shared/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JobForm } from "@/components/company/job-form";
import { VerificationRequiredPanel } from "@/components/company/verification-required-panel";

export default function NewJobPage() {
  const { accessToken } = useAuth();
  const { profile, isLoading: isProfileLoading } = useCompanyProfile();
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

  const isVerified = profile?.verificationStatus === "Verified";

  useEffect(() => {
    if (!accessToken || !isVerified) return;
    (async () => {
      try {
        const data = await apiClient<SkillOption[]>("/api/company/skills", { token: accessToken });
        setSkills(data);
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e.message || "Failed to load skills");
      } finally {
        setIsLoadingSkills(false);
      }
    })();
  }, [accessToken, isVerified]);

  return (
    <PageContainer narrow className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/company/jobs"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2 text-muted-foreground" })}
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Job Postings
      </Link>

      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Post a New Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New postings are reviewed by an admin before they go live to students.
        </p>
      </div>

      {isProfileLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !isVerified ? (
        <VerificationRequiredPanel status={profile?.verificationStatus ?? "Pending"} />
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Job Details</CardTitle>
            <CardDescription>Provide the information students will see and be matched on.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSkills ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <JobForm skillOptions={skills} />
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
