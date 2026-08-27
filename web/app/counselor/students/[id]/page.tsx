"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { VerifiedSkillBadge } from "@/components/shared/verified-skill-badge";
import { AdvisingNotesList, CounselorFeedbackItem } from "@/components/shared/advising-notes-list";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  GraduationCap,
  FileText,
  Briefcase,
  MessageSquare,
  Send,
  Loader2,
  Lock,
  User,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Eye,
  Edit3
} from "lucide-react";
import { toast } from "sonner";

interface ProfileDto {
  firstName: string;
  lastName: string;
  cgpa: number;
  institutionalId: string;
  department: string;
  biography: string | null;
  interests: string | null;
  verifiedSkills: string[];
}

interface ResumeDto {
  id: string;
  lastModified: string;
  downloadUrl?: string | null;
  dynamicJsonData?: string | null;
}

interface ApplicationDto {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  submittedAt: string;
  attachedResumeId?: string | null;
}

interface CounselorStudentDetail {
  studentId: string;
  userId: string;
  profile: ProfileDto;
  resumes: ResumeDto[];
  applications: ApplicationDto[];
}

export default function CounselorStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;
  const { accessToken, isLoading: isAuthLoading } = useAuth();

  const [studentDetail, setStudentDetail] = useState<CounselorStudentDetail | null>(null);
  const [feedbackList, setFeedbackList] = useState<CounselorFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Feedback form state
  const [narrativeMarkdown, setNarrativeMarkdown] = useState("");
  const [meetingDate, setMeetingDate] = useState(() => {
    const now = new Date();
    // Default formatted for datetime-local input YYYY-MM-DDTHH:mm
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return localIso;
  });
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const [detailData, feedbackData] = await Promise.all([
          apiClient<CounselorStudentDetail>(`/api/counselor/students/${studentId}`, {
            token: accessToken,
          }),
          apiClient<CounselorFeedbackItem[]>(`/api/counselor/students/${studentId}/feedback`, {
            token: accessToken,
          }),
        ]);

        if (isMounted) {
          setStudentDetail(detailData);
          setFeedbackList(feedbackData || []);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const error = err as { message?: string };
        toast.error(error.message || "Failed to load student details.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [studentId, accessToken, isAuthLoading]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrativeMarkdown.trim()) {
      toast.error("Please enter advising notes or session narrative.");
      return;
    }

    if (narrativeMarkdown.length > 5000) {
      toast.error("Advising narrative cannot exceed 5000 characters.");
      return;
    }

    if (!meetingDate) {
      toast.error("Please select a valid meeting date.");
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      const isoMeetingDate = new Date(meetingDate).toISOString();

      const created = await apiClient<CounselorFeedbackItem>(
        `/api/counselor/students/${studentId}/feedback`,
        {
          method: "POST",
          token: accessToken,
          body: JSON.stringify({
            narrativeMarkdown: narrativeMarkdown.trim(),
            meetingDate: isoMeetingDate,
          }),
        }
      );

      toast.success("Advising session logged successfully!");
      setFeedbackList((prev) => [created, ...prev]);
      setNarrativeMarkdown("");
      setPreviewTab("write");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to submit advising feedback.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <PageContainer className="py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (!studentDetail) {
    return (
      <PageContainer className="py-16 text-center space-y-4">
        <div className="p-3 mx-auto w-fit rounded-full bg-destructive/10 text-destructive">
          <GraduationCap className="size-8" />
        </div>
        <h2 className="font-heading text-xl font-bold">Student Record Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          The requested student could not be located or you do not have permission to view their record.
        </p>
        <Link href="/counselor/students">
          <Button variant="outline" size="sm" className="mt-2">
            <ArrowLeft className="mr-2 size-4" /> Back to Directory
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const { profile, resumes, applications } = studentDetail;
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "Student";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <PageContainer className="py-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Back to directory button */}
      <div>
        <Link
          href="/counselor/students"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="mr-1.5 size-3.5" /> Back to Student Directory
        </Link>
      </div>

      {/* Student Overview Header Card */}
      <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-200 flex items-center justify-center font-heading font-bold text-lg shrink-0">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                    {fullName}
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 text-xs font-semibold"
                  >
                    Verified Student
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Lock className="size-3 text-muted-foreground" /> ID: {profile.institutionalId || "N/A"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="size-3 text-muted-foreground" /> {profile.department || "General"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 text-center min-w-[90px]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-800 dark:text-amber-300">
                  CGPA
                </p>
                <p className="font-mono text-xl font-bold text-amber-900 dark:text-amber-200">
                  {profile.cgpa ? Number(profile.cgpa).toFixed(2) : "0.00"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 text-center min-w-[90px]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-teal-800 dark:text-teal-300">
                  Resumes
                </p>
                <p className="font-mono text-xl font-bold text-teal-900 dark:text-teal-200">
                  {resumes.length}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 text-center min-w-[90px]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-800 dark:text-indigo-300">
                  Applications
                </p>
                <p className="font-mono text-xl font-bold text-indigo-900 dark:text-indigo-200">
                  {applications.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Detail Workspace */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-xl h-10 p-1 bg-slate-100 dark:bg-slate-800/70 border border-border/60 rounded-lg">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 shadow-2xs"
          >
            <User className="size-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger
            value="resumes"
            className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 shadow-2xs"
          >
            <FileText className="size-3.5" /> Resumes ({resumes.length})
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 shadow-2xs"
          >
            <Briefcase className="size-3.5" /> Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger
            value="advising"
            className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 shadow-2xs"
          >
            <MessageSquare className="size-3.5" /> Advising ({feedbackList.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Profile ── */}
        <TabsContent value="profile" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Academic Credentials & Badges */}
            <div className="space-y-6">
              <Card className="border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-teal-600" />
                    <CardTitle className="font-heading text-base">Academic Records</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border/70 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Institutional ID</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      {profile.institutionalId || "N/A"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 space-y-1">
                    <span className="text-[11px] font-medium text-teal-800 dark:text-teal-300">Department</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {profile.department || "Not specified"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 space-y-1">
                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">CGPA</span>
                    <p className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200">
                      {profile.cgpa ? Number(profile.cgpa).toFixed(2) : "0.00"}{" "}
                      <span className="text-xs font-normal text-muted-foreground">/ 4.00</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Verified Skills */}
              <Card className="border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-teal-600" />
                    <CardTitle className="font-heading text-base">Verified Skills</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Skills verified through timed platform assessments (≥ 70% threshold).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.verifiedSkills && profile.verifiedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.verifiedSkills.map((skill) => (
                        <VerifiedSkillBadge key={skill} skillName={skill} size="md" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No verified skill assessments completed yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Biography & Interests */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-teal-600" />
                    <CardTitle className="font-heading text-base">Professional Biography</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.biography ? (
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {profile.biography}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Student has not provided a biography yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-teal-600" />
                    <CardTitle className="font-heading text-base">Interests & Specializations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.interests ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.split(",").map((interest, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        >
                          {interest.trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No specific career interests specified yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: Resumes ── */}
        <TabsContent value="resumes" className="space-y-4 animate-in fade-in duration-300">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base">Resume Versions</CardTitle>
              <CardDescription className="text-xs">
                Resumes crafted or uploaded by the student using the ATS Resume Builder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <FileText className="size-8 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">This student has not created any resumes yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumes.map((resume, index) => {
                    const formattedDate = new Date(resume.lastModified).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={resume.id}
                        className="p-4 rounded-xl border border-border/70 bg-card hover:border-teal-300 dark:hover:border-teal-800 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                            <FileText className="size-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Resume Version #{index + 1}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Last updated: {formattedDate}
                            </p>
                          </div>
                        </div>

                        {resume.downloadUrl && (
                          <a
                            href={resume.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                          >
                            <Eye className="size-3.5" /> View PDF
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: Applications ── */}
        <TabsContent value="applications" className="space-y-4 animate-in fade-in duration-300">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base">Internship & Job Applications</CardTitle>
              <CardDescription className="text-xs">
                History of job postings this student has applied to and current recruitment statuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Briefcase className="size-8 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">This student has not submitted any job applications yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const appliedDate = new Date(app.submittedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={app.id}
                        className="p-4 rounded-xl border border-border/70 bg-card hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {app.jobTitle || "Internship Position"}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                              {app.companyName || "Company"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Applied on {appliedDate}
                          </p>
                        </div>

                        <div>
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold capitalize bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200"
                          >
                            {app.applicationStatus || "Submitted"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Advising Notes & Feedback Logging ── */}
        <TabsContent value="advising" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Feedback Logging Form */}
            <div className="lg:col-span-2">
              <Card className="border-border/70 shadow-sm sticky top-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-teal-600" />
                    <CardTitle className="font-heading text-base">Log Advising Session</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Record one-on-one session feedback, action items, or career guidance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    {/* Meeting Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor="meetingDate" className="text-xs font-medium">
                        Meeting Date & Time
                      </Label>
                      <div className="relative">
                        <Input
                          id="meetingDate"
                          type="datetime-local"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          required
                          className="text-xs h-9"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Can be past (completed session) or future (scheduled).
                      </p>
                    </div>

                    {/* Markdown Feedback Input with Tabs */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="narrative" className="text-xs font-medium">
                          Advising Narrative (Markdown supported)
                        </Label>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={() => setPreviewTab("write")}
                            className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                              previewTab === "write"
                                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Edit3 className="size-3 inline mr-1" /> Write
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewTab("preview")}
                            className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                              previewTab === "preview"
                                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Eye className="size-3 inline mr-1" /> Preview
                          </button>
                        </div>
                      </div>

                      {previewTab === "write" ? (
                        <Textarea
                          id="narrative"
                          rows={8}
                          value={narrativeMarkdown}
                          onChange={(e) => setNarrativeMarkdown(e.target.value)}
                          placeholder="### Advising Notes&#10;- Resume formatting looks solid. Recommended emphasizing Docker projects.&#10;- Target 3 backend internship applications this week."
                          className="text-xs font-mono resize-y"
                          maxLength={5000}
                          required
                        />
                      ) : (
                        <div className="min-h-[160px] p-3 rounded-lg border border-border/80 bg-slate-50/50 dark:bg-slate-900/50 prose prose-sm dark:prose-invert max-w-none text-xs">
                          {narrativeMarkdown.trim() ? (
                            <ReactMarkdown>{narrativeMarkdown}</ReactMarkdown>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Live preview will appear here as you type markdown notes.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-0.5">
                        <span>Markdown syntax enabled</span>
                        <span className={narrativeMarkdown.length > 5000 ? "text-destructive font-bold" : ""}>
                          {narrativeMarkdown.length} / 5000
                        </span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingFeedback || !narrativeMarkdown.trim()}
                      className="w-full bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white text-xs h-9 shadow-sm"
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <Loader2 className="mr-2 size-3.5 animate-spin" /> Saving Session...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 size-3.5" /> Save Advising Session
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Feedback History List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                  Session History ({feedbackList.length})
                </h3>
              </div>

              <AdvisingNotesList
                notes={feedbackList}
                emptyTitle="No Session History"
                emptyMessage="Log your first advising session with this student using the form on the left."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
