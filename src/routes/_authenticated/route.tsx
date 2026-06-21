import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

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
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => (<><IdleLogout /><Outlet /></>),
});