"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  /** "danger" tints the icon amber and uses a destructive confirm button. */
  tone: "danger" | "positive";
  isPending: boolean;
  onConfirm: () => void;
}

// A single confirmation gate reused for suspend (danger) and reactivate (positive),
// so a meaningful account action is never a single accidental click.
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  tone,
  isPending,
  onConfirm,
}: ConfirmActionDialogProps) {
  const isDanger = tone === "danger";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              isDanger
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
            )}
          >
            {isDanger ? (
              <AlertTriangle className="size-5" />
            ) : (
              <ShieldCheck className="size-5" />
            )}
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            Cancel
          </DialogClose>
          <Button
            variant={isDanger ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {pendingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
