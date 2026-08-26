"use client";

import React, { useEffect, useState } from "react";
import Link from "next/navigation";
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
  ExternalLink,
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

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<ResumeDto[]>("/api/student/resumes", {
        token: accessToken,
      });
      setResumes(data || []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to load resumes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchResumes();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
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
            You haven't created a resume yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Build your first tailored resume using our step-by-step wizard. We'll automatically format it, link your skills, and generate an ATS-compatible PDF.
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
              // Ignore
            }

            return (
              <Card
                key={resume.id}
                className="border-border/70 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                      <FileCheck2 className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono border-teal-200 text-teal-800 dark:border-teal-800 dark:text-teal-300">
                      Draft #{idx + 1}
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-lg mt-3">
                    ATS Resume
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    Modified {formatDate(resume.lastModified)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="size-3 text-teal-600" />
                      Skills Linked:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {skillCount > 0 ? `${skillCount} skills` : "Pending skills"}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t flex items-center gap-2">
                  <NextLink href={`/student/resumes/builder?resumeId=${resume.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit3 className="size-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </NextLink>

                  {resume.downloadUrl ? (
                    <a
                      href={resume.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        PDF
                      </Button>
                    </a>
                  ) : (
                    <NextLink href={`/student/resumes/builder?resumeId=${resume.id}`} className="flex-1">
                      <Button size="sm" variant="secondary" className="w-full">
                        Finalize
                      </Button>
                    </NextLink>
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
