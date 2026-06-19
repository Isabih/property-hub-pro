import { createFileRoute } from "@tanstack/react-router";
import { Users, Building2, ShieldCheck, LayoutDashboard, Activity, Settings, FileCheck, Server, AlertTriangle } from "lucide-react";
import { DashboardShell, StatCard, Panel } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/it")({
  head: () => ({ meta: [{ title: "IT Dashboard — NOVAWORKS" }] }),
  component: ITDashboard,
});

const NAV = [
  { to: "/dashboard/it", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/it", label: "Users", icon: Users },
  { to: "/dashboard/it", label: "Properties", icon: Building2 },
  { to: "/dashboard/it", label: "Verifications", icon: FileCheck },
  { to: "/dashboard/it", label: "System health", icon: Server },
  { to: "/dashboard/it", label: "Audit log", icon: Activity },
  { to: "/dashboard/it", label: "Settings", icon: Settings },
];

function ITDashboard() {
  return (
    <DashboardShell title="IT Control" role="it" nav={NAV}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value="0" icon={Users} />
        <StatCard label="Active listings" value="0" icon={Building2} />
        <StatCard label="Pending approvals" value="0" icon={ShieldCheck} />
        <StatCard label="System alerts" value="0" icon={AlertTriangle} />
      </div>
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="Recent users">
          <p className="text-sm text-noir/60">Newly registered users across all roles.</p>
        </Panel>
        <Panel title="Pending property approvals">
          <p className="text-sm text-noir/60">Listings waiting for review.</p>
        </Panel>
        <Panel title="Verification requests">
          <p className="text-sm text-noir/60">Identity and luxury-access verifications.</p>
        </Panel>
        <Panel title="System health">
          <p className="text-sm text-noir/60">Database, auth, storage status. No financial data shown for IT role.</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}