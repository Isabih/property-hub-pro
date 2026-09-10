import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { navForRoles } from "@/components/dashboard/nav-config";
import { useAuth } from "@/lib/use-auth";
import { listPropertiesForPicker } from "@/lib/property-of-day.functions";
import { getPopupSettings, updatePopupSettings, POPUP_DEFAULTS, type PopupSettings } from "@/lib/popup-settings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/it/popups")({
  head: () => ({ meta: [{ title: "Corner Popups — NOVAWORKS" }] }),
  component: () => (
    <RoleGate allow={["it", "admin"]}>
      <Page />
    </RoleGate>
  ),
});

function Page() {
  const { roles } = useAuth();
  const shell = navForRoles(roles);
  const list = useServerFn(listPropertiesForPicker);
  const get = useServerFn(getPopupSettings);
  const save = useServerFn(updatePopupSettings);

  const [items, setItems] = useState<any[]>([]);
  const [s, setS] = useState<PopupSettings>(POPUP_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([list(), get()])
      .then(([rows, settings]) => {
        setItems(rows);
        setS(settings);
      })
      .catch(() => toast.error("Failed to load popup settings"))
      .finally(() => setLoading(false));
  }, [list, get]);

  const toggleProperty = (id: string) => {
    setS((prev) => ({
      ...prev,
      property_ids: prev.property_ids.includes(id)
        ? prev.property_ids.filter((x) => x !== id)
        : [...prev.property_ids, id].slice(0, 24),
    }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ data: s });
      toast.success("Popup settings saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      title="Corner Popups"
      subtitle="Control the small property adverts that appear in the corner of the website"
      role={shell.role}
      nav={shell.nav}
      actions={[{ label: saving ? "Saving…" : "Save changes", onClick: onSave, variant: "primary" }]}
    >
      {loading ? (
        <p className="text-noir/60">Loading…</p>
      ) : (
        <>
          <Panel title="Behaviour" subtitle="How often popups appear and how long they stay">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex items-center gap-3 text-sm text-noir">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => setS({ ...s, enabled: e.target.checked })}
                  className="w-4 h-4 accent-[var(--color-gold,#c9a227)]"
                />
                Show popups on the site
              </label>
              <label className="text-sm text-noir/70">
                Appear every (seconds)
                <input
                  type="number"
                  min={4}
                  max={300}
                  value={Math.round(s.cycle_ms / 1000)}
                  onChange={(e) => setS({ ...s, cycle_ms: Math.max(4, Number(e.target.value) || 4) * 1000 })}
                  className="mt-1 w-full rounded-lg border border-noir/15 px-3 py-2 text-noir"
                />
              </label>
              <label className="text-sm text-noir/70">
                Stay visible (seconds)
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={Math.round(s.visible_ms / 1000)}
                  onChange={(e) => setS({ ...s, visible_ms: Math.max(2, Number(e.target.value) || 2) * 1000 })}
                  className="mt-1 w-full rounded-lg border border-noir/15 px-3 py-2 text-noir"
                />
              </label>
              <label className="text-sm text-noir/70">
                Max properties in rotation
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={s.max_items}
                  onChange={(e) => setS({ ...s, max_items: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })}
                  className="mt-1 w-full rounded-lg border border-noir/15 px-3 py-2 text-noir"
                />
              </label>
            </div>
          </Panel>

          <div className="mt-6">
            <Panel
              title="Properties to advertise"
              subtitle={s.property_ids.length === 0 ? "None selected — all active properties rotate" : `${s.property_ids.length} selected`}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((p) => {
                  const on = s.property_ids.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProperty(p.id)}
                      className={`text-left bg-white rounded-xl overflow-hidden border transition-all hover:shadow-lg ${on ? "border-gold ring-2 ring-gold/40" : "border-noir/10"}`}
                    >
                      <div className="relative aspect-[4/3] bg-noir/10">
                        {p.cover && <img src={p.cover} alt={p.title} className="w-full h-full object-cover" />}
                        {on && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-gold text-noir-deep text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded">
                            <Check className="w-3 h-3" /> In rotation
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-medium text-noir line-clamp-1">{p.title}</div>
                        <div className="text-xs text-noir/60 mt-1">{p.district ? `${p.district}, ${p.city ?? ""}` : p.city}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
