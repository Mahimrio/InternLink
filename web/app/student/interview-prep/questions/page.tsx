"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  BrainCircuit,
  Code2,
  Users,
  MessageSquare,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

/* ────────────────────────────── Types ────────────────────────────── */

interface InterviewQuestion {
  questionText: string;
  category: string;
}

interface QuestionsResponse {
  questions: InterviewQuestion[];
}

/* ────────────────────────────── Constants ────────────────────────── */

const CATEGORIES = ["All", "Technical", "Situational", "HR"] as const;
type Category = (typeof CATEGORIES)[number];

function getCategoryStyle(category: string) {
  switch (category.toLowerCase()) {
    case "technical":
      return "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800";
    case "situational":
      return "bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "hr":
      return "bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
  }
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "technical":
      return <Code2 className="w-4 h-4" />;
    case "situational":
      return <Users className="w-4 h-4" />;
    case "hr":
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <Lightbulb className="w-4 h-4" />;
  }
}

/* ────────────────────────────── Page ─────────────────────────────── */

export default function InterviewQuestionsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const generateQuestions = useCallback(async () => {
    if (!role.trim() || !accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient<QuestionsResponse>(
        "/api/student/interview-prep/questions",
        {
          method: "POST",
          body: JSON.stringify({ role: role.trim(), jobId: null }),
          token: accessToken,
        }
      );
      setQuestions(data.questions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate questions."
      );
    } finally {
      setIsLoading(false);
    }
  }, [role, accessToken]);

  const filteredQuestions = useMemo(() => {
    if (activeCategory === "All") return questions;
    return questions.filter(
      (q) => q.category.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [questions, activeCategory]);

  const handleCopy = useCallback(
    async (text: string, idx: number) => {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    },
    []
  );

  return (
    <PageContainer>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/20">
              <BrainCircuit className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold tracking-tight">
                Interview Question Bank
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-generated questions tailored to your target role and skills
              </p>
            </div>
          </div>
        </div>

        {/* Role Input */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border rounded-xl p-6 shadow-sm">
          <label
            htmlFor="role-input"
            className="block text-sm font-medium mb-2"
          >
            Target Role
          </label>
          <div className="flex gap-3">
            <Input
              id="role-input"
              placeholder="e.g. Frontend Engineer, Data Analyst, ML Intern..."
              value={role}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRole(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") generateQuestions();
              }}
              className="flex-1"
            />
            <Button
              onClick={generateQuestions}
              disabled={isLoading || !role.trim()}
              className="btn-gradient-animate gap-2 min-w-[160px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isLoading ? "Generating..." : "Generate Questions"}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Quick Start Banner */}
        {questions.length === 0 && !isLoading && (
          <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-teal-50 to-amber-50/50 dark:from-teal-950/30 dark:to-amber-950/20 border border-teal-200/50 dark:border-teal-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Want to practice with a live interviewer?{" "}
                <span className="font-medium text-foreground">
                  Try the Mock Interview Chatbot
                </span>{" "}
                for a real conversational experience.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => router.push("/student/interview-prep/mock")}
            >
              Start Mock <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Category Tabs */}
        {questions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const count =
                cat === "All"
                  ? questions.length
                  : questions.filter(
                      (q) =>
                        q.category.toLowerCase() === cat.toLowerCase()
                    ).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-white/80 dark:bg-slate-800/80 border hover:bg-slate-50 dark:hover:bg-slate-700/80"
                  }`}
                >
                  {cat}{" "}
                  <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/80 dark:bg-slate-900/80 border rounded-xl p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {/* Question Cards */}
        {!isLoading && filteredQuestions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredQuestions.map((q, idx) => (
              <div
                key={idx}
                className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border rounded-xl p-5 shadow-sm
                  hover:shadow-md hover:border-teal-300/50 dark:hover:border-teal-700/50 transition-all duration-300
                  animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getCategoryStyle(
                      q.category
                    )}`}
                  >
                    {getCategoryIcon(q.category)}
                    {q.category}
                  </span>
                  <button
                    onClick={() => handleCopy(q.questionText, idx)}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    title="Copy question"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-sm leading-relaxed">{q.questionText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
