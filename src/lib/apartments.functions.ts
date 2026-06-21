import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export function defaultPrefixFromTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean).slice(0, 4);
  if (!words.length) return "APT";
  const letters = words.map((w) => w[0]?.toUpperCase()).join("");
  return letters.slice(0, 4) || "APT";
}

export const generateApartmentsForProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { property_id: string; count: number; prefix: string }) => d)
  .handler(async ({ data, context }) => {
    const count = Math.max(1, Math.min(500, data.count | 0));
    const prefix = data.prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "APT";
    const rows = Array.from({ length: count }, (_, i) => ({
      property_id: data.property_id,
      code: `${prefix}-${String(i + 1).padStart(3, "0")}`,
      status: "available",
    }));
    // delete existing then insert (idempotent regeneration)
    await context.supabase.from("apartments").delete().eq("property_id", data.property_id);
    const { error } = await context.supabase.from("apartments").insert(rows);
    if (error) throw error;
    return { ok: true, created: rows.length };
  });

export const listApartmentsByProperty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { property_id: string; only_available?: boolean }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("apartments").select("*").eq("property_id", data.property_id).order("code");
    if (data.only_available) q = q.eq("status", "available");
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const updateApartmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "available" | "occupied" | "maintenance" | "reserved" }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("apartments").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
