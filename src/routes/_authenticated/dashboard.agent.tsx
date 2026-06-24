import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { Building2, Users, MessageSquare, DollarSign, LayoutDashboard, Plus, Settings, CalendarCheck, RefreshCw, Phone, ListPlus, BarChart3, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell, StatCard, Panel, AnalyticsChart, QuickActions } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { sampleAnalytics } from "@/lib/sample-analytics";

export const Route = createFileRoute("/_authenticated/dashboard/agent")({
  head: () => ({ meta: [{ title: "Agent Dashboard — NOVAWORKS" }] }),
  component: () => (<RoleGate allow={["agent"]}><AgentDashboard /></RoleGate>),
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
  const [stats, setStats] = useState({ listings: 0, leads: 0, visits: 0, portfolio: 0 });
  const [apartments, setApartments] = useState<Array<{ id: string; title: string; price: number; currency: string }>>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const l = await supabase
        .from("properties")
        .select("id,title,price,currency")
        .or(`agent_id.eq.${user.id},owner_id.eq.${user.id}`);
      const ids = (l.data ?? []).map((x) => x.id);
      const rows = (l.data ?? []).map((x: any) => ({
        id: x.id,
        title: x.title ?? "Apartment",
        price: Number(x.price) || 0,
        currency: x.currency ?? "USD",
      }));
      const portfolio = rows.reduce((s, r) => s + r.price, 0);
      setApartments(rows);
      let leads = 0, visits = 0;
      if (ids.length) {
        const [lead, vis] = await Promise.all([
          supabase.from("property_inquiries").select("id", { count: "exact", head: true }).in("property_id", ids),
          supabase.from("property_inquiries").select("id", { count: "exact", head: true }).in("property_id", ids).not("scheduled_at", "is", null),
        ]);
        leads = lead.count ?? 0;
        visits = vis.count ?? 0;
      }
      setStats({ listings: l.data?.length ?? 0, leads, visits, portfolio });
    })();
  }, [user]);

  const money = (n: number, c = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

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
        <StatCard icon={Wallet} label="Portfolio Value" sublabel="Sum of assigned apartments" value={money(stats.portfolio)} />
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

      <div className="mt-6">
        <Panel title="Money by Apartment" subtitle="Apartment income, owner income, and NOVAWORKS income">
          {apartments.length === 0 ? (
            <p className="text-sm text-noir/50">No assigned apartments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-noir/60 text-left">
                  <tr className="border-b border-noir/10">
                    <th className="py-2 pr-4 font-medium">Apartment</th>
                    <th className="py-2 pr-4 font-medium text-right">Apartment Income</th>
                    <th className="py-2 pr-4 font-medium text-right">Owner Income</th>
                    <th className="py-2 font-medium text-right">NOVAWORKS Income</th>
                  </tr>
                </thead>
                <tbody>
                  {apartments.map((a) => (
                    <tr key={a.id} className="border-b border-noir/5">
                      <td className="py-2 pr-4">{a.title}</td>
                      <td className="py-2 pr-4 text-right">{money(a.price, a.currency)}</td>
                      <td className="py-2 pr-4 text-right">{money(a.price, a.currency)}</td>
                      <td className="py-2 text-right">{money(0, a.currency)}</td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 pr-4 text-right">{money(stats.portfolio)}</td>
                    <td className="py-2 pr-4 text-right">{money(stats.portfolio)}</td>
                    <td className="py-2 text-right">{money(0)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-noir/50">Amounts reflect each apartment's listed value. No service cost or percentage is applied.</p>
            </div>
          )}
        </Panel>
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