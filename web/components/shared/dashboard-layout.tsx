"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut, Menu, X, User as UserIcon } from "lucide-react";

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
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = user?.name || user?.unique_name || user?.email || "User";

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Topbar */}
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
        <div className="border-t border-border/50 p-4">
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
        <header className="hidden md:flex h-16 items-center justify-between border-b border-border/50 bg-background/50 px-6 lg:px-10 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold capitalize">
              {pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 shadow-sm">
              <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-primary">{roleName} Mode</span>
            </div>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted border border-border/50">
                <UserIcon className="size-4 text-muted-foreground" />
              </div>
              <span className="hidden sm:inline-block max-w-[150px] truncate">
                {displayName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-10">
          {children}
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
