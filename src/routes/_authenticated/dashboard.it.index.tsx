import { createFileRoute } from "@tanstack/react-router";
import { Users, Building2, LayoutDashboard, Activity, Settings, FileCheck, Server, Eye, RefreshCw, Plus, UserPlus, Bell, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell, StatCard, Panel, AnalyticsChart, QuickActions } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { sampleAnalytics } from "@/lib/sample-analytics";
import { RoleGate } from "@/components/dashboard/RoleGate";

export const Route = createFileRoute("/_authenticated/dashboard/it")({
  head: () => ({ meta: [{ title: "IT Dashboard — NOVAWORKS" }] }),
  component: () => (
    <RoleGate allow={["it"]}>
      <ITDashboard />
    </RoleGate>
  ),
});

const NAV = [
  { to: "/dashboard/it", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Overview" },
  { to: "/dashboard/properties", label: "Properties", icon: Building2, group: "Content" },
  { to: "/dashboard/properties/new", label: "Add Property", icon: Plus, group: "Content" },
  { to: "/dashboard/it/media-verify", label: "Media Verification", icon: ShieldCheck, group: "Content" },
  { to: "/dashboard/service-requests", label: "Service Requests", icon: Wrench, group: "Content" },
  { to: "/dashboard/receptionist", label: "Reception", icon: UserPlus, group: "Management" },
  { to: "/dashboard/it/users", label: "Users", icon: Users, group: "Management" },
  { to: "/dashboard/it/staff/new", label: "Add Staff", icon: UserPlus, group: "Management" },
  { to: "/dashboard/it/luxury", label: "Luxury Access", icon: FileCheck, group: "Management" },
  { to: "/dashboard/it/password-resets", label: "Password Resets", icon: Server, group: "Management" },
  { to: "/dashboard/it/system-health", label: "System Health", icon: Activity, group: "System" },
  { to: "/dashboard/it/settings", label: "Email Settings", icon: Settings, group: "System" },
];

function ITDashboard() {
  const [stats, setStats] = useState({ users: 0, properties: 0, views: 0 });
  useEffect(() => {
    (async () => {
      const [u, p, v] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("property_views").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, properties: p.count ?? 0, views: v.count ?? 0 });
    })();
  }, []);

  return (
    <DashboardShell
      title="IT Dashboard"
      subtitle="Manage properties, media, and system performance"
      role="it"
      nav={NAV}
      actions={[
        { label: "Sync Data", icon: RefreshCw },
        { label: "Add Property", to: "/dashboard/properties/new", icon: Plus, variant: "primary" },
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Properties" sublabel={`${stats.properties} new this month`} value={String(stats.properties)} delta={{ value: "+12", positive: true }} />
        <StatCard icon={Users} label="Active Users" sublabel="Across all roles" value={stats.users.toLocaleString()} delta={{ value: "+8.2%", positive: true }} />
        <StatCard icon={Eye} label="Total Views" sublabel="This month" value={stats.views.toLocaleString()} delta={{ value: "+24%", positive: true }} />
        <StatCard icon={Activity} label="Conversion Rate" sublabel="Inquiries to bookings" value="3.8%" delta={{ value: "-0.4%", positive: false }} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><AnalyticsChart data={sampleAnalytics(5)} /></div>
        <QuickActions actions={[
          { label: "Add Property", sublabel: "Create new listing", icon: Building2, to: "/dashboard/properties/new", tone: "gold" },
          { label: "Add Staff", sublabel: "Owners, agents, reception", icon: UserPlus, to: "/dashboard/it/staff/new", tone: "blue" },
          { label: "Luxury Requests", sublabel: "Approve access", icon: FileCheck, to: "/dashboard/it/luxury", tone: "violet" },
          { label: "Password Resets", sublabel: "Approve & issue OTP", icon: Server, to: "/dashboard/it/password-resets", tone: "emerald" },
        ]} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="System Health" subtitle="Database, auth, storage status">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Database</span><span className="text-emerald-600">● Operational</span></li>
            <li className="flex justify-between"><span>Authentication</span><span className="text-emerald-600">● Operational</span></li>
          </ul>
        </Panel>
        <Panel title="Recent Activity" subtitle="Latest events across the platform">
          <p className="text-sm text-noir/50">No money-related data is shown in the IT view.</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}