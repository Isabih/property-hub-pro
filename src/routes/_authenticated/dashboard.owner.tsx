import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, DollarSign, Eye, Users, LayoutDashboard, Plus, Settings, MessageSquare, RefreshCw, Upload, BarChart3, ListPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell, StatCard, Panel, AnalyticsChart, QuickActions } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { sampleAnalytics } from "@/lib/sample-analytics";

export const Route = createFileRoute("/_authenticated/dashboard/owner")({
  head: () => ({ meta: [{ title: "Owner Dashboard — NOVAWORKS" }] }),
  component: OwnerDashboard,
});

const NAV = [
  { to: "/dashboard/owner", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/properties", label: "My Properties", icon: Building2, group: "Content" },
  { to: "/dashboard/properties/new", label: "Add Property", icon: Plus, group: "Content" },
  { to: "/dashboard/owner", label: "Inquiries", icon: Users, group: "Management" },
  { to: "/dashboard/owner", label: "Messages", icon: MessageSquare, group: "Management" },
  { to: "/dashboard/owner", label: "Earnings", icon: DollarSign, group: "Management" },
  { to: "/dashboard/owner", label: "Settings", icon: Settings, group: "System" },
];

function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ properties: 0, views: 0, inquiries: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const p = await supabase.from("properties").select("id, views_count").eq("owner_id", user.id);
      const ids = (p.data ?? []).map((x) => x.id);
      const totalViews = (p.data ?? []).reduce((s, x) => s + (x.views_count ?? 0), 0);
      let inq = 0;
      if (ids.length) {
        const i = await supabase.from("property_inquiries").select("id", { count: "exact", head: true }).in("property_id", ids);
        inq = i.count ?? 0;
      }
      setStats({ properties: p.data?.length ?? 0, views: totalViews, inquiries: inq });
    })();
  }, [user]);

  return (
    <DashboardShell
      title="Owner Dashboard"
      subtitle="Manage your portfolio and track performance"
      role="owner"
      nav={NAV}
      actions={[
        { label: "Sync Data", icon: RefreshCw },
        { label: "Add Property", to: "/dashboard/properties/new", icon: Plus, variant: "primary" },
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Properties" sublabel="In your portfolio" value={String(stats.properties)} delta={{ value: "+2", positive: true }} />
        <StatCard icon={Eye} label="Total Views" sublabel="All-time" value={stats.views.toLocaleString()} delta={{ value: "+18%", positive: true }} />
        <StatCard icon={Users} label="Active Inquiries" sublabel="Awaiting response" value={String(stats.inquiries)} delta={{ value: "+5", positive: true }} />
        <StatCard icon={DollarSign} label="Est. Earnings" sublabel="This month" value="$0" delta={{ value: "0%", positive: true }} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><AnalyticsChart data={sampleAnalytics(2)} /></div>
        <QuickActions actions={[
          { label: "Add Property", sublabel: "Create new listing", icon: ListPlus, to: "/dashboard/properties/new", tone: "gold" },
          { label: "Upload Media", sublabel: "Photos & videos", icon: Upload, to: "/dashboard/properties/new", tone: "blue" },
          { label: "My Properties", sublabel: "Manage listings", icon: Building2, to: "/dashboard/properties", tone: "violet" },
          { label: "Reports", sublabel: "View analytics", icon: BarChart3, to: "/dashboard/owner", tone: "emerald" },
        ]} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="My Properties" subtitle="Latest listings" action={<Link to="/dashboard/properties" className="text-sm text-gold">View all</Link>}>
          <p className="text-sm text-noir/50">{stats.properties === 0 ? "No properties yet. Click 'Add Property' to create your first listing." : `You have ${stats.properties} properties.`}</p>
        </Panel>
        <Panel title="Recent Inquiries" subtitle="Buyer interest">
          <p className="text-sm text-noir/50">{stats.inquiries === 0 ? "No inquiries yet." : `${stats.inquiries} active inquiries.`}</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}