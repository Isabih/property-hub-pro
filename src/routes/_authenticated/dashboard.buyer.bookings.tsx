import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, CreditCard, Loader2, Clock } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { BUYER_NAV } from "@/components/dashboard/nav-config";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { createBooking, listMyBookings, startBookingPayment, verifyBookingPayment, PAYMENT_METHODS } from "@/lib/bookings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/buyer/bookings")({
  head: () => ({
    meta: [
      { title: "Book & Pay — NOVAWORKS" },
      { name: "description", content: "Book a NOVAWORKS apartment and pay online with MoMo, Airtel Money or card." },
    ],
  }),
  component: () => (<RoleGate allow={["buyer"]}><MyBookings /></RoleGate>),
});

function MyBookings() {
  const { user, profile } = useAuth();
  const create = useServerFn(createBooking);
  const list = useServerFn(listMyBookings);
  const pay = useServerFn(startBookingPayment);
  const verify = useServerFn(verifyBookingPayment);

  const [rows, setRows] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    property_id: "", full_name: "", email: "", phone: "",
    check_in: "", check_out: "", payment_method: "momo", notes: "",
  });

  const refresh = () => list().then((d: any) => setRows(d)).catch(() => {});

  useEffect(() => {
    refresh();
    supabase.from("properties").select("id,title,price,currency,city").eq("status", "active").order("title")
      .then(({ data }) => setProps(data ?? []));
  }, []);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      full_name: f.full_name || profile?.full_name || "",
      email: f.email || profile?.email || user?.email || "",
      phone: f.phone || profile?.phone || "",
    }));
  }, [profile, user]);

  // Handle the gateway redirect back (?tx_ref=...)
  useEffect(() => {
    const tx = new URLSearchParams(window.location.search).get("tx_ref");
    if (!tx) return;
    verify({ data: { tx_ref: tx } })
      .then((r: any) => {
        toast[r.paid ? "success" : "error"](r.paid ? "Payment received — awaiting reception confirmation." : "Payment was not completed.");
        window.history.replaceState({}, "", window.location.pathname);
        refresh();
      })
      .catch((e: any) => toast.error(e.message ?? "Could not verify payment"));
  }, []);

  const selected = useMemo(() => props.find((p) => p.id === form.property_id), [props, form.property_id]);
  const nights = useMemo(() => {
    if (!form.check_in || !form.check_out) return 0;
    const ms = new Date(form.check_out).getTime() - new Date(form.check_in).getTime();
    return Math.max(0, Math.round(ms / 86400000));
  }, [form.check_in, form.check_out]);
  const total = selected ? Number(selected.price ?? 0) * Math.max(nights, 1) : 0;

  const submit = async () => {
    if (!form.property_id || !form.check_in || !form.check_out) return toast.error("Pick a property and your dates");
    if (nights < 1) return toast.error("Check-out must be after check-in");
    setBusy(true);
    try {
      const booking: any = await create({ data: { ...form, notes: form.notes || null } as any });
      toast.success("Booking created");
      if (form.payment_method === "cash") {
        toast.message("Pay at reception — your stay starts once reception confirms.");
      } else {
        const res: any = await pay({ data: { booking_id: booking.id, redirect_url: window.location.origin + "/dashboard/buyer/bookings" } });
        window.location.href = res.link;
        return;
      }
      setForm({ ...form, check_in: "", check_out: "", notes: "" });
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Booking failed");
    } finally { setBusy(false); }
  };

  return (
    <DashboardShell title="Book & Pay" subtitle="Reserve an apartment and pay with MoMo, Airtel Money or card" role="buyer" nav={BUYER_NAV}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="New booking" subtitle="Your stay starts once reception confirms your payment">
          <div className="grid sm:grid-cols-2 gap-3">
            <F label="Property" full>
              <select className="input-luxe" value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}>
                <option value="">Select a property…</option>
                {props.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.city}</option>)}
              </select>
            </F>
            <F label="Full name"><input className="input-luxe" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></F>
            <F label="Phone"><input className="input-luxe" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2507…" /></F>
            <F label="Email" full><input className="input-luxe" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></F>
            <F label="Check-in"><input className="input-luxe" type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></F>
            <F label="Check-out"><input className="input-luxe" type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></F>
            <F label="Payment method" full>
              <select className="input-luxe" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </F>
            <F label="Notes (optional)" full><textarea className="input-luxe" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
          </div>
          {selected && nights > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div className="flex justify-between"><span>{nights} night(s) × {selected.currency} {Number(selected.price).toLocaleString()}</span>
                <strong>{selected.currency} {total.toLocaleString()}</strong></div>
            </div>
          )}
          <button onClick={submit} disabled={busy} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-noir-deep text-white text-sm font-medium disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {form.payment_method === "cash" ? "Reserve (pay at reception)" : "Book & pay now"}
          </button>
        </Panel>

        <Panel title="My bookings" subtitle="Status and stay expiry">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
          <div className="space-y-3">
            {rows.map((b) => (
              <div key={b.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{b.properties?.title ?? "Property"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" /> {b.check_in} → {b.check_out} · {b.nights} night(s)
                    </div>
                    {b.stay_end && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Expires {new Date(b.stay_end).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{b.currency} {Number(b.amount).toLocaleString()}</div>
                    <Badge status={b.status} payment={b.payment_status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}

function Badge({ status, payment }: { status: string; payment: string }) {
  const tone = status === "confirmed" ? "bg-emerald-100 text-emerald-800" : status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800";
  return <div className="mt-1 flex flex-col items-end gap-1">
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${tone}`}>{status}</span>
    <span className="text-[11px] text-muted-foreground">payment: {payment}</span>
  </div>;
}

function F({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`block ${full ? "sm:col-span-2" : ""}`}><div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>{children}</label>;
}
