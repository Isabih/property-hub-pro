import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, UserPlus, KeyRound, Power, Save, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/use-auth";
import { listAllUsers, updateUserProfile, updateUserRoles, itTriggerPasswordReset } from "@/lib/staff.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/it/users")({
  head: () => ({ meta: [{ title: "Users — NOVAWORKS" }] }),
  component: UsersPage,
});

const ALL_ROLES = ["admin", "it", "receptionist", "owner", "agent", "buyer"] as const;

function UsersPage() {
  const { roles, primaryRole } = useAuth();
  const navigate = useNavigate();
  const isIT = roles.includes("it");
  const isAdmin = roles.includes("admin");
  const allowed = isIT || isAdmin;
  useEffect(() => { if (roles.length && !allowed) navigate({ to: dashboardPathFor(primaryRole) }); }, [roles, allowed, primaryRole, navigate]);

  const load = useServerFn(listAllUsers);
  const updProfile = useServerFn(updateUserProfile);
  const updRoles = useServerFn(updateUserRoles);
  const triggerReset = useServerFn(itTriggerPasswordReset);

  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const refresh = () => load().then((d: any) => setUsers(d));
  useEffect(() => { if (allowed) refresh(); }, [allowed]);

  const save = async () => {
    if (!editing) return;
    try {
      await updProfile({ data: { user_id: editing.id, full_name: editing.full_name, phone: editing.phone, avatar_url: editing.avatar_url } });
      await updRoles({ data: { user_id: editing.id, roles: editing.roles } });
      toast.success("Saved");
      setEditing(null);
      refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const toggleActive = async (u: any) => {
    try {
      await updProfile({ data: { user_id: u.id, active: !u.active } });
      toast.success(u.active ? "Deactivated" : "Reactivated");
      refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const reset = async (u: any) => {
    if (!confirm(`Trigger password reset for ${u.email}? It will appear in the password-reset queue.`)) return;
    try {
      await triggerReset({ data: { user_id: u.id } });
      toast.success("Reset request created — approve in Password Resets");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <DashboardShell
      title="User Management"
      subtitle="View, edit, deactivate, and reset passwords"
      role={isIT ? "it" : "admin"}
      nav={[
        { to: isIT ? "/dashboard/it" : "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
        { to: "/dashboard/it/users", label: "Users", icon: Users, group: "Management" },
        { to: "/dashboard/it/staff/new", label: "Add Staff", icon: UserPlus, group: "Management" },
      ]}
    >
      <Panel title={`All Users (${users.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-noir/60 border-b"><th className="py-2">Name</th><th>Email</th><th>Roles</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 flex items-center gap-2">
                    {u.avatar_url ? <img src={u.avatar_url} className="h-7 w-7 rounded-full object-cover" alt="" /> : <div className="h-7 w-7 rounded-full bg-noir/10" />}
                    {u.full_name || "—"}
                  </td>
                  <td className="truncate max-w-48">{u.email}</td>
                  <td className="text-xs">{u.roles.join(", ") || "—"}</td>
                  <td>{u.active === false ? <span className="text-rose-600">Disabled</span> : <span className="text-emerald-600">Active</span>}</td>
                  <td className="text-right space-x-2">
                    <button onClick={() => setEditing({ ...u, roles: [...u.roles] })} className="text-xs underline">Edit</button>
                    <button onClick={() => toggleActive(u)} className="text-xs underline"><Power className="inline h-3 w-3" /> {u.active === false ? "Enable" : "Disable"}</button>
                    <button onClick={() => reset(u)} className="text-xs underline"><KeyRound className="inline h-3 w-3" /> Reset</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-noir/50">No users</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setEditing(null)} className="absolute top-3 right-3"><X className="h-4 w-4" /></button>
            <h3 className="font-display text-xl">Edit user</h3>
            <div className="mt-4 space-y-3">
              <label className="block"><div className="text-xs font-medium text-noir/60 mb-1">Full name</div><input className="input-luxe" value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></label>
              <label className="block"><div className="text-xs font-medium text-noir/60 mb-1">Phone</div><input className="input-luxe" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label>
              <label className="block"><div className="text-xs font-medium text-noir/60 mb-1">Avatar URL</div><input className="input-luxe" value={editing.avatar_url ?? ""} onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })} /></label>
              <div>
                <div className="text-xs font-medium text-noir/60 mb-1">Roles</div>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => {
                    const on = editing.roles.includes(r);
                    const restricted = (r === "admin" || r === "it") && !isIT;
                    return (
                      <button key={r} disabled={restricted} onClick={() => setEditing({ ...editing, roles: on ? editing.roles.filter((x: string) => x !== r) : [...editing.roles, r] })} className={`text-xs px-2.5 py-1 rounded-full border ${on ? "bg-noir-deep text-white border-noir-deep" : "bg-white"} disabled:opacity-40`}>
                        {r}
                      </button>
                    );
                  })}
                </div>
                {!isIT && <p className="text-xs text-noir/50 mt-1">Only IT can grant IT or admin roles.</p>}
              </div>
            </div>
            <button onClick={save} className="mt-5 w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-noir-deep text-white text-sm"><Save className="h-4 w-4" /> Save changes</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}