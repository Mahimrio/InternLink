"use client";

import { ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyProfile } from "@/lib/company-context";
import { VERIFICATION_STATUS_CONFIG, VerificationStatus } from "@/lib/company";

const ICONS: Record<VerificationStatus, React.ElementType> = {
  Pending: ShieldAlert,
  Verified: ShieldCheck,
  Rejected: ShieldX,
};

const MESSAGES: Record<VerificationStatus, string> = {
  Pending:
    "Your company is awaiting admin verification. You can set up your profile now — job posting unlocks once you're verified.",
  Verified: "Your company is verified. You can publish and manage job postings.",
  Rejected:
    "Your verification was rejected. Please review your company details or contact support before posting jobs.",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = VERIFICATION_STATUS_CONFIG[status];
  const Icon = ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.badgeClass
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

// Rendered at the top of every Company-area page so status is always visible.
export function VerificationBanner() {
  const { profile, isLoading } = useCompanyProfile();

  if (isLoading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking verification status…
      </div>
    );
  }

  if (!profile) return null;

  const status = profile.verificationStatus;
  const config = VERIFICATION_STATUS_CONFIG[status];
  const Icon = ICONS[status];

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        config.badgeClass
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm font-medium leading-snug">{MESSAGES[status]}</p>
      </div>
      <VerificationBadge status={status} />
    </div>
  );
}
