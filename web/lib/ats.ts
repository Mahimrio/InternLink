// ATS (recruiter pipeline) types + the client-side mirror of the API transition graph.

export interface AtsApplicationListItem {
  applicationId: string;
  studentName: string;
  jobTitle: string;
  applicationStatus: string;
  submittedAt: string;
  verifiedSkillCount: number;
}

export interface AtsInterview {
  scheduledDateTime: string;
  contextMeetingLink: string | null;
  statusIndicator: string;
}

export interface AtsApplicantDetail {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  applicationStatus: string;
  submittedAt: string;
  studentName: string;
  department: string;
  cgpa: number;
  resumeDownloadUrl: string | null;
  verifiedSkills: string[];
  interview: AtsInterview | null;
}

export type AtsStatus = "Applied" | "Screened" | "Scheduled" | "Offered" | "Rejected";

// Board column order (Offered + Rejected are the two terminal columns).
export const ATS_COLUMNS: AtsStatus[] = ["Applied", "Screened", "Scheduled", "Offered", "Rejected"];

// Client-side mirror of the API's forward-transition graph. The server is the source of
// truth; this only decides which "Advance" options to show on a card.
export const ATS_TRANSITIONS: Record<AtsStatus, AtsStatus[]> = {
  Applied: ["Screened", "Rejected"],
  Screened: ["Scheduled", "Rejected"],
  Scheduled: ["Offered", "Rejected"],
  Offered: [],
  Rejected: [],
};

export function nextStatuses(current: string): AtsStatus[] {
  return ATS_TRANSITIONS[current as AtsStatus] ?? [];
}
