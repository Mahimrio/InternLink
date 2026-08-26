"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { CompanyProfile } from "@/lib/company";

interface CompanyProfileContextValue {
  profile: CompanyProfile | null;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: CompanyProfile) => void;
  refresh: () => Promise<void>;
}

const CompanyProfileContext = createContext<CompanyProfileContextValue | undefined>(undefined);

// Fetches the company profile once for the whole Company area so the verification
// banner and every page share a single source of truth (and one network call).
export function CompanyProfileProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfileState] = useState<CompanyProfile | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      // Await first so no setState runs synchronously inside the calling effect.
      const data = await apiClient<CompanyProfile>("/api/company/profile", {
        token: accessToken,
      });
      setProfileState(data);
      setError(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load company profile");
    } finally {
      setHasLoaded(true);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthLoading && accessToken) {
      // Intentional one-shot fetch on mount; state is set only after the awaited request.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
  }, [accessToken, isAuthLoading, load]);

  const value: CompanyProfileContextValue = {
    profile,
    isLoading: isAuthLoading || (!!accessToken && !hasLoaded),
    error,
    setProfile: setProfileState,
    refresh: load,
  };

  return (
    <CompanyProfileContext.Provider value={value}>{children}</CompanyProfileContext.Provider>
  );
}

export function useCompanyProfile() {
  const ctx = useContext(CompanyProfileContext);
  if (ctx === undefined) {
    throw new Error("useCompanyProfile must be used within a CompanyProfileProvider");
  }
  return ctx;
}
