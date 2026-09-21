"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Award,
  Loader2,
} from "lucide-react";

/* ────────────────────────────── Types ────────────────────────────── */

interface ChatMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
}

interface InterviewReport {
  accuracySummary: string;
  logicGaps: string[];
  improvementSuggestions: string[];
}

interface MockInterviewSessionDetail {
  sessionId: string;
  role: string;
  jobId: string | null;
  status: string;
  messages: ChatMessage[];
  report: InterviewReport | null;
  createdAt: string;
  completedAt: string | null;
}

/* ────────────────────────────── Page ─────────────────────────────── */

export default function MockInterviewReportPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<MockInterviewSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    if (!sessionId) return;

    let isMounted = true;
    async function loadReport() {
      try {
        const data = await apiClient<MockInterviewSessionDetail>(
          `/api/student/interview-prep/sessions/${sessionId}`,
          {
            token: accessToken,
          }
        );
        if (isMounted) {
          setSession(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load interview report."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [sessionId, accessToken, isAuthLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm text-muted-foreground">Loading coaching report...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !session) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-heading font-semibold">Report Unavailable</h2>
          <p className="text-sm text-muted-foreground">{error || "Interview session not found."}</p>
          <div className="pt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/student/interview-prep/mock")}>
              Back to Mock Interview
            </Button>
            <Button onClick={() => router.push("/student/dashboard")}>Go to Dashboard</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const report = session.report;

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        {/* Header */}
        <div className="text-center space-y-3 pt-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/20 flex items-center justify-center">
            <Award className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Interview Coaching Report</h1>
          <p className="text-muted-foreground">
            Performance breakdown for{" "}
            <span className="font-semibold text-foreground">{session.role}</span>
          </p>
        </div>

        {/* 1. Overall Assessment Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border rounded-xl shadow-sm p-6 space-y-3 border-teal-200/50 dark:border-teal-800/50">
          <div className="flex items-center gap-2.5 text-teal-700 dark:text-teal-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <h2 className="text-lg font-heading font-semibold">Performance Summary</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {report?.accuracySummary ||
              "Session completed. Practice regularly to sharpen response clarity, depth, and technical reasoning."}
          </p>
        </div>

        {/* 2. Logic Gaps & Improvement Areas */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Logic Gaps */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-heading font-semibold">Identified Logic Gaps</h2>
            </div>
            {report?.logicGaps && report.logicGaps.length > 0 ? (
              <ul className="space-y-2.5">
                {report.logicGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No significant logic gaps identified.</p>
            )}
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-teal-700 dark:text-teal-400">
              <Lightbulb className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-heading font-semibold">Actionable Suggestions</h2>
            </div>
            {report?.improvementSuggestions && report.improvementSuggestions.length > 0 ? (
              <ul className="space-y-2.5">
                {report.improvementSuggestions.map((sug, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Continue with standard STAR method prep.</p>
            )}
          </div>
        </div>

        {/* 3. Conversation Transcript Accordion */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTranscript((prev) => !prev)}
            className="w-full flex items-center justify-between p-5 text-left font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <BrainCircuit className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-semibold">View Full Interview Transcript ({session.messages.length} exchanges)</span>
            </div>
            {showTranscript ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showTranscript && (
            <div className="p-5 border-t space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
              {session.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "candidate" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                      msg.role === "interviewer"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-600 text-white"
                    }`}
                  >
                    {msg.role === "interviewer" ? (
                      <Bot className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === "interviewer"
                        ? "bg-white dark:bg-slate-800 border"
                        : "bg-teal-600 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/student/dashboard")}
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push("/student/interview-prep/questions")}
            >
              Browse Questions <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              className="btn-gradient-animate gap-2"
              onClick={() => router.push("/student/interview-prep/mock")}
            >
              <RotateCcw className="w-4 h-4" />
              Retake / New Mock
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
