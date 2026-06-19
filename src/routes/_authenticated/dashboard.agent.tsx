import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, MessageSquare, TrendingUp, LayoutDashboard, Plus, Settings, CalendarCheck } from "lucide-react";
import { DashboardShell, StatCard, Panel } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/agent")({
  head: () => ({ meta: [{ title: "Agent Dashboard — NOVAWORKS" }] }),
  component: AgentDashboard,
});

const NAV = [
  { to: "/dashboard/agent", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/agent", label: "My listings", icon: Building2 },
  { to: "/dashboard/agent", label: "Leads", icon: Users },
  { to: "/dashboard/agent", label: "Visits", icon: CalendarCheck },
  { to: "/dashboard/agent", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/agent", label: "Settings", icon: Settings },
];

function AgentDashboard() {
  return (
    <DashboardShell title="Agent Dashboard" role="agent" nav={NAV}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active listings" value="0" icon={Building2} />
        <StatCard label="New leads" value="0" icon={Users} />
        <StatCard label="Visits this week" value="0" icon={CalendarCheck} />
        <StatCard label="Avg response time" value="—" icon={TrendingUp} />
      </div>
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel
          title="My listings"
          action={
            <Link to="/list-property" className="inline-flex items-center gap-1 text-sm text-gold">
              <Plus className="w-4 h-4" /> New
            </Link>
          }
        >
          <p className="text-sm text-noir/60">No listings yet. Click "New" to publish your first property.</p>
        </Panel>
        <Panel title="Recent leads">
          <p className="text-sm text-noir/60">Visit requests and inquiries on your listings will appear here.</p>
        </Panel>
        <Panel title="Upcoming visits">
          <p className="text-sm text-noir/60">Scheduled property visits with prospective buyers.</p>
        </Panel>
        <Panel title="Conversations">
          <p className="text-sm text-noir/60">Replies and messages from buyers.</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}