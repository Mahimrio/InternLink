"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Ban, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { AdminUser, AdminUserRole, PagedResult } from "@/lib/admin";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [roleFilter, setRoleFilter] = useState<AdminUserRole>("Student");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [target, setTarget] = useState<AdminUser | null>(null);
  const [isActing, setIsActing] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ role: roleFilter, page: "1", pageSize: "50" });
      if (searchQuery) params.set("search", searchQuery);
      const data = await apiClient<PagedResult<AdminUser>>(
        `/api/admin/users?${params.toString()}`,
        { token: accessToken }
      );
      setUsers(data.items);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, roleFilter, searchQuery]);

  useEffect(() => {
    // One-shot fetch reacting to filter/search changes; state is set only after the awaited request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const handleConfirmAction = async () => {
    if (!target) return;
    const action = target.isActive ? "suspend" : "reactivate";
    try {
      setIsActing(true);
      await apiClient(`/api/admin/users/${target.id}/${action}`, {
        method: "POST",
        token: accessToken,
      });
      // Optimistically flip the row's status so the table reflects the change immediately.
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, isActive: !u.isActive } : u))
      );
      toast.success(target.isActive ? "User suspended" : "User reactivated");
      setTarget(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || `Failed to ${action} user`);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">User Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review platform accounts and suspend or reactivate access.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={roleFilter} onValueChange={(value) => setRoleFilter(value as AdminUserRole)}>
          <TabsList>
            <TabsTrigger value="Student">Students</TabsTrigger>
            <TabsTrigger value="Company">Companies</TabsTrigger>
          </TabsList>
        </Tabs>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearchQuery(searchInput.trim());
          }}
          className="relative w-full sm:w-72"
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </form>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : users.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UsersIcon className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">No users found</h2>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term."
                  : `No ${roleFilter === "Student" ? "students" : "companies"} are registered yet.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-4 font-medium">{user.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                          user.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            user.isActive ? "bg-emerald-500" : "bg-rose-500"
                          )}
                        />
                        {user.isActive ? "Active" : "Suspended"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      {user.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setTarget(user)}
                        >
                          <Ban className="mr-1 size-3.5" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                          onClick={() => setTarget(user)}
                        >
                          <ShieldCheck className="mr-1 size-3.5" />
                          Reactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmActionDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open && !isActing) setTarget(null);
        }}
        title={
          target?.isActive
            ? `Suspend ${target?.displayName}?`
            : `Reactivate ${target?.displayName}?`
        }
        description={
          target?.isActive
            ? "The account will be signed out and blocked from logging in until reactivated."
            : "The account will regain access and be able to log in again."
        }
        confirmLabel={target?.isActive ? "Suspend user" : "Reactivate user"}
        pendingLabel={target?.isActive ? "Suspending…" : "Reactivating…"}
        tone={target?.isActive ? "danger" : "positive"}
        isPending={isActing}
        onConfirm={handleConfirmAction}
      />
    </PageContainer>
  );
}
