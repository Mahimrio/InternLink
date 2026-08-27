"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SkillOption, WeightedSkill, WEIGHT_LABELS } from "@/lib/company";

interface SkillsWeightSelectorProps {
  options: SkillOption[];
  value: WeightedSkill[];
  onChange: (value: WeightedSkill[]) => void;
}

export function SkillsWeightSelector({ options, value, onChange }: SkillsWeightSelectorProps) {
  const [query, setQuery] = useState("");

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of options) map.set(o.id, o.skillName);
    return map;
  }, [options]);

  const selectedIds = useMemo(() => new Set(value.map((v) => v.skillId)), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.skillName.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (skillId: string) => {
    if (selectedIds.has(skillId)) {
      onChange(value.filter((v) => v.skillId !== skillId));
    } else {
      onChange([...value, { skillId, weight: 3 }]);
    }
  };

  const setWeight = (skillId: string, weight: number) => {
    onChange(value.map((v) => (v.skillId === skillId ? { ...v, weight } : v)));
  };

  return (
    <div className="space-y-4">
      {/* Searchable option list */}
      <div className="rounded-lg border border-input">
        <div className="relative border-b border-input">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="border-0 pl-9 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No skills match “{query}”.</p>
          ) : (
            filtered.map((option) => {
              const checked = selectedIds.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60",
                    checked && "bg-primary/5"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded border",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                      )}
                    >
                      {checked && <Check className="size-3" />}
                    </span>
                    {option.skillName}
                  </span>
                  <span className="text-xs text-muted-foreground">{option.domainClassification}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected skills with weight sliders */}
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No skills selected yet. Pick the skills this role needs and set how important each one is.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((sel) => (
            <div key={sel.skillId} className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{nameById.get(sel.skillId) ?? "Unknown skill"}</span>
                <button
                  type="button"
                  onClick={() => toggle(sel.skillId)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Remove skill"
                >
                  <X className="size-4" />
                </button>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={sel.weight}
                onChange={(e) => setWeight(sel.skillId, Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Nice to have</span>
                <span className="font-semibold text-primary">{WEIGHT_LABELS[sel.weight]}</span>
                <span>Critical</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
