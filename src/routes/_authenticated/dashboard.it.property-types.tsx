import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Layers, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/use-auth";
import { IT_NAV } from "@/components/dashboard/nav-config";
import { fetchPropertyCategories } from "@/lib/property-types-public";
import { updatePropertyCategories, type PropertyTypeRow } from "@/lib/property-types.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/it/property-types")({
  head: () => ({ meta: [{ title: "Property Types — NOVAWORKS IT" }] }),
  component: PropertyTypesAdmin,
});

function PropertyTypesAdmin() {
  const { roles, primaryRole } = useAuth();
  const navigate = useNavigate();
  const canEdit = roles.includes("it");
  useEffect(() => {
    if (roles.length && !canEdit) navigate({ to: dashboardPathFor(primaryRole) });
  }, [roles, canEdit, primaryRole, navigate]);

  const save = useServerFn(updatePropertyCategories);
  const [rows, setRows] = useState<PropertyTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPropertyCategories()
      .then((d) => setRows(d))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<PropertyTypeRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((rs) => [
      ...rs,
      { key: "", label: "", plural: "", description: "", enabled: true },
    ]);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = (await save({ data: { categories: rows } })) as { categories: PropertyTypeRow[] };
      setRows(res.categories);
      toast.success("Property types saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      title="Property Types"
      subtitle="Add, edit, enable or remove the property categories shown across the site"
      role="it"
      nav={IT_NAV}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-noir/40">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <Panel
          title={`Categories (${rows.length})`}
          subtitle="The 'key' is used to filter properties. Disabling a type hides it from the homepage and filter chips but keeps existing data intact."
        >
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="grid md:grid-cols-[110px_1fr_1fr_1.4fr_auto_auto] gap-2 items-center bg-white border border-noir/10 rounded-lg p-3">
                <input
                  className="input-luxe"
                  placeholder="key"
                  value={r.key}
                  onChange={(e) => update(i, { key: e.target.value })}
                />
                <input
                  className="input-luxe"
                  placeholder="Label (singular)"
                  value={r.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                />
                <input
                  className="input-luxe"
                  placeholder="Plural"
                  value={r.plural}
                  onChange={(e) => update(i, { plural: e.target.value })}
                />
                <input
                  className="input-luxe"
                  placeholder="Description"
                  value={r.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => update(i, { enabled: e.target.checked })}
                  />
                  Enabled
                </label>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-rose-600 hover:bg-rose-50 rounded-md w-9 h-9 inline-flex items-center justify-center"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-noir/15 hover:border-gold/50"
            >
              <Plus className="w-4 h-4" /> Add type
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-5 py-2.5 rounded-md font-medium disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
            </button>
          </div>
        </Panel>
      )}
    </DashboardShell>
  );
}

// Silence unused import warnings when icons map shifts.
void Layers;
void LayoutDashboard;