import { Users, Building2, ShieldCheck, DollarSign, LayoutDashboard, Activity, Settings, FileCheck, BarChart3, UserPlus, Bell, Wrench, Mail, Film, Plus, Server, Image as ImageIcon, Star } from "lucide-react";
import type { NavItem } from "./DashboardShell";
import type { AppRole } from "@/lib/use-auth";

export const IT_NAV: NavItem[] = [
  { to: "/dashboard/it", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Overview" },
  { to: "/dashboard/properties", label: "Properties", icon: Building2, group: "Content" },
  { to: "/dashboard/properties/new", label: "Add Property", icon: Plus, group: "Content" },
  { to: "/dashboard/it/media-verify", label: "Media Verification", icon: ShieldCheck, group: "Content" },
  { to: "/dashboard/it/home-content", label: "Homepage Content", icon: ImageIcon, group: "Content" },
  { to: "/dashboard/it/property-of-the-day", label: "Property of the Day", icon: Star, group: "Content" },
  { to: "/dashboard/service-requests", label: "Service Requests", icon: Wrench, group: "Content" },
  { to: "/dashboard/receptionist", label: "Reception", icon: UserPlus, group: "Management" },
  { to: "/dashboard/it/users", label: "Users", icon: Users, group: "Management" },
  { to: "/dashboard/it/staff/new", label: "Add Staff", icon: UserPlus, group: "Management" },
  { to: "/dashboard/it/luxury", label: "Luxury Access", icon: FileCheck, group: "Management" },
  { to: "/dashboard/it/password-resets", label: "Password Resets", icon: Server, group: "Management" },
  { to: "/dashboard/it/system-health", label: "System Health", icon: Activity, group: "System" },
  { to: "/dashboard/it/settings", label: "Email Settings", icon: Settings, group: "System" },
];

export const ADMIN_NAV: NavItem[] = [
  { to: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/admin", label: "Analytics", icon: BarChart3, group: "Overview" },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Overview" },
  { to: "/dashboard/properties", label: "Properties", icon: Building2, group: "Content" },
  { to: "/dashboard/service-requests", label: "Service Requests", icon: Wrench, group: "Content" },
  { to: "/dashboard/it/media-verify", label: "Media Verification", icon: ShieldCheck, group: "Content" },
  { to: "/dashboard/admin/contact-edit", label: "Contact Page", icon: Mail, group: "Content" },
  { to: "/dashboard/admin/portfolio-videos", label: "Portfolio Videos", icon: Film, group: "Content" },
  { to: "/dashboard/it/staff/new", label: "Add Owner / Agent / Receptionist", icon: UserPlus, group: "Management" },
  { to: "/dashboard/admin", label: "Users", icon: Users, group: "Management" },
  { to: "/dashboard/admin", label: "Verifications", icon: FileCheck, group: "Management" },
  { to: "/dashboard/admin", label: "Revenue", icon: DollarSign, group: "Management" },
  { to: "/dashboard/admin", label: "Approvals", icon: ShieldCheck, group: "Management" },
  { to: "/dashboard/admin", label: "Activity", icon: Activity, group: "System" },
  { to: "/dashboard/admin", label: "Settings", icon: Settings, group: "System" },
];

/** Pick the right NAV + shell role based on the user's roles. IT takes precedence. */
export function shellForStaff(roles: AppRole[]): { role: AppRole; nav: NavItem[] } {
  if (roles.includes("it")) return { role: "it", nav: IT_NAV };
  return { role: "admin", nav: ADMIN_NAV };
}