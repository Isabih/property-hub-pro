import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type CEO = { name: string; title: string; quote: string; image: string; since: string };
export type TeamMember = { name: string; role: string; image: string };
export type ContactInfo = {
  phone: string; phone_hours: string;
  email: string; email_note: string;
  address: string; address_note: string;
  hours: string; hours_note: string;
};
export type ContactContent = { ceo: CEO; team: TeamMember[]; info: ContactInfo };

const DEFAULTS: ContactContent = {
  ceo: {
    name: "Jean-Paul Habimana",
    title: "Chief Executive Officer",
    quote: "We don't just sell properties — we build the future of how Rwandans live, invest and call a place home.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=85",
    since: "Leading NOVAWORKS since 2014",
  },
  team: [],
  info: {
    phone: "+250 793 300 080", phone_hours: "Mon – Sat, 8am – 6pm",
    email: "info@novaworks.rw", email_note: "Replies within 24 hours",
    address: "Kigali Heights, KG 7 Ave", address_note: "Kimihurura, Kigali, Rwanda",
    hours: "Mon – Sat", hours_note: "8:00am – 6:00pm",
  },
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getContactContent = createServerFn({ method: "GET" }).handler(async (): Promise<ContactContent> => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("app_settings")
    .select("contact_ceo,contact_team,contact_info")
    .eq("id", true)
    .maybeSingle();
  if (!data) return DEFAULTS;
  return {
    ceo: (data.contact_ceo as CEO | null) ?? DEFAULTS.ceo,
    team: (data.contact_team as TeamMember[] | null) ?? DEFAULTS.team,
    info: (data.contact_info as ContactInfo | null) ?? DEFAULTS.info,
  };
});

const CEOSchema = z.object({
  name: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  quote: z.string().min(1).max(600),
  image: z.string().url(),
  since: z.string().max(200).optional().default(""),
});
const MemberSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  image: z.string().url(),
});
const InfoSchema = z.object({
  phone: z.string().max(60), phone_hours: z.string().max(120),
  email: z.string().max(120), email_note: z.string().max(120),
  address: z.string().max(200), address_note: z.string().max(200),
  hours: z.string().max(120), hours_note: z.string().max(120),
});
const UpdateSchema = z.object({
  ceo: CEOSchema,
  team: z.array(MemberSchema).max(24),
  info: InfoSchema,
});

export const updateContactContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isIT } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "it" });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isIT && !isAdmin) throw new Error("Only IT or Admin can edit contact content");
    const { error } = await context.supabase.from("app_settings").update({
      contact_ceo: data.ceo,
      contact_team: data.team,
      contact_info: data.info,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }).eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });