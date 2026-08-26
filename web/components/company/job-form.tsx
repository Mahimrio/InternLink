"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { CompanyJob, SkillOption, WeightedSkill } from "@/lib/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillsWeightSelector } from "@/components/company/skills-weight-selector";

const todayIso = () => new Date().toISOString().slice(0, 10);

const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  coreDescription: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description cannot exceed 5000 characters"),
  selectionCriteria: z.string().max(2000, "Selection criteria cannot exceed 2000 characters"),
  locationType: z.enum(["Remote", "OnSite", "Hybrid"], {
    message: "Select a location type",
  }),
  deadLine: z
    .string()
    .min(1, "Deadline is required")
    .refine((d) => d >= todayIso(), "Deadline must be today or later"),
  requiredSkills: z.array(
    z.object({ skillId: z.string().uuid(), weight: z.number().min(1).max(5) })
  ),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  skillOptions: SkillOption[];
  initialJob?: CompanyJob | null;
}

// The API's job DTO exposes skill names but not ids, so map names back to ids for editing.
function mapInitialSkills(job: CompanyJob | null | undefined, options: SkillOption[]): WeightedSkill[] {
  if (!job) return [];
  const idByName = new Map(options.map((o) => [o.skillName, o.id]));
  return job.requiredSkills
    .map((s) => {
      const skillId = idByName.get(s.skillName);
      return skillId ? { skillId, weight: s.weight } : null;
    })
    .filter((s): s is WeightedSkill => s !== null);
}

export function JobForm({ skillOptions, initialJob }: JobFormProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(initialJob);

  const defaultValues = useMemo<JobFormValues>(
    () => ({
      title: initialJob?.title ?? "",
      coreDescription: initialJob?.coreDescription ?? "",
      selectionCriteria: initialJob?.selectionCriteria ?? "",
      locationType: (initialJob?.locationType as JobFormValues["locationType"]) ?? "Remote",
      deadLine: initialJob?.deadLine ? initialJob.deadLine.slice(0, 10) : "",
      requiredSkills: mapInitialSkills(initialJob, skillOptions),
    }),
    [initialJob, skillOptions]
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: JobFormValues) => {
    try {
      setIsSubmitting(true);
      const body = JSON.stringify({
        title: values.title,
        coreDescription: values.coreDescription,
        selectionCriteria: values.selectionCriteria,
        locationType: values.locationType,
        // Send end-of-day so a same-day deadline is still in the future server-side.
        deadLine: new Date(`${values.deadLine}T23:59:59`).toISOString(),
        requiredSkills: values.requiredSkills,
      });

      if (isEdit && initialJob) {
        await apiClient(`/api/company/jobs/${initialJob.id}`, {
          method: "PUT",
          token: accessToken,
          body,
        });
        toast.success("Job posting updated");
      } else {
        await apiClient("/api/company/jobs", {
          method: "POST",
          token: accessToken,
          body,
        });
        toast.success("Job posting created");
      }

      router.push("/company/jobs");
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to save the job posting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title</Label>
        <Input
          id="title"
          placeholder="e.g. Backend Engineering Intern"
          {...register("title")}
          className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coreDescription">Description</Label>
        <Textarea
          id="coreDescription"
          rows={6}
          placeholder="Describe the role, responsibilities, team, and what the intern will work on…"
          {...register("coreDescription")}
          className={errors.coreDescription ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.coreDescription && (
          <p className="text-xs text-destructive">{errors.coreDescription.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="selectionCriteria">Selection Criteria</Label>
        <Textarea
          id="selectionCriteria"
          rows={4}
          placeholder="What will you evaluate candidates on? e.g. relevant projects, CGPA, communication…"
          {...register("selectionCriteria")}
          className={errors.selectionCriteria ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.selectionCriteria && (
          <p className="text-xs text-destructive">{errors.selectionCriteria.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="locationType">Location Type</Label>
          <Controller
            name="locationType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="locationType" className="w-full">
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="OnSite">On-site</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.locationType && (
            <p className="text-xs text-destructive">{errors.locationType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadLine">Application Deadline</Label>
          <Input
            id="deadLine"
            type="date"
            min={todayIso()}
            {...register("deadLine")}
            className={errors.deadLine ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.deadLine && <p className="text-xs text-destructive">{errors.deadLine.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Required Skills &amp; Importance</Label>
        <Controller
          name="requiredSkills"
          control={control}
          render={({ field }) => (
            <SkillsWeightSelector
              options={skillOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.push("/company/jobs")}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white shadow-sm min-w-[150px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              {isEdit ? "Save changes" : "Publish job"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
