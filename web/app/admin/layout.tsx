import { RoleGuard } from "@/components/shared/role-guard";
import { DashboardLayout, NavItem } from "@/components/shared/dashboard-layout";
import { LayoutDashboard, Users, CheckCircle, Briefcase, BarChart3 } from "lucide-react";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard /> },
  { title: "User Moderation", href: "/admin/users", icon: <Users /> },
  { title: "Company Approvals", href: "/admin/companies", icon: <CheckCircle /> },
  { title: "Job Approvals", href: "/admin/jobs", icon: <Briefcase /> },
  { title: "Analytics", href: "/admin/analytics", icon: <BarChart3 /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRole="Admin">
      <DashboardLayout navItems={navItems} roleName="Admin">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
