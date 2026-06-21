import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("app_settings").select("*").eq("id", true).maybeSingle();
    if (error) throw error;
    return data;
  });

export const updateAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    sender_name: string;
    from_email: string;
    reply_to?: string | null;
    signature: string;
    brand_color: string;
    site_url: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: isIT } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "it" });
    if (!isIT) throw new Error("Only IT can change email settings");
    const { error } = await context.supabase
      .from("app_settings")
      .update({ ...data, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", true);
    if (error) throw error;
    return { ok: true };
  });