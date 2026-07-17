"use client";

import { notFound } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

/* ─── Gate: dev only ─── */
if (process.env.NODE_ENV === "production") notFound();

/* ─── Color swatch data ─── */
const tealShades = [
  { name: "50", cls: "bg-teal-50", textCls: "text-teal-950" },
  { name: "100", cls: "bg-teal-100", textCls: "text-teal-950" },
  { name: "200", cls: "bg-teal-200", textCls: "text-teal-950" },
  { name: "300", cls: "bg-teal-300", textCls: "text-teal-950" },
  { name: "400", cls: "bg-teal-400", textCls: "text-teal-50" },
  { name: "500", cls: "bg-teal-500", textCls: "text-teal-50" },
  { name: "600", cls: "bg-teal-600", textCls: "text-teal-50" },
  { name: "700", cls: "bg-teal-700", textCls: "text-teal-50" },
  { name: "800", cls: "bg-teal-800", textCls: "text-teal-50" },
  { name: "900", cls: "bg-teal-900", textCls: "text-teal-50" },
  { name: "950", cls: "bg-teal-950", textCls: "text-teal-50" },
];

const amberShades = [
  { name: "50", cls: "bg-amber-50", textCls: "text-amber-950" },
  { name: "100", cls: "bg-amber-100", textCls: "text-amber-950" },
  { name: "200", cls: "bg-amber-200", textCls: "text-amber-950" },
  { name: "300", cls: "bg-amber-300", textCls: "text-amber-950" },
  { name: "400", cls: "bg-amber-400", textCls: "text-amber-950" },
  { name: "500", cls: "bg-amber-500", textCls: "text-amber-50" },
  { name: "600", cls: "bg-amber-600", textCls: "text-amber-50" },
  { name: "700", cls: "bg-amber-700", textCls: "text-amber-50" },
  { name: "800", cls: "bg-amber-800", textCls: "text-amber-50" },
  { name: "900", cls: "bg-amber-900", textCls: "text-amber-50" },
  { name: "950", cls: "bg-amber-950", textCls: "text-amber-50" },
];

const semanticColors = [
  { name: "background", cls: "bg-background", border: true },
  { name: "foreground", cls: "bg-foreground" },
  { name: "primary", cls: "bg-primary" },
  { name: "primary-foreground", cls: "bg-primary-foreground", border: true },
  { name: "secondary", cls: "bg-secondary", border: true },
  { name: "muted", cls: "bg-muted", border: true },
  { name: "accent", cls: "bg-accent" },
  { name: "destructive", cls: "bg-destructive" },
  { name: "border", cls: "bg-border" },
  { name: "card", cls: "bg-card", border: true },
  { name: "popover", cls: "bg-popover", border: true },
  { name: "ring", cls: "bg-ring" },
];

/* ─── Type scale data ─── */
const typeScale = [
  { cls: "text-xs", label: "text-xs", size: "0.75rem / 1rem" },
  { cls: "text-sm", label: "text-sm", size: "0.875rem / 1.25rem" },
  { cls: "text-base", label: "text-base", size: "1rem / 1.5rem" },
  { cls: "text-lg", label: "text-lg", size: "1.125rem / 1.75rem" },
  { cls: "text-xl", label: "text-xl", size: "1.25rem / 1.75rem" },
  { cls: "text-2xl", label: "text-2xl", size: "1.5rem / 2rem" },
  { cls: "text-3xl", label: "text-3xl", size: "1.875rem / 2.25rem" },
  { cls: "text-4xl", label: "text-4xl", size: "2.25rem / 2.5rem" },
];

/* ─── Section wrapper ─── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <Separator />
      {children}
    </section>
  );
}

/* ─── Color swatch row ─── */
function ColorRow({
  label,
  shades,
}: {
  label: string;
  shades: typeof tealShades;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <div className="grid grid-cols-11 gap-1">
        {shades.map((s) => (
          <div
            key={s.name}
            className={`${s.cls} ${s.textCls} flex aspect-square flex-col items-center justify-center rounded-lg text-[10px] font-medium`}
          >
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <PageContainer className="space-y-16">
        {/* ── Header ── */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            InternLink Style Guide
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Internal design reference — dev only. Shows all design tokens,
            components, and variants.
          </p>
          <Badge variant="outline" className="mt-3">
            Dev Environment Only
          </Badge>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  1. COLOR PALETTE                                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Color Palette">
          <ColorRow label="Primary — Teal" shades={tealShades} />
          <ColorRow label="Accent — Amber" shades={amberShades} />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Semantic Colors (CSS Variables)
            </h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {semanticColors.map((c) => (
                <div key={c.name} className="flex flex-col items-center gap-1">
                  <div
                    className={`${c.cls} size-12 rounded-lg shadow-sm ${
                      c.border ? "border border-border" : ""
                    }`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  2. TYPOGRAPHY                                               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Typography">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Display Font — Space Grotesk (Headings)
              </h3>
              <div className="space-y-2 rounded-lg border border-border p-4">
                <p className="font-heading text-3xl font-bold">
                  The quick brown fox jumps over the lazy dog
                </p>
                <p className="font-heading text-xl font-semibold">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz ·
                  0123456789
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Body Font — Inter (Body Text)
              </h3>
              <div className="space-y-2 rounded-lg border border-border p-4">
                <p className="font-sans text-lg">
                  The quick brown fox jumps over the lazy dog
                </p>
                <p className="font-sans text-base">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz ·
                  0123456789
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Type Scale
              </h3>
              <div className="space-y-3">
                {typeScale.map((t) => (
                  <div
                    key={t.cls}
                    className="flex items-baseline gap-4 rounded-lg border border-border px-4 py-3"
                  >
                    <code className="w-24 shrink-0 text-xs text-muted-foreground">
                      {t.label}
                    </code>
                    <span className={t.cls}>
                      The quick brown fox jumps over the lazy dog
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {t.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  3. ICONS                                                    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Icon Sizes (Lucide React)">
          <div className="flex items-end gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Search size={16} />
                <Bell size={16} />
                <Settings size={16} />
                <Mail size={16} />
                <Star size={16} />
              </div>
              <span className="text-xs text-muted-foreground">
                16px — Dense UI, tables, compact controls
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Search size={20} />
                <Bell size={20} />
                <Settings size={20} />
                <Mail size={20} />
                <Star size={20} />
              </div>
              <span className="text-xs text-muted-foreground">
                20px — Inline, nav items, standard controls
              </span>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  4. BUTTONS                                                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Button">
          <div className="space-y-6">
            {/* Variants */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Variants
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Default (Primary)</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {/* States */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                States
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
                <Button disabled variant="outline">
                  Disabled Outline
                </Button>
                <Button disabled>
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </Button>
                <Button>
                  <Check className="size-4" />
                  With Icon
                </Button>
                <Button variant="outline">
                  Action
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  5. INPUT & TEXTAREA                                         */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Input & Textarea">
          <div className="grid max-w-lg gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sg-input-default">Default Input</Label>
              <Input
                id="sg-input-default"
                placeholder="Enter your email…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sg-input-disabled">Disabled Input</Label>
              <Input
                id="sg-input-disabled"
                placeholder="Cannot edit"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sg-textarea">Textarea</Label>
              <Textarea
                id="sg-textarea"
                placeholder="Write your cover letter…"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sg-textarea-disabled">
                Disabled Textarea
              </Label>
              <Textarea
                id="sg-textarea-disabled"
                placeholder="Cannot edit"
                disabled
                rows={2}
              />
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  6. SELECT                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Select">
          <div className="max-w-xs space-y-1.5">
            <Label>Department</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cse">Computer Science</SelectItem>
                <SelectItem value="eee">Electrical Engineering</SelectItem>
                <SelectItem value="me">Mechanical Engineering</SelectItem>
                <SelectItem value="ce">Civil Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  7. BADGE                                                    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Badge">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  8. CARD                                                     */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Frontend Intern</CardTitle>
                <CardDescription>TechNest Solutions · Dhaka</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Tailwind</Badge>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-sm text-muted-foreground">
                  ৳15,000/mo
                </span>
                <Button size="sm">Apply</Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Data Analyst Intern</CardTitle>
                <CardDescription>DataForge Inc. · Remote</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">SQL</Badge>
                  <Badge variant="secondary">Pandas</Badge>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-sm text-muted-foreground">
                  ৳20,000/mo
                </span>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-48" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  9. AVATAR                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Avatar">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage
                src="https://api.dicebear.com/9.x/initials/svg?seed=MA"
                alt="MA"
              />
              <AvatarFallback>MA</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://api.dicebear.com/9.x/initials/svg?seed=RK"
                alt="RK"
              />
              <AvatarFallback>RK</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>
                <User className="size-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  10. TABLE                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Table">
          <div className="rounded-lg border border-border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    TechNest Solutions
                  </TableCell>
                  <TableCell>Frontend Intern</TableCell>
                  <TableCell>
                    <Badge className="bg-teal-100 text-teal-800">
                      Interview
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    2 days ago
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    DataForge Inc.
                  </TableCell>
                  <TableCell>Data Analyst Intern</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Under Review</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    5 days ago
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    CloudPeak Systems
                  </TableCell>
                  <TableCell>Backend Intern</TableCell>
                  <TableCell>
                    <Badge variant="destructive">Rejected</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    1 week ago
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  11. TABS                                                    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Tabs">
          <Tabs defaultValue="overview" className="max-w-lg">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Dashboard Overview</CardTitle>
                  <CardDescription>
                    Your career journey at a glance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    3 active applications · 1 interview scheduled · 87% profile
                    completion
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="applications" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Your Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Application list would go here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Charts and statistics would render here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  12. SKELETON (Loading States)                               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Skeleton (Loading States)">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  13. DIALOG                                                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Dialog">
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Application</DialogTitle>
                <DialogDescription>
                  Are you sure you want to apply for Frontend Intern at TechNest
                  Solutions? You can attach a cover letter below.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Optional cover letter…"
                rows={3}
              />
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button>Submit Application</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  14. DROPDOWN MENU                                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Dropdown Menu">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" className="gap-1.5">
                Actions
                <ChevronDown className="size-4" />
              </Button>
            } />
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Application</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Briefcase className="size-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="size-4" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="size-4" />
                Save for Later
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="size-4" />
                Withdraw
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  15. TOAST                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Toast (Sonner)">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success("Application submitted!")}
            >
              Success Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error("Failed to submit application.")}
            >
              Error Toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Your resume is being analyzed by AI…")
              }
            >
              Info Toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.warning("Deadline is in 24 hours!")
              }
            >
              Warning Toast
            </Button>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  16. SPACING & ELEVATION TOKENS                              */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <Section title="Elevation & Radius">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Standard Card Elevation: shadow-sm + border
              </h3>
              <div className="flex gap-4">
                <div className="flex size-24 items-center justify-center rounded-lg border border-border bg-card text-xs text-muted-foreground shadow-sm">
                  shadow-sm
                  <br />+ border
                </div>
                <div className="flex size-24 items-center justify-center rounded-lg border border-border bg-card text-xs text-muted-foreground">
                  border only
                  <br />
                  (no shadow)
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Border Radius Token: 0.5rem (rounded-lg)
              </h3>
              <div className="flex gap-4">
                {(
                  [
                    ["rounded-sm", "sm"],
                    ["rounded-md", "md"],
                    ["rounded-lg", "lg ✓"],
                    ["rounded-xl", "xl"],
                  ] as const
                ).map(([cls, label]) => (
                  <div
                    key={cls}
                    className={`${cls} flex size-16 items-center justify-center border-2 text-xs font-medium ${
                      cls === "rounded-lg"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Use <code className="text-foreground">rounded-lg</code>{" "}
                consistently. The highlighted swatch above is the standard.
              </p>
            </div>
          </div>
        </Section>

        {/* ── Footer ── */}
        <div className="pb-10 text-center text-sm text-muted-foreground">
          <Sparkles className="mx-auto mb-2 size-5 text-amber-500" />
          End of style guide · InternLink Design System
        </div>
      </PageContainer>
    </div>
  );
}
