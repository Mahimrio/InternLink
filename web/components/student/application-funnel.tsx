"use client";

import React from "react";
import {
  ApplicationStatus,
  getStatusConfig,
} from "@/lib/application-status";
import { CheckCircle2, UserCheck, Calendar, Award, XCircle } from "lucide-react";

interface ApplicationFunnelProps {
  status: string;
  className?: string;
}

const STEPS = [
  { key: "Applied", label: "Applied", icon: CheckCircle2 },
  { key: "Screened", label: "Screened", icon: UserCheck },
  { key: "Scheduled", label: "Scheduled", icon: Calendar },
  { key: "Terminal", label: "Decision", icon: Award },
];

export function ApplicationFunnel({ status, className = "" }: ApplicationFunnelProps) {
  const normStatus = (status as ApplicationStatus) || "Applied";
  const config = getStatusConfig(normStatus);
  const currentStep = config.stepIndex; // 0, 1, 2, or 3
  const isRejected = normStatus === "Rejected";
  const isOffered = normStatus === "Offered";

  return (
    <div className={`w-full py-3 ${className}`}>
      {/* Stepper container */}
      <div className="relative flex items-center justify-between">
        {/* Connecting background track */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0" />

        {/* Connecting active progress line */}
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-500 ${
            isRejected
              ? "bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500"
              : isOffered
              ? "bg-gradient-to-r from-teal-500 via-blue-500 to-emerald-500"
              : "bg-gradient-to-r from-teal-500 to-teal-400"
          }`}
          style={{
            width: `${Math.min(100, Math.max(0, (currentStep / (STEPS.length - 1)) * 100))}%`,
          }}
        />

        {/* Nodes */}
        {STEPS.map((step, idx) => {
          const isPassed = idx < currentStep;
          const isCurrent = idx === currentStep;

          let StepIcon = step.icon;
          let nodeLabel = step.label;

          // Branching terminal node logic
          if (idx === 3) {
            if (isOffered) {
              StepIcon = Award;
              nodeLabel = "Offered";
            } else if (isRejected) {
              StepIcon = XCircle;
              nodeLabel = "Rejected";
            } else {
              nodeLabel = "Offer / Decision";
            }
          }

          let nodeBg = "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400";
          let ringEffect = "";

          if (isPassed) {
            nodeBg = "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20";
          } else if (isCurrent) {
            if (isRejected) {
              nodeBg = "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30";
              ringEffect = "ring-4 ring-rose-400/20 animate-pulse";
            } else if (isOffered) {
              nodeBg = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30";
              ringEffect = "ring-4 ring-emerald-400/20 animate-pulse";
            } else if (normStatus === "Scheduled") {
              nodeBg = "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30";
              ringEffect = "ring-4 ring-amber-400/20 animate-pulse";
            } else if (normStatus === "Screened") {
              nodeBg = "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30";
              ringEffect = "ring-4 ring-blue-400/20 animate-pulse";
            } else {
              nodeBg = "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/30";
              ringEffect = "ring-4 ring-teal-400/20 animate-pulse";
            }
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`size-8 sm:size-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${nodeBg} ${ringEffect}`}
              >
                <StepIcon className="size-4 sm:size-4.5" />
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "font-semibold text-slate-900 dark:text-white"
                    : isPassed
                    ? "text-slate-600 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-600"
                }`}
              >
                {nodeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
