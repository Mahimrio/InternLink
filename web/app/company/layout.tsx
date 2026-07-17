import { RoleGuard } from "@/components/shared/role-guard";
import { DashboardLayout, NavItem } from "@/components/shared/dashboard-layout";
import { LayoutDashboard, Building2, Briefcase, Users } from "lucide-react";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/company/dashboard", icon: <LayoutDashboard /> },
  { title: "Company Profile", href: "/company/profile", icon: <Building2 /> },
  { title: "Job Postings", href: "/company/jobs", icon: <Briefcase /> },
  { title: "ATS Pipeline", href: "/company/ats", icon: <Users /> },
];

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRole="Company">
      <DashboardLayout navItems={navItems} roleName="Company">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
