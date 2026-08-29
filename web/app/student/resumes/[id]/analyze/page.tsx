"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  LayoutList,
  RefreshCw,
  Sparkles,
  SpellCheck,
} from "lucide-react";
import { toast } from "sonner";

/* ────────────────────────────── Types ────────────────────────────── */

interface AtsScore {
  atsScore: number;
  grammarIssues: string[];
  structureCritique: string;
  missingKeywords: string[];
}

interface Suggestion {
  originalText: string;
  suggestedText: string;
  reason: string;
}

interface AnalysisResponse {
  score: AtsScore;
  suggestions: Suggestion[] | null;
}

interface JobItem {
  id: string;
  title: string;
  companyName: string;
}

const GENERAL = "general";

/* ─────────────────────────── Score ring ──────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const stroke = score < 50 ? "stroke-red-500" : score < 75 ? "stroke-amber-500" : "stroke-teal-500";
  const text = score < 50 ? "text-red-500" : score < 75 ? "text-amber-500" : "text-teal-600 dark:text-teal-400";

  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 128 128" className="size-36 -rotate-90">
        <circle cx="64" cy="64" r={radius} strokeWidth="10" className="fill-none stroke-muted" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className={`fill-none transition-[stroke-dashoffset] duration-1000 ease-out ${stroke}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-heading text-4xl font-bold ${text}`}>{score}</span>
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">ATS SCORE</span>
      </div>
    </div>
  );
}

/* ────────────────────── Loading skeleton layout ───────────────────── */

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row">
          <Skeleton className="size-36 rounded-full" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border/60 p-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-2.5 w-40" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────────── Main page ─────────────────────────────── */

export default function AnalyzeResumePage() {
  const { id: resumeId } = useParams<{ id: string }>();
  const { accessToken, isLoading: isAuthLoading } = useAuth();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(GENERAL);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Base UI Select renders raw values unless the root receives `items` (value → label).
  const selectItems = React.useMemo(
    () => [
      { value: GENERAL, label: "General analysis (no target job)" },
      ...jobs.map((job) => ({ value: job.id, label: `${job.title} · ${job.companyName}` })),
    ],
    [jobs]
  );

  useEffect(() => {
    if (!accessToken) return;
    let isMounted = true;
    apiClient<{ items: JobItem[] }>("/api/student/jobs", { token: accessToken })
      .then((data) => {
        if (isMounted) setJobs(data?.items || []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  async function runAnalysis() {
    if (!accessToken || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const query = selectedJobId !== GENERAL ? `?targetJobId=${selectedJobId}` : "";
      const result = await apiClient<AnalysisResponse>(
        `/api/student/resumes/${resumeId}/analyze${query}`,
        { method: "POST", token: accessToken }
      );
      setAnalysis(result);
      if (result.score.atsScore === -1) {
        toast.error("Analysis is temporarily unavailable — please try again.");
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to analyze resume.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const score = analysis?.score;
  const unavailable = score?.atsScore === -1;

  return (
    <PageContainer className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/student/resumes"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to My Resumes
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Analyze My Resume</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get an AI-powered ATS score, or target a specific job for tailored improvement suggestions.
        </p>
      </div>

      {/* Target selector */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-amber-500" />
            Analysis Target
          </CardTitle>
          <CardDescription>
            Choose a job to tailor the suggestions, or run a general analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-sm">
            <Select
              items={selectItems}
              value={selectedJobId}
              onValueChange={(v) => setSelectedJobId((v as string) ?? GENERAL)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="General analysis (no target job)" />
              </SelectTrigger>
              <SelectContent>
                {selectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing || isAuthLoading}
            className="btn-gradient-animate gap-2 text-white shadow-sm"
          >
            {isAnalyzing ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {isAnalyzing ? "Analyzing…" : "Analyze My Resume"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {isAnalyzing && <ResultsSkeleton />}

      {!isAnalyzing && unavailable && (
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <RefreshCw className="size-7" />
          </div>
          <h2 className="font-heading text-xl font-bold">Analysis temporarily unavailable</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The AI service could not complete the analysis. This is usually momentary — please try again.
          </p>
          <Button onClick={runAnalysis} variant="outline" className="mt-6 gap-2">
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </Card>
      )}

      {!isAnalyzing && score && !unavailable && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Score + structure */}
          <Card>
            <CardContent className="flex flex-col items-center gap-8 p-8 sm:flex-row">
              <ScoreRing score={score.atsScore} />
              <div className="flex-1">
                <h2 className="mb-2 flex items-center gap-2 font-heading text-lg font-semibold">
                  <LayoutList className="size-4.5 text-primary" />
                  Structure Critique
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{score.structureCritique}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Grammar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <SpellCheck className="size-4 text-primary" />
                  Grammar Issues
                  <Badge variant="secondary" className="ml-auto">{score.grammarIssues.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {score.grammarIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No grammar issues found — nice work.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {score.grammarIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Missing keywords */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="size-4 text-amber-600" />
                  Missing Keywords
                  <Badge variant="secondary" className="ml-auto">{score.missingKeywords.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {score.missingKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No missing keywords detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {score.missingKeywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Improvement suggestions (targeted) */}
          {analysis?.suggestions && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-amber-500" />
                  Improvement Suggestions
                  <Badge variant="secondary" className="ml-auto">{analysis.suggestions.length}</Badge>
                </CardTitle>
                <CardDescription>Tailored to the selected job — before and after.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No suggestions were generated — try again, or pick a different target job.
                  </p>
                ) : (
                  analysis.suggestions.map((s, i) => (
                    <div key={i} className="rounded-xl border border-border/60 p-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <p className="rounded-lg bg-red-500/5 p-3 text-sm text-muted-foreground line-through decoration-red-400/60">
                          {s.originalText}
                        </p>
                        <ArrowRight className="mx-auto hidden size-4 shrink-0 text-primary md:block" />
                        <p className="rounded-lg bg-teal-500/5 p-3 text-sm font-medium">
                          {s.suggestedText}
                        </p>
                      </div>
                      <p className="mt-2.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/70">Why:</span> {s.reason}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}
