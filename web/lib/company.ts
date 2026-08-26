// Shared types + presentation config for the Company area.

export type VerificationStatus = "Pending" | "Verified" | "Rejected";

export interface CompanyProfile {
  companyName: string;
  corporateWebsite: string | null;
  industrySector: string;
  verificationStatus: VerificationStatus;
}

export interface JobSkill {
  skillName: string;
  requiredImportanceWeight: number;
  weight: number;
}

export interface CompanyJob {
  id: string;
  title: string;
  coreDescription: string;
  selectionCriteria: string;
  locationType: string;
  deadLine: string;
  isApproved: boolean;
  isClosed: boolean;
  requiredSkills: JobSkill[];
}

export interface SkillOption {
  id: string;
  skillName: string;
  domainClassification: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Weighted skill sent to the API when creating/updating a job.
export interface WeightedSkill {
  skillId: string;
  weight: number;
}

// Color-coded verification config (amber Pending, green Verified, red Rejected).
export const VERIFICATION_STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  Pending: {
    label: "Pending Verification",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  Verified: {
    label: "Verified",
    badgeClass:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  Rejected: {
    label: "Verification Rejected",
    badgeClass:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    dotClass: "bg-red-500",
  },
};

export type JobComputedStatus = "Pending Approval" | "Live" | "Closed";

export function computeJobStatus(
  job: Pick<CompanyJob, "isApproved" | "isClosed">
): JobComputedStatus {
  if (job.isClosed) return "Closed";
  if (!job.isApproved) return "Pending Approval";
  return "Live";
}

export const JOB_STATUS_CONFIG: Record<JobComputedStatus, string> = {
  "Pending Approval":
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Live: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  Closed:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
};

// Human labels for the 1-5 skill importance weight (bare numbers read as meaningless).
export const WEIGHT_LABELS: Record<number, string> = {
  1: "Nice to have",
  2: "Helpful",
  3: "Important",
  4: "Very important",
  5: "Critical",
};

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  Remote: "Remote",
  OnSite: "On-site",
  Hybrid: "Hybrid",
};
