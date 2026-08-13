import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Layers, Plus, Trash2, Save, Loader2, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/use-auth";
import { navForRoles } from "@/components/dashboard/nav-config";
import { fetchPropertyCategories } from "@/lib/property-types-public";
import { updatePropertyCategories, type PropertyTypeRow } from "@/lib/property-types.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/it/property-types")({
  head: () => ({ meta: [{ title: "Property Types — NOVAWORKS IT" }] }),
  component: PropertyTypesAdmin,
});

function PropertyTypesAdmin() {
  const { roles, primaryRole } = useAuth();
  const shell = navForRoles(roles);
  const navigate = useNavigate();
  const canEdit = roles.includes("it") || roles.includes("admin");
  useEffect(() => {
    if (roles.length && !canEdit) navigate({ to: dashboardPathFor(primaryRole) });
  }, [roles, canEdit, primaryRole, navigate]);

  const save = useServerFn(updatePropertyCategories);
  const [rows, setRows] = useState<PropertyTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchPropertyCategories()
      .then((d) => setRows(d))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<PropertyTypeRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
    setConfirmIdx(null);
  };
  const move = (i: number, delta: number) =>
    setRows((rs) => {
      const j = i + delta;
      if (j < 0 || j >= rs.length) return rs;
      const next = rs.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = () =>
    setRows((rs) => [
      ...rs,
      { key: "", label: "", plural: "", description: "", enabled: true },
    ]);

  // Validation: keys must be non-empty, slug-shaped, unique; label & plural required.
  const errors = useMemo(() => {
    const errs: Record<number, string> = {};
    const seen = new Map<string, number>();
    rows.forEach((r, i) => {
      const k = r.key.trim().toLowerCase();
      if (!k) errs[i] = "Key is required";
      else if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(k))
        errs[i] = "Key must be lowercase letters, numbers and hyphens";
      else if (seen.has(k)) errs[i] = `Duplicate key with row #${(seen.get(k) ?? 0) + 1}`;
      else seen.set(k, i);
      if (!errs[i] && !r.label.trim()) errs[i] = "Label is required";
      if (!errs[i] && !r.plural.trim()) errs[i] = "Plural is required";
    });
    return errs;
  }, [rows]);
  const hasErrors = Object.keys(errors).length > 0;

  const onSave = async () => {
    if (hasErrors) {
      toast.error("Fix the highlighted rows before saving");
      return;
    }
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
      role={shell.role}
      nav={shell.nav}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-noir/40">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <Panel
          title={`Categories (${rows.length})`}
          subtitle="Drag-free reorder with the arrows. The 'key' is the slug used to filter properties — must be lowercase, unique, and url-safe. Disabling hides the type from the site without losing data."
        >
          <div className="space-y-3">
            {rows.map((r, i) => {
              const err = errors[i];
              return (
                <div
                  key={i}
                  className={`bg-white border rounded-lg p-3 ${err ? "border-rose-300" : "border-noir/10"}`}
                >
                  <div className="grid md:grid-cols-[auto_110px_1fr_1fr_1.4fr_auto_auto_auto] gap-2 items-center">
                    <div className="flex md:flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="w-7 h-6 inline-flex items-center justify-center rounded border border-noir/10 hover:border-gold/50 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === rows.length - 1}
                        className="w-7 h-6 inline-flex items-center justify-center rounded border border-noir/10 hover:border-gold/50 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                    <label className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={(e) => update(i, { enabled: e.target.checked })}
                      />
                      {r.enabled ? "Enabled" : "Disabled"}
                    </label>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${r.enabled ? "bg-emerald-50 text-emerald-700" : "bg-noir/5 text-noir/50"}`}>
                      {r.enabled ? "Live" : "Hidden"}
                    </span>
                    {confirmIdx === i ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className="text-xs bg-rose-600 text-white rounded px-2 py-1"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmIdx(null)}
                          className="text-xs border border-noir/15 rounded px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmIdx(i)}
                        className="text-rose-600 hover:bg-rose-50 rounded-md w-9 h-9 inline-flex items-center justify-center"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {err && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
                      <AlertTriangle className="w-3.5 h-3.5" /> {err}
                    </div>
                  )}
                </div>
              );
            })}
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
              disabled={saving || hasErrors}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-5 py-2.5 rounded-md font-medium disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
            </button>
          </div>
          {hasErrors && (
            <div className="mt-3 text-xs text-rose-600 inline-flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Fix highlighted rows before saving.
            </div>
          )}
        </Panel>
      )}
    </DashboardShell>
  );
}

// Silence unused import warnings when icons map shifts.
void Layers;
void LayoutDashboard;