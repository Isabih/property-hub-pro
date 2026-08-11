import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, MailCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { shellForStaff } from "@/components/dashboard/nav-config";
import { useAuth } from "@/lib/use-auth";
import { startCreateStaff, verifyAndCreateStaff, resendStaffOtp } from "@/lib/staff.functions";
import { MediaInput } from "@/components/dashboard/MediaInput";
import { toast } from "sonner";
import { StaffOtpModal } from "@/components/auth/StaffOtpModal";

export const Route = createFileRoute("/_authenticated/dashboard/it/staff/new")({
  head: () => ({ meta: [{ title: "Add Staff — NOVAWORKS" }] }),
  component: () => (
    <RoleGate allow={["it", "admin"]}>
      <AddStaff />
    </RoleGate>
  ),
});

function AddStaff() {
  const { roles, user } = useAuth();
  const isIT = roles.includes("it");
  const shell = shellForStaff(roles);

  const start = useServerFn(startCreateStaff);
  const verify = useServerFn(verifyAndCreateStaff);
  const resend = useServerFn(resendStaffOtp);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role: "owner" as any, avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ email: string; role: string } | null>(null);
  const [pending, setPending] = useState<{ id: string; email: string } | null>(null);

  const allowedRoles = isIT
    ? ["it", "admin", "owner", "agent", "receptionist"]
    : ["owner", "agent", "receptionist"];

  const submit = async () => {
    if (!form.full_name || !form.email || !form.password) return toast.error("Name, email and password required");
    if (form.password.length < 8) return toast.error("Password must be 8+ chars");
    setSaving(true);
    try {
      const res = await start({ data: { full_name: form.full_name, email: form.email, phone: form.phone, password: form.password, role: form.role as any, avatar_url: form.avatar_url || null } });
      setPending({ id: res.pending_id, email: res.email });
      toast.success(`Verification code sent to ${res.email}`);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell
      title="Add Staff Member"
      subtitle={isIT ? "Create IT, admins, owners, agents or receptionists" : "Create owners, agents, or receptionists"}
      role={shell.role}
      nav={shell.nav}
    >
      <Panel title="New staff user" subtitle="An account will be created and the email confirmed automatically">
        {pending && (
          <StaffOtpModal
            email={pending.email}
            onClose={() => setPending(null)}
            onResend={async () => { await resend({ data: { pending_id: pending.id } }); }}
            onSubmit={async (code: string) => {
              const res = await verify({ data: { pending_id: pending.id, code } });
              setLastCreated({ email: res.email, role: res.role });
              setForm({ full_name: "", email: "", phone: "", password: "", role: form.role, avatar_url: "" });
              setPending(null);
              toast.success(`${res.role} account created for ${res.email}`);
            }}
          />
        )}
        {lastCreated && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <MailCheck className="h-5 w-5 text-emerald-700 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-emerald-900">
                {lastCreated.role} account created for {lastCreated.email}
              </div>
              <p className="text-emerald-800/80 mt-0.5">
                A verification email has been sent. The user cannot sign in until they verify their email address.
              </p>
              {isIT && (
                <Link to="/dashboard/it/users" className="underline text-emerald-900 text-xs mt-1 inline-block">
                  View users →
                </Link>
              )}
            </div>
          </div>
        )}
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
          <Field label="Profile photo" full>
            <MediaInput
              value={form.avatar_url}
              onChange={(url) => setForm({ ...form, avatar_url: url })}
              subdir="avatars"
              aspect="aspect-square"
              userId={user?.id ?? null}
            />
          </Field>
        </div>
        <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-noir-deep text-white text-sm font-medium disabled:opacity-60">
          <UserPlus className="h-4 w-4" /> {saving ? "Creating…" : "Create account"}
        </button>
        <p className="text-xs text-noir/50 mt-3">
          A verification email is sent automatically. No user can sign in without verifying their email first.
        </p>
        {isIT && <p className="mt-4 text-sm"><Link to="/dashboard/it/users" className="underline">Manage existing users →</Link></p>}
      </Panel>
    </DashboardShell>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`block ${full ? "sm:col-span-2" : ""}`}><div className="text-xs font-medium text-noir/60 mb-1.5">{label}</div>{children}</label>;
}