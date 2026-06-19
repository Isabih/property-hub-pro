import { createFileRoute } from "@tanstack/react-router";
import { Users, Building2, ShieldCheck, DollarSign, LayoutDashboard, Activity, Settings, FileCheck } from "lucide-react";
import { DashboardShell, StatCard, Panel } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NOVAWORKS" }] }),
  component: AdminDashboard,
});

const NAV = [
  { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/admin", label: "Users", icon: Users },
  { to: "/dashboard/admin", label: "Properties", icon: Building2 },
  { to: "/dashboard/admin", label: "Verifications", icon: FileCheck },
  { to: "/dashboard/admin", label: "Revenue", icon: DollarSign },
  { to: "/dashboard/admin", label: "Activity", icon: Activity },
  { to: "/dashboard/admin", label: "Settings", icon: Settings },
];

function AdminDashboard() {
  return (
    <DashboardShell title="Admin Control" role="admin" nav={NAV}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value="0" icon={Users} />
        <StatCard label="Active listings" value="0" icon={Building2} />
        <StatCard label="Pending approvals" value="0" icon={ShieldCheck} />
        <StatCard label="Revenue (MTD)" value="$0" icon={DollarSign} />
      </div>
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="Recent users">
          <p className="text-sm text-noir/60">Newly registered buyers, agents, and owners.</p>
        </Panel>
        <Panel title="Pending property approvals">
          <p className="text-sm text-noir/60">Listings waiting for review before going live.</p>
        </Panel>
        <Panel title="Verification requests">
          <p className="text-sm text-noir/60">Identity and luxury-access verifications.</p>
        </Panel>
        <Panel title="Revenue & commissions">
          <p className="text-sm text-noir/60">Monthly commission summary, top performers, and payouts.</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}