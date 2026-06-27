import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PropertyTypeRow {
  key: string;
  label: string;
  plural: string;
  description: string;
  enabled: boolean;
}

export const updatePropertyCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { categories: PropertyTypeRow[] }) => d)
  .handler(async ({ data, context }) => {
    const { data: isIT } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "it" });
    if (!isIT) throw new Error("Only IT can edit property types");
    const cleaned = data.categories
      .map((c) => ({
        key: String(c.key).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""),
        label: String(c.label).trim(),
        plural: String(c.plural).trim(),
        description: String(c.description ?? "").trim(),
        enabled: !!c.enabled,
      }))
      .filter((c) => c.key && c.label && c.plural);
    const seen = new Set<string>();
    const unique = cleaned.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
    const { error } = await context.supabase
      .from("app_settings")
      .update({ property_categories: unique, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", true);
    if (error) throw error;
    return { ok: true, categories: unique };
  });