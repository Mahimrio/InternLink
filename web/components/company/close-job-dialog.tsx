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
import { Loader2, AlertTriangle } from "lucide-react";

interface CloseJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  isClosing: boolean;
  onConfirm: () => void;
}

// Closing is one-way from the UI's perspective (the API never hard-deletes), so we confirm first.
export function CloseJobDialog({
  open,
  onOpenChange,
  jobTitle,
  isClosing,
  onConfirm,
}: CloseJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isClosing}>
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>Close “{jobTitle}”?</DialogTitle>
          <DialogDescription>
            This will remove the job from student search results. Applicants already in the
            pipeline are unaffected. You can&apos;t reopen a closed posting from here.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isClosing} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={isClosing}>
            {isClosing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Closing…
              </>
            ) : (
              "Close job"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
