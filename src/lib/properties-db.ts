import { supabase } from "@/integrations/supabase/client";

export interface DbProperty {
  id: string;
  owner_id: string;
  agent_id: string | null;
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
  country: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string[] | null;
  featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbPropertyImage {
  id: string;
  property_id: string;
  url: string;
  storage_path: string | null;
  position: number;
  is_cover: boolean;
  section: string;
}

export const IMAGE_SECTIONS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "living_room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "other", label: "Other" },
] as const;
export type ImageSection = typeof IMAGE_SECTIONS[number]["value"];

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) + "-" + Math.random().toString(36).slice(2, 7);
}

export async function fetchMyProperties() {
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllProperties() {
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadPropertyImage(userId: string, file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("property-media").upload(path, file, { upsert: false });
  if (error) throw error;
  // Bucket is private; mint a long-lived signed URL so the frontend can render it.
  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const { data, error: signErr } = await supabase
    .storage
    .from("property-media")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("Failed to sign URL");
  return { url: data.signedUrl, path };
}

export async function createProperty(input: {
  ownerId: string;
  agentId?: string | null;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  address: string;
  city: string;
  district: string;
  lat: number | null;
  lng: number | null;
  amenities: string[];
  status: "draft" | "active";
  notify_subscribers?: boolean;
  video_url?: string | null;
  tour_3d_url?: string | null;
  blueprint_url?: string | null;
  unit_count?: number;
  unit_code_prefix?: string | null;
  is_luxury?: boolean;
  images: Array<{ url: string; path: string; section: ImageSection }>;
}) {
  const slug = slugify(input.title);
  const { data: prop, error } = await supabase
    .from("properties")
    .insert({
      owner_id: input.ownerId,
      agent_id: input.agentId ?? null,
      slug,
      title: input.title,
      description: input.description,
      property_type: input.property_type,
      listing_type: input.listing_type,
      price: input.price,
      currency: input.currency,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area_sqm: input.area_sqm,
      address: input.address,
      city: input.city,
      district: input.district,
      lat: input.lat,
      lng: input.lng,
      amenities: input.amenities,
      status: input.status,
      notify_subscribers: input.notify_subscribers ?? false,
      video_url: input.video_url ?? null,
      tour_3d_url: input.tour_3d_url ?? null,
      blueprint_url: input.blueprint_url ?? null,
      unit_count: input.unit_count ?? 1,
      unit_code_prefix: input.unit_code_prefix ?? null,
      is_luxury: input.is_luxury ?? false,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.images.length) {
    const rows = input.images.map((img, i) => ({
      property_id: prop.id,
      url: img.url,
      storage_path: img.path,
      position: i,
      is_cover: i === 0,
      section: img.section,
    }));
    const { error: imgErr } = await supabase.from("property_images").insert(rows);
    if (imgErr) throw imgErr;
  }

  return prop;
}

/** Upload a single arbitrary file (blueprint PDF, etc) to property-media and return signed URL. */
export async function uploadPropertyFile(userId: string, file: File, subdir = "files"): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${subdir}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("property-media").upload(path, file, { upsert: false });
  if (error) throw error;
  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const { data, error: signErr } = await supabase.storage.from("property-media").createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("Failed to sign URL");
  return { url: data.signedUrl, path };
}

export async function deleteProperty(id: string) {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function setPropertyStatus(id: string, status: string) {
  const { error } = await supabase.from("properties").update({ status }).eq("id", id);
  if (error) throw error;
}