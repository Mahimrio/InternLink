"use client";

import { useAuth } from "@/lib/auth-context";
import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyDashboardPage() {
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

  const displayName = user.name || user.unique_name || user.email || "Company";

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {displayName}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          This is your company dashboard. Manage your job postings, review applicants in the ATS pipeline, and update your profile.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Active Jobs</h3>
            <p className="text-4xl font-bold text-primary">0</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Total Applicants</h3>
            <p className="text-4xl font-bold text-primary">0</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Interviews Scheduled</h3>
            <p className="text-4xl font-bold text-primary">0</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
