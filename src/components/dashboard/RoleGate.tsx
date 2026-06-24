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
  const { roles, primaryRole, loading, session, rolesLoaded } = useAuth();
  const navigate = useNavigate();
  // Admin and IT are system roles, but customer-only pages stay customer-only.
  const customerOnly = allow.length === 1 && allow[0] === "buyer";
  const systemOverride = !customerOnly && (roles.includes("admin") || roles.includes("it"));
  const allowed = systemOverride || allow.some((r) => roles.includes(r));
  const toasted = useRef(false);

  useEffect(() => {
    if (loading || !rolesLoaded) return;
    if (!session) return;
    if (!allowed) {
      if (!toasted.current) {
        toasted.current = true;
        toast.error("Redirecting you to your dashboard.");
      }
      navigate({ to: dashboardPathFor(primaryRole), replace: true });
    }
  }, [loading, rolesLoaded, allowed, primaryRole, navigate, session]);

  if (loading || !rolesLoaded || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2]">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }
  return <>{children}</>;
}
