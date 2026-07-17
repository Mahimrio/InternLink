import { ArrowRight, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/page-container";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden relative selection:bg-primary/20 selection:text-primary">
      {/* ── Ambient Background Gradients ── */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[30%] -right-[15%] h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[100px]" />
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

      {/* ── Hero section ── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center py-20 sm:py-32 lg:py-40">
        <PageContainer className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm transition-all hover:bg-primary/10 hover:shadow-md">
            <Sparkles className="size-4 text-amber-500 animate-pulse" />
            <span>AI-Powered Career Platform</span>
          </div>

          {/* Heading */}
          <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 [animation-fill-mode:backwards] max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your internship journey,{" "}
            <span className="relative whitespace-nowrap text-primary inline-block transition-transform duration-500 hover:scale-[1.02]">
              <span className="relative z-10">simplified</span>
              {/* Subtle underline flourish */}
              <span className="absolute bottom-1 left-0 z-0 h-3 w-full rounded-full bg-amber-400/30 blur-[2px]" />
            </span>
          </h1>

          {/* Description */}
          <p className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 [animation-fill-mode:backwards] mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Connect with top companies, get AI-powered resume feedback, and
            prepare for interviews — all in one platform built for university
            students.
          </p>

          {/* CTAs */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 [animation-fill-mode:backwards] mt-12 flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Button size="lg" className="btn-gradient-animate h-14 gap-2 rounded-full px-8 text-base shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/25" render={<Link href="/register?role=Student" />} nativeButton={false}>
              <GraduationCap className="size-5" />
              I&apos;m a Student
            </Button>
            <Button variant="outline" size="lg" className="h-14 gap-2 rounded-full border-border/60 bg-background/50 backdrop-blur-sm px-8 text-base shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-muted/80 hover:shadow-md" render={<Link href="/register?role=Company" />} nativeButton={false}>
              <Briefcase className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
              I&apos;m Hiring
            </Button>
          </div>
        </PageContainer>
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
