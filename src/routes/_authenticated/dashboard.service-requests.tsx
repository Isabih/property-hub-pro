import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wrench, AlertCircle, Clock, CheckCircle2, Search, X, Send, UserCheck,
  LayoutDashboard, Building2, MessageSquare, Bell,
} from "lucide-react";
import { DashboardShell, StatCard, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { useAuth } from "@/lib/use-auth";
import {
  listAllServiceRequests, updateServiceRequest, listAssignableStaff,
} from "@/lib/service-requests.functions";

export const Route = createFileRoute("/_authenticated/dashboard/service-requests")({
  head: () => ({ meta: [{ title: "Service Requests — Staff" }] }),
  component: () => (
    <RoleGate allow={["admin", "it", "receptionist"]}>
      <StaffServiceRequestsPage />
    </RoleGate>
  ),
});

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-noir/5 text-noir/60",
};
const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-noir/5 text-noir/70",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 animate-pulse",
};

function StaffServiceRequestsPage() {
  const { primaryRole } = useAuth();
  const role = (primaryRole ?? "admin") as any;
  const qc = useQueryClient();
  const list = useServerFn(listAllServiceRequests);
  const listStaff = useServerFn(listAssignableStaff);
  const update = useServerFn(updateServiceRequest);

  const { data: requests = [], isLoading } = useQuery({ queryKey: ["all-service-requests"], queryFn: () => list() });
  const { data: staff = [] } = useQuery({ queryKey: ["assignable-staff"], queryFn: () => listStaff() });

  const [selected, setSelected] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const updateMut = useMutation({
    mutationFn: (d: { id: string; status?: any; admin_response?: string; assigned_to?: string | null }) =>
      update({ data: d }),
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["all-service-requests"] });
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const filtered = useMemo(() => requests.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
    if (q) {
      const hay = `${r.title} ${r.description} ${r.customers?.full_name ?? ""} ${r.customers?.email ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [requests, q, statusFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: requests.length,
    urgent: requests.filter((r: any) => r.priority === "urgent" && r.status !== "completed").length,
    pending: requests.filter((r: any) => r.status === "pending").length,
    in_progress: requests.filter((r: any) => r.status === "in_progress").length,
  }), [requests]);

  const NAV = [
    { to: role === "receptionist" ? "/dashboard/receptionist" : `/dashboard/${role}`, label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
    { to: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Overview" },
    { to: "/dashboard/service-requests", label: "Service Requests", icon: Wrench, group: "Operations" },
    { to: "/dashboard/properties", label: "Properties", icon: Building2, group: "Content" },
  ];

  return (
    <DashboardShell title="Service Requests" subtitle="Manage, assign, and reply to customer requests" role={role} nav={NAV}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total" value={String(stats.total)} />
        <StatCard icon={AlertCircle} label="Urgent open" value={String(stats.urgent)} />
        <StatCard icon={Clock} label="Pending" value={String(stats.pending)} />
        <StatCard icon={CheckCircle2} label="In progress" value={String(stats.in_progress)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-noir/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, title, description..."
            className="w-full rounded-lg bg-white border border-noir/10 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-white border border-noir/10 px-3 py-2.5 text-sm">
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg bg-white border border-noir/10 px-3 py-2.5 text-sm">
          <option value="all">All priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-noir/50">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl bg-white border border-noir/5 p-10 text-center text-sm text-noir/50">No requests match.</div>
        )}
        {filtered.map((r: any) => {
          const assignee = staff.find((s: any) => s.id === r.assigned_to);
          return (
            <article key={r.id}
              className={`rounded-2xl bg-white border p-5 shadow-sm hover:shadow-md transition cursor-pointer ${
                r.priority === "urgent" && r.status !== "completed" ? "border-rose-200" : "border-noir/5"
              }`}
              onClick={() => setSelected(r)}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg text-noir-deep truncate">{r.title}</h3>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md capitalize ${PRIORITY_BADGE[r.priority]}`}>{r.priority}</span>
                  </div>
                  <p className="text-sm text-noir/70 mt-1 line-clamp-2">{r.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-noir/50">
                    <span>Customer: <span className="text-noir/80">{r.customers?.full_name}</span></span>
                    <span>{r.customers?.email}</span>
                    {r.customers?.apartment_no && <span>Apt {r.customers.apartment_no}</span>}
                    {r.customers?.properties?.title && <span>{r.customers.properties.title}</span>}
                    <span className="capitalize">{r.category}</span>
                    <span>{new Date(r.created_at).toISOString().slice(0, 10)}</span>
                    {assignee && (
                      <span className="inline-flex items-center gap-1 text-violet-700">
                        <UserCheck className="h-3 w-3" /> {assignee.name}
                      </span>
                    )}
                  </div>
                </div>
                {r.admin_response && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    <MessageSquare className="h-3 w-3" /> Replied
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {selected && (
        <ManageModal
          request={selected}
          staff={staff}
          onClose={() => setSelected(null)}
          onSave={(d) => updateMut.mutate({ id: selected.id, ...d })}
          saving={updateMut.isPending}
        />
      )}
    </DashboardShell>
  );
}

function ManageModal({ request, staff, onClose, onSave, saving }: {
  request: any;
  staff: any[];
  onClose: () => void;
  onSave: (d: { status?: any; admin_response?: string; assigned_to?: string | null }) => void;
  saving: boolean;
}) {
  const [status, setStatus] = useState(request.status);
  const [assignedTo, setAssignedTo] = useState<string>(request.assigned_to ?? "");
  const [reply, setReply] = useState(request.admin_response ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="flex items-center justify-between px-6 py-4 border-b border-noir/5 sticky top-0 bg-white">
          <div className="min-w-0">
            <h2 className="font-display text-xl text-noir-deep truncate">{request.title}</h2>
            <p className="text-xs text-noir/50 mt-0.5">
              {request.customers?.full_name} · {request.customers?.email} · {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-noir/50 hover:text-noir-deep">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-5">
          <Panel title="Request">
            <p className="text-sm text-noir-deep whitespace-pre-line">{request.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className={`px-2 py-0.5 rounded-md capitalize ${PRIORITY_BADGE[request.priority]}`}>{request.priority}</span>
              <span className="px-2 py-0.5 rounded-md bg-noir/5 capitalize">{request.category}</span>
            </div>
          </Panel>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-xs font-medium text-noir/60 mb-1.5">Status</div>
              <select className="input-luxe w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="block">
              <div className="text-xs font-medium text-noir/60 mb-1.5">Assign to</div>
              <select className="input-luxe w-full" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="">— Unassigned —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <div className="text-xs font-medium text-noir/60 mb-1.5">Reply to customer (sends email)</div>
            <textarea className="input-luxe w-full min-h-32" value={reply} onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply that will be emailed to the customer and shown on their dashboard…" />
          </label>
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-noir/5 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-noir-deep hover:bg-noir/5">Cancel</button>
          <button disabled={saving}
            onClick={() => onSave({
              status,
              assigned_to: assignedTo || null,
              admin_response: reply !== (request.admin_response ?? "") ? reply : undefined,
            })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gold text-noir-deep hover:bg-gold-soft disabled:opacity-50">
            <Send className="h-4 w-4" /> {saving ? "Saving…" : "Save & Notify"}
          </button>
        </footer>
      </div>
    </div>
  );
}
