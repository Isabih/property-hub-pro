import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type HeroSlide = {
  image: string;
  title: string;
  titleAccent: string;
  subtitle: string;
};

export type HomeContent = {
  hero_slides: HeroSlide[];
  category_images: Record<string, string>;
  hero_story_video_url: string;
  hero_video_bg_url: string | null;
  featured_property_ids: string[];
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const DEFAULTS: HomeContent = {
  hero_slides: [],
  category_images: {},
  hero_story_video_url: "https://www.youtube.com/watch?v=1uO3l3k7a34",
  hero_video_bg_url: null,
  featured_property_ids: [],
};

export const getHomeContent = createServerFn({ method: "GET" }).handler(async (): Promise<HomeContent> => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("app_settings")
    .select("hero_slides,category_images,hero_story_video_url,hero_video_bg_url,featured_property_ids")
    .eq("id", true)
    .maybeSingle();
  if (!data) return DEFAULTS;
  return {
    hero_slides: (data.hero_slides as HeroSlide[] | null) ?? [],
    category_images: (data.category_images as Record<string, string> | null) ?? {},
    hero_story_video_url: data.hero_story_video_url ?? DEFAULTS.hero_story_video_url,
    hero_video_bg_url: data.hero_video_bg_url ?? null,
    featured_property_ids: ((data as any).featured_property_ids as string[] | null) ?? [],
  };
});

const HeroSlideSchema = z.object({
  image: z.string().url().or(z.literal("")),
  title: z.string().min(1),
  titleAccent: z.string().min(1),
  subtitle: z.string().min(1),
});

const UpdateSchema = z.object({
  hero_slides: z.array(HeroSlideSchema).max(8),
  category_images: z.record(z.string(), z.string().url().or(z.literal(""))),
  hero_story_video_url: z.string().url(),
  hero_video_bg_url: z.string().url().nullable().or(z.literal("")),
  featured_property_ids: z.array(z.string().uuid()).max(24).default([]),
});

export const updateHomeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isIT } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "it" });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isIT && !isAdmin) throw new Error("Only IT or Admin can change homepage content");
    const payload = {
      hero_slides: data.hero_slides,
      category_images: data.category_images,
      hero_story_video_url: data.hero_story_video_url,
      hero_video_bg_url: data.hero_video_bg_url || null,
      featured_property_ids: data.featured_property_ids ?? [],
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    };
    const { error } = await context.supabase.from("app_settings").update(payload).eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });