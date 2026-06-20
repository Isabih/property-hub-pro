import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, MessageSquare, TrendingUp, LayoutDashboard, Plus, Settings, CalendarCheck, RefreshCw, Phone, ListPlus, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell, StatCard, Panel, AnalyticsChart, QuickActions } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { sampleAnalytics } from "@/lib/sample-analytics";

export const Route = createFileRoute("/_authenticated/dashboard/agent")({
  head: () => ({ meta: [{ title: "Agent Dashboard — NOVAWORKS" }] }),
  component: AgentDashboard,
});

const NAV = [
  { to: "/dashboard/agent", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/agent", label: "Assigned Listings", icon: Building2, group: "Content" },
  { to: "/dashboard/inquiries", label: "Leads", icon: Users, group: "Management" },
  { to: "/dashboard/inquiries", label: "Visits", icon: CalendarCheck, group: "Management" },
  { to: "/dashboard/inquiries", label: "Messages", icon: MessageSquare, group: "Management" },
  { to: "/dashboard/agent", label: "Settings", icon: Settings, group: "System" },
];

function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ listings: 0, leads: 0, visits: 0 });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const l = await supabase.from("properties").select("id").or(`agent_id.eq.${user.id},owner_id.eq.${user.id}`);
      const ids = (l.data ?? []).map((x) => x.id);
      let leads = 0, visits = 0;
      if (ids.length) {
        const [lead, vis] = await Promise.all([
          supabase.from("property_inquiries").select("id", { count: "exact", head: true }).in("property_id", ids),
          supabase.from("property_inquiries").select("id", { count: "exact", head: true }).in("property_id", ids).not("scheduled_at", "is", null),
        ]);
        leads = lead.count ?? 0;
        visits = vis.count ?? 0;
      }
      setStats({ listings: l.data?.length ?? 0, leads, visits });
    })();
  }, [user]);

  return (
    <DashboardShell
      title="Agent Dashboard"
      subtitle="Manage clients, listings, and conversions"
      role="agent"
      nav={NAV}
      actions={[
        { label: "Sync Data", icon: RefreshCw },
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Active Listings" sublabel="Assigned to you" value={String(stats.listings)} delta={{ value: "+3", positive: true }} />
        <StatCard icon={Users} label="New Leads" sublabel="This week" value={String(stats.leads)} delta={{ value: "+12", positive: true }} />
        <StatCard icon={CalendarCheck} label="Scheduled Visits" sublabel="Upcoming" value={String(stats.visits)} delta={{ value: "+2", positive: true }} />
        <StatCard icon={TrendingUp} label="Conversion Rate" sublabel="Lead → visit" value="24%" delta={{ value: "+4.2%", positive: true }} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><AnalyticsChart data={sampleAnalytics(3)} /></div>
        <QuickActions actions={[
          { label: "Call Lead", sublabel: "Top priority", icon: Phone, to: "/dashboard/inquiries", tone: "gold" },
          { label: "Messages", sublabel: "Respond to buyers", icon: MessageSquare, to: "/dashboard/inquiries", tone: "blue" },
          { label: "Assigned Listings", sublabel: "Properties you manage", icon: Building2, to: "/dashboard/agent", tone: "violet" },
          { label: "Reports", sublabel: "Performance", icon: BarChart3, to: "/dashboard/agent", tone: "emerald" },
        ]} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="Assigned Listings" subtitle="Properties NOVAWORKS has assigned to you">
          <p className="text-sm text-noir/50">{stats.listings === 0 ? "No listings assigned yet. The IT team assigns properties to agents." : `${stats.listings} active listings.`}</p>
        </Panel>
        <Panel title="Recent Leads" subtitle="Buyer inquiries">
          <p className="text-sm text-noir/50">{stats.leads === 0 ? "No leads yet." : `${stats.leads} leads to respond to.`}</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}