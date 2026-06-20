import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LayoutDashboard, CheckCheck, Building2 } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications — NOVAWORKS" }] }),
  component: NotificationsPage,
});

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  property_id: string | null;
}

function NotificationsPage() {
  const { user, primaryRole, roles } = useAuth();
  const navigate = useNavigate();
  const canSee = roles.includes("it") || roles.includes("admin");
  const role = canSee ? (roles.includes("it") ? "it" : "admin") : (primaryRole as any) ?? "buyer";

  useEffect(() => {
    if (roles.length && !canSee) {
      navigate({ to: dashboardPathFor((primaryRole as any) ?? "buyer") });
    }
  }, [roles, canSee, primaryRole, navigate]);

  const [rows, setRows] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("staff_notifications" as any)
      .select("id,kind,title,body,read_at,created_at,property_id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as unknown as Notif[]);
  };

  useEffect(() => { load(); }, [user?.id]);

  const markAll = async () => {
    const ids = rows.filter((r) => !r.read_at).map((r) => r.id);
    if (!ids.length) return;
    await supabase.from("staff_notifications" as any).update({ read_at: new Date().toISOString() }).in("id", ids);
    load();
  };

  const unread = rows.filter((r) => !r.read_at).length;

  return (
    <DashboardShell
      title="Notifications"
      subtitle={`${unread} unread · Property status changes broadcast to IT & Admin`}
      role={role}
      nav={[
        { to: dashboardPathFor(role), label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
        { to: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Overview" },
        { to: "/dashboard/properties", label: "Properties", icon: Building2, group: "Content" },
      ]}
      actions={[{ label: "Mark all read", icon: CheckCheck, onClick: markAll, variant: "primary" }]}
    >
      <Panel title="Inbox" subtitle="Approval, sold, and maintenance alerts">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-noir/50">No notifications yet.</div>
        ) : (
          <ul className="divide-y divide-noir/10">
            {rows.map((n) => (
              <li key={n.id} className={`py-3 flex items-start gap-3 ${n.read_at ? "opacity-60" : ""}`}>
                <span className={`mt-1 h-2 w-2 rounded-full ${n.read_at ? "bg-noir/20" : "bg-gold"}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-noir/60">{n.body}</div>}
                  <div className="text-[11px] text-noir/40 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-noir/5 px-2 py-0.5 rounded">{n.kind.replace("property_", "")}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </DashboardShell>
  );
}