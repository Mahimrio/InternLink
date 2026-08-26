"use client";

import React, { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { VerifiedSkillBadge } from "@/components/shared/verified-skill-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";

/* ────────────────────────────── Types ────────────────────────────── */

interface QuestionDto {
  questionId: string;
  questionText: string;
  options: string[];
}

interface StartAssessmentData {
  sessionToken: string;
  skillId: string;
  skillName: string;
  domainClassification: string;
  timeLimitSeconds: number;
  questions: QuestionDto[];
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string | null;
}

interface AssessmentResult {
  skillId: string;
  skillName: string;
  score: number;
  percentageScore: number;
  passed: boolean;
  isVerified: boolean;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  earnedDate: string;
  results: QuestionResult[];
}

/* ────────────────────────── Helpers ───────────────────────────────── */

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ────────────────────────── Main Page Component ─────────────────────── */

export default function SkillAssessmentDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const resolvedParams = use(params);
  const skillId = resolvedParams.skillId;

  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Assessment session state
  const [sessionData, setSessionData] = useState<StartAssessmentData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes default
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Use refs in effects to safely pass the latest answers and token into auto-submit interval
  const answersRef = useRef<Record<string, number>>({});
  const sessionTokenRef = useRef<string>("");

  useEffect(() => {
    answersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    if (sessionData?.sessionToken) {
      sessionTokenRef.current = sessionData.sessionToken;
    }
  }, [sessionData?.sessionToken]);

  // Submit assessment callback
  const submitAssessment = useCallback(
    async (isAutoSubmit = false) => {
      const token = sessionTokenRef.current;
      if (!token || !accessToken || isSubmitting) return;

      try {
        setIsSubmitting(true);
        if (isAutoSubmit) {
          toast.warning("Time's up! Automatically submitting your answers...", { duration: 4000 });
        }

        const answersList = (sessionData?.questions || []).map((q) => ({
          questionId: q.questionId,
          selectedOptionIndex:
            answersRef.current[q.questionId] !== undefined ? answersRef.current[q.questionId] : -1,
        }));

        const res = await apiClient<AssessmentResult>("/api/student/assessments/submit", {
          method: "POST",
          token: accessToken,
          body: JSON.stringify({
            sessionToken: token,
            answers: answersList,
          }),
        });

        setResult(res);
        if (res.passed) {
          toast.success(`Assessment Passed! You scored ${res.percentageScore}%!`);
        } else {
          toast.error(`Assessment completed. Score: ${res.percentageScore}% (70% required to verify).`);
        }
      } catch (err: unknown) {
        const errorMsg = (err as Error)?.message || "Failed to submit assessment.";
        toast.error(errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken, isSubmitting, sessionData]
  );

  // Start assessment on mount
  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    let isMounted = true;
    async function startQuiz() {
      try {
        const data = await apiClient<StartAssessmentData>(
          `/api/student/assessments/${skillId}/start`,
          { token: accessToken }
        );
        if (!isMounted) return;

        setSessionData(data);
        setTimeLeft(data.timeLimitSeconds || 600);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = (err as Error)?.message || "Failed to start assessment.";
        toast.error(msg);
        router.push("/student/assessments");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    startQuiz();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, skillId, router]);

  // Countdown timer interval
  useEffect(() => {
    if (!sessionData || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitAssessment(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionData, result, submitAssessment]);

  // Handle option selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result) return; // Prevent edits after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleRetake = () => {
    setResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setIsLoading(true);

    // Re-fetch a fresh session
    apiClient<StartAssessmentData>(`/api/student/assessments/${skillId}/start`, {
      token: accessToken,
    })
      .then((data) => {
        setSessionData(data);
        setTimeLeft(data.timeLimitSeconds || 600);
      })
      .catch((err) => {
        toast.error((err as Error)?.message || "Failed to restart assessment.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  /* ────────────────────────── Loading State ───────────────────────── */

  if (isLoading || isAuthLoading) {
    return (
      <PageContainer className="py-8 space-y-6 max-w-3xl">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  /* ────────────────────────── Results View ───────────────────────── */

  if (result) {
    return (
      <PageContainer className="py-8 space-y-7 max-w-3xl">
        {/* Navigation back */}
        <Link
          href="/student/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to all assessments
        </Link>

        {/* Hero Result Card */}
        <div
          className={`rounded-3xl p-6 sm:p-8 space-y-5 relative overflow-hidden border ${
            result.passed
              ? "glass-hero border-teal-300 dark:border-teal-700"
              : "glass-card-amber border-amber-300 dark:border-amber-700"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Assessment Results
                </span>
                {result.isVerified && <VerifiedSkillBadge isVerified={true} size="sm" />}
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {result.skillName} Assessment
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Completed in {Math.floor(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}s
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="flex sm:flex-col items-center justify-center p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
              <span className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-teal-700 dark:text-teal-400 tabular-nums">
                {result.percentageScore}%
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {result.correctCount} of {result.totalQuestions} Correct
              </span>
            </div>
          </div>

          {/* Pass / Fail Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              result.passed
                ? "bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200"
                : "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            }`}
          >
            {result.passed ? (
              <ShieldCheck className="size-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              {result.passed ? (
                <div>
                  <p className="font-bold text-sm text-teal-800 dark:text-teal-200">
                    Skill Verified!
                  </p>
                  <p className="mt-0.5 text-teal-700/90 dark:text-teal-300/90">
                    You surpassed the 70% passing threshold. The <strong>Verified {result.skillName}</strong> badge is now linked to your profile and visible to recruiters.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-sm text-amber-800 dark:text-amber-200">
                    Did Not Pass (70% Required)
                  </p>
                  <p className="mt-0.5 text-amber-700/90 dark:text-amber-300/90">
                    You answered {result.correctCount} out of {result.totalQuestions} questions correctly. Review the correct solutions below and retake the assessment when ready.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleRetake}
              variant="outline"
              size="sm"
              className="text-xs font-semibold border-slate-300 dark:border-slate-700"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Retake Assessment
            </Button>
            <Link href="/student/profile">
              <Button size="sm" className="btn-gradient-animate text-white text-xs font-semibold">
                View on My Profile
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Question Review Section ── */}
        <div className="space-y-4 pt-2">
          <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="size-4 text-teal-600" />
            Question Breakdown & Explanations
          </h2>

          <div className="space-y-4">
            {result.results.map((q, idx) => {
              return (
                <div
                  key={q.questionId}
                  className={`rounded-2xl p-5 border transition-all ${
                    q.isCorrect
                      ? "bg-white/80 dark:bg-slate-900/80 border-teal-200 dark:border-teal-900/60"
                      : "bg-white/80 dark:bg-slate-900/80 border-rose-200 dark:border-rose-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-heading font-semibold text-sm text-slate-900 dark:text-white">
                        {q.questionText}
                      </span>
                    </div>

                    {q.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 shrink-0">
                        <CheckCircle2 className="size-3 text-teal-600" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 shrink-0">
                        <XCircle className="size-3 text-rose-600" /> Incorrect
                      </span>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 mt-3">
                    {q.options.map((opt, optIdx) => {
                      const isUserChoice = q.selectedOptionIndex === optIdx;
                      const isCorrectChoice = q.correctOptionIndex === optIdx;

                      let optStyle = "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40";
                      if (isCorrectChoice) {
                        optStyle = "border-teal-500 bg-teal-50/80 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-semibold";
                      } else if (isUserChoice && !q.isCorrect) {
                        optStyle = "border-rose-400 bg-rose-50/80 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 line-through opacity-80";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="size-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isCorrectChoice && (
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1 shrink-0">
                              <Check className="size-3" /> Correct Answer
                            </span>
                          )}
                          {isUserChoice && !q.isCorrect && (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1 shrink-0">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  {q.explanation && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2">
                      <HelpCircle className="size-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">Explanation: </strong>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ────────────────────────── Quiz Active View ───────────────────────── */

  if (!sessionData || sessionData.questions.length === 0) {
    return (
      <PageContainer className="py-12 text-center space-y-4 max-w-lg">
        <p className="text-sm text-slate-500">No questions available for this skill.</p>
        <Link href="/student/assessments">
          <Button variant="outline" size="sm">
            Back to Assessments
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const currentQ = sessionData.questions[currentQuestionIdx];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isUrgent = timeLeft < 60;
  const isWarning = timeLeft < 120 && !isUrgent;

  return (
    <PageContainer className="py-8 space-y-6 max-w-3xl">
      {/* Top Floating Control Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 sticky top-20 z-20 shadow-md backdrop-blur-md">
        <div>
          <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
            Timed Assessment
          </span>
          <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white truncate">
            {sessionData.skillName}
          </h2>
        </div>

        {/* ── Timer Badge ── */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-all ${
            isUrgent
              ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30 animate-pulse"
              : isWarning
              ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200"
              : "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800"
          }`}
        >
          <Clock className={`size-4 ${isUrgent ? "text-white" : "text-teal-600 dark:text-teal-400"}`} />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => submitAssessment(false)}
          disabled={isSubmitting}
          size="sm"
          className="btn-gradient-animate text-white text-xs font-semibold shadow-sm shadow-teal-600/20"
        >
          {isSubmitting ? "Submitting..." : "Finish & Submit"}
        </Button>
      </div>

      {/* Progress Bar & Question Counter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Question <strong>{currentQuestionIdx + 1}</strong> of {sessionData.questions.length}
          </span>
          <span>{answeredCount} of {sessionData.questions.length} Answered</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIdx + 1) / sessionData.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* ── Question Card ── */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200/80 dark:border-slate-800">
        <div className="space-y-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60">
            Question #{currentQuestionIdx + 1}
          </span>
          <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
            {currentQ.questionText}
          </h3>
        </div>

        {/* Radio Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedAnswers[currentQ.questionId] === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(currentQ.questionId, idx)}
                className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium transition-all duration-200 border flex items-center justify-between gap-3 group ${
                  isSelected
                    ? "bg-teal-50/90 dark:bg-teal-950/50 border-teal-600 dark:border-teal-500 text-teal-950 dark:text-teal-100 shadow-sm shadow-teal-500/10"
                    : "bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-6 rounded-full border flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                      isSelected
                        ? "bg-teal-600 text-white border-teal-600"
                        : "border-slate-300 dark:border-slate-700 text-slate-500 group-hover:border-teal-400"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="leading-relaxed">{opt}</span>
                </div>

                <div
                  className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {isSelected && <Check className="size-3" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Navigation Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
            className="text-xs"
          >
            <ChevronLeft className="size-4 mr-1" />
            Previous
          </Button>

          {/* Quick jump dots */}
          <div className="flex items-center gap-1.5">
            {sessionData.questions.map((q, i) => {
              const isAns = selectedAnswers[q.questionId] !== undefined;
              const isCurr = i === currentQuestionIdx;
              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => setCurrentQuestionIdx(i)}
                  className={`size-2.5 rounded-full transition-all ${
                    isCurr
                      ? "bg-teal-600 ring-2 ring-teal-400/40 scale-125"
                      : isAns
                      ? "bg-teal-400 dark:bg-teal-700"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              );
            })}
          </div>

          {currentQuestionIdx < sessionData.questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() =>
                setCurrentQuestionIdx((prev) =>
                  Math.min(sessionData.questions.length - 1, prev + 1)
                )
              }
              className="text-xs btn-gradient-animate text-white"
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => submitAssessment(false)}
              disabled={isSubmitting}
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            >
              {isSubmitting ? "Submitting..." : "Submit All"}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
