import { RoleGuard } from "@/components/shared/role-guard";
import { DashboardLayout, NavItem } from "@/components/shared/dashboard-layout";
import { LayoutDashboard, Search, FileText, ClipboardList, BookOpen, User } from "lucide-react";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard /> },
  { title: "My Profile", href: "/student/profile", icon: <User /> },
  { title: "Browse Jobs", href: "/student/jobs", icon: <Search /> },
  { title: "My Applications", href: "/student/applications", icon: <ClipboardList /> },
  { title: "My Resumes", href: "/student/resumes", icon: <FileText /> },
  { title: "Skill Assessments", href: "/student/assessments", icon: <BookOpen /> },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRole="Student">
      <DashboardLayout navItems={navItems} roleName="Student">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
