"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  Loader2,
  ExternalLink,
  Building2,
  Calendar,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";

interface AddExternalJobDialogProps {
  token: string;
  onJobCreated: () => void;
}

interface ParseResponse {
  parsedSuccessfully: boolean;
  parseError?: string;
  title?: string;
  coreDescription?: string;
  selectionCriteria?: string;
  locationType?: string;
  companyNameSnapshot?: string;
  externalApplyUrl?: string;
  externalSourceName?: string;
  suggestedSkillNames?: string[];
}

export function AddExternalJobDialog({ token, onJobCreated }: AddExternalJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");

  // AI Extraction State
  const [rawText, setRawText] = useState("");
  const [aiSourcePortal, setAiSourcePortal] = useState("BDJobs");
  const [aiSourceUrl, setAiSourceUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sourceName, setSourceName] = useState("BDJobs");
  const [applyUrl, setApplyUrl] = useState("");
  const [locationType, setLocationType] = useState("OnSite");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [description, setDescription] = useState("");
  const [selectionCriteria, setSelectionCriteria] = useState("");
  const [externalJobId, setExternalJobId] = useState("");
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRawText("");
    setAiSourceUrl("");
    setTitle("");
    setCompanyName("");
    setSourceName("BDJobs");
    setApplyUrl("");
    setLocationType("OnSite");
    setDescription("");
    setSelectionCriteria("");
    setExternalJobId("");
    setExtractedSkills([]);
  };

  const handleAiExtract = async () => {
    if (!rawText.trim() || rawText.trim().length < 40) {
      toast.error("Please paste at least 40 characters of job description or circular text.");
      return;
    }

    setIsParsing(true);
    try {
      const res = await apiClient<ParseResponse>("/api/admin/jobs/external/parse", {
        method: "POST",
        token,
        body: JSON.stringify({
          rawContent: rawText.trim(),
          sourceName: aiSourcePortal,
          sourceUrl: aiSourceUrl.trim() || null,
        }),
      });

      if (res.title) setTitle(res.title);
      if (res.companyNameSnapshot) setCompanyName(res.companyNameSnapshot);
      if (res.coreDescription) setDescription(res.coreDescription);
      if (res.selectionCriteria) setSelectionCriteria(res.selectionCriteria);
      if (res.locationType) setLocationType(res.locationType);
      if (res.externalSourceName) setSourceName(res.externalSourceName);
      if (res.externalApplyUrl) setApplyUrl(res.externalApplyUrl);
      if (res.suggestedSkillNames && res.suggestedSkillNames.length > 0) {
        setExtractedSkills(res.suggestedSkillNames);
      }

      toast.success("AI extraction completed! Review the details in the form.");
      setActiveTab("manual");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to extract job details with AI.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Job title is required.");
      return;
    }
    if (!companyName.trim()) {
      toast.error("Company name is required.");
      return;
    }
    if (!applyUrl.trim() || !applyUrl.startsWith("http")) {
      toast.error("A valid apply URL starting with http:// or https:// is required.");
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      toast.error("Please provide a description of at least 20 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient("/api/admin/jobs/external", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: title.trim(),
          companyNameSnapshot: companyName.trim(),
          externalSourceName: sourceName.trim(),
          externalApplyUrl: applyUrl.trim(),
          externalJobId: externalJobId.trim() || null,
          locationType,
          deadLine: new Date(deadline).toISOString(),
          coreDescription: description.trim(),
          selectionCriteria: selectionCriteria.trim() || "See job description for requirements.",
        }),
      });

      toast.success(`External job "${title}" published and approved!`);
      resetForm();
      setOpen(false);
      onJobCreated();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to create external job posting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="btn-gradient-animate gap-1.5 text-xs text-white shadow-sm font-semibold"
          >
            <Plus className="size-3.5" />
            Add External Job
          </Button>
        }
      />

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <ExternalLink className="size-4" />
            </span>
            <DialogTitle className="font-heading text-xl font-bold">
              Add External Job Posting
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Aggregate third-party circulars from BDJobs, LinkedIn, or external portals for students.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "ai" | "manual")}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-1.5 text-xs font-semibold">
              <Sparkles className="size-3.5 text-amber-500" />
              AI Smart-Paste
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5 text-xs font-semibold">
              <FileText className="size-3.5" />
              Job Details Form
            </TabsTrigger>
          </TabsList>

          {/* AI Smart Paste Tab */}
          <TabsContent value="ai" className="space-y-4 pt-3">
            <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/60 text-xs text-violet-900 dark:text-violet-200 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                Zero-effort circular extraction
              </p>
              <p className="text-muted-foreground dark:text-violet-300/80 leading-relaxed">
                Paste any unstructured job circular, BDJobs description, or LinkedIn post text.
                Google Gemini will extract structured fields, location type, and tech skills automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ai-portal" className="text-xs">Source Portal</Label>
                <select
                  id="ai-portal"
                  value={aiSourcePortal}
                  onChange={(e) => setAiSourcePortal(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="BDJobs">BDJobs</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Chakri">Chakri.com</option>
                  <option value="Arbeitnow">Arbeitnow</option>
                  <option value="Company Portal">Direct Career Portal</option>
                  <option value="Other">Other External Source</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ai-url" className="text-xs">Original Circular URL (optional)</Label>
                <Input
                  id="ai-url"
                  placeholder="https://jobs.bdjobs.com/jobdetails.asp?id=..."
                  value={aiSourceUrl}
                  onChange={(e) => setAiSourceUrl(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-text" className="text-xs font-semibold">Raw Job Text / Circular Copy</Label>
              <Textarea
                id="ai-text"
                rows={7}
                placeholder="Paste the circular or job post text here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            <Button
              type="button"
              onClick={handleAiExtract}
              disabled={isParsing}
              className="w-full btn-gradient-animate text-white text-xs font-semibold gap-2 h-10 shadow-sm"
            >
              {isParsing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4 text-amber-300" />
              )}
              {isParsing ? "Extracting with Gemini AI…" : "Extract Job Details with AI"}
            </Button>
          </TabsContent>

          {/* Manual Form Tab */}
          <TabsContent value="manual" className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {extractedSkills.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    AI Detected Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="form-title" className="text-xs">Job Title *</Label>
                  <Input
                    id="form-title"
                    required
                    placeholder="e.g. Software Engineer Intern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-company" className="text-xs">Company Name *</Label>
                  <Input
                    id="form-company"
                    required
                    placeholder="e.g. bKash Ltd., Brain Station 23"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="form-source" className="text-xs">Source Name *</Label>
                  <Input
                    id="form-source"
                    required
                    placeholder="e.g. BDJobs"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-location" className="text-xs">Location Type</Label>
                  <select
                    id="form-location"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="OnSite">OnSite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-deadline" className="text-xs">Application Deadline</Label>
                  <Input
                    id="form-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="form-url" className="text-xs">External Apply URL *</Label>
                  <Input
                    id="form-url"
                    type="url"
                    required
                    placeholder="https://jobs.bdjobs.com/..."
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-id" className="text-xs">External Job ID / Slug (optional)</Label>
                  <Input
                    id="form-id"
                    placeholder="e.g. bdjobs-108273"
                    value={externalJobId}
                    onChange={(e) => setExternalJobId(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-desc" className="text-xs">Role Description *</Label>
                <Textarea
                  id="form-desc"
                  required
                  rows={4}
                  placeholder="Outline responsibilities and daily tasks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-criteria" className="text-xs">Selection Criteria & Requirements</Label>
                <Textarea
                  id="form-criteria"
                  rows={2}
                  placeholder="Required degrees, CGPA, specific technologies..."
                  value={selectionCriteria}
                  onChange={(e) => setSelectionCriteria(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {isSubmitting ? "Publishing…" : "Publish External Job"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
