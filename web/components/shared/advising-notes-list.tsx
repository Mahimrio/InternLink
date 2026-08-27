"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, UserCheck, MessageSquare, Clock } from "lucide-react";

export interface CounselorFeedbackItem {
  id: string;
  studentId: string;
  counselorUserId: string;
  counselorEmail?: string | null;
  narrativeMarkdown: string;
  meetingDate: string;
  createdAt?: string;
}

interface AdvisingNotesListProps {
  notes: CounselorFeedbackItem[];
  emptyMessage?: string;
  emptyTitle?: string;
}

export function AdvisingNotesList({
  notes,
  emptyTitle = "No Advising Notes Yet",
  emptyMessage = "No counselor advising sessions or notes have been logged for this student yet.",
}: AdvisingNotesListProps) {
  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-border text-center space-y-3">
        <div className="p-3 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
          <MessageSquare className="size-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {emptyTitle}
          </p>
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => {
        const meetingDateObj = new Date(note.meetingDate);
        const isUpcoming = meetingDateObj > new Date();
        const formattedDate = meetingDateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Card
            key={note.id}
            className="border-border/70 shadow-sm hover:border-teal-300 dark:hover:border-teal-800 transition-colors"
          >
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {note.counselorEmail || "Career Counselor"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="size-3 text-teal-600" />
                      <span>Meeting: {formattedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUpcoming ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-xs font-medium"
                    >
                      <Clock className="size-3 mr-1" /> Scheduled
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 text-xs font-medium"
                    >
                      Completed Session
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                {/* ReactMarkdown sanitizes by default and does not execute script tags */}
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => (
                      <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white mt-2 mb-1" {...props} />
                    ),
                    h2: ({ ...props }) => (
                      <h4 className="font-heading text-sm font-semibold text-slate-900 dark:text-white mt-2 mb-1" {...props} />
                    ),
                    h3: ({ ...props }) => (
                      <h5 className="font-heading text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 mb-1" {...props} />
                    ),
                    p: ({ ...props }) => (
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mb-2 last:mb-0" {...props} />
                    ),
                    ul: ({ ...props }) => (
                      <ul className="list-disc pl-4 text-xs space-y-1 mb-2 text-slate-700 dark:text-slate-300" {...props} />
                    ),
                    ol: ({ ...props }) => (
                      <ol className="list-decimal pl-4 text-xs space-y-1 mb-2 text-slate-700 dark:text-slate-300" {...props} />
                    ),
                    li: ({ ...props }) => <li className="text-xs" {...props} />,
                    blockquote: ({ ...props }) => (
                      <blockquote className="border-l-2 border-teal-500 pl-3 italic text-xs text-muted-foreground my-2" {...props} />
                    ),
                    code: ({ ...props }) => (
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-teal-700 dark:text-teal-300" {...props} />
                    ),
                    hr: ({ ...props }) => <hr className="my-2 border-border/60" {...props} />,
                    strong: ({ ...props }) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                  }}
                >
                  {note.narrativeMarkdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
