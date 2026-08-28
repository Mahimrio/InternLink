"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Briefcase, ChevronRight, FileText, GraduationCap, Users } from "lucide-react";

interface CounselorStudentSummary {
  studentId: string;
  fullName: string;
  cgpa: number;
  department: string;
  institutionalId: string;
  resumeCount: number;
  applicationCount: number;
}

const delays = ["", "delay-100", "delay-200"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function CounselorDashboardPage() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [students, setStudents] = useState<CounselorStudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      // Defer to avoid synchronous setState inside the effect (react-hooks/set-state-in-effect)
      if (!isAuthLoading) Promise.resolve().then(() => setIsLoading(false));
      return;
    }
    let isMounted = true;
    apiClient<CounselorStudentSummary[]>("/api/counselor/students", { token: accessToken })
      .then((data) => {
        if (isMounted) setStudents(data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading]);

  if (isAuthLoading || !user) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  const displayName = user.name || user.unique_name || user.email || "Counselor";
  const totalApplications = students.reduce((sum, s) => sum + s.applicationCount, 0);
  const totalResumes = students.reduce((sum, s) => sum + s.resumeCount, 0);

  const stats = [
    { label: "Total Students", value: students.length, icon: Users, tile: "bg-primary/10 text-primary", valueColor: "text-primary" },
    { label: "Applications Tracked", value: totalApplications, icon: Briefcase, tile: "bg-primary/10 text-primary", valueColor: "text-primary" },
    { label: "Resumes on File", value: totalResumes, icon: FileText, tile: "bg-amber-500/10 text-amber-600", valueColor: "text-amber-600" },
  ];

  const topStudents = [...students]
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 5);

  return (
    <PageContainer>
      <div className="flex flex-col gap-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {displayName}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Review student profiles and provide feedback on their applications and resumes.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`animate-in fade-in slide-in-from-bottom-4 animation-duration-[700ms] fill-mode-[backwards] ${delays[i]} group rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10`}
            >
              <div className={`flex size-11 items-center justify-center rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110 ${stat.tile}`}>
                <stat.icon className="size-5" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">{stat.label}</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-8 w-14" />
              ) : (
                <p className={`mt-1 font-heading text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 animation-duration-[700ms] fill-mode-[backwards] delay-300 overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">Students at a glance</h2>
              <p className="text-xs text-muted-foreground">Most active by applications</p>
            </div>
            <Link href="/counselor/students" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))
            ) : topStudents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <Users className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No students registered yet</p>
                <p className="text-xs text-muted-foreground">Students will appear here once they sign up.</p>
              </div>
            ) : (
              topStudents.map((student) => (
                <Link
                  key={student.studentId}
                  href={`/counselor/students/${student.studentId}`}
                  className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                      {initialsOf(student.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">{student.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{student.department || "No department"}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <Badge variant="secondary" className="hidden gap-1 sm:inline-flex">
                      <GraduationCap className="size-3" />
                      {student.cgpa.toFixed(2)}
                    </Badge>
                    <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
                      <span className="flex items-center gap-1" title="Resumes">
                        <FileText className="size-3.5" />
                        {student.resumeCount}
                      </span>
                      <span className="flex items-center gap-1" title="Applications">
                        <Briefcase className="size-3.5" />
                        {student.applicationCount}
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
