"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  Building2,
  Mail,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { AdminCompany, CompanyVerificationStatus, PagedResult } from "@/lib/admin";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RejectCompanyDialog } from "@/components/admin/reject-company-dialog";

const STATUS_TABS: CompanyVerificationStatus[] = ["Pending", "Verified", "Rejected"];

export default function AdminCompaniesPage() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<CompanyVerificationStatus>("Pending");
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminCompany | null>(null);

  const loadCompanies = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await apiClient<PagedResult<AdminCompany>>(
        `/api/admin/companies?status=${status}&page=1&pageSize=50`,
        { token: accessToken }
      );
      setCompanies(data.items);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCompanies();
  }, [loadCompanies]);

  const handleApprove = async (company: AdminCompany) => {
    try {
      setPendingId(company.id);
      await apiClient(`/api/admin/companies/${company.id}/approve`, {
        method: "POST",
        token: accessToken,
      });
      // Remove from the pending queue immediately rather than waiting for a manual refresh.
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      toast.success(`${company.companyName} approved`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to approve company");
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    const company = rejectTarget;
    try {
      setPendingId(company.id);
      await apiClient(`/api/admin/companies/${company.id}/reject`, {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({ reason: reason || null }),
      });
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      toast.success(`${company.companyName} rejected`);
      setRejectTarget(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to reject company");
    } finally {
      setPendingId(null);
    }
  };

  const isPendingQueue = status === "Pending";

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Company Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify company registrations before they can post internships.
        </p>
      </div>

      <div className="mb-6">
        <Tabs value={status} onValueChange={(value) => setStatus(value as CompanyVerificationStatus)}>
          <TabsList>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : companies.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BadgeCheck className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">
                {isPendingQueue ? "Approval queue is clear" : `No ${status.toLowerCase()} companies`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isPendingQueue
                  ? "Every company registration has been reviewed."
                  : "Nothing to show in this view."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => {
            const busy = pendingId === company.id;
            return (
              <Card key={company.id} className="border-border/70 shadow-sm">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-heading text-lg font-semibold leading-tight">
                        {company.companyName}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {company.industrySector || "Industry not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-4 shrink-0" />
                      <span className="truncate">{company.contactEmail}</span>
                    </div>
                    {company.corporateWebsite ? (
                      <a
                        href={company.corporateWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="size-4 shrink-0" />
                        <span className="truncate">{company.corporateWebsite}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground/70">
                        <ExternalLink className="size-4 shrink-0" />
                        <span>No website provided</span>
                      </div>
                    )}
                  </div>

                  {isPendingQueue && (
                    <div className="mt-auto flex items-center gap-2 border-t pt-4">
                      <Button
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handleApprove(company)}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 size-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        onClick={() => setRejectTarget(company)}
                        disabled={busy}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RejectCompanyDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open && pendingId === null) setRejectTarget(null);
        }}
        companyName={rejectTarget?.companyName ?? ""}
        isPending={rejectTarget !== null && pendingId === rejectTarget.id}
        onConfirm={handleReject}
      />
    </PageContainer>
  );
}
