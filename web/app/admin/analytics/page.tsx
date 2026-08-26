"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GraduationCap, Building2, Briefcase, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { AdminAnalytics, STATUS_CHART_COLORS, CHART_PRIMARY } from "@/lib/admin";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STAT_ICONS = { GraduationCap, Building2, Briefcase, FileText };

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof STAT_ICONS;
  accent: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  const Icon = STAT_ICONS[icon];
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-4xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} applications</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await apiClient<AdminAnalytics>("/api/admin/analytics", {
        token: accessToken,
      });
      setData(result);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  const statusData = useMemo(() => {
    if (!data) return [];
    const s = data.applicationsByStatus;
    return [
      { status: "Applied", count: s.applied },
      { status: "Screened", count: s.screened },
      { status: "Scheduled", count: s.scheduled },
      { status: "Offered", count: s.offered },
      { status: "Rejected", count: s.rejected },
    ];
  }, [data]);

  const trendData = useMemo(
    () =>
      data?.newApplicationsLast7Days.map((d) => ({
        date: formatShortDate(d.date),
        count: d.count,
      })) ?? [],
    [data]
  );

  const totalApplications = useMemo(
    () => statusData.reduce((sum, s) => sum + s.count, 0),
    [statusData]
  );

  if (isLoading || !data) {
    return (
      <PageContainer>
        <div className="mb-8">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A live snapshot of activity across InternLink.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Students"
          value={data.activeStudentCount}
          icon="GraduationCap"
          accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
        />
        <StatCard
          label="Active Companies"
          value={data.activeCompanyCount}
          icon="Building2"
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Open Jobs"
          value={data.openJobCount}
          icon="Briefcase"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Total Applications"
          value={totalApplications}
          icon="FileText"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading text-lg font-semibold">Applications by Status</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Distribution across the hiring pipeline.
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading text-lg font-semibold">New Applications</h2>
            <p className="mb-4 text-sm text-muted-foreground">Submitted over the last 7 days.</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_PRIMARY}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: CHART_PRIMARY, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
