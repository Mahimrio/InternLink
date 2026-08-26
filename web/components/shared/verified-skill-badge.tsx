"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface VerifiedSkillBadgeProps {
  skillName?: string;
  isVerified?: boolean;
  score?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function VerifiedSkillBadge({
  skillName,
  isVerified = true,
  score,
  size = "sm",
  className = "",
  showText = true,
}: VerifiedSkillBadgeProps) {
  if (!isVerified) {
    if (!skillName) return null;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 ${className}`}
      >
        {skillName}
      </span>
    );
  }

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  };

  return (
    <span
      title={score ? `Verified Skill (Score: ${score}%)` : "Verified Skill via Assessment"}
      className={`inline-flex items-center font-semibold rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-300/80 dark:border-teal-700/80 shadow-xs shadow-teal-500/10 transition-all hover:border-teal-400 ${sizeClasses[size]} ${className}`}
    >
      <ShieldCheck className={`${iconSizes[size]} text-teal-600 dark:text-teal-400 shrink-0`} />
      {skillName && <span>{skillName}</span>}
      {showText && !skillName && <span>Verified</span>}
      {score !== undefined && score !== null && (
        <span className="text-[10px] font-mono opacity-80 pl-0.5">({score}%)</span>
      )}
    </span>
  );
}
