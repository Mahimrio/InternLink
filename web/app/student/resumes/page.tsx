"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Plus,
  Calendar,
  Edit3,
  FileCheck2,
  Sparkles,
  Layers
} from "lucide-react";

interface ResumeDto {
  id: string;
  lastModified: string;
  downloadUrl: string | null;
  dynamicJsonData: string | null;
}

export default function StudentResumesPage() {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const [resumes, setResumes] = useState<ResumeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    let isMounted = true;
    async function load() {
      try {
        const data = await apiClient<ResumeDto[]>("/api/student/resumes", {
          token: accessToken,
        });
        if (isMounted) setResumes(data || []);
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (isMounted) toast.error(error.message || "Failed to load resumes");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <PageContainer className="py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Resumes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your ATS-ready resumes and download official QuestPDF documents.
          </p>
        </div>

        <NextLink href="/student/resumes/builder">
          <Button className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white shadow-sm">
            <Plus className="size-4 mr-1.5" />
            New Resume
          </Button>
        </NextLink>
      </div>

      {/* Empty State */}
      {resumes.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 mb-4 shadow-sm">
            <FileText className="size-8" />
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-2">
            You haven&apos;t created a resume yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Build your first tailored resume using our step-by-step wizard. We&apos;ll automatically format it, link your skills, and generate an ATS-compatible PDF.
          </p>
          <NextLink href="/student/resumes/builder">
            <Button className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white px-6">
              <Sparkles className="size-4 mr-2 text-amber-300" />
              Start Building Now
            </Button>
          </NextLink>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume, idx) => {
            let skillCount = 0;
            try {
              if (resume.dynamicJsonData) {
                const parsed = JSON.parse(resume.dynamicJsonData);
                if (parsed.skills && Array.isArray(parsed.skills)) {
                  skillCount = parsed.skills.length;
                }
              }
            } catch {
              // Ignore json parse error
            }

            return (
              <Card
                key={resume.id}
                className="group relative overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Top decorative line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-teal-700" />

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileCheck2 className="size-4 text-teal-600 dark:text-teal-400" />
                      Resume #{idx + 1}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-semibold border-teal-200/50">
                      ATS Verified
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                    <Calendar className="size-3 text-slate-400" />
                    Updated {formatDate(resume.lastModified)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Layers className="size-3.5 text-teal-600" />
                    <span>{skillCount} Skills included</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 flex items-center gap-2">
                  <NextLink href={`/student/resumes/builder?resumeId=${resume.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Edit3 className="size-3.5 mr-1.5 text-teal-600" />
                      Edit Draft
                    </Button>
                  </NextLink>

                  <NextLink href={`/student/resumes/${resume.id}/analyze`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold border-amber-300/60 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10">
                      <Sparkles className="size-3.5 mr-1.5" />
                      Analyze
                    </Button>
                  </NextLink>

                  {resume.downloadUrl ? (
                    <a
                      href={resume.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                        <Download className="size-3.5 mr-1.5" />
                        PDF
                      </Button>
                    </a>
                  ) : (
                    <Button disabled size="sm" variant="ghost" className="flex-1 text-xs text-slate-400">
                      Draft Only
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
