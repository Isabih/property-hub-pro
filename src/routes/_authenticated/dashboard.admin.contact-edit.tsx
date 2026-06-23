import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Mail, Save, Plus, Trash2, Users } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { MediaInput } from "@/components/dashboard/MediaInput";
import {
  getContactContent,
  updateContactContent,
  type ContactContent,
  type TeamMember,
} from "@/lib/contact-content.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/contact-edit")({
  head: () => ({ meta: [{ title: "Edit Contact Page — NOVAWORKS" }] }),
  component: () => (
    <RoleGate allow={["admin", "it"]}>
      <ContactEditPage />
    </RoleGate>
  ),
});

function ContactEditPage() {
  const load = useServerFn(getContactContent);
  const save = useServerFn(updateContactContent);
  const [content, setContent] = useState<ContactContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load().then(setContent); }, []);

  if (!content) {
    return (
      <DashboardShell title="Edit Contact" role="admin" nav={nav}>
        <Panel title="Loading…"><div className="py-12 text-center text-noir/50 text-sm">Fetching contact content…</div></Panel>
      </DashboardShell>
    );
  }

  const setCEO = (patch: Partial<ContactContent["ceo"]>) =>
    setContent({ ...content, ceo: { ...content.ceo, ...patch } });
  const setInfo = (patch: Partial<ContactContent["info"]>) =>
    setContent({ ...content, info: { ...content.info, ...patch } });
  const setMember = (i: number, patch: Partial<TeamMember>) => {
    const team = [...content.team];
    team[i] = { ...team[i], ...patch };
    setContent({ ...content, team });
  };
  const addMember = () => setContent({
    ...content,
    team: [...content.team, { name: "New member", role: "Role", image: "" }],
  });
  const removeMember = (i: number) => {
    if (!confirm(`Remove ${content.team[i].name}?`)) return;
    setContent({ ...content, team: content.team.filter((_, idx) => idx !== i) });
  };
  const moveMember = (i: number, dir: -1 | 1) => {
    const team = [...content.team];
    const j = i + dir;
    if (j < 0 || j >= team.length) return;
    [team[i], team[j]] = [team[j], team[i]];
    setContent({ ...content, team });
  };

  const onSave = async () => {
    if (!content.ceo.image) return toast.error("CEO photo is required");
    if (content.team.some((m) => !m.image)) return toast.error("Every team member needs a photo");
    setSaving(true);
    try {
      await save({ data: content });
      toast.success("Contact page updated");
    } catch (e: any) { toast.error(e?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell
      title="Edit Contact Page"
      subtitle="Update CEO, team members and contact details shown on /contact"
      role="admin"
      nav={nav}
      actions={[{ label: saving ? "Saving…" : "Save changes", icon: Save, variant: "primary", onClick: onSave }]}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="CEO" subtitle="Featured large card at the top of the page">
          <div className="grid sm:grid-cols-[200px_1fr] gap-4">
            <div>
              <div className="text-xs text-noir/60 mb-1.5">Portrait</div>
              <MediaInput value={content.ceo.image} onChange={(url) => setCEO({ image: url })} subdir="contact/ceo" aspect="aspect-[4/5]" />
            </div>
            <div className="space-y-3">
              <Field label="Name"><input className="input-luxe" value={content.ceo.name} onChange={(e) => setCEO({ name: e.target.value })} /></Field>
              <Field label="Title"><input className="input-luxe" value={content.ceo.title} onChange={(e) => setCEO({ title: e.target.value })} /></Field>
              <Field label="Quote"><textarea rows={4} className="input-luxe" value={content.ceo.quote} onChange={(e) => setCEO({ quote: e.target.value })} /></Field>
              <Field label="Footnote (e.g. 'Leading NOVAWORKS since 2014')"><input className="input-luxe" value={content.ceo.since} onChange={(e) => setCEO({ since: e.target.value })} /></Field>
            </div>
          </div>
        </Panel>

        <Panel
          title={`Team (${content.team.length})`}
          subtitle="Cards shown under the CEO"
          action={<button onClick={addMember} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-noir-deep text-white"><Plus className="h-3.5 w-3.5" /> Add member</button>}
        >
          <div className="space-y-4">
            {content.team.map((m, i) => (
              <div key={i} className="grid sm:grid-cols-[140px_1fr_auto] gap-3 items-start border border-noir/10 rounded-lg p-3">
                <MediaInput value={m.image} onChange={(url) => setMember(i, { image: url })} subdir="contact/team" aspect="aspect-square" />
                <div className="space-y-2">
                  <Field label="Name"><input className="input-luxe" value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} /></Field>
                  <Field label="Role"><input className="input-luxe" value={m.role} onChange={(e) => setMember(i, { role: e.target.value })} /></Field>
                </div>
                <div className="flex sm:flex-col gap-1 text-xs">
                  <button onClick={() => moveMember(i, -1)} disabled={i === 0} className="px-2 py-1 rounded border disabled:opacity-30">↑</button>
                  <button onClick={() => moveMember(i, 1)} disabled={i === content.team.length - 1} className="px-2 py-1 rounded border disabled:opacity-30">↓</button>
                  <button onClick={() => removeMember(i)} className="px-2 py-1 rounded border text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {content.team.length === 0 && <p className="text-sm text-noir/50 text-center py-6">No team members yet — click "Add member".</p>}
          </div>
        </Panel>

        <Panel title="Contact details" subtitle="Phone, email, address, hours">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Phone"><input className="input-luxe" value={content.info.phone} onChange={(e) => setInfo({ phone: e.target.value })} /></Field>
            <Field label="Phone hours"><input className="input-luxe" value={content.info.phone_hours} onChange={(e) => setInfo({ phone_hours: e.target.value })} /></Field>
            <Field label="Email"><input className="input-luxe" value={content.info.email} onChange={(e) => setInfo({ email: e.target.value })} /></Field>
            <Field label="Email note"><input className="input-luxe" value={content.info.email_note} onChange={(e) => setInfo({ email_note: e.target.value })} /></Field>
            <Field label="Address"><input className="input-luxe" value={content.info.address} onChange={(e) => setInfo({ address: e.target.value })} /></Field>
            <Field label="Address note"><input className="input-luxe" value={content.info.address_note} onChange={(e) => setInfo({ address_note: e.target.value })} /></Field>
            <Field label="Office hours"><input className="input-luxe" value={content.info.hours} onChange={(e) => setInfo({ hours: e.target.value })} /></Field>
            <Field label="Hours note"><input className="input-luxe" value={content.info.hours_note} onChange={(e) => setInfo({ hours_note: e.target.value })} /></Field>
          </div>
        </Panel>
      </div>

      <div className="mt-6 text-right">
        <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold text-noir-deep font-medium disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </DashboardShell>
  );
}

const nav = [
  { to: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/admin/contact-edit", label: "Contact Page", icon: Mail, group: "Content" },
  { to: "/dashboard/it/staff/new", label: "Add Staff", icon: Users, group: "Management" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs font-medium text-noir/60 mb-1">{label}</div>{children}</label>;
}