"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { VerifiedSkillBadge } from "@/components/shared/verified-skill-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  Search,
  Clock,
  ArrowRight,
  Sparkles,
  RotateCcw
} from "lucide-react";

/* ────────────────────────────── Types ────────────────────────────── */

interface AssessmentSkill {
  skillId: string;
  skillName: string;
  domainClassification: string;
  bestScore: number | null;
  attemptsCount: number;
  isVerified: boolean;
  lastAttemptDate: string | null;
}

/* ────────────────────────── Helpers ───────────────────────────────── */

function getDomainBadgeStyle(domain: string) {
  switch (domain?.toLowerCase()) {
    case "backend":
      return "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800";
    case "frontend":
      return "bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "devops":
      return "bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "softskills":
      return "bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
  }
}

/* ────────────────────────── Page Component ───────────────────────── */

export default function StudentAssessmentsPage() {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const [skills, setSkills] = useState<AssessmentSkill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    let isMounted = true;
    async function loadSkills() {
      try {
        const data = await apiClient<AssessmentSkill[]>("/api/student/assessments/skills", {
          token: accessToken,
        });
        if (isMounted) {
          setSkills(data || []);
        }
      } catch {
        // Graceful error handling
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSkills();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading]);

  // Derived stats
  const totalSkills = skills.length;
  const verifiedCount = skills.filter((s) => s.isVerified).length;

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch = s.skillName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesDomain =
        selectedDomain === "All" ||
        s.domainClassification.toLowerCase() === selectedDomain.toLowerCase();
      return matchesSearch && matchesDomain;
    });
  }, [skills, searchQuery, selectedDomain]);

  return (
    <PageContainer className="py-8 space-y-7">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 mb-2">
            <Award className="size-3.5 text-amber-600" />
            Skill Verification
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Timed Skill Assessments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prove your technical proficiencies with 10-minute MCQ challenges and earn verified badges for your profile.
          </p>
        </div>

        {/* Verification Summary Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-heading text-xl font-bold text-teal-700 dark:text-teal-400 tabular-nums">
              {verifiedCount} / {totalSkills}
            </div>
            <p className="text-xs text-slate-400">Verified Skills</p>
          </div>
        </div>
      </div>

      {/* ── Banner Information Card ── */}
      <div className="glass-card-amber rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
          <h2 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            How Skill Verification Works
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <div className="size-6 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">5 Multiple Choice Questions</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Carefully curated questions testing core concepts & industry standards.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="size-6 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">10-Minute Timed Session</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Automated countdown timer with server-side validation.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="size-6 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">≥ 70% Pass Threshold</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Score 4 out of 5 to instantly earn a permanent Verified Skill Badge.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by skill name (e.g. C#, React, Docker)..."
              className="pl-10 h-10 bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80 text-sm"
            />
          </div>

          {/* Domain tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["All", "Backend", "Frontend", "DevOps", "SoftSkills"].map((domain) => {
              const isActive = selectedDomain === domain;
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setSelectedDomain(domain)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                      : "bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-800"
                  }`}
                >
                  {domain === "SoftSkills" ? "Soft Skills" : domain}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Skills Grid ── */}
      {isLoading || isAuthLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3 max-w-md mx-auto">
          <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="size-7" />
          </div>
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-slate-200">
            No matching skills found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try adjusting your search query or switching domain categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill) => {
            const domainStyle = getDomainBadgeStyle(skill.domainClassification);

            return (
              <div
                key={skill.skillId}
                className={`group rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  skill.isVerified
                    ? "glass-card-teal border-teal-300/80 dark:border-teal-700/80"
                    : "glass-card"
                }`}
              >
                <div className="space-y-3">
                  {/* Top row badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${domainStyle}`}>
                      {skill.domainClassification}
                    </span>

                    {skill.isVerified ? (
                      <VerifiedSkillBadge score={skill.bestScore} size="sm" />
                    ) : skill.attemptsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                        <RotateCcw className="size-2.5" /> Best: {skill.bestScore}%
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">Not taken</span>
                    )}
                  </div>

                  {/* Skill Name */}
                  <div>
                    <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                      {skill.skillName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="size-3 text-slate-400" />
                      5 Questions • 10 Minutes
                    </p>
                  </div>
                </div>

                {/* Card Action CTA */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    {skill.attemptsCount > 0 ? `${skill.attemptsCount} attempt${skill.attemptsCount > 1 ? "s" : ""}` : "No attempts"}
                  </div>

                  <Link href={`/student/assessments/${skill.skillId}`}>
                    <Button
                      size="sm"
                      className={`h-8 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        skill.isVerified
                          ? "bg-teal-50 text-teal-800 border border-teal-300 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-700"
                          : "btn-gradient-animate text-white shadow-sm shadow-teal-600/20"
                      }`}
                    >
                      {skill.isVerified ? (
                        <>
                          <RotateCcw className="size-3 mr-1" /> Retake
                        </>
                      ) : skill.attemptsCount > 0 ? (
                        <>
                          <RotateCcw className="size-3 mr-1" /> Try Again
                        </>
                      ) : (
                        <>
                          Start Assessment <ArrowRight className="size-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
