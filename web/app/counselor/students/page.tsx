"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  GraduationCap,
  FileText,
  Briefcase,
  ChevronRight,
  ArrowUpDown,
  X,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";

interface CounselorStudentSummary {
  studentId: string;
  fullName: string;
  cgpa: number;
  department: string;
  institutionalId: string;
  resumeCount: number;
  applicationCount: number;
}

type SortField = "name" | "cgpa" | "department" | "resumes" | "applications";
type SortDirection = "asc" | "desc";

export default function CounselorStudentsDirectoryPage() {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const [students, setStudents] = useState<CounselorStudentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    let isMounted = true;
    async function fetchStudents() {
      try {
        setIsLoading(true);
        const endpoint = debouncedSearch
          ? `/api/counselor/students?search=${encodeURIComponent(debouncedSearch)}`
          : "/api/counselor/students";

        const data = await apiClient<CounselorStudentSummary[]>(endpoint, {
          token: accessToken,
        });

        if (isMounted) {
          setStudents(data || []);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const error = err as { message?: string };
        toast.error(error.message || "Failed to load students directory.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, debouncedSearch]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.fullName.localeCompare(b.fullName);
      } else if (sortField === "cgpa") {
        comparison = Number(a.cgpa) - Number(b.cgpa);
      } else if (sortField === "department") {
        comparison = (a.department || "").localeCompare(b.department || "");
      } else if (sortField === "resumes") {
        comparison = a.resumeCount - b.resumeCount;
      } else if (sortField === "applications") {
        comparison = a.applicationCount - b.applicationCount;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [students, sortField, sortDirection]);

  // Aggregate stats
  const totalStudents = students.length;
  const avgCgpa = useMemo(() => {
    if (totalStudents === 0) return "0.00";
    const sum = students.reduce((acc, curr) => acc + Number(curr.cgpa || 0), 0);
    return (sum / totalStudents).toFixed(2);
  }, [students, totalStudents]);

  const totalApplications = useMemo(() => {
    return students.reduce((acc, curr) => acc + curr.applicationCount, 0);
  }, [students]);

  const totalResumes = useMemo(() => {
    return students.reduce((acc, curr) => acc + curr.resumeCount, 0);
  }, [students]);

  return (
    <PageContainer className="py-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Directory
            </h1>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200">
              <Users className="mr-1 size-3.5" /> Career Advising
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Search, review academic trajectories, and log counseling notes for enrolled students.
          </p>
        </div>
      </div>

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Students Enrolled</p>
              <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? <Skeleton className="h-7 w-12" /> : totalStudents}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Average CGPA</p>
              <div className="font-heading text-2xl font-bold text-amber-700 dark:text-amber-300">
                {isLoading ? <Skeleton className="h-7 w-12" /> : avgCgpa}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Resumes Built</p>
              <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? <Skeleton className="h-7 w-12" /> : totalResumes}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Applications</p>
              <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? <Skeleton className="h-7 w-12" /> : totalApplications}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Main Card */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-lg">Enrolled Students</CardTitle>
              <CardDescription>
                Click any student record to view their detailed academic profile, resumes, applications, and advising history.
              </CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : sortedStudents.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="p-3 mx-auto w-fit rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Users className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No students found
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {debouncedSearch
                    ? `No students matching "${debouncedSearch}". Try a different keyword.`
                    : "There are currently no students registered in the platform."}
                </p>
              </div>
              {debouncedSearch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-xs h-8"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50">
                    <TableHead>
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors"
                      >
                        Student Name
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">Institutional ID</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("department")}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors"
                      >
                        Department
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("cgpa")}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors"
                      >
                        CGPA
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button
                        onClick={() => handleSort("resumes")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors"
                      >
                        Resumes
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button
                        onClick={() => handleSort("applications")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors"
                      >
                        Applications
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => {
                    const initials = student.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "ST";

                    return (
                      <TableRow
                        key={student.studentId}
                        className="hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors group cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/counselor/students/${student.studentId}`}
                            className="flex items-center gap-3 focus:outline-hidden"
                          >
                            <div className="size-8 rounded-full bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-200 flex items-center justify-center font-heading font-semibold text-xs shrink-0">
                              {initials}
                            </div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 transition-colors">
                              {student.fullName}
                            </span>
                          </Link>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {student.institutionalId || "N/A"}
                        </TableCell>

                        <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="size-3 text-muted-foreground" />
                            {student.department || "General"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs font-semibold bg-amber-50/60 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200"
                          >
                            {student.cgpa ? Number(student.cgpa).toFixed(2) : "0.00"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <FileText className="size-3 text-teal-600" />
                            {student.resumeCount}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <Briefcase className="size-3 text-indigo-600" />
                            {student.applicationCount}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <Link href={`/counselor/students/${student.studentId}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-8 text-teal-700 dark:text-teal-300 group-hover:bg-teal-100/50 dark:group-hover:bg-teal-900/50"
                            >
                              Review
                              <ChevronRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
