import { RoleGuard } from "@/components/shared/role-guard";
import { DashboardLayout, NavItem } from "@/components/shared/dashboard-layout";
import { LayoutDashboard, GraduationCap } from "lucide-react";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/counselor/dashboard", icon: <LayoutDashboard /> },
  { title: "Student Directory", href: "/counselor/students", icon: <GraduationCap /> },
];

export default function CounselorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRole="Counselor">
      <DashboardLayout navItems={navItems} roleName="Counselor">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
