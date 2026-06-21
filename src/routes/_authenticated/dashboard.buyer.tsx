import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { Heart, CalendarCheck, MessageSquare, Eye, LayoutDashboard, Search, Settings, Compass, MapPin, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell, StatCard, Panel, AnalyticsChart, QuickActions } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { sampleAnalytics } from "@/lib/sample-analytics";

export const Route = createFileRoute("/_authenticated/dashboard/buyer")({
  head: () => ({ meta: [{ title: "Customer Dashboard — NOVAWORKS" }] }),
  component: () => (<RoleGate allow={["buyer"]}><BuyerDashboard /></RoleGate>),
});

const NAV = [
  { to: "/dashboard/buyer", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/properties", label: "Browse", icon: Search, group: "Overview" },
  { to: "/dashboard/buyer", label: "Saved", icon: Heart, group: "Activity" },
  { to: "/dashboard/buyer", label: "Visits", icon: CalendarCheck, group: "Activity" },
  { to: "/dashboard/buyer", label: "Messages", icon: MessageSquare, group: "Activity" },
  { to: "/dashboard/buyer/service-requests", label: "Service Requests", icon: AlertCircle, group: "Activity" },
  { to: "/dashboard/buyer", label: "Settings", icon: Settings, group: "System" },
];

function BuyerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ saved: 0, visits: 0, inquiries: 0 });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, v, m] = await Promise.all([
        supabase.from("saved_properties").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("property_inquiries").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("scheduled_at", "is", null),
        supabase.from("property_inquiries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setStats({ saved: s.count ?? 0, visits: v.count ?? 0, inquiries: m.count ?? 0 });
    })();
  }, [user]);

  return (
    <DashboardShell
      title="Customer Dashboard"
      subtitle="Discover, save, and visit properties you love"
      role="buyer"
      nav={NAV}
      actions={[
        { label: "Browse Properties", to: "/properties", icon: Search, variant: "primary" },
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Saved Properties" sublabel="Your wishlist" value={String(stats.saved)} delta={{ value: "+2", positive: true }} />
        <StatCard icon={CalendarCheck} label="Scheduled Visits" sublabel="Upcoming" value={String(stats.visits)} delta={{ value: "+1", positive: true }} />
        <StatCard icon={MessageSquare} label="Active Inquiries" sublabel="With agents" value={String(stats.inquiries)} delta={{ value: "+3", positive: true }} />
        <StatCard icon={Eye} label="Recently Viewed" sublabel="This week" value="12" delta={{ value: "+24%", positive: true }} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><AnalyticsChart data={sampleAnalytics(1)} /></div>
        <QuickActions actions={[
          { label: "Browse", sublabel: "Find new properties", icon: Search, to: "/properties", tone: "gold" },
          { label: "Explore Map", sublabel: "Properties nearby", icon: MapPin, to: "/properties", tone: "blue" },
          { label: "Recommendations", sublabel: "Based on your taste", icon: Compass, to: "/properties", tone: "violet" },
          { label: "Messages", sublabel: "Chat with agents", icon: MessageSquare, to: "/dashboard/buyer", tone: "emerald" },
        ]} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="Saved Properties" subtitle="Listings you bookmarked">
          <p className="text-sm text-noir/50">{stats.saved === 0 ? "Tap the heart on any listing to save it here." : `You have ${stats.saved} saved properties.`}</p>
        </Panel>
        <Panel title="Upcoming Visits" subtitle="Confirmed and pending">
          <p className="text-sm text-noir/50">{stats.visits === 0 ? "Schedule a visit from any property page." : `${stats.visits} visits coming up.`}</p>
        </Panel>
      </div>
    </DashboardShell>
  );
}