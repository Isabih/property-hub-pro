import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, dashboardPathFor, type AppRole } from "@/lib/use-auth";
import { toast } from "sonner";

/**
 * Gates a dashboard route to a specific set of roles.
 * Admins always pass. Anyone else is redirected to their own dashboard.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: AppRole[];
  children: ReactNode;
}) {
  const { roles, primaryRole, loading, session } = useAuth();
  const navigate = useNavigate();
  // Admin and IT are system roles, but customer-only pages stay customer-only.
  const customerOnly = allow.length === 1 && allow[0] === "buyer";
  const systemOverride = !customerOnly && (roles.includes("admin") || roles.includes("it"));
  const allowed = systemOverride || allow.some((r) => roles.includes(r));
  const toasted = useRef(false);

  useEffect(() => {
    if (loading) return;
    // Not signed in — the parent _authenticated gate handles redirect; don't toast.
    if (!session) return;
    // No roles yet (race during hydration) — wait, don't toast.
    if (roles.length === 0) return;
    if (!allowed) {
      if (!toasted.current) {
        toasted.current = true;
        toast.error("Redirecting you to your dashboard.");
      }
      navigate({ to: dashboardPathFor(primaryRole), replace: true });
    }
  }, [loading, allowed, roles, primaryRole, navigate, session]);

  if (loading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2]">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }
  return <>{children}</>;
}
