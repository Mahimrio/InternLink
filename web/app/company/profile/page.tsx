"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Building2, Globe, Briefcase, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { useCompanyProfile } from "@/lib/company-context";
import { CompanyProfile } from "@/lib/company";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const isAbsoluteHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200, "Company name is too long"),
  corporateWebsite: z
    .string()
    .max(2048, "Website URL is too long")
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isAbsoluteHttpUrl(v), "Enter a valid absolute URL (http or https)"),
  industrySector: z.string().max(150, "Industry sector is too long"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompanyProfilePage() {
  const { accessToken } = useAuth();
  const { profile, isLoading, setProfile } = useCompanyProfile();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { companyName: "", corporateWebsite: "", industrySector: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({
        companyName: profile.companyName || "",
        corporateWebsite: profile.corporateWebsite || "",
        industrySector: profile.industrySector || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSaving(true);
      const updated = await apiClient<CompanyProfile>("/api/company/profile", {
        method: "PUT",
        token: accessToken,
        body: JSON.stringify({
          companyName: values.companyName,
          corporateWebsite: values.corporateWebsite || "",
          industrySector: values.industrySector,
        }),
      });
      setProfile(updated);
      reset({
        companyName: updated.companyName,
        corporateWebsite: updated.corporateWebsite || "",
        industrySector: updated.industrySector,
      });
      toast.success("Company profile updated");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to save company profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer narrow>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card className="border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your company details up to date. Verification status is set by administrators and
          can&apos;t be changed here.
        </p>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <CardTitle className="font-heading text-xl">Organization Details</CardTitle>
          </div>
          <CardDescription>
            This information is shown to students on your internship postings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Technologies Ltd."
                {...register("companyName")}
                className={errors.companyName ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="corporateWebsite">Corporate Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="corporateWebsite"
                  className={`pl-9 ${errors.corporateWebsite ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="https://www.example.com"
                  {...register("corporateWebsite")}
                />
              </div>
              {errors.corporateWebsite && (
                <p className="text-xs text-destructive">{errors.corporateWebsite.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industrySector">Industry Sector</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="industrySector"
                  className="pl-9"
                  placeholder="e.g. Software & IT Services"
                  {...register("industrySector")}
                />
              </div>
              {errors.industrySector && (
                <p className="text-xs text-destructive">{errors.industrySector.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSaving || !isDirty}
                className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white shadow-sm min-w-[150px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
