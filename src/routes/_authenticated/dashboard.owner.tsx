import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, DollarSign, Eye, Users, LayoutDashboard, Plus, Settings, MessageSquare } from "lucide-react";
import { DashboardShell, StatCard, Panel } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/owner")({
  head: () => ({ meta: [{ title: "Owner Dashboard — NOVAWORKS" }] }),
  component: OwnerDashboard,
});

const NAV = [
  { to: "/dashboard/owner", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/owner", label: "My properties", icon: Building2 },
  { to: "/dashboard/owner", label: "Inquiries", icon: Users },
  { to: "/dashboard/owner", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/owner", label: "Earnings", icon: DollarSign },
  { to: "/dashboard/owner", label: "Settings", icon: Settings },
];

function OwnerDashboard() {
  return (
    <DashboardShell title="Property Owner" role="owner" nav={NAV}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My properties" value="0" icon={Building2} />
        <StatCard label="Total views" value="0" icon={Eye} />
        <StatCard label="Active inquiries" value="0" icon={Users} />
        <StatCard label="Pending earnings" value="$0" icon={DollarSign} />
      </div>
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel
          title="My properties"
          action={
            <Link to="/list-property" className="inline-flex items-center gap-1 text-sm text-gold">
              <Plus className="w-4 h-4" /> Add property
            </Link>
          }
        >
          <p className="text-sm text-noir/60">List your first property to start receiving inquiries.</p>
        </Panel>
        <Panel title="Inquiries on my properties">
          <p className="text-sm text-noir/60">Buyer interest will appear here.</p>
        </Panel>
        <Panel title="Visits scheduled on my properties">
          <p className="text-sm text-noir/60">Confirm or reschedule upcoming visits.</p>
        </Panel>
        <Panel title="Performance">
          <p className="text-sm text-noir/60">Views, favorites, and conversion trends over time.</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}