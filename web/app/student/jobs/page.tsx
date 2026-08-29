"use client";

import React, { Suspense, useEffect, useMemo, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Filter,
  X,
  Briefcase
} from "lucide-react";

/* ────────────────────────────── Types ────────────────────────────── */

interface JobSkillDto {
  skillName: string;
  requiredImportanceWeight: number;
  weight: number;
}

interface JobDto {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  coreDescription: string;
  selectionCriteria: string;
  locationType: string;
  deadLine: string;
  hasApplied: boolean;
  requiredSkills: JobSkillDto[];
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface RecommendationInfo {
  matchPercentage: number;
  reason: string;
}

interface JobRecommendationDto {
  job: JobDto;
  matchPercentage: number;
  reason: string;
}

/* ────────────────────────── Helpers ───────────────────────────────── */

function formatRelativeDeadline(deadlineStr: string): { text: string; isUrgent: boolean } {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: "Expired", isUrgent: true };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 48) {
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return { text: `Closes in ${diffMinutes}m`, isUrgent: true };
    }
    return { text: `Closes in ${diffHours}h`, isUrgent: true };
  }

  if (diffDays === 1) {
    return { text: "Closes tomorrow", isUrgent: true };
  }

  return { text: `Closes in ${diffDays} days`, isUrgent: false };
}

function getLocationBadgeStyle(locationType: string) {
  switch (locationType?.toLowerCase()) {
    case "remote":
      return "bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800";
    case "hybrid":
      return "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "onsite":
      return "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
  }
}

function getMatchBadgeStyle(pct: number) {
  if (pct >= 75)
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
  if (pct >= 50)
    return "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  return "bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700";
}

/* ───────────────────── Inner Content Component ─────────────────────── */

function JobDiscoveryContent() {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // URL state parameters
  const initialKeyword = searchParams.get("keyword") || "";
  const initialLocation = searchParams.get("locationType") || "";
  const initialRelevant = searchParams.get("relevantToMe") === "true";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [keywordInput, setKeywordInput] = useState(initialKeyword);
  const [locationType, setLocationType] = useState(initialLocation);
  const [relevantToMe, setRelevantToMe] = useState(initialRelevant);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [pagedData, setPagedData] = useState<PagedResult<JobDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showRecommended, setShowRecommended] = useState(false);
  const [recommendations, setRecommendations] = useState<Map<string, RecommendationInfo> | null>(null);
  // Loading is derived, not stored: recs are "loading" whenever the toggle is on but nothing arrived yet.
  const isLoadingRecs = showRecommended && recommendations === null;

  // The recommendation call is slower than the job list (AI-ranked) — fetch it
  // separately so badges resolve in place instead of blocking the list render.
  useEffect(() => {
    if (!showRecommended || !accessToken || recommendations !== null) return;
    let isMounted = true;
    apiClient<JobRecommendationDto[]>("/api/student/jobs/recommended", { token: accessToken })
      .then((items) => {
        if (!isMounted) return;
        setRecommendations(
          new Map(items.map((r) => [r.job.id, { matchPercentage: r.matchPercentage, reason: r.reason }]))
        );
      })
      .catch(() => {
        if (isMounted) setRecommendations(new Map());
      });
    return () => {
      isMounted = false;
    };
  }, [showRecommended, accessToken, recommendations]);

  // Sync state to URL search parameters
  const updateUrlParams = useCallback(
    (kw: string, loc: string, rel: boolean, pg: number) => {
      const params = new URLSearchParams();
      if (kw.trim()) params.set("keyword", kw.trim());
      if (loc) params.set("locationType", loc);
      if (rel) params.set("relevantToMe", "true");
      if (pg > 1) params.set("page", pg.toString());

      const queryStr = params.toString();
      startTransition(() => {
        router.push(queryStr ? `${pathname}?${queryStr}` : pathname, { scroll: false });
      });
    },
    [pathname, router]
  );

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (keywordInput.trim()) params.set("keyword", keywordInput.trim());
      if (locationType) params.set("locationType", locationType);
      if (relevantToMe) params.set("relevantToMe", "true");
      params.set("page", currentPage.toString());
      params.set("pageSize", "12");

      const res = await apiClient<PagedResult<JobDto>>(
        `/api/student/jobs?${params.toString()}`,
        { token: accessToken }
      );
      setPagedData(res);
    } catch {
      // Graceful error handling
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, keywordInput, locationType, relevantToMe, currentPage]);

  // Debounced search for keyword
  useEffect(() => {
    const handler = setTimeout(() => {
      updateUrlParams(keywordInput, locationType, relevantToMe, currentPage);
      fetchJobs();
    }, 300);

    return () => clearTimeout(handler);
  }, [keywordInput, locationType, relevantToMe, currentPage, updateUrlParams, fetchJobs]);

  const handleClearFilters = () => {
    setKeywordInput("");
    setLocationType("");
    setRelevantToMe(false);
    setCurrentPage(1);
    updateUrlParams("", "", false, 1);
  };

  const totalPages = pagedData ? Math.ceil(pagedData.totalCount / pagedData.pageSize) : 1;

  // With recommendations active, ranked jobs float to the top, sorted by match percentage.
  const displayItems = useMemo(() => {
    if (!pagedData) return [];
    if (!showRecommended || !recommendations) return pagedData.items;
    return [...pagedData.items].sort(
      (a, b) =>
        (recommendations.get(b.id)?.matchPercentage ?? -1) - (recommendations.get(a.id)?.matchPercentage ?? -1)
    );
  }, [pagedData, showRecommended, recommendations]);

  return (
    <PageContainer className="py-8 space-y-7">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 mb-2">
            <Briefcase className="size-3.5" />
            Job Discovery
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Explore Internships
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover verified campus internship opportunities tailored to your skills and major.
          </p>
        </div>

        {pagedData && (
          <div className="text-right">
            <span className="font-heading text-xl font-bold text-teal-700 dark:text-teal-400 tabular-nums">
              {pagedData.totalCount}
            </span>
            <p className="text-xs text-slate-400">Available openings</p>
          </div>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={keywordInput}
              onChange={(e) => {
                setKeywordInput(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, keywords, or technologies..."
              className="pl-10 pr-9 h-10 bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80 focus-visible:ring-teal-500 text-sm"
            />
            {keywordInput && (
              <button
                type="button"
                onClick={() => {
                  setKeywordInput("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Location Type Select */}
          <div className="sm:col-span-3">
            <select
              value={locationType}
              onChange={(e) => {
                setLocationType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="OnSite">On-Site</option>
            </select>
          </div>

          {/* Relevant to me Toggle */}
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => {
                setRelevantToMe(!relevantToMe);
                setCurrentPage(1);
              }}
              className={`w-full h-10 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 border ${
                relevantToMe
                  ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20"
                  : "bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-teal-400"
              }`}
            >
              <Sparkles className={`size-3.5 ${relevantToMe ? "text-amber-300" : "text-slate-400"}`} />
              Matched to My Skills
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(keywordInput || locationType || relevantToMe) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="size-3" /> Filters:
            </span>
            {keywordInput && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Keyword: &quot;{keywordInput}&quot;
                <button type="button" onClick={() => setKeywordInput("")} className="hover:text-rose-500">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {locationType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Location: {locationType}
                <button type="button" onClick={() => setLocationType("")} className="hover:text-rose-500">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {relevantToMe && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Matched to My Skills
                <button type="button" onClick={() => setRelevantToMe(false)} className="hover:text-rose-500">
                  <X className="size-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Recommended for You ── */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-amber-200/40 dark:border-amber-800/30">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold text-slate-900 dark:text-white">Recommended for You</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isLoadingRecs
                ? "Ranking open roles against your skills, interests and CGPA…"
                : "AI-ranked matches based on your skills, interests and CGPA."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showRecommended ? "default" : "outline"}
          onClick={() => setShowRecommended(!showRecommended)}
          className={`shrink-0 gap-1.5 text-xs font-semibold ${
            showRecommended ? "btn-gradient-animate text-white shadow-sm" : ""
          }`}
        >
          <Sparkles className="size-3.5" />
          {showRecommended ? "Hide matches" : "Show matches"}
        </Button>
      </div>

      {/* ── Job Cards Grid ── */}
      {isLoading || isAuthLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <div className="flex gap-1.5 pt-2">
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : !pagedData || pagedData.items.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="size-8" />
          </div>
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-slate-200">
            No internships match your criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Try adjusting your search terms or clearing your location and skill match filters.
          </p>
          <Button onClick={handleClearFilters} variant="outline" size="sm" className="mt-2">
            Reset all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayItems.map((job) => {
            const deadlineInfo = formatRelativeDeadline(job.deadLine);
            const locationStyle = getLocationBadgeStyle(job.locationType);
            const rec = showRecommended ? recommendations?.get(job.id) : undefined;

            return (
              <div
                key={job.id}
                className="group glass-card-teal rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  {/* Top row badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${locationStyle}`}
                    >
                      <MapPin className="size-3" />
                      {job.locationType}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        deadlineInfo.isUrgent
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {deadlineInfo.isUrgent ? (
                        <AlertTriangle className="size-3 text-rose-500" />
                      ) : (
                        <Clock className="size-3" />
                      )}
                      {deadlineInfo.text}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors leading-snug line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <Building2 className="size-3.5 text-teal-600 shrink-0" />
                      <span className="font-medium truncate">{job.companyName}</span>
                    </p>
                  </div>

                  {/* AI match badge — skeleton while recommendations are in flight, resolves in place */}
                  {showRecommended && isLoadingRecs && (
                    <Skeleton className="h-5 w-24 rounded-md" />
                  )}
                  {rec && (
                    <div className="space-y-1 animate-in fade-in duration-500">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border tabular-nums ${getMatchBadgeStyle(rec.matchPercentage)}`}
                      >
                        <Sparkles className="size-3" />
                        {rec.matchPercentage}% match
                      </span>
                      <p className="text-[11px] italic text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {rec.reason}
                      </p>
                    </div>
                  )}

                  {/* Description preview */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {job.coreDescription}
                  </p>

                  {/* Required Skills */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="size-3" /> Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills.slice(0, 4).map((sk) => (
                          <span
                            key={sk.skillName}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100/90 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                          >
                            {sk.skillName}
                          </span>
                        ))}
                        {job.requiredSkills.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-medium self-center">
                            +{job.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between gap-3">
                  {job.hasApplied ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                      <CheckCircle2 className="size-4 text-teal-500" />
                      Applied
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not applied yet</span>
                  )}

                  <Link href={`/student/jobs/${job.id}`}>
                    <Button
                      size="sm"
                      className="h-8 text-xs font-semibold btn-gradient-animate text-white shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      View Details
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination Controls ── */}
      {pagedData && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing page <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span> ({pagedData.totalCount} total)
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const nextP = Math.max(1, currentPage - 1);
                setCurrentPage(nextP);
                updateUrlParams(keywordInput, locationType, relevantToMe, nextP);
              }}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentPage(p);
                  updateUrlParams(keywordInput, locationType, relevantToMe, p);
                }}
                className={`h-8 w-8 p-0 text-xs font-semibold ${
                  p === currentPage ? "btn-gradient-animate text-white" : ""
                }`}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const nextP = Math.min(totalPages, currentPage + 1);
                setCurrentPage(nextP);
                updateUrlParams(keywordInput, locationType, relevantToMe, nextP);
              }}
              className="h-8 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

/* ────────────────────────── Main Export with Suspense ───────────────────────── */

export default function StudentJobsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-8 space-y-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-64 rounded-2xl" />
            ))}
          </div>
        </PageContainer>
      }
    >
      <JobDiscoveryContent />
    </Suspense>
  );
}
