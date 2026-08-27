"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, XCircle } from "lucide-react";

interface RejectCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  isPending: boolean;
  onConfirm: (reason: string) => void;
}

// Rejecting a company captures an optional reason the applicant can be shown later.
export function RejectCompanyDialog({
  open,
  onOpenChange,
  companyName,
  isPending,
  onConfirm,
}: RejectCompanyDialogProps) {
  const [reason, setReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next && !isPending) setReason("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
            <XCircle className="size-5" />
          </div>
          <DialogTitle>Reject “{companyName}”?</DialogTitle>
          <DialogDescription>
            The company will be marked as rejected and won&apos;t be able to post jobs. Add an
            optional reason for your records.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason (optional)</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Unverifiable business registration details."
            rows={3}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Rejecting…
              </>
            ) : (
              "Reject company"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
