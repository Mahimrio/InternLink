"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileCheck,
  Plus,
  Trash2,
  Download
} from "lucide-react";

const STEPS = [
  { id: "personal-info", title: "Personal Info", icon: User },
  { id: "education", title: "Education", icon: GraduationCap },
  { id: "experience", title: "Experience", icon: Briefcase },
  { id: "skills", title: "Skills & Stack", icon: Wrench },
  { id: "review", title: "Review & Finalize", icon: FileCheck },
];

const PRESET_SKILLS = [
  "C#",
  ".NET Core",
  "ASP.NET Core",
  "PostgreSQL",
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Docker",
  "Entity Framework Core",
  "REST APIs",
  "Git & GitHub",
  "Python",
  "SQL",
  "Azure",
  "Unit Testing",
  "CI/CD Pipelines"
];

interface SkillItem {
  name: string;
  proficiency: number;
}

interface ResumeData {
  "personal-info"?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  education?: {
    institution?: string;
    degree?: string;
    department?: string;
    gradYear?: string;
    cgpa?: string;
    honors?: string;
  };
  experience?: {
    company?: string;
    role?: string;
    duration?: string;
    responsibilities?: string;
    projects?: string;
  };
  skills?: SkillItem[];
}

function ResumeBuilderContent() {
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Form states per step
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  });

  const [education, setEducation] = useState({
    institution: "",
    degree: "",
    department: "",
    gradYear: "",
    cgpa: "",
    honors: "",
  });

  const [experience, setExperience] = useState({
    company: "",
    role: "",
    duration: "",
    responsibilities: "",
    projects: "",
  });

  const [skills, setSkills] = useState<SkillItem[]>([
    { name: "C#", proficiency: 4 },
    { name: ".NET Core", proficiency: 4 },
    { name: "PostgreSQL", proficiency: 4 },
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Initialize or load draft
  useEffect(() => {
    if (!accessToken) {
      if (!isAuthLoading) {
        Promise.resolve().then(() => setIsLoading(false));
      }
      return;
    }

    let isMounted = true;

    async function initWizard() {
      try {
        const queryId = searchParams.get("resumeId");

        if (queryId) {
          setResumeId(queryId);
          // Fetch existing resume to populate steps
          const resumes = await apiClient<Array<{ id: string; dynamicJsonData?: string }>>(
            "/api/student/resumes",
            { token: accessToken }
          );
          const target = resumes.find((r) => r.id === queryId);
          if (target && target.dynamicJsonData && isMounted) {
            try {
              const parsed: ResumeData = JSON.parse(target.dynamicJsonData);
              if (parsed["personal-info"]) setPersonalInfo((prev) => ({ ...prev, ...parsed["personal-info"] }));
              if (parsed.education) setEducation((prev) => ({ ...prev, ...parsed.education }));
              if (parsed.experience) setExperience((prev) => ({ ...prev, ...parsed.experience }));
              if (parsed.skills) setSkills(parsed.skills);
            } catch {
              // Parse error
            }
          }
        } else {
          // Initialize fresh draft
          const res = await apiClient<{ resumeId: string }>("/api/student/resumes", {
            method: "POST",
            token: accessToken,
          });
          setResumeId(res.resumeId);

          // Auto-fill personal info from student profile if available
          try {
            const profile = await apiClient<{
              firstName?: string;
              lastName?: string;
              department?: string;
              cgpa?: number;
              biography?: string;
            }>("/api/student/profile", { token: accessToken });

            if (profile) {
              setPersonalInfo((prev) => ({
                ...prev,
                fullName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
                summary: profile.biography || "",
              }));
              setEducation((prev) => ({
                ...prev,
                department: profile.department || "",
                cgpa: profile.cgpa ? String(profile.cgpa) : "",
              }));
            }
          } catch {
            // Profile fetch optional
          }
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || "Failed to initialize resume wizard");
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      initWizard();
    }

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, searchParams]);

  // Progressive save helper for single step
  const saveCurrentStep = async (stepIdx: number): Promise<boolean> => {
    if (!resumeId || !accessToken) return true;
    const stepId = STEPS[stepIdx].id;
    if (stepId === "review") return true;

    try {
      setIsSaving(true);
      let payload: unknown = {};

      if (stepId === "personal-info") payload = personalInfo;
      else if (stepId === "education") payload = education;
      else if (stepId === "experience") payload = experience;
      else if (stepId === "skills") payload = skills;

      await apiClient(`/api/student/resumes/${resumeId}/step/${stepId}`, {
        method: "PUT",
        token: accessToken,
        body: JSON.stringify(payload),
      });

      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || `Failed to save ${STEPS[stepIdx].title}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    const success = await saveCurrentStep(currentStepIndex);
    if (success && currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinalize = async () => {
    if (!resumeId || !accessToken) return;

    try {
      setIsFinalizing(true);
      await apiClient<{ documentPath: string; downloadUrl: string }>(
        `/api/student/resumes/${resumeId}/finalize`,
        {
          method: "POST",
          token: accessToken,
        }
      );

      toast.success("Resume finalized and PDF compiled successfully!");
      router.push("/student/resumes");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to finalize resume PDF");
    } finally {
      setIsFinalizing(false);
    }
  };

  // Skill management helpers
  const handleAddPresetSkill = (name: string) => {
    if (!skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setSkills([...skills, { name, proficiency: 3 }]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, { name: trimmed, proficiency: 3 }]);
      setCustomSkillInput("");
    }
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter((s) => s.name !== name));
  };

  const handleProficiencyChange = (name: string, val: number) => {
    setSkills(
      skills.map((s) => (s.name === name ? { ...s, proficiency: val } : s))
    );
  };

  if (isLoading || isAuthLoading) {
    return (
      <PageContainer className="py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  const currentStep = STEPS[currentStepIndex];

  return (
    <PageContainer className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Interactive Resume Wizard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build, edit, and stream in-memory PDF resumes formatted for university ATS systems.
          </p>
        </div>
        {resumeId && (
          <Badge variant="outline" className="w-fit px-3 py-1 border-teal-200 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300">
            <CheckCircle2 className="size-3.5 mr-1.5 text-teal-600" />
            Draft Auto-Saving
          </Badge>
        )}
      </div>

      {/* Stepper Navigation */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[650px] p-2 bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={async () => {
                  if (idx !== currentStepIndex) {
                    await saveCurrentStep(currentStepIndex);
                    setCurrentStepIndex(idx);
                  }
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-teal-700 text-white shadow-sm"
                    : isCompleted
                    ? "text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800"
                    : "text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? "bg-white/20 text-white"
                      : isCompleted
                      ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
                </div>
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <currentStep.icon className="size-5 text-teal-600" />
            <CardTitle className="font-heading text-xl">{currentStep.title}</CardTitle>
          </div>
          <CardDescription>
            {currentStepIndex === 0 && "Provide your contact details and a concise elevator pitch summary."}
            {currentStepIndex === 1 && "Highlight your academic program, university credentials, and graduation timeline."}
            {currentStepIndex === 2 && "Detail your prior work experience, internships, or notable course projects."}
            {currentStepIndex === 3 && "Select and rate your technical proficiencies (synced with your institutional skill matrix)."}
            {currentStepIndex === 4 && "Review your complete resume and compile the official QuestPDF document."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* STEP 1: PERSONAL INFO */}
          {currentStepIndex === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    placeholder="e.g. Tariq Ahmed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="e.g. student@aust.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="+8801700000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location / City</Label>
                  <Input
                    id="location"
                    value={personalInfo.location}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                    placeholder="Dhaka, Bangladesh"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  rows={4}
                  value={personalInfo.summary}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                  placeholder="Dedicated Software Engineering student with high proficiency in .NET Core, cloud architectures, and modern web application development..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION */}
          {currentStepIndex === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution">University / College</Label>
                  <Input
                    id="institution"
                    value={education.institution}
                    onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                    placeholder="Ahsanullah University of Science & Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree & Major</Label>
                  <Input
                    id="degree"
                    value={education.degree}
                    onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                    placeholder="B.Sc. in Computer Science & Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={education.department}
                    onChange={(e) => setEducation({ ...education, department: e.target.value })}
                    placeholder="CSE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradYear">Graduation Year</Label>
                  <Input
                    id="gradYear"
                    value={education.gradYear}
                    onChange={(e) => setEducation({ ...education, gradYear: e.target.value })}
                    placeholder="2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA</Label>
                  <Input
                    id="cgpa"
                    value={education.cgpa}
                    onChange={(e) => setEducation({ ...education, cgpa: e.target.value })}
                    placeholder="3.85"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="honors">Academic Honors & Distinctions</Label>
                <Textarea
                  id="honors"
                  rows={3}
                  value={education.honors}
                  onChange={(e) => setEducation({ ...education, honors: e.target.value })}
                  placeholder="Dean's List of Honor (3 Semesters), University Merit Scholarship..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: EXPERIENCE */}
          {currentStepIndex === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company / Organization</Label>
                  <Input
                    id="company"
                    value={experience.company}
                    onChange={(e) => setExperience({ ...experience, company: e.target.value })}
                    placeholder="Tech Solutions Ltd. or Open Source Contributor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Position</Label>
                  <Input
                    id="role"
                    value={experience.role}
                    onChange={(e) => setExperience({ ...experience, role: e.target.value })}
                    placeholder="Software Engineer Intern / Full Stack Developer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Timeline / Duration</Label>
                <Input
                  id="duration"
                  value={experience.duration}
                  onChange={(e) => setExperience({ ...experience, duration: e.target.value })}
                  placeholder="June 2025 – Present"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibilities">Key Responsibilities & Impact</Label>
                <Textarea
                  id="responsibilities"
                  rows={4}
                  value={experience.responsibilities}
                  onChange={(e) => setExperience({ ...experience, responsibilities: e.target.value })}
                  placeholder="• Developed high-throughput REST APIs using ASP.NET Core 8 and EF Core.&#10;• Designed interactive frontends in Next.js 14 with Tailwind CSS."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projects">Academic & Capstone Projects</Label>
                <Textarea
                  id="projects"
                  rows={3}
                  value={experience.projects}
                  onChange={(e) => setExperience({ ...experience, projects: e.target.value })}
                  placeholder="InternLink Portal (AUST CSE 3200 Capstone): Full stack AI career platform connecting students and recruiters."
                />
              </div>
            </div>
          )}

          {/* STEP 4: SKILLS */}
          {currentStepIndex === 3 && (
            <div className="space-y-6">
              {/* Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Select Core Skills
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SKILLS.map((preset) => {
                    const isSelected = skills.some((s) => s.name.toLowerCase() === preset.toLowerCase());
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddPresetSkill(preset)}
                        disabled={isSelected}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-all ${
                          isSelected
                            ? "bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300 opacity-60 cursor-default"
                            : "bg-white border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                        }`}
                      >
                        + {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Add */}
              <div className="flex items-center gap-2">
                <Input
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Add custom skill (e.g. Microservices, Redis, PyTorch)..."
                />
                <Button type="button" onClick={handleAddCustomSkill} variant="outline" className="shrink-0">
                  <Plus className="size-4 mr-1" /> Add Skill
                </Button>
              </div>

              {/* Selected Skills List with Sliders */}
              <div className="space-y-3 pt-2">
                <Label className="font-semibold text-sm">Configured Skills & Proficiency Levels (1-5)</Label>
                {skills.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No skills added yet. Choose from above.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                      >
                        <div className="space-y-1">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {skill.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 font-medium">
                            <span>Level {skill.proficiency}/5:</span>
                            <span>
                              {skill.proficiency === 5
                                ? "Expert"
                                : skill.proficiency === 4
                                ? "Advanced"
                                : skill.proficiency === 3
                                ? "Intermediate"
                                : skill.proficiency === 2
                                ? "Familiar"
                                : "Beginner"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={skill.proficiency}
                            onChange={(e) => handleProficiencyChange(skill.name, Number(e.target.value))}
                            className="w-20 accent-teal-600 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & FINALIZE */}
          {currentStepIndex === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 dark:bg-teal-950/30 dark:border-teal-800 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-semibold">
                  <CheckCircle2 className="size-5 text-teal-600" />
                  Ready to compile official ATS-ready PDF
                </div>
                <p className="text-xs text-teal-800/80 dark:text-teal-300/80">
                  Review the summary below. Clicking Finalize will render the PDF in memory using QuestPDF and upload it directly to Supabase Storage.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-white dark:bg-slate-900 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Personal Information</span>
                  <p className="font-bold text-slate-900 dark:text-white">{personalInfo.fullName || "Not specified"}</p>
                  <p className="text-xs text-muted-foreground">{personalInfo.email} • {personalInfo.phone}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 line-clamp-3">{personalInfo.summary}</p>
                </div>

                <div className="p-4 rounded-lg border bg-white dark:bg-slate-900 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Education Credentials</span>
                  <p className="font-bold text-slate-900 dark:text-white">{education.institution || "Not specified"}</p>
                  <p className="text-xs text-muted-foreground">{education.degree} ({education.gradYear})</p>
                  <p className="text-xs text-teal-700 font-medium">CGPA: {education.cgpa || "N/A"}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-white dark:bg-slate-900 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Configured Skills ({skills.length})</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((s) => (
                    <Badge key={s.name} variant="secondary" className="px-2.5 py-1 text-xs">
                      {s.name} • Lvl {s.proficiency}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSaving || isFinalizing}
          >
            <ChevronLeft className="size-4 mr-1" /> Back
          </Button>

          <div className="flex items-center gap-3">
            {currentStepIndex < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="size-4 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="bg-gradient-to-r from-teal-600 to-teal-700 btn-gradient-animate text-white px-6"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Finalizing & Uploading PDF...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" /> Finalize & Generate PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </PageContainer>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContainer>
      }
    >
      <ResumeBuilderContent />
    </Suspense>
  );
}
