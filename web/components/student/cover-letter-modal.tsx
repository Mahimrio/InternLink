"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import {
  Sparkles,
  FileDown,
  Save,
  RotateCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";

interface CoverLetterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  token: string;
  onSavedSuccess?: () => void;
}

interface SavedCoverLetterResponse {
  hasSaved: boolean;
  coverLetter?: {
    id: string;
    jobId: string;
    content: string;
    documentPath?: string | null;
    downloadUrl?: string | null;
    lastModified: string;
  } | null;
}

interface GenerateResponse {
  generatedText: string;
}

export function CoverLetterModal({
  isOpen,
  onOpenChange,
  jobId,
  jobTitle,
  companyName,
  token,
  onSavedSuccess,
}: CoverLetterModalProps) {
  const [text, setText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSavedLocally, setIsSavedLocally] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const textareaId = useId();

  const handleGenerate = useCallback(async () => {
    if (!token || !jobId) return;

    try {
      setIsGenerating(true);
      const res = await apiClient<GenerateResponse>(
        `/api/student/jobs/${jobId}/cover-letter`,
        {
          method: "POST",
          token,
        }
      );

      if (res?.generatedText) {
        setText(res.generatedText);
        setIsSavedLocally(false);
        toast.success("AI cover letter generated! You can now refine it.");
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to generate cover letter.";
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  }, [jobId, token]);

  // Load existing saved cover letter if any when dialog opens
  useEffect(() => {
    if (!isOpen || !token || !jobId) return;

    let isMounted = true;

    async function loadSaved() {
      try {
        const res = await apiClient<SavedCoverLetterResponse>(
          `/api/student/jobs/${jobId}/cover-letter`,
          { token }
        );

        if (!isMounted) return;

        if (res?.hasSaved && res.coverLetter?.content) {
          setText(res.coverLetter.content);
          setIsSavedLocally(true);
        } else {
          // If no draft exists yet, automatically trigger initial AI generation
          handleGenerate();
        }
      } catch {
        handleGenerate();
      }
    }

    loadSaved();

    return () => {
      isMounted = false;
    };
  }, [isOpen, jobId, token, handleGenerate]);

  const handleSave = async () => {
    if (!token || !jobId) return;

    if (!text.trim()) {
      toast.error("Cover letter cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      await apiClient(`/api/student/jobs/${jobId}/cover-letter/save`, {
        method: "POST",
        token,
        body: JSON.stringify({ finalText: text }),
      });

      setIsSavedLocally(true);
      toast.success("Cover letter saved to your application profile!");
      onSavedSuccess?.();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to save cover letter.";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token || !jobId) return;

    if (!text.trim()) {
      toast.error("Please generate or enter a cover letter first.");
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5187";
      const res = await fetch(
        `${baseUrl}/api/student/jobs/${jobId}/cover-letter/pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to generate PDF.");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = `CoverLetter_${companyName.replace(/\s+/g, "_")}.pdf`;
      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
          try {
            fileName = decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ""));
          } catch {
            fileName = utf8Match[1].trim();
          }
        } else {
          const regularMatch = contentDisposition.match(/filename=(["']?)([^"';]+)\1/i);
          if (regularMatch?.[2]) {
            fileName = regularMatch[2].trim();
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to render PDF.";
      toast.error(errorMsg);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[90vh] flex flex-col p-6 gap-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Sparkles className="size-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
              AI Cover Letter Assistant
            </span>

            {isSavedLocally && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800">
                <CheckCircle2 className="size-3" />
                Saved
              </span>
            )}
          </div>

          <DialogTitle className="font-heading text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="size-5 text-teal-600 shrink-0" />
            <span>Application for {jobTitle}</span>
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Building2 className="size-3.5 text-slate-400" />
            <span>Target Company: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{companyName}</strong></span>
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4 rounded-xl border border-dashed border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20">
              <div className="relative">
                <div className="size-12 rounded-full bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center text-teal-600 dark:text-teal-300 animate-spin">
                  <RotateCw className="size-6" />
                </div>
                <Sparkles className="size-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>

              <div className="text-center space-y-1.5 max-w-sm">
                <h4 className="font-heading font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Synthesizing Personalized Cover Letter
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Combining your verified skills, latest resume, and {companyName}&apos;s specific selection criteria into an impactful letter...
                </p>
              </div>

              {/* Progress animation bars */}
              <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-teal-500 to-amber-500 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Textarea Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className={`px-2 py-0.5 rounded-md font-mono font-medium ${
                    wordCount >= 250 && wordCount <= 400
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}>
                    {wordCount} words
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>{charCount} characters</span>
                  <span className="hidden sm:inline text-[11px] text-slate-400">
                    (250–400 words recommended)
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="h-8 text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300"
                >
                  <RotateCw className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>

              {/* Editor Textarea */}
              <div className="relative">
                <textarea
                  id={textareaId}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setIsSavedLocally(false);
                  }}
                  placeholder="Your cover letter will appear here once generated..."
                  rows={14}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-y shadow-inner"
                />
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <AlertCircle className="size-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Review and customize the text to highlight specific personal projects. Changes are only attached when you click <strong>Save to Application</strong> below.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Close
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || isGenerating || !text.trim()}
              className="h-9 text-xs font-semibold gap-1.5 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileDown className="size-3.5 text-teal-600" />
              )}
              Download as PDF
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isGenerating || !text.trim()}
              className="h-9 text-xs font-semibold gap-1.5 btn-gradient-animate text-white shadow-md shadow-teal-600/20"
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save to Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
