"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PageContainer } from "@/components/shared/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Briefcase, Building2, CalendarClock, ClipboardList, Plus, Users } from "lucide-react";

const stats = [
  { label: "Active Jobs", value: "0", icon: Briefcase, tile: "bg-primary/10 text-primary", valueColor: "text-primary" },
  { label: "Total Applicants", value: "0", icon: Users, tile: "bg-primary/10 text-primary", valueColor: "text-primary" },
  { label: "Interviews Scheduled", value: "0", icon: CalendarClock, tile: "bg-amber-500/10 text-amber-600", valueColor: "text-amber-600" },
];

const actions = [
  { title: "Post a Job", description: "Publish a new internship", href: "/company/jobs/new", icon: Plus },
  { title: "Manage Jobs", description: "Edit or close your postings", href: "/company/jobs", icon: Briefcase },
  { title: "ATS Pipeline", description: "Screen and track applicants", href: "/company/ats", icon: ClipboardList },
  { title: "Company Profile", description: "Keep your details current", href: "/company/profile", icon: Building2 },
];

const delays = ["", "delay-100", "delay-200", "delay-300"];

export default function CompanyDashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  const displayName = user.name || user.unique_name || user.email || "Company";

  return (
    <PageContainer>
      <div className="flex flex-col gap-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {displayName}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage your job postings, review applicants in the ATS pipeline, and update your profile.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`animate-in fade-in slide-in-from-bottom-4 animation-duration-[700ms] fill-mode-[backwards] ${delays[i]} group rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10`}
            >
              <div className={`flex size-11 items-center justify-center rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110 ${stat.tile}`}>
                <stat.icon className="size-5" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className={`mt-1 font-heading text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action, i) => (
              <Link
                key={action.title}
                href={action.href}
                className={`animate-in fade-in slide-in-from-bottom-4 animation-duration-[700ms] fill-mode-[backwards] ${delays[i]} group flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <action.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
