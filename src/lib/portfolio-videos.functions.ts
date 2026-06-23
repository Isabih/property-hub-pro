import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PortfolioVideo = {
  id: string;
  title: string;
  building: string;
  url: string;
  poster?: string;
  description?: string;
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getPortfolioVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortfolioVideo[]> => {
    const supabase = publicClient();
    const { data } = await supabase
      .from("app_settings")
      .select("portfolio_videos")
      .eq("id", true)
      .maybeSingle();
    return ((data?.portfolio_videos as PortfolioVideo[] | null) ?? []).filter((v) => v && v.url);
  },
);

const VideoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160),
  building: z.string().min(1).max(160),
  url: z.string().url().max(500),
  poster: z.string().url().max(500).optional().or(z.literal("")),
  description: z.string().max(600).optional().or(z.literal("")),
});

export const updatePortfolioVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ videos: z.array(VideoSchema).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isIT } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "it" });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isIT && !isAdmin) throw new Error("Only IT or Admin can edit portfolio videos");
    const { error } = await context.supabase
      .from("app_settings")
      .update({
        portfolio_videos: data.videos,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });