import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, UserPlus, Users, CheckCircle2, Loader2, X, Wrench, CalendarCheck } from "lucide-react";
import { DashboardShell, Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/lib/use-auth";
import { createCustomer, listCustomers, listPropertiesForBooking, listStaffForAssignment } from "@/lib/customers.functions";
import { sendCustomerOtp, verifyCustomerOtp } from "@/lib/email.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/receptionist")({
  head: () => ({ meta: [{ title: "Receptionist Dashboard — NOVAWORKS" }] }),
  component: () => (<RoleGate allow={["receptionist"]}><ReceptionistDashboard /></RoleGate>),
});

const NAV = [
  { to: "/dashboard/receptionist", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/receptionist", label: "Customers", icon: Users, group: "Reception" },
  { to: "/dashboard/bookings", label: "Bookings & Payments", icon: CalendarCheck, group: "Reception" },
  { to: "/dashboard/service-requests", label: "Service Requests", icon: Wrench, group: "Reception" },
];

const PAYMENT_METHODS = [
  { value: "momo", label: "MTN Mobile Money" },
  { value: "airtel", label: "Airtel Money" },
  { value: "visa", label: "Visa / Credit card" },
  { value: "irembo", label: "Irembo Pay (coming soon)" },
  { value: "cash", label: "Cash" },
];

function ReceptionistDashboard() {
  const { roles } = useAuth();
  const navigate = useNavigate();
  const allowed = roles.includes("receptionist") || roles.includes("admin") || roles.includes("it");
  useEffect(() => { if (roles.length && !allowed) navigate({ to: "/dashboard/buyer" }); }, [roles, allowed, navigate]);

  const load = useServerFn(listCustomers);
  const loadProps = useServerFn(listPropertiesForBooking);
  const loadStaff = useServerFn(listStaffForAssignment);
  const create = useServerFn(createCustomer);
  const resend = useServerFn(sendCustomerOtp);
  const verify = useServerFn(verifyCustomerOtp);

  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    property_id: "", apartment_no: "",
    agent_id: "",
    stay_start: "", stay_end: "",
    amount_paid: "", payment_method: "momo", payment_status: "paid",
  });
  const [saving, setSaving] = useState(false);

  const refresh = () => load().then((d: any) => setCustomers(d));
  useEffect(() => {
    if (!allowed) return;
    refresh();
    loadProps().then((d: any) => setProperties(d));
    loadStaff().then((d: any) => setStaff(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const submit = async () => {
    if (!form.full_name || !form.email || !form.phone) return toast.error("Name, email and phone are required");
    setSaving(true);
    try {
      const r = await create({ data: {
        full_name: form.full_name, email: form.email, phone: form.phone,
        property_id: form.property_id || null,
        apartment_no: form.apartment_no || null,
        agent_id: form.agent_id || null,
        stay_start: form.stay_start || null, stay_end: form.stay_end || null,
        amount_paid: form.amount_paid ? Number(form.amount_paid) : 0,
        payment_method: form.payment_method, payment_status: form.payment_status,
      } });
      setPendingCustomerId(r.id);
      toast.success("Customer created — verification code sent");
      setForm({ full_name: "", email: "", phone: "", property_id: "", apartment_no: "", agent_id: "", stay_start: "", stay_end: "", amount_paid: "", payment_method: "momo", payment_status: "paid" });
      refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const submitOtp = async () => {
    if (!pendingCustomerId || otp.length !== 6) return toast.error("Enter the 6-digit code");
    setVerifying(true);
    try {
      await verify({ data: { customerId: pendingCustomerId, code: otp } });
      toast.success("Email verified — welcome email sent");
      setPendingCustomerId(null); setOtp(""); refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setVerifying(false); }
  };

  const total = customers.length;
  const verified = customers.filter((c) => c.email_verified).length;
  const pending = total - verified;

  return (
    <DashboardShell title="Receptionist" subtitle="Register customers, assign agents, collect payments" role="receptionist" nav={NAV}>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Customers" value={String(total)} />
        <StatCard icon={CheckCircle2} label="Verified" value={String(verified)} />
        <StatCard icon={Loader2} label="Awaiting verification" value={String(pending)} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title="Register a customer" subtitle="They will receive a 6-digit code valid for 5 minutes">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name" full><input className="input-luxe" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} /></Field>
            <Field label="Email"><input className="input-luxe" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></Field>
            <Field label="Phone"><input className="input-luxe" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></Field>
            <Field label="Property">
              <select className="input-luxe" value={form.property_id} onChange={(e) => setForm({...form, property_id: e.target.value})}>
                <option value="">— Select —</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.property_type})</option>)}
              </select>
            </Field>
            <Field label="Apartment / unit no."><input className="input-luxe" value={form.apartment_no} onChange={(e) => setForm({...form, apartment_no: e.target.value})} placeholder="e.g. A-204" /></Field>
            <Field label="Assigned agent">
              <select className="input-luxe" value={form.agent_id} onChange={(e) => setForm({...form, agent_id: e.target.value})}>
                <option value="">— None —</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </Field>
            <Field label="Stay starts"><input className="input-luxe" type="date" value={form.stay_start} onChange={(e) => setForm({...form, stay_start: e.target.value})} /></Field>
            <Field label="Stay ends"><input className="input-luxe" type="date" value={form.stay_end} onChange={(e) => setForm({...form, stay_end: e.target.value})} /></Field>
            <Field label="Amount paid"><input className="input-luxe" type="number" value={form.amount_paid} onChange={(e) => setForm({...form, amount_paid: e.target.value})} /></Field>
            <Field label="Payment method">
              <select className="input-luxe" value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Payment status">
              <select className="input-luxe" value={form.payment_status} onChange={(e) => setForm({...form, payment_status: e.target.value})}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </Field>
          </div>
          <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-noir-deep text-white text-sm font-medium disabled:opacity-60">
            <UserPlus className="h-4 w-4" /> {saving ? "Saving…" : "Register & send code"}
          </button>
          <p className="text-xs text-noir/50 mt-3">Online payment processing is not yet wired — this records the chosen method. Irembo / Visa integration comes later.</p>
        </Panel>

        <Panel title="Recent customers" subtitle="Latest 100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-noir/60 border-b"><th className="py-2">Name</th><th>Email</th><th>Property</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2">{c.full_name}</td>
                    <td className="truncate max-w-32">{c.email}</td>
                    <td className="truncate max-w-32">{c.properties?.title ?? "—"}</td>
                    <td>{c.email_verified ? <span className="text-emerald-600">✓ Verified</span> : <span className="text-amber-600">Pending</span>}</td>
                    <td>{!c.email_verified && (
                      <button onClick={() => { setPendingCustomerId(c.id); resend({ data: { customerId: c.id } }).then(() => toast.success("Code resent")); }} className="text-xs underline">Verify</button>
                    )}</td>
                  </tr>
                ))}
                {customers.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-noir/50">No customers yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {pendingCustomerId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => { setPendingCustomerId(null); setOtp(""); }} className="absolute top-3 right-3"><X className="h-4 w-4" /></button>
            <h3 className="font-display text-xl">Enter verification code</h3>
            <p className="text-sm text-noir/60 mt-1">A 6-digit code was emailed to the customer. It expires in 5 minutes.</p>
            <input className="input-luxe mt-4 text-center text-2xl tracking-[10px] font-mono" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
            <div className="mt-4 flex gap-2">
              <button onClick={submitOtp} disabled={verifying} className="flex-1 px-4 py-2 rounded-md bg-noir-deep text-white text-sm disabled:opacity-60">{verifying ? "Verifying…" : "Verify"}</button>
              <button onClick={() => resend({ data: { customerId: pendingCustomerId } }).then(() => toast.success("Code resent"))} className="px-4 py-2 rounded-md border text-sm">Resend</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`block ${full ? "sm:col-span-2" : ""}`}><div className="text-xs font-medium text-noir/60 mb-1.5">{label}</div>{children}</label>;
}