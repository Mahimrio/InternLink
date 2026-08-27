"use client";

import { ShieldAlert, ShieldX, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationStatus } from "@/lib/company";

// Shown in place of the job-posting UI when a company isn't Verified — an explained
// empty state rather than a disabled button with no context.
export function VerificationRequiredPanel({ status }: { status: VerificationStatus }) {
  const rejected = status === "Rejected";

  return (
    <Card className="border-border/70">
      <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
        <div
          className={
            rejected
              ? "flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
              : "flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
          }
        >
          {rejected ? <ShieldX className="size-8" /> : <ShieldAlert className="size-8" />}
        </div>

        <div className="space-y-1.5">
          <h2 className="font-heading text-xl font-semibold">
            {rejected ? "Verification was not approved" : "Your company is awaiting admin verification"}
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {rejected
              ? "An administrator reviewed your company and could not verify it. Please review your company profile details, then reach out to support so posting can be re-enabled."
              : "An administrator reviews every new company before it can post internships. As soon as you're verified, job posting unlocks here automatically — no need to do anything else."}
          </p>
        </div>

        {!rejected && (
          <ol className="mx-auto w-full max-w-sm space-y-2 text-left text-sm">
            {[
              "Complete your company profile so admins can verify you faster.",
              "An administrator reviews and verifies your company.",
              "Job posting unlocks automatically once you're approved.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        )}

        {!rejected && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            You can still edit your company profile while you wait.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
