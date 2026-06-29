import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Property, PropertyCategory, PropertyListing, PropertyStatus, RoomCategory } from "./properties";

const TYPE_TO_CATEGORY: Record<string, PropertyCategory> = {
  residential: "apartment",
  apartment: "apartment",
  villa: "villa",
  penthouse: "luxury-apartment",
  "luxury-apartment": "luxury-apartment",
  building: "building",
  office: "office",
  land: "land",
  studio: "studio",
  commercial: "commercial",
};

const STATUS_MAP: Record<string, PropertyStatus> = {
  active: "available",
  draft: "maintenance",
  sold: "sold",
  rented: "rented",
  maintenance: "maintenance",
};

function sectionToRoom(section: string | null): RoomCategory {
  switch (section) {
    case "kitchen": return "kitchen";
    case "living_room": return "living-room";
    case "bathroom": return "bathroom";
    case "gym": return "gym";
    case "main": return "main";
    default: return "other";
  }
}

function serverClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function isValidLuxuryToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string" || token.length < 8) return false;
  const sb = serverClient();
  const { data } = await sb
    .from("luxury_access_requests")
    .select("status,expires_at")
    .eq("access_token", token)
    .maybeSingle();
  if (!data) return false;
  if (data.status !== "approved") return false;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return false;
  return true;
}

export const fetchPropertyForView = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; luxuryToken?: string }) => d)
  .handler(async ({ data }): Promise<(Property & { locked?: boolean }) | null> => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("properties")
      .select("id,slug,title,description,property_type,listing_type,status,price,currency,bedrooms,bathrooms,area_sqm,address,city,district,lat,lng,amenities,featured,property_images(url,position,is_cover,section)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error || !row) return null;

    const images = ((row.property_images ?? []) as { url: string; position: number; is_cover: boolean; section: string | null }[])
      .slice()
      .sort((a, b) => {
        if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
        return (a.position ?? 0) - (b.position ?? 0);
      });
    const cover = images[0]?.url ?? "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80";
    const category = TYPE_TO_CATEGORY[row.property_type] ?? "apartment";
    const status = STATUS_MAP[row.status] ?? "available";
    const luxury = category === "luxury-apartment" || category === "villa";

    const hasAccess = luxury ? await isValidLuxuryToken(data.luxuryToken) : true;
    const locked = luxury && !hasAccess;

    const fullRoomGallery = images.map((img) => ({ room: sectionToRoom(img.section), src: img.url }));

    const property: Property & { locked?: boolean } = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category,
      listing: (row.listing_type === "rent" ? "rent" : "sale") as PropertyListing,
      status,
      luxury,
      featured: row.featured,
      price: locked ? 0 : Number(row.price) || 0,
      currency: (row.currency === "RWF" ? "RWF" : "USD"),
      priceUnit: row.listing_type === "rent" ? "month" : "total",
      location: row.city ?? "Kigali",
      district: row.district ?? "",
      beds: row.bedrooms ?? undefined,
      baths: row.bathrooms ?? undefined,
      area: row.area_sqm ?? 0,
      description: locked
        ? "This is an exclusive luxury listing. Request access to view full details, pricing, and the complete media set."
        : (row.description ?? ""),
      image: cover,
      roomGallery: locked ? [{ room: "main" as RoomCategory, src: cover }] : fullRoomGallery,
      amenities: locked ? [] : (row.amenities ?? []),
      address: locked ? undefined : (row.address ?? undefined),
      lat: locked ? undefined : (row.lat ?? undefined),
      lng: locked ? undefined : (row.lng ?? undefined),
      locked,
    };
    return property;
  });