import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, UserPlus, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/use-auth";
import { createStaffUser } from "@/lib/staff.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/it/staff/new")({
  head: () => ({ meta: [{ title: "Add Staff — NOVAWORKS" }] }),
  component: AddStaff,
});

function AddStaff() {
  const { roles, primaryRole } = useAuth();
  const navigate = useNavigate();
  const isIT = roles.includes("it");
  const isAdmin = roles.includes("admin");
  const allowed = isIT || isAdmin;
  useEffect(() => { if (roles.length && !allowed) navigate({ to: dashboardPathFor(primaryRole) }); }, [roles, allowed, primaryRole, navigate]);

  const create = useServerFn(createStaffUser);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role: isIT ? "owner" : "owner" as any });
  const [saving, setSaving] = useState(false);

  const allowedRoles = isIT
    ? ["admin", "owner", "agent", "receptionist"]
    : ["owner", "agent", "receptionist"];

  const submit = async () => {
    if (!form.full_name || !form.email || !form.password) return toast.error("Name, email and password required");
    if (form.password.length < 8) return toast.error("Password must be 8+ chars");
    setSaving(true);
    try {
      await create({ data: { full_name: form.full_name, email: form.email, phone: form.phone, password: form.password, role: form.role as any } });
      toast.success(`${form.role} created`);
      setForm({ full_name: "", email: "", phone: "", password: "", role: form.role });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const dashTo = isIT ? "/dashboard/it" : "/dashboard/admin";

  return (
    <DashboardShell
      title="Add Staff Member"
      subtitle={isIT ? "Create owners, agents, receptionists, or admins" : "Create owners, agents, or receptionists"}
      role={isIT ? "it" : "admin"}
      nav={[
        { to: dashTo, label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
        { to: isIT ? "/dashboard/it/users" : "/dashboard/admin", label: "Users", icon: Users, group: "Management" },
      ]}
    >
      <Panel title="New staff user" subtitle="An account will be created and the email confirmed automatically">
        <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
          <Field label="Full name" full><input className="input-luxe" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} /></Field>
          <Field label="Email"><input className="input-luxe" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></Field>
          <Field label="Phone"><input className="input-luxe" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></Field>
          <Field label="Initial password"><input className="input-luxe" type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="At least 8 characters" /></Field>
          <Field label="Role">
            <select className="input-luxe" value={form.role} onChange={(e) => setForm({...form, role: e.target.value as any})}>
              {allowedRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-noir-deep text-white text-sm font-medium disabled:opacity-60">
          <UserPlus className="h-4 w-4" /> {saving ? "Creating…" : "Create account"}
        </button>
        <p className="text-xs text-noir/50 mt-3">The user will need to verify their identity at first sign-in. Share their credentials securely.</p>
        {isIT && <p className="mt-4 text-sm"><Link to="/dashboard/it/users" className="underline">Manage existing users →</Link></p>}
      </Panel>
    </DashboardShell>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`block ${full ? "sm:col-span-2" : ""}`}><div className="text-xs font-medium text-noir/60 mb-1.5">{label}</div>{children}</label>;
}