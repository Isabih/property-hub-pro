import { supabase } from "@/integrations/supabase/client";
import type { Property, PropertyCategory, PropertyListing, PropertyStatus } from "./properties";

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

interface DbRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: string;
  status: string;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  address: string | null;
  city: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string[] | null;
  featured: boolean;
  property_images: { url: string; position: number; is_cover: boolean; section: string | null }[] | null;
}

function rowToProperty(r: DbRow): Property {
  const images = (r.property_images ?? []).slice().sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });
  const cover = images[0]?.url ?? "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80";
  const category = TYPE_TO_CATEGORY[r.property_type] ?? "apartment";
  const status = STATUS_MAP[r.status] ?? "available";
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category,
    listing: (r.listing_type === "rent" ? "rent" : "sale") as PropertyListing,
    status,
    luxury: category === "luxury-apartment" || category === "villa",
    featured: r.featured,
    price: Number(r.price) || 0,
    currency: (r.currency === "RWF" ? "RWF" : "USD"),
    priceUnit: r.listing_type === "rent" ? "month" : "total",
    location: r.city ?? "Kigali",
    district: r.district ?? "",
    beds: r.bedrooms ?? undefined,
    baths: r.bathrooms ?? undefined,
    area: r.area_sqm ?? 0,
    description: r.description ?? "",
    image: cover,
    roomGallery: images.map((img) => ({ room: sectionToRoom(img.section), src: img.url })),
    amenities: r.amenities ?? [],
    address: r.address ?? undefined,
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
  };
}

function sectionToRoom(section: string | null): import("./properties").RoomCategory {
  switch (section) {
    case "kitchen": return "kitchen";
    case "living_room": return "living";
    case "bathroom": return "bathroom";
    case "gym": return "gym";
    case "main": return "main";
    default: return "other";
  }
}

export async function fetchActiveProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id,slug,title,description,property_type,listing_type,status,price,currency,bedrooms,bathrooms,area_sqm,address,city,district,lat,lng,amenities,featured,property_images(url,position,is_cover,section)")
    .in("status", ["active", "sold", "maintenance"])
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[properties] fetchActive:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToProperty(r as unknown as DbRow));
}

export async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select("id,slug,title,description,property_type,listing_type,status,price,currency,bedrooms,bathrooms,area_sqm,address,city,district,lat,lng,amenities,featured,property_images(url,position,is_cover,section)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[properties] fetchBySlug:", error.message);
    return null;
  }
  if (!data) return null;
  return rowToProperty(data as unknown as DbRow);
}