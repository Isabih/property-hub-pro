import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PopupSettings = {
  enabled: boolean;
  cycle_ms: number;
  visible_ms: number;
  max_items: number;
  property_ids: string[];
};

export const POPUP_DEFAULTS: PopupSettings = {
  enabled: true,
  cycle_ms: 20000,
  visible_ms: 8000,
  max_items: 6,
  property_ids: [],
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getPopupSettings = createServerFn({ method: "GET" }).handler(async (): Promise<PopupSettings> => {
  const supabase = publicClient();
  const { data } = await supabase.from("app_settings").select("popup_settings").eq("id", true).maybeSingle();
  const raw = (data?.popup_settings ?? null) as Partial<PopupSettings> | null;
  return { ...POPUP_DEFAULTS, ...(raw ?? {}) };
});

const Schema = z.object({
  enabled: z.boolean(),
  cycle_ms: z.number().int().min(4000).max(300000),
  visible_ms: z.number().int().min(2000).max(60000),
  max_items: z.number().int().min(1).max(24),
  property_ids: z.array(z.string().uuid()).max(24),
});

export const updatePopupSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Schema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isIT } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "it" });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isIT && !isAdmin) throw new Error("Only IT or Admin can change popup settings");
    const { error } = await context.supabase
      .from("app_settings")
      .update({ popup_settings: data, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
