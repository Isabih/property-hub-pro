import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendCustomEmail } from "@/lib/email.functions";

type Category = "maintenance" | "plumbing" | "electrical" | "cleaning" | "security" | "general" | "other";
type Priority = "low" | "medium" | "high" | "urgent";
type Status = "pending" | "in_progress" | "completed" | "cancelled";

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k) => vars[k] ?? "");
}

async function loadSettings(supabase: any) {
  const { data } = await supabase.from("app_settings").select("*").eq("id", true).maybeSingle();
  return data ?? {};
}

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

    // Confirmation email to the customer (uses editable template from app_settings)
    try {
      const settings = await loadSettings(context.supabase);
      const urgencyLabel = data.priority === "urgent"
        ? (settings.sr_urgent_label ?? "URGENT")
        : (settings.sr_normal_label ?? "new");
      const bodyTpl = settings.sr_confirm_body ?? "Hello {{name}},\n\nWe received your {{urgency_label}} request:\n\n\"{{title}}\"";
      const subject = renderTemplate(settings.sr_confirm_subject ?? "We received your service request",
        { name: cust.full_name, title, urgency_label: urgencyLabel, priority: data.priority });
      const text = renderTemplate(bodyTpl,
        { name: cust.full_name, title, urgency_label: urgencyLabel, priority: data.priority });
      const html = `<p>${text.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`;
      await sendCustomEmail({ data: { to: cust.email, subject, html, kind: "service_confirm" } });
    } catch { /* never block submission */ }
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
  .inputValidator((d: { id: string; status?: Status; admin_response?: string; assigned_to?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const patch: { status?: Status; admin_response?: string; responded_at?: string; responded_by?: string; assigned_to?: string | null } = {};
    if (data.status) patch.status = data.status;
    if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to;
    if (data.admin_response !== undefined) {
      patch.admin_response = data.admin_response;
      patch.responded_at = new Date().toISOString();
      patch.responded_by = context.userId;
    }
    const { data: updated, error } = await context.supabase
      .from("service_requests")
      .update(patch)
      .eq("id", data.id)
      .select("*, customers(full_name, email)")
      .single();
    if (error) throw error;

    // Email customer when staff replies
    if (data.admin_response && updated?.customers?.email) {
      try {
        const settings = await loadSettings(context.supabase);
        const subject = settings.sr_reply_subject ?? "Update on your service request";
        const html = `<p>Hello ${updated.customers.full_name ?? ""},</p>
          <p>Our team has replied to your request <strong>${updated.title ?? ""}</strong>:</p>
          <blockquote style="border-left:3px solid #c9a96b;padding:8px 12px;color:#333;background:#faf7f0">
            ${String(data.admin_response).replace(/</g, "&lt;").replace(/\n/g, "<br/>")}
          </blockquote>
          <p>Current status: <strong>${updated.status}</strong></p>`;
        await sendCustomEmail({ data: { to: updated.customers.email, subject, html, kind: "service_reply" } });
      } catch { /* ignore */ }
    }
    return { ok: true };
  });

/** Staff assignable to a service request (admin, it, receptionist, agent, owner). */
export const listAssignableStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "it", "receptionist", "agent", "owner"]);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    if (!ids.length) return [];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    const seen = new Map<string, { id: string; name: string; role: string }>();
    for (const r of rows ?? []) {
      if (seen.has(r.user_id)) continue;
      const p: any = byId.get(r.user_id);
      seen.set(r.user_id, { id: r.user_id, name: p?.full_name ?? p?.email ?? "Unknown", role: r.role as string });
    }
    return Array.from(seen.values());
  });