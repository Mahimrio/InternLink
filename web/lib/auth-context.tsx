"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type Role = "Student" | "Company" | "Admin" | "Counselor";

export interface DecodedTokenClaims {
  nameid: string; // User ID
  email: string;
  role: Role;
  exp: number;
  jti: string;
}

interface AuthState {
  accessToken: string | null;
  role: Role | null;
  user: DecodedTokenClaims | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  setAuthData: (accessToken: string, role: Role) => void;
  logout: () => Promise<void>;
  login: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    role: null,
    user: null,
    isLoading: true,
  });
  const router = useRouter();

  const setAuthData = React.useCallback((accessToken: string, role: Role) => {
    try {
      // jwt-decode is purely for UI convenience, not a security boundary
      const decoded = jwtDecode<DecodedTokenClaims>(accessToken);
      setState({
        accessToken,
        role,
        user: decoded,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to decode token", err);
      setState({
        accessToken: null,
        role: null,
        user: null,
        isLoading: false,
      });
    }
  }, []);

  // Handle silent token refresh on mount
  useEffect(() => {
    let isMounted = true;

    async function silentRefresh() {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAuthData(data.accessToken, data.role as Role);
          }
        } else {
          if (isMounted) {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        }
      } catch (err) {
        if (isMounted) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    silentRefresh();

    return () => {
      isMounted = false;
    };
  }, [setAuthData]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setState({ accessToken: null, role: null, user: null, isLoading: false });
      router.push("/login");
      toast.success("Logged out successfully");
    }
  };

  const login = () => {
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ ...state, setAuthData, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
