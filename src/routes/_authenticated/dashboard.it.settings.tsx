import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Settings, LayoutDashboard, Mail, Save, Send } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/lib/use-auth";
import { getAppSettings, updateAppSettings } from "@/lib/app-settings.functions";
import { sendCustomEmail } from "@/lib/email.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/it/settings")({
  head: () => ({ meta: [{ title: "Email Settings — NOVAWORKS" }] }),
  component: ITSettings,
});

const NAV = [
  { to: "/dashboard/it", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/it/settings", label: "Email Settings", icon: Mail, group: "System" },
];

function ITSettings() {
  const { roles } = useAuth();
  const navigate = useNavigate();
  const canEdit = roles.includes("it");
  const get = useServerFn(getAppSettings);
  const save = useServerFn(updateAppSettings);
  const sendTest = useServerFn(sendCustomEmail);

  const [form, setForm] = useState({
    sender_name: "",
    from_email: "",
    reply_to: "",
    signature: "",
    brand_color: "#0f766e",
    site_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (roles.length && !canEdit) {
      toast.error("Only IT can edit email settings");
      navigate({ to: "/dashboard/it" });
    }
  }, [roles, canEdit, navigate]);

  useEffect(() => {
    get().then((s: any) => {
      if (s) setForm({
        sender_name: s.sender_name ?? "",
        from_email: s.from_email ?? "",
        reply_to: s.reply_to ?? "",
        signature: s.signature ?? "",
        brand_color: s.brand_color ?? "#0f766e",
        site_url: s.site_url ?? "",
      });
    }).finally(() => setLoading(false));
  }, [get]);

  const submit = async () => {
    setSaving(true);
    try {
      await save({ data: { ...form, reply_to: form.reply_to || null } });
      toast.success("Email settings saved");
    } catch (e: any) { toast.error(e.message ?? "Failed to save"); }
    finally { setSaving(false); }
  };

  const sendTestEmail = async () => {
    if (!testTo) return toast.error("Enter a recipient");
    setSendingTest(true);
    try {
      await sendTest({ data: { to: testTo, subject: "Novaworks email test", html: "<p>This is a test email from your Novaworks settings.</p>", kind: "test" } });
      toast.success("Test email sent");
    } catch (e: any) { toast.error(e.message ?? "Failed to send"); }
    finally { setSendingTest(false); }
  };

  return (
    <DashboardShell title="Email Settings" subtitle="Configure how outbound emails appear to recipients" role="it" nav={NAV} actions={[{ label: saving ? "Saving…" : "Save Settings", icon: Save, onClick: submit, variant: "primary" }]}>
      {loading ? <p className="text-noir/60">Loading…</p> : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Sender" subtitle="What recipients see in their inbox">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Sender name"><input className="input-luxe" value={form.sender_name} onChange={(e) => setForm({...form, sender_name: e.target.value})} /></Field>
                <Field label="From email"><input className="input-luxe" value={form.from_email} onChange={(e) => setForm({...form, from_email: e.target.value})} placeholder="no-reply@yourdomain.com" /></Field>
                <Field label="Reply-to (optional)"><input className="input-luxe" value={form.reply_to} onChange={(e) => setForm({...form, reply_to: e.target.value})} /></Field>
                <Field label="Site URL"><input className="input-luxe" value={form.site_url} onChange={(e) => setForm({...form, site_url: e.target.value})} /></Field>
                <Field label="Brand color"><input type="color" className="input-luxe h-10" value={form.brand_color} onChange={(e) => setForm({...form, brand_color: e.target.value})} /></Field>
              </div>
            </Panel>
            <Panel title="Email footer / signature" subtitle="Shown at the bottom of every outgoing email">
              <textarea className="input-luxe min-h-40 font-mono text-sm" value={form.signature} onChange={(e) => setForm({...form, signature: e.target.value})} />
              <p className="text-xs text-noir/50 mt-2">Line breaks are preserved. This appears under every system email.</p>
            </Panel>
            <Panel title="Send a test email" subtitle="Verify your sender domain is configured in Resend">
              <div className="flex gap-2">
                <input className="input-luxe flex-1" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
                <button onClick={sendTestEmail} disabled={sendingTest} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-noir-deep text-white text-sm disabled:opacity-60">
                  <Send className="h-4 w-4" /> {sendingTest ? "Sending…" : "Send test"}
                </button>
              </div>
              <p className="text-xs text-noir/50 mt-3">⚠ The From email's domain must be verified in your Resend account, or Resend will reject the send.</p>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel title="Live preview" subtitle="How a recipient sees your email">
              <div className="rounded-md overflow-hidden border border-noir/10 text-sm">
                <div style={{ background: form.brand_color, color: "#fff", padding: "16px 20px", fontWeight: 600 }}>{form.sender_name || "Sender"}</div>
                <div className="p-5 bg-white">
                  <p>Hello,</p>
                  <p>This is an example body. Real emails populate dynamic content here.</p>
                </div>
                <div className="p-4 border-t bg-white text-xs text-noir/60 whitespace-pre-line">{form.signature}</div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs font-medium text-noir/60 mb-1.5">{label}</div>{children}</label>;
}