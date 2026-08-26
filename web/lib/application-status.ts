export type ApplicationStatus =
  | "Applied"
  | "Screened"
  | "Scheduled"
  | "Offered"
  | "Rejected";

export interface StatusConfig {
  label: string;
  description: string;
  stepIndex: number; // 0: Applied, 1: Screened, 2: Scheduled, 3: Offered/Rejected
  colorClasses: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotBg: string;
    ringColor: string;
  };
}

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  Applied: {
    label: "Applied",
    description: "Application submitted and received by hiring team",
    stepIndex: 0,
    colorClasses: {
      bg: "bg-teal-500",
      text: "text-teal-700 dark:text-teal-300",
      border: "border-teal-400 dark:border-teal-600",
      badgeBg: "bg-teal-50 dark:bg-teal-950/60",
      badgeText: "text-teal-700 dark:text-teal-300",
      badgeBorder: "border-teal-200 dark:border-teal-800",
      dotBg: "bg-teal-500",
      ringColor: "ring-teal-400/30",
    },
  },
  Screened: {
    label: "Screened",
    description: "Profile reviewed and shortlisted by recruiter",
    stepIndex: 1,
    colorClasses: {
      bg: "bg-blue-500",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-400 dark:border-blue-600",
      badgeBg: "bg-blue-50 dark:bg-blue-950/60",
      badgeText: "text-blue-700 dark:text-blue-300",
      badgeBorder: "border-blue-200 dark:border-blue-800",
      dotBg: "bg-blue-500",
      ringColor: "ring-blue-400/30",
    },
  },
  Scheduled: {
    label: "Interview Scheduled",
    description: "Interview slot scheduled with engineering/HR team",
    stepIndex: 2,
    colorClasses: {
      bg: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-400 dark:border-amber-600",
      badgeBg: "bg-amber-50 dark:bg-amber-950/60",
      badgeText: "text-amber-700 dark:text-amber-300",
      badgeBorder: "border-amber-200 dark:border-amber-800",
      dotBg: "bg-amber-500",
      ringColor: "ring-amber-400/30",
    },
  },
  Offered: {
    label: "Offer Extended",
    description: "Congratulations! An internship offer has been extended",
    stepIndex: 3,
    colorClasses: {
      bg: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-400 dark:border-emerald-600",
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      badgeBorder: "border-emerald-200 dark:border-emerald-800",
      dotBg: "bg-emerald-500",
      ringColor: "ring-emerald-400/30",
    },
  },
  Rejected: {
    label: "Not Selected",
    description: "Application was not selected for this opening",
    stepIndex: 3,
    colorClasses: {
      bg: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-400 dark:border-rose-600",
      badgeBg: "bg-rose-50 dark:bg-rose-950/60",
      badgeText: "text-rose-700 dark:text-rose-300",
      badgeBorder: "border-rose-200 dark:border-rose-800",
      dotBg: "bg-rose-500",
      ringColor: "ring-rose-400/30",
    },
  },
};

export function getStatusConfig(statusString: string): StatusConfig {
  const norm = statusString as ApplicationStatus;
  return APPLICATION_STATUS_CONFIG[norm] || APPLICATION_STATUS_CONFIG.Applied;
}
