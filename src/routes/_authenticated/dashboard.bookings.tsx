import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { navForRoles } from "@/components/dashboard/nav-config";
import { useAuth } from "@/lib/use-auth";
import { listAllBookings, confirmBookingPayment, rejectBooking } from "@/lib/bookings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings & Payments — NOVAWORKS" },
      { name: "description", content: "Confirm customer payments and start their stay clock." },
    ],
  }),
  component: () => (<RoleGate allow={["receptionist", "admin", "it"]}><BookingsDesk /></RoleGate>),
});

function BookingsDesk() {
  const { roles } = useAuth();
  const shell = navForRoles(roles);
  const list = useServerFn(listAllBookings);
  const confirm = useServerFn(confirmBookingPayment);
  const reject = useServerFn(rejectBooking);
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [unit, setUnit] = useState<Record<string, string>>({});

  const refresh = () => list().then((d: any) => setRows(d)).catch((e: any) => toast.error(e.message ?? "Failed to load"));
  useEffect(() => { refresh(); }, []);

  const doConfirm = async (id: string) => {
    setBusy(id);
    try {
      const r: any = await confirm({ data: { booking_id: id, apartment_no: unit[id] || null } });
      toast.success(`Confirmed — stay expires ${new Date(r.stay_end).toLocaleString()}`);
      refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  const doReject = async (id: string) => {
    if (!window.confirm("Cancel this booking and notify the customer?")) return;
    setBusy(id);
    try { await reject({ data: { booking_id: id } }); toast.success("Booking cancelled"); refresh(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  const pending = rows.filter((r) => r.status === "pending");
  const rest = rows.filter((r) => r.status !== "pending");

  return (
    <DashboardShell title="Bookings & Payments" subtitle="Confirm payments — the stay clock starts on your confirmation" role={shell.role} nav={shell.nav}>
      <Panel title="Awaiting confirmation" subtitle={`${pending.length} booking(s)`}>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">Nothing waiting.</p>}
        <div className="space-y-3">
          {pending.map((b) => (
            <div key={b.id} className="rounded-lg border border-border p-4 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
              <div>
                <div className="font-medium">{b.full_name} · {b.properties?.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {b.email} · {b.phone} · {b.check_in} → {b.check_out} ({b.nights} night(s))
                </div>
                <div className="text-xs mt-1">
                  {b.currency} {Number(b.amount).toLocaleString()} · {b.payment_method} ·{" "}
                  <span className={b.payment_status === "paid" ? "text-emerald-700" : "text-amber-700"}>payment {b.payment_status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input className="input-luxe !py-1.5 !w-28" placeholder="Unit no." value={unit[b.id] ?? ""} onChange={(e) => setUnit({ ...unit, [b.id]: e.target.value })} />
                <button onClick={() => doConfirm(b.id)} disabled={busy === b.id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-white text-xs font-medium disabled:opacity-60">
                  {busy === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Confirm
                </button>
                <button onClick={() => doReject(b.id)} disabled={busy === b.id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-red-300 text-red-700 text-xs font-medium disabled:opacity-60">
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-6">
        <Panel title="All bookings" subtitle="Confirmed, cancelled and past stays">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">Guest</th><th>Property</th><th>Dates</th><th>Amount</th><th>Status</th><th>Expires</th>
              </tr></thead>
              <tbody>
                {rest.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="py-2">{b.full_name}</td>
                    <td>{b.properties?.title}</td>
                    <td className="text-xs">{b.check_in} → {b.check_out}</td>
                    <td>{b.currency} {Number(b.amount).toLocaleString()}</td>
                    <td className="text-xs">{b.status} / {b.payment_status}</td>
                    <td className="text-xs">{b.stay_end ? new Date(b.stay_end).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {rest.length === 0 && <tr><td colSpan={6} className="py-3 text-muted-foreground">No records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
