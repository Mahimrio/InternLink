import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared across the student skills display (Prompt 21) and the recruiter applicant detail.
export function VerifiedSkillBadge({ skill, className }: { skill: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        className
      )}
    >
      <BadgeCheck className="size-3.5" />
      {skill}
    </span>
  );
}
