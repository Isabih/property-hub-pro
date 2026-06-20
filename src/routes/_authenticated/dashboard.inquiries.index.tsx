import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Inbox, LayoutDashboard, Building2, MessageSquare, RefreshCw, CalendarCheck, CheckCircle2, Mail, Phone, ExternalLink } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/inquiries/")({
  head: () => ({ meta: [{ title: "Inquiries — NOVAWORKS" }] }),
  component: InquiriesPage,
});

type InquiryStatus = "new" | "contacted" | "scheduled" | "closed";
const STATUSES: InquiryStatus[] = ["new", "contacted", "scheduled", "closed"];
const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  contacted: "bg-sky-100 text-sky-800 border-sky-200",
  scheduled: "bg-violet-100 text-violet-800 border-violet-200",
  closed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

interface InquiryRow {
  id: string;
  property_id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  properties: {
    id: string;
    title: string;
    slug: string;
    owner_id: string;
    agent_id: string | null;
    city: string | null;
  } | null;
}

function navFor(role: "agent" | "owner") {
  const base = role === "agent" ? "/dashboard/agent" : "/dashboard/owner";
  return [
    { to: base, label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
    { to: "/dashboard/properties", label: role === "agent" ? "My Listings" : "My Properties", icon: Building2, group: "Content" },
    { to: "/dashboard/inquiries", label: "Inquiries", icon: MessageSquare, group: "Management" },
  ];
}

function InquiriesPage() {
  const { user, roles, profile } = useAuth();
  const role: "agent" | "owner" = roles.includes("agent") ? "agent" : "owner";
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("property_inquiries")
      .select("*, properties:property_id(id,title,slug,owner_id,agent_id,city)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setRows((data ?? []) as unknown as InquiryRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const s of STATUSES) c[s] = rows.filter((r) => r.status === s).length;
    return c;
  }, [rows]);

  async function updateStatus(id: string, status: InquiryStatus) {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from("property_inquiries").update({ status }).eq("id", id);
    if (error) {
      setRows(prev);
      toast.error(error.message);
    } else {
      toast.success(`Marked as ${status}`);
    }
  }

  async function scheduleVisit(id: string, iso: string) {
    const { error } = await supabase
      .from("property_inquiries")
      .update({ scheduled_at: iso, status: "scheduled" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Visit scheduled");
      load();
    }
  }

  return (
    <DashboardShell
      title="Inquiries"
      subtitle={role === "agent" ? "Buyer leads on properties assigned to you" : "Inquiries on properties you own"}
      role={role}
      nav={navFor(role)}
      actions={[{ label: "Refresh", icon: RefreshCw, onClick: load }]}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition ${
              filter === s ? "bg-noir-deep text-white border-noir-deep" : "bg-white text-noir border-noir/10 hover:border-noir/30"
            }`}
          >
            {s} <span className="opacity-60">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Panel title="Conversations" subtitle={`${filtered.length} ${filtered.length === 1 ? "inquiry" : "inquiries"}`}>
            {loading ? (
              <p className="text-sm text-noir/50">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-noir/50 py-6 text-center">
                <Inbox className="h-6 w-6 mx-auto mb-2 opacity-40" />
                No inquiries yet.
              </div>
            ) : (
              <ul className="divide-y divide-noir/5 -mx-2">
                {filtered.map((r) => {
                  const isMine = role === "agent" ? r.properties?.agent_id === user?.id : r.properties?.owner_id === user?.id;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg transition ${
                          selected?.id === r.id ? "bg-noir-deep/5" : "hover:bg-noir-deep/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{r.name || r.email || "Anonymous"}</div>
                            <div className="text-xs text-noir/60 truncate">{r.properties?.title ?? "—"}</div>
                          </div>
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[(r.status as InquiryStatus) ?? "new"] ?? STATUS_STYLE.new}`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-noir/50">
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                          {!isMine && <span className="text-gold">• assigned via team</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <InquiryDetail
              key={selected.id}
              inquiry={selected}
              role={role}
              currentUserId={user?.id ?? null}
              onStatusChange={(s) => updateStatus(selected.id, s)}
              onSchedule={(iso) => scheduleVisit(selected.id, iso)}
            />
          ) : (
            <Panel title="Select an inquiry" subtitle="Pick a conversation to view details">
              <p className="text-sm text-noir/50">Nothing selected.</p>
            </Panel>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function InquiryDetail({
  inquiry,
  role,
  currentUserId,
  onStatusChange,
  onSchedule,
}: {
  inquiry: InquiryRow;
  role: "agent" | "owner";
  currentUserId: string | null;
  onStatusChange: (s: InquiryStatus) => void;
  onSchedule: (iso: string) => void;
}) {
  const [scheduleAt, setScheduleAt] = useState<string>(
    inquiry.scheduled_at ? new Date(inquiry.scheduled_at).toISOString().slice(0, 16) : "",
  );
  const assignedToMe = role === "agent"
    ? inquiry.properties?.agent_id === currentUserId
    : inquiry.properties?.owner_id === currentUserId;
  const status = (inquiry.status as InquiryStatus) ?? "new";

  return (
    <Panel
      title={inquiry.name || inquiry.email || "Anonymous inquirer"}
      subtitle={inquiry.properties?.title ?? undefined}
      action={
        inquiry.properties?.slug ? (
          <Link
            to="/properties/$slug"
            params={{ slug: inquiry.properties.slug }}
            className="text-xs text-gold inline-flex items-center gap-1"
          >
            View property <ExternalLink className="h-3 w-3" />
          </Link>
        ) : null
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${STATUS_STYLE[status]}`}>
            {status}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border bg-noir-deep/5 border-noir/10">
            {role === "agent" ? "Agent view" : "Owner view"}
          </span>
          {assignedToMe ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
              Assigned to you
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-700">
              Team property
            </span>
          )}
          <span className="text-[11px] text-noir/50 ml-auto">
            Received {new Date(inquiry.created_at).toLocaleString()}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {inquiry.email && (
            <a href={`mailto:${inquiry.email}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-noir/10 text-sm hover:border-gold">
              <Mail className="h-4 w-4 text-noir/50" /> {inquiry.email}
            </a>
          )}
          {inquiry.phone && (
            <a href={`tel:${inquiry.phone}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-noir/10 text-sm hover:border-gold">
              <Phone className="h-4 w-4 text-noir/50" /> {inquiry.phone}
            </a>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-noir/50 mb-1">Message</div>
          <div className="rounded-lg bg-noir-deep/5 p-4 text-sm whitespace-pre-wrap min-h-[80px]">
            {inquiry.message || <span className="text-noir/40">No message provided.</span>}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-noir/50 mb-2">Update status</div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                disabled={s === status}
                className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-wider border transition ${
                  s === status
                    ? "bg-noir-deep text-white border-noir-deep cursor-default"
                    : "bg-white border-noir/10 hover:border-gold"
                }`}
              >
                {s === "contacted" && <Mail className="inline h-3 w-3 mr-1" />}
                {s === "scheduled" && <CalendarCheck className="inline h-3 w-3 mr-1" />}
                {s === "closed" && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-noir/50 mb-2">Schedule visit</div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="px-3 py-2 rounded-md border border-noir/10 text-sm bg-white"
            />
            <button
              onClick={() => scheduleAt && onSchedule(new Date(scheduleAt).toISOString())}
              disabled={!scheduleAt}
              className="px-4 py-2 rounded-md bg-gold text-noir-deep text-sm font-medium disabled:opacity-40"
            >
              {inquiry.scheduled_at ? "Reschedule" : "Schedule"}
            </button>
            {inquiry.scheduled_at && (
              <span className="text-xs text-noir/60">
                Currently: {new Date(inquiry.scheduled_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}