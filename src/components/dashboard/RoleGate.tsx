import { useEffect, type ReactNode } from "react";
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
  const { roles, primaryRole, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = roles.includes("admin") || allow.some((r) => roles.includes(r));

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      toast.error("This dashboard isn't available for your role.");
      navigate({ to: dashboardPathFor(primaryRole), replace: true });
    }
  }, [loading, allowed, primaryRole, navigate]);

  if (loading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2]">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }
  return <>{children}</>;
}
