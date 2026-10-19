import { supabase } from '@/integrations/supabase/client';
export type Apartment = {
 id: string; property_id: string; code: string; name: string | null; floor: number | null;
 bedrooms: number | null; bathrooms: number | null; area_sqm: number | null; nightly_rate: number | null;
 description: string | null; image_url: string | null; status: string; building_title: string;
 building_slug: string; address: string | null; city: string | null; district: string | null; currency: string;
};
export async function fetchApartments(buildingId?: string): Promise<Apartment[]> {
 const { data, error } = await supabase.rpc('list_building_apartments', buildingId ? { building_id: buildingId } : {});
 if (error) throw new Error(error.message);
 return data ?? [];
}
