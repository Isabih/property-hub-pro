import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendCustomEmail } from "@/lib/email.functions";

type Category = "maintenance" | "plumbing" | "electrical" | "cleaning" | "security" | "general" | "other";
type Priority = "low" | "medium" | "high" | "urgent";
type Status = "pending" | "in_progress" | "completed" | "cancelled";

/** Returns customer row matching the signed-in user's email, or null. */
export const getMyCustomerRecord = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: u } = await context.supabase.auth.getUser();
    const email = u?.user?.email?.toLowerCase();
    if (!email) return null;
    const { data } = await context.supabase
      .from("customers")
      .select("id,full_name,email,phone,apartment_no,stay_start,stay_end,property_id,created_by,properties(title)")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const today = new Date().toISOString().slice(0, 10);
    const isStaying = (!data.stay_start || data.stay_start <= today) && (!data.stay_end || data.stay_end >= today);
    return { ...data, is_currently_staying: isStaying };
  });

export const listMyServiceRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: u } = await context.supabase.auth.getUser();
    const email = u?.user?.email?.toLowerCase();
    if (!email) return [];
    const { data: cust } = await context.supabase.from("customers").select("id").ilike("email", email);
    const ids = (cust ?? []).map((c) => c.id);
    if (!ids.length) return [];
    const { data, error } = await context.supabase
      .from("service_requests")
      .select("*, customers!inner(full_name, apartment_no, properties(title))")
      .in("customer_id", ids)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllServiceRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_requests")
      .select("*, customers(full_name, email, phone, apartment_no, created_by, properties(title))")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return data ?? [];
  });

export const createServiceRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    title: string;
    description: string;
    category: Category;
    priority: Priority;
    image_urls?: string[];
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: u } = await context.supabase.auth.getUser();
    const email = u?.user?.email?.toLowerCase();
    if (!email) throw new Error("Not signed in");

    const { data: cust } = await context.supabase
      .from("customers")
      .select("id, full_name, email, stay_start, stay_end, created_by, apartment_no, properties(title)")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!cust) throw new Error("No active customer record. Contact reception.");
    const today = new Date().toISOString().slice(0, 10);
    if (cust.stay_start && cust.stay_start > today) throw new Error("Your stay hasn't started yet.");
    if (cust.stay_end && cust.stay_end < today) throw new Error("Your stay has ended. Please contact reception.");

    const title = data.title.trim().slice(0, 140);
    const description = data.description.trim().slice(0, 4000);
    if (!title) throw new Error("Title is required");
    if (!description) throw new Error("Description is required");

    const { data: row, error } = await context.supabase
      .from("service_requests")
      .insert({
        customer_id: cust.id,
        title,
        description,
        category: data.category,
        priority: data.priority,
        image_urls: data.image_urls ?? [],
      })
      .select("id")
      .single();
    if (error) throw error;

    // Email staff for urgent only (in-app notifications are created by DB trigger)
    if (data.priority === "urgent") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const recipients = new Set<string>();
        if (cust.created_by) {
          const { data: rp } = await supabaseAdmin.from("profiles").select("email").eq("id", cust.created_by).maybeSingle();
          if (rp?.email) recipients.add(rp.email);
        }
        const { data: admins } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, profiles:profiles!inner(email)")
          .in("role", ["admin", "it"]);
        for (const a of (admins as any[] | null) ?? []) {
          if (a.profiles?.email) recipients.add(a.profiles.email);
        }
        const propTitle = (cust as any).properties?.title ?? "—";
        const html = `<p><strong>URGENT service request</strong> from <strong>${cust.full_name}</strong>.</p>
          <p><strong>${title}</strong></p>
          <p>${description.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>
          <p><strong>Category:</strong> ${data.category} · <strong>Priority:</strong> URGENT<br/>
          <strong>Property:</strong> ${propTitle}${cust.apartment_no ? ` — ${cust.apartment_no}` : ""}<br/>
          <strong>Contact:</strong> ${cust.email}</p>`;
        for (const to of recipients) {
          try { await sendCustomEmail({ data: { to, subject: `URGENT: ${title}`, html, kind: "service_urgent" } }); } catch {}
        }
      } catch {
        // notifications still fire via DB trigger
      }
    }

    return { id: row.id };
  });

export const updateServiceRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status?: Status; admin_response?: string }) => d)
  .handler(async ({ data, context }) => {
    const patch: { status?: Status; admin_response?: string; responded_at?: string; responded_by?: string } = {};
    if (data.status) patch.status = data.status;
    if (data.admin_response !== undefined) {
      patch.admin_response = data.admin_response;
      patch.responded_at = new Date().toISOString();
      patch.responded_by = context.userId;
    }
    const { error } = await context.supabase.from("service_requests").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });