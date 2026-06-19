import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, CalendarCheck, MessageSquare, Eye, LayoutDashboard, Search, Settings } from "lucide-react";
import { DashboardShell, StatCard, Panel } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/buyer")({
  head: () => ({ meta: [{ title: "Buyer Dashboard — NOVAWORKS" }] }),
  component: BuyerDashboard,
});

const NAV = [
  { to: "/dashboard/buyer", label: "Overview", icon: LayoutDashboard },
  { to: "/properties", label: "Browse properties", icon: Search },
  { to: "/dashboard/buyer", label: "Saved", icon: Heart },
  { to: "/dashboard/buyer", label: "Visits", icon: CalendarCheck },
  { to: "/dashboard/buyer", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/buyer", label: "Settings", icon: Settings },
];

function BuyerDashboard() {
  return (
    <DashboardShell title="Buyer Dashboard" role="buyer" nav={NAV}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saved properties" value="0" icon={Heart} />
        <StatCard label="Scheduled visits" value="0" icon={CalendarCheck} />
        <StatCard label="New messages" value="0" icon={MessageSquare} />
        <StatCard label="Recently viewed" value="0" icon={Eye} />
      </div>
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="Saved properties" action={<Link to="/properties" className="text-sm text-gold">Browse</Link>}>
          <EmptyState message="You haven't saved any properties yet. Tap the heart on a listing to save it." />
        </Panel>
        <Panel title="Upcoming visits">
          <EmptyState message="No visits scheduled. Open a property and use the 'Schedule Visit' panel." />
        </Panel>
        <Panel title="Messages with agents">
          <EmptyState message="When you message an agent your conversation will appear here." />
        </Panel>
        <Panel title="Recently viewed">
          <EmptyState message="Properties you visit will appear here for quick access." />
        </Panel>
      </div>
    </DashboardShell>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-noir/60">{message}</p>;
}