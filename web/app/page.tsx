import {
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Mic,
  Rocket,
  Search,
  Sparkles,
  Target,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shared/page-container";
import { Reveal } from "@/components/shared/reveal";

const features = [
  {
    icon: FileText,
    title: "AI Resume Scoring",
    description:
      "Build your resume step by step and get instant ATS-style scoring with concrete suggestions to improve it.",
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description:
      "Semantic recommendations that match your real skills and interests — not just keyword overlap.",
  },
  {
    icon: Award,
    title: "Verified Skill Badges",
    description:
      "Take skill assessments and earn badges that companies can actually trust when screening applicants.",
  },
  {
    icon: Mic,
    title: "AI Interview Prep",
    description:
      "Practice with adaptive question banks and mock interviews, with instant feedback on your answers.",
  },
  {
    icon: ClipboardList,
    title: "Hiring Pipeline (ATS)",
    description:
      "Companies screen, schedule, and track every applicant through a single kanban-style pipeline.",
  },
  {
    icon: HeartHandshake,
    title: "Counselor Guidance",
    description:
      "University career counselors follow your progress and leave actionable, personal feedback.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Create your profile",
    description:
      "Sign up as a student, add your skills, and build a polished resume with the guided, AI-scored builder.",
  },
  {
    icon: Target,
    title: "Get matched",
    description:
      "AI matching surfaces the internships that genuinely fit your skills, interests, and availability.",
  },
  {
    icon: Rocket,
    title: "Apply & grow",
    description:
      "Apply in one click, track every application, and prep for interviews — all the way to the offer.",
  },
];

const studentPerks = [
  "Guided resume builder with AI feedback",
  "Personalized internship recommendations",
  "Skill assessments & verified badges",
  "Mock interviews with instant scoring",
];

const companyPerks = [
  "Post internships to a curated student pool",
  "Full ATS pipeline from application to offer",
  "AI-assisted applicant screening",
  "Skill badges verified by assessments",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden relative selection:bg-primary/20 selection:text-primary">
      {/* ── Ambient Background Gradients ── */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-150 w-150 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[15%] right-[-15%] h-125 w-125 rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="absolute bottom-[5%] left-[-10%] h-125 w-125 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* ── Minimal top nav placeholder ── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-md shadow-sm transition-all">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-primary/30">
              <Briefcase className="size-4.5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
              InternLink
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <div className="mr-2 hidden items-center md:flex">
              <Link href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Features
              </Link>
              <Link href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                How it works
              </Link>
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex hover:bg-primary/5 transition-colors" render={<Link href="/login" />} nativeButton={false}>
              Log in
            </Button>
            <Button size="sm" className="btn-gradient-animate group shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" render={<Link href="/register" />} nativeButton={false}>
              Get Started
              <ArrowRight data-icon="inline-end" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {/* ── Hero section ── */}
        <section className="flex flex-col items-center justify-center py-20 sm:py-28 lg:py-36">
        <PageContainer className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm transition-all hover:bg-primary/10 hover:shadow-md">
            <Sparkles className="size-4 text-amber-500 animate-pulse" />
            <span>AI-Powered Career Platform</span>
          </div>

          {/* Heading */}
          <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-[backwards] max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your internship journey,{" "}
            <span className="relative whitespace-nowrap text-primary inline-block transition-transform duration-500 hover:scale-[1.02]">
              <span className="relative z-10">simplified</span>
              {/* Subtle underline flourish */}
              <span className="absolute bottom-1 left-0 z-0 h-3 w-full rounded-full bg-amber-400/30 blur-[2px]" />
            </span>
          </h1>

          {/* Description */}
          <p className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 fill-mode-[backwards] mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Connect with top companies, get AI-powered resume feedback, and
            prepare for interviews — all in one platform built for university
            students.
          </p>

          {/* CTAs */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-[backwards] mt-12 flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Button size="lg" className="btn-gradient-animate h-14 gap-2 rounded-full px-8 text-base shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/25" render={<Link href="/register?role=Student" />} nativeButton={false}>
              <GraduationCap className="size-5" />
              I&apos;m a Student
            </Button>
            <Button variant="outline" size="lg" className="h-14 gap-2 rounded-full border-border/60 bg-background/50 backdrop-blur-sm px-8 text-base shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-muted/80 hover:shadow-md" render={<Link href="/register?role=Company" />} nativeButton={false}>
              <Briefcase className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
              I&apos;m Hiring
            </Button>
          </div>

          {/* Platform facts */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-[backwards] mt-16 grid w-full max-w-2xl grid-cols-3 divide-x divide-border/60 rounded-2xl border border-border/60 bg-background/60 shadow-md shadow-primary/5 backdrop-blur-sm">
            {[
              { value: "7+", label: "AI career tools" },
              { value: "4", label: "Tailored roles" },
              { value: "Free", label: "For students" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 px-4 py-5">
                <span className="font-heading text-2xl font-bold text-primary sm:text-3xl">{stat.value}</span>
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Dashboard preview mockup */}
          <div className="animate-in fade-in zoom-in-95 duration-1000 delay-1000 fill-mode-[backwards] relative mt-20 w-full max-w-4xl">
            <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-linear-to-r from-primary/15 via-amber-400/10 to-primary/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 text-left shadow-2xl shadow-primary/10 backdrop-blur-sm">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-emerald-400/70" />
                <div className="ml-3 flex h-6 w-full max-w-64 items-center rounded-md bg-background/80 px-3 text-[11px] font-medium text-muted-foreground">
                  internlink.app/student/dashboard
                </div>
              </div>
              <div className="grid sm:grid-cols-[190px_1fr]">
                {/* Sidebar */}
                <div className="hidden flex-col border-r border-border/60 bg-muted/20 p-4 sm:flex">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary shadow-sm">
                      <Briefcase className="size-3.5 text-primary-foreground" />
                    </div>
                    <span className="font-heading text-sm font-bold">InternLink</span>
                  </div>
                  <div className="mt-5 space-y-1">
                    <div className="flex items-center gap-2.5 rounded-md bg-primary/10 px-2.5 py-2 text-xs font-semibold text-primary">
                      <LayoutDashboard className="size-3.5" />
                      Dashboard
                    </div>
                    {[
                      { icon: Search, label: "Browse Jobs" },
                      { icon: ClipboardList, label: "My Applications" },
                      { icon: FileText, label: "My Resumes" },
                      { icon: Award, label: "Assessments" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-muted-foreground">
                        <item.icon className="size-3.5" />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main content */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading text-base font-bold">Welcome back, Ayesha</p>
                      <Skeleton className="mt-1.5 h-2.5 w-40" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Bell className="size-4 text-muted-foreground" />
                        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500" />
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        AR
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      { label: "Active Applications", value: "3" },
                      { label: "Interviews", value: "2" },
                      { label: "Resume Score", value: "87" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border/60 bg-background p-3.5 shadow-sm">
                        <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 font-heading text-lg font-bold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-semibold">Recommended for you</p>
                    <div className="mt-2.5 space-y-2.5">
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3.5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                            <Briefcase className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">Frontend Intern · TechCorp</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">Remote · 12 days left</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          92% match
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3.5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                            <Building2 className="size-4 text-amber-600" />
                          </div>
                          <div className="space-y-1.5">
                            <Skeleton className="h-3 w-36" />
                            <Skeleton className="h-2.5 w-24" />
                          </div>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                          87% match
                        </span>
                      </div>
                      {/* still-loading row keeps the skeleton aesthetic */}
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3.5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-lg" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3 w-40" />
                            <Skeleton className="h-2.5 w-28" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating chips */}
            <div className="animate-float absolute -top-5 -right-4 hidden items-center gap-2.5 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-xl shadow-primary/10 lg:flex">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Resume score</p>
                <p className="font-heading text-sm font-bold text-primary">87 / 100</p>
              </div>
            </div>
            <div className="animate-float-delayed absolute -bottom-6 -left-6 hidden items-center gap-2.5 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-xl shadow-amber-500/10 lg:flex">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Sparkles className="size-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">New match</p>
                <p className="text-sm font-medium text-muted-foreground">Frontend Intern · 92%</p>
              </div>
            </div>
          </div>
        </PageContainer>
        </section>

        {/* ── Features ── */}
        <section id="features" className="scroll-mt-20 border-y border-border/40 bg-muted/20 py-20 sm:py-24">
          <PageContainer>
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Features</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to get hired
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                One platform covering the whole journey — from your first resume
                draft to the final interview.
              </p>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 100} className="h-full">
                  <div className="group h-full rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/25">
                      <feature.icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </PageContainer>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-24">
          <PageContainer>
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps from campus to career
              </h2>
            </Reveal>
            <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-8">
              {/* connecting line (desktop) */}
              <div className="pointer-events-none absolute top-7 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-primary/10 via-primary/40 to-primary/10 sm:block" />
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 150}>
                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 mb-5 flex size-14 items-center justify-center rounded-full border border-primary/20 bg-background shadow-md shadow-primary/10 transition-transform duration-300 hover:scale-110">
                      <step.icon className="size-6 text-primary" />
                      <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-amber-500 font-heading text-xs font-bold text-amber-950 shadow-sm">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </PageContainer>
        </section>

        {/* ── For students & companies ── */}
        <section className="pb-20 sm:pb-24">
          <PageContainer>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Students */}
              <Reveal className="h-full">
                <div className="h-full rounded-2xl border border-primary/20 bg-card/80 p-8 shadow-xl shadow-primary/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 sm:p-10">
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                  <GraduationCap className="size-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">For Students</h3>
                <p className="mt-2 text-muted-foreground">
                  Stand out before you even graduate.
                </p>
                <ul className="mt-6 space-y-3">
                  {studentPerks.map((perk) => (
                    <li key={perk} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button className="btn-gradient-animate mt-8 h-11 gap-2 rounded-full px-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" render={<Link href="/register?role=Student" />} nativeButton={false}>
                  Create student account
                  <ArrowRight className="size-4" />
                </Button>
                </div>
              </Reveal>

              {/* Companies */}
              <Reveal delay={150} className="h-full">
                <div className="h-full rounded-2xl border border-amber-500/20 bg-card/80 p-8 shadow-xl shadow-amber-500/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 sm:p-10">
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 shadow-sm">
                  <Building2 className="size-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">For Companies</h3>
                <p className="mt-2 text-muted-foreground">
                  Find motivated, pre-vetted interns faster.
                </p>
                <ul className="mt-6 space-y-3">
                  {companyPerks.map((perk) => (
                    <li key={perk} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-8 h-11 gap-2 rounded-full px-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" render={<Link href="/register?role=Company" />} nativeButton={false}>
                  Start hiring
                  <ArrowRight className="size-4" />
                </Button>
                </div>
              </Reveal>
            </div>
            <Reveal delay={300}>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Counselors and admins get dedicated workspaces too — accounts are
                provisioned by your university.
              </p>
            </Reveal>
          </PageContainer>
        </section>

        {/* ── Final CTA ── */}
        <section className="pb-24">
          <PageContainer>
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center shadow-2xl shadow-primary/25 sm:px-16">
              <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-amber-400/20 blur-3xl" />
              <h2 className="relative text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Your career starts before graduation
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80 sm:text-lg">
                Join InternLink today — build your resume, get matched, and land
                the internship.
              </p>
              <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" className="h-12 gap-2 rounded-full px-8 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg" render={<Link href="/register" />} nativeButton={false}>
                  Get started free
                  <ArrowRight className="size-4" />
                </Button>
                <Button size="lg" variant="ghost" className="h-12 rounded-full px-8 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground" render={<Link href="/login" />} nativeButton={false}>
                  Log in
                </Button>
              </div>
              </div>
            </Reveal>
          </PageContainer>
        </section>
      </main>

      {/* ── Footer placeholder ── */}
      <footer className="relative z-10 border-t border-border/40 bg-muted/10 py-8 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row lg:px-12">
          <div className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
              <Briefcase className="size-3.5 text-primary" />
            </div>
            <span className="font-medium text-foreground/80">&copy; {new Date().getFullYear()} InternLink</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium border border-border/50 shadow-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-amber-500"></span>
              </span>
              CSE 3200
            </span>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium border border-border/50 shadow-sm">
              AUST
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
