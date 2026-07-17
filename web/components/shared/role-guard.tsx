"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Role } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRole: Role;
}

export function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const { role, isLoading, accessToken } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!accessToken) {
        router.replace("/login");
      } else if (role !== allowedRole) {
        // Mismatched role — route them to their actual dashboard
        const rolePath = role ? `/${role.toLowerCase()}/dashboard` : "/login";
        router.replace(rolePath);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [isLoading, role, allowedRole, accessToken, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
