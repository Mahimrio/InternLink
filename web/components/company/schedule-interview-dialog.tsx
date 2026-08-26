"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Link2, Loader2 } from "lucide-react";

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  isSubmitting: boolean;
  onConfirm: (scheduledDateTimeIso: string, contextMeetingLink: string) => void;
}

// Local yyyy-MM-ddTHH:mm for the datetime-local min attribute and comparisons.
function nowLocalString() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  studentName,
  isSubmitting,
  onConfirm,
}: ScheduleInterviewDialogProps) {
  const [dateTime, setDateTime] = useState("");
  const [link, setLink] = useState("");
  const [minDateTime, setMinDateTime] = useState("");

  useEffect(() => {
    if (open) {
      // Reset the form each time the dialog opens — an intentional sync with the open trigger.
      /* eslint-disable react-hooks/set-state-in-effect */
      setDateTime("");
      setLink("");
      setMinDateTime(nowLocalString());
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  // Local datetime strings sort chronologically, so compare as strings to avoid reading the
  // clock during render (keeps the component pure).
  const isDateValid = dateTime !== "" && minDateTime !== "" && dateTime > minDateTime;
  const isLinkValid = isValidHttpUrl(link);
  const canConfirm = isDateValid && isLinkValid && !isSubmitting;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(new Date(dateTime).toISOString(), link.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            <Calendar className="size-5" />
          </div>
          <DialogTitle>Schedule interview with {studentName}</DialogTitle>
          <DialogDescription>
            Both a future date/time and a valid meeting link are required to move this applicant to
            Scheduled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledDateTime">Date &amp; time</Label>
            <Input
              id="scheduledDateTime"
              type="datetime-local"
              min={minDateTime}
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
            {dateTime !== "" && !isDateValid && (
              <p className="text-xs text-destructive">Pick a date and time in the future.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contextMeetingLink">Meeting link</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contextMeetingLink"
                type="url"
                className="pl-9"
                placeholder="https://meet.example.com/interview"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            {link !== "" && !isLinkValid && (
              <p className="text-xs text-destructive">Enter a valid URL (http or https).</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isSubmitting} />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Scheduling…
              </>
            ) : (
              "Confirm &amp; schedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
