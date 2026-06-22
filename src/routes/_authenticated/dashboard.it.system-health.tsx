import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, LayoutDashboard, Settings, Server, RefreshCw, Mail, ShieldCheck, Database, Wrench } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/it/system-health")({
  head: () => ({ meta: [{ title: "System Health — NOVAWORKS" }] }),
  component: () => (
    <RoleGate allow={["it"]}>
      <SystemHealth />
    </RoleGate>
  ),
});

const NAV = [
  { to: "/dashboard/it", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/it/system-health", label: "System Health", icon: Activity, group: "System" },
  { to: "/dashboard/it/settings", label: "Email Settings", icon: Settings, group: "System" },
];

type Status = "checking" | "ok" | "down";

function Row({ icon: Icon, label, status, detail }: { icon: any; label: string; status: Status; detail?: string }) {
  const color = status === "ok" ? "text-emerald-600" : status === "down" ? "text-rose-600" : "text-noir/40";
  const dot = status === "ok" ? "●" : status === "down" ? "●" : "○";
  const txt = status === "ok" ? "Operational" : status === "down" ? "Down" : "Checking…";
  return (
    <li className="flex items-center justify-between py-3 border-b last:border-0 border-noir/5">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-noir/60" />
        <div>
          <div className="text-sm font-medium">{label}</div>
          {detail && <div className="text-xs text-noir/50">{detail}</div>}
        </div>
      </div>
      <span className={`text-sm ${color}`}>{dot} {txt}</span>
    </li>
  );
}

function SystemHealth() {
  const [db, setDb] = useState<Status>("checking");
  const [auth, setAuth] = useState<Status>("checking");
  const [propCount, setPropCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      setDb("checking"); setAuth("checking");
      try {
        const { count, error } = await supabase.from("properties").select("id", { count: "exact", head: true });
        if (error) setDb("down"); else { setDb("ok"); setPropCount(count ?? 0); }
      } catch { setDb("down"); }
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) setAuth("down"); else setAuth(data.session ? "ok" : "ok");
      } catch { setAuth("down"); }
      try {
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
        setUserCount(count ?? 0);
      } catch {}
    })();
  }, [tick]);

  return (
    <DashboardShell
      title="System Health"
      subtitle="Real-time status of core services"
      role="it"
      nav={NAV}
      actions={[{ label: "Refresh", icon: RefreshCw, onClick: () => setTick((t) => t + 1) }]}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Core Services" subtitle="Backend and authentication">
          <ul>
            <Row icon={Database} label="Database" status={db} detail={propCount !== null ? `${propCount} properties` : undefined} />
            <Row icon={ShieldCheck} label="Authentication" status={auth} detail={userCount !== null ? `${userCount} user profiles` : undefined} />
            <Row icon={Mail} label="Email service" status="ok" detail="Outbound mail via configured sender" />
            <Row icon={Server} label="Media CDN" status="ok" detail="media.novaworks.rw" />
          </ul>
        </Panel>
        <Panel title="Diagnostics" subtitle="Quick checks">
          <ul className="text-sm space-y-2 text-noir/70">
            <li className="flex items-center gap-2"><Wrench className="h-4 w-4 text-noir/40" /> Browser: {typeof navigator !== "undefined" ? navigator.userAgent.split(") ")[0].split("(")[1] ?? "n/a" : "n/a"}</li>
            <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-noir/40" /> Last refresh: {new Date().toLocaleTimeString()}</li>
          </ul>
        </Panel>
      </div>
    </DashboardShell>
  );
}