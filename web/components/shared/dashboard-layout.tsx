"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Briefcase, LogOut, Menu, X } from "lucide-react";

import { apiClient } from "@/lib/api-client";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  roleName: string;
}

export function DashboardLayout({ children, navItems, roleName }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, accessToken, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ firstName?: string; lastName?: string; department?: string } | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let isMounted = true;
    if (roleName.toLowerCase() === "student") {
      apiClient<{ firstName?: string; lastName?: string; department?: string }>("/api/student/profile", { token: accessToken })
        .then((p) => {
          if (isMounted && p) {
            setProfileData(p);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [accessToken, roleName]);

  const fullName = profileData?.firstName
    ? `${profileData.firstName} ${profileData.lastName || ""}`.trim()
    : (user?.name || user?.unique_name || (user?.email ? user.email.split("@")[0] : "User"));
  const firstName = profileData?.firstName
    ? profileData.firstName
    : user?.name
    ? user.name.split(" ")[0]
    : fullName.split(" ")[0] || "there";
  const department = profileData?.department || (roleName === "Student" ? "Computer Science & Eng." : `${roleName} Account`);
  const userInitials = profileData?.firstName
    ? `${profileData.firstName[0]}${profileData.lastName?.[0] || ""}`.toUpperCase()
    : fullName.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Topbar - Clean brand & menu only (profile removed in phone view) */}
      <div className="md:hidden flex items-center justify-between border-b border-border/50 bg-background/80 p-4 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Briefcase className="size-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold">InternLink</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border/50 bg-muted/10 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="hidden md:flex h-16 items-center gap-2 border-b border-border/50 px-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Briefcase className="size-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">InternLink</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className={cn("flex size-5 items-center justify-center", isActive ? "text-primary" : "")}>
                  {item.icon}
                </div>
                {item.title}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border/50 p-4 space-y-3">
          {/* Mobile Profile Card inside Drawer */}
          <div className="md:hidden flex items-center gap-3 p-2 rounded-xl bg-muted/40 border border-border/50">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white font-heading font-bold text-xs shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{fullName}</div>
              <div className="text-[10px] text-muted-foreground truncate">{department}</div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 lg:px-10 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {pathname.endsWith("/dashboard") ? (
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return "Good morning";
                    if (hour < 17) return "Good afternoon";
                    return "Good evening";
                  })()},{" "}
                  <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 dark:from-teal-300 dark:via-teal-200 dark:to-teal-400 bg-clip-text text-transparent">
                    {firstName}
                  </span>
                </span>
              </div>
            ) : (
              <h1 className="font-heading text-lg lg:text-xl font-bold capitalize text-slate-900 dark:text-white">
                {pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard"}
              </h1>
            )}
          </div>

          {/* Desktop Right Actions & Professional Profile Card */}
          <div className="flex items-center gap-3.5">
            <ThemeToggle />
            {/* Quick Action Button */}
            {roleName.toLowerCase() === "student" && (
              <Link href="/student/resumes/builder">
                <Button size="sm" className="h-8.5 text-xs font-semibold btn-gradient-animate text-white shadow-xs px-3 hidden lg:inline-flex transition-all hover:scale-[1.02] active:scale-[0.98]">
                  + New Resume
                </Button>
              </Link>
            )}

            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/40 px-3 py-1 shadow-xs">
              <div className="size-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">{roleName} Mode</span>
            </div>

            <div className="h-6 w-px bg-border/50 hidden sm:block" />

            {/* Professional Profile Pill (Desktop Header) */}
            <Link
              href={roleName.toLowerCase() === "student" ? "/student/profile" : `/${roleName.toLowerCase()}/profile`}
              className="flex items-center gap-2.5 rounded-xl p-1.5 pl-2 pr-3 bg-muted/40 hover:bg-muted/80 border border-border/60 transition-all duration-200 hover:scale-[1.02] group shadow-xs cursor-pointer"
              title="View Profile"
            >
              <div className="relative">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white font-heading font-bold text-xs shadow-xs select-none ring-2 ring-teal-500/20 group-hover:ring-teal-500/40 transition-all">
                  {userInitials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="text-left leading-tight hidden lg:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors max-w-[130px] truncate">
                  {fullName}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground max-w-[130px] truncate">
                  {department}
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="relative flex-1 overflow-auto p-4 md:p-6 lg:p-10">
          {/* Ambient depth */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-[-15%] right-[-5%] h-96 w-96 rounded-full bg-primary/5 blur-[110px]" />
            <div className="absolute top-[30%] left-[-10%] h-80 w-80 rounded-full bg-amber-500/5 blur-[100px]" />
          </div>
          {/* Keyed on pathname so every route change replays the entrance */}
          <div key={pathname} className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
      
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
