import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getPropertyOfTheDay = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data: pod } = await supabase
    .from("property_of_the_day")
    .select("property_id, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (!pod?.property_id) return null;
  const { data: prop } = await supabase
    .from("properties")
    .select("id,slug,title,description,property_type,listing_type,status,price,currency,bedrooms,bathrooms,area_sqm,address,city,district,amenities,featured,property_images(url,position,is_cover)")
    .eq("id", pod.property_id)
    .maybeSingle();
  if (!prop) return null;
  const images = (prop.property_images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.is_cover === b.is_cover ? (a.position ?? 0) - (b.position ?? 0) : a.is_cover ? -1 : 1));
  return {
    id: prop.id,
    slug: prop.slug,
    title: prop.title,
    description: prop.description,
    city: prop.city,
    district: prop.district,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    area_sqm: prop.area_sqm,
    price: Number(prop.price) || 0,
    currency: prop.currency,
    listing_type: prop.listing_type,
    amenities: prop.amenities ?? [],
    cover: images[0]?.url ?? null,
  };
});

export const setPropertyOfTheDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { property_id: string | null }) =>
    z.object({ property_id: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("property_of_the_day")
      .upsert({ id: 1, property_id: data.property_id, updated_by: context.userId, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPropertiesForPicker = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("properties")
      .select("id,title,city,district,price,currency,status,property_images(url,is_cover,position)")
      .in("status", ["active", "sold", "maintenance"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((p: any) => {
      const imgs = (p.property_images ?? []).slice().sort((a: any, b: any) =>
        a.is_cover === b.is_cover ? (a.position ?? 0) - (b.position ?? 0) : a.is_cover ? -1 : 1,
      );
      return {
        id: p.id,
        title: p.title,
        city: p.city,
        district: p.district,
        price: Number(p.price) || 0,
        currency: p.currency,
        status: p.status,
        cover: imgs[0]?.url ?? null,
      };
    });
  });