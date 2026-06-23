import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { dashboardPathFor, type AppRole } from "@/lib/use-auth";

const ROLE_PRIORITY: AppRole[] = ["admin", "it", "receptionist", "owner", "agent", "buyer"];
function pickPrimary(roles: AppRole[]): AppRole | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return roles[0] ?? null;
}

/**
 * Returns true if the role set is allowed to view the given dashboard path.
 * Admin and IT pass for every prefix EXCEPT customer-only /dashboard/buyer.
 */
function canAccess(pathname: string, roles: AppRole[]): boolean {
  // Shared sub-areas open to multiple roles
  if (pathname.startsWith("/dashboard/properties")) {
    return roles.some((r) => ["it", "admin", "owner", "agent"].includes(r));
  }
  if (pathname.startsWith("/dashboard/service-requests")) {
    return roles.some((r) => ["it", "admin", "receptionist", "agent"].includes(r));
  }
  if (pathname.startsWith("/dashboard/inquiries")) {
    return roles.some((r) => ["it", "admin", "agent", "receptionist"].includes(r));
  }
  if (pathname.startsWith("/dashboard/notifications")) return roles.length > 0;

  // Role-prefixed dashboards
  if (pathname.startsWith("/dashboard/buyer")) return roles.includes("buyer");
  if (pathname.startsWith("/dashboard/it")) return roles.includes("it");
  if (pathname.startsWith("/dashboard/admin")) return roles.includes("admin") || roles.includes("it");
  if (pathname.startsWith("/dashboard/receptionist")) return roles.some((r) => ["receptionist", "it", "admin"].includes(r));
  if (pathname.startsWith("/dashboard/agent")) return roles.some((r) => ["agent", "it", "admin"].includes(r));
  if (pathname.startsWith("/dashboard/owner")) return roles.some((r) => ["owner", "it", "admin"].includes(r));
  return true;
}

const IDLE_MS = 60_000; // 1 minute

function IdleLogout() {
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try { await supabase.auth.signOut(); } catch {}
        toast("Signed out due to inactivity", { description: "Please sign in again to continue." });
        navigate({ to: "/auth", replace: true });
      }, IDLE_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [navigate]);
  return null;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    if (!data.user.email_confirmed_at && data.user.email) {
      // Trigger an OTP and force verification before any dashboard access
      try {
        await supabase.auth.signInWithOtp({ email: data.user.email, options: { shouldCreateUser: false } });
      } catch {}
      throw redirect({ to: "/auth/verify", search: { email: data.user.email } });
    }

    // Load roles for centralised deep-link gating
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const roles = ((roleRows ?? []) as Array<{ role: AppRole }>).map((r) => r.role);
    const primary = pickPrimary(roles);
    const home = dashboardPathFor(primary);

    const path = location.pathname;
    // Bare /dashboard → send to user's home
    if (path === "/dashboard" || path === "/dashboard/") {
      throw redirect({ to: home, replace: true });
    }
    // Gate every /dashboard/* path by role
    if (path.startsWith("/dashboard/") && !canAccess(path, roles)) {
      throw redirect({ to: home, replace: true });
    }

    return { user: data.user, roles, primaryRole: primary };
  },
  component: () => (<><IdleLogout /><Outlet /></>),
});