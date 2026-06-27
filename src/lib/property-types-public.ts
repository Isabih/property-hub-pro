import { supabase } from "@/integrations/supabase/client";
import type { PropertyTypeRow } from "./property-types.functions";

export async function fetchPropertyCategories(): Promise<PropertyTypeRow[]> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("property_categories")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return [];
  return (data.property_categories as unknown as PropertyTypeRow[]) ?? [];
}