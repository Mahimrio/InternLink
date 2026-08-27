"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight } from "lucide-react";
import { AtsStatus, nextStatuses } from "@/lib/ats";
import { APPLICATION_STATUS_CONFIG } from "@/lib/application-status";

interface AdvanceStatusMenuProps {
  currentStatus: string;
  disabled?: boolean;
  onSelect: (next: AtsStatus) => void;
}

export function AdvanceStatusMenu({ currentStatus, disabled, onSelect }: AdvanceStatusMenuProps) {
  const options = nextStatuses(currentStatus);
  if (options.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        Advance
        <ChevronDown className="ml-1 size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {options.map((status) => (
          <DropdownMenuItem
            key={status}
            variant={status === "Rejected" ? "destructive" : "default"}
            onClick={() => onSelect(status)}
          >
            <ArrowRight className="size-3.5" />
            {APPLICATION_STATUS_CONFIG[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
