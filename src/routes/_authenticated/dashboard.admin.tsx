import { createFileRoute } from "@tanstack/react-router";
import { Users, Building2, ShieldCheck, DollarSign, LayoutDashboard, Activity, Settings, FileCheck, Plus, RefreshCw, BarChart3, UserPlus, Upload, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell, StatCard, Panel, AnalyticsChart, QuickActions } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { sampleAnalytics } from "@/lib/sample-analytics";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NOVAWORKS" }] }),
  component: AdminDashboard,
});

const NAV = [
  { to: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/admin", label: "Analytics", icon: BarChart3, group: "Overview" },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Overview" },
  { to: "/dashboard/properties", label: "Properties", icon: Building2, group: "Content" },
  { to: "/dashboard/admin/staff/new", label: "Add Owner / Agent / Receptionist", icon: UserPlus, group: "Management" },
  { to: "/dashboard/admin", label: "Users", icon: Users, group: "Management" },
  { to: "/dashboard/admin", label: "Verifications", icon: FileCheck, group: "Management" },
  { to: "/dashboard/admin", label: "Revenue", icon: DollarSign, group: "Management" },
  { to: "/dashboard/admin", label: "Approvals", icon: ShieldCheck, group: "Management" },
  { to: "/dashboard/admin", label: "Activity", icon: Activity, group: "System" },
  { to: "/dashboard/admin", label: "Settings", icon: Settings, group: "System" },
];

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, properties: 0, pending: 0, views: 0 });
  useEffect(() => {
    (async () => {
      const [u, p, d, v] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("property_views").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, properties: p.count ?? 0, pending: d.count ?? 0, views: v.count ?? 0 });
    })();
  }, []);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Full control over users, content, and revenue"
      role="admin"
      nav={NAV}
      actions={[
        { label: "Sync Data", icon: RefreshCw },
        { label: "Add Staff", to: "/dashboard/admin/staff/new", icon: UserPlus, variant: "primary" },
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Properties" sublabel={`${stats.pending} pending`} value={String(stats.properties)} delta={{ value: "+12", positive: true }} />
        <StatCard icon={Users} label="Active Users" sublabel="Across all roles" value={stats.users.toLocaleString()} delta={{ value: "+8.2%", positive: true }} />
        <StatCard icon={Activity} label="Total Views" sublabel="This month" value={stats.views.toLocaleString()} delta={{ value: "+24%", positive: true }} />
        <StatCard icon={DollarSign} label="Revenue (MTD)" sublabel="Commissions" value="$0" delta={{ value: "-0.4%", positive: false }} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><AnalyticsChart data={sampleAnalytics(4)} /></div>
        <QuickActions actions={[
          { label: "Add Owner", sublabel: "Register property owner", icon: UserPlus, to: "/dashboard/admin/staff/new", tone: "gold" },
          { label: "Add Agent", sublabel: "Register sales agent", icon: UserPlus, to: "/dashboard/admin/staff/new", tone: "blue" },
          { label: "Add Receptionist", sublabel: "Front-desk staff", icon: UserPlus, to: "/dashboard/admin/staff/new", tone: "violet" },
          { label: "Reports", sublabel: "View analytics", icon: BarChart3, to: "/dashboard/admin", tone: "emerald" },
        ]} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="Pending Approvals" subtitle="Draft listings awaiting review">
          <p className="text-sm text-noir/50">{stats.pending} listings in draft status.</p>
        </Panel>
        <Panel title="Revenue & Commissions" subtitle="Monthly summary">
          <p className="text-sm text-noir/50">Payments module not yet connected.</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}