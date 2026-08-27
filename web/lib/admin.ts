// Shared types + presentation config for the Admin area.

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type AdminUserRole = "Student" | "Company";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export type CompanyVerificationStatus = "Pending" | "Verified" | "Rejected";

export interface AdminCompany {
  id: string;
  companyName: string;
  corporateWebsite: string | null;
  industrySector: string;
  verificationStatus: CompanyVerificationStatus;
  contactEmail: string;
  createdAt: string;
}

export interface AdminJob {
  id: string;
  title: string;
  companyName: string;
  description: string;
  locationType: string;
  deadLine: string;
  isApproved: boolean;
  isClosed: boolean;
}

export interface ApplicationsByStatus {
  applied: number;
  screened: number;
  scheduled: number;
  offered: number;
  rejected: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface AdminAnalytics {
  activeStudentCount: number;
  activeCompanyCount: number;
  openJobCount: number;
  applicationsByStatus: ApplicationsByStatus;
  newApplicationsLast7Days: DailyCount[];
}

// Concrete hex colors matching the app's status palette so Recharts renders in
// the design system's colors (teal/blue/amber/emerald/rose) instead of its
// default rainbow. Keyed to match APPLICATION_STATUS_CONFIG.
export const STATUS_CHART_COLORS: Record<string, string> = {
  Applied: "#14b8a6", // teal-500
  Screened: "#3b82f6", // blue-500
  Scheduled: "#f59e0b", // amber-500
  Offered: "#10b981", // emerald-500
  Rejected: "#f43f5e", // rose-500
};

// Primary brand teal used for the trend line and single-series bars.
export const CHART_PRIMARY = "#0d9488"; // teal-600
