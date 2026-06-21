import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function adminClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendMail(to: string, subject: string, html: string, kind: string) {
  const sb = adminClient();
  const { data: s } = await sb.from("app_settings").select("*").eq("id", true).maybeSingle();
  const settings = s ?? { sender_name: "Novaworks", from_email: "no-reply@novaworks.rw", brand_color: "#0f766e", signature: "Regards,\nNovaworks", site_url: "https://novaworks.rw" } as any;
  const wrapped = `<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222"><div style="max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eee"><div style="background:${settings.brand_color};color:#fff;padding:20px 28px;font-size:18px;font-weight:600">${settings.sender_name}</div><div style="padding:28px;font-size:15px;line-height:1.55">${html}</div><div style="padding:20px 28px;border-top:1px solid #eee;color:#666;font-size:13px;line-height:1.5">${String(settings.signature).replace(/\n/g, "<br/>")}</div></div></body></html>`;
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.LOVABLE_API_KEY}`, "x-connection-api-key": process.env.RESEND_API_KEY ?? "" },
    body: JSON.stringify({ from: `${settings.sender_name} <${settings.from_email}>`, to: [to], subject, html: wrapped }),
  });
  if (!res.ok) {
    const t = await res.text();
    await sb.from("email_log").insert({ to_email: to, subject, kind, status: "failed", error: t.slice(0, 500) });
    throw new Error(`Email failed: ${t.slice(0, 200)}`);
  }
  await sb.from("email_log").insert({ to_email: to, subject, kind, status: "sent" });
}

/** Public: visitor submits a luxury access request and receives an OTP. */
export const requestLuxuryAccess = createServerFn({ method: "POST" })
  .inputValidator((d: { full_name: string; email: string; phone?: string; reason?: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
    if (!data.full_name.trim()) throw new Error("Name required");
    const sb = adminClient();
    const code = sixDigit();
    const hash = await sha256(code);
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data: row, error } = await sb.from("luxury_access_requests").insert({
      full_name: data.full_name.trim(),
      email,
      phone: data.phone?.trim() || null,
      reason: data.reason?.trim() || null,
      otp_hash: hash,
      otp_expires_at: expires,
    }).select("id").single();
    if (error) throw error;
    await sendMail(email, "Luxury access verification code", `<p>Hello ${data.full_name},</p><p>Your verification code:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f5f5f5;padding:14px 18px;border-radius:6px;display:inline-block">${code}</p><p>Expires in 5 minutes. After verifying, our team will review your request.</p>`, "luxury_otp");
    return { id: row.id };
  });

export const verifyLuxuryOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; code: string }) => d)
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { data: r } = await sb.from("luxury_access_requests").select("*").eq("id", data.id).maybeSingle();
    if (!r) throw new Error("Request not found");
    if (r.email_verified) return { ok: true, alreadyVerified: true };
    if (!r.otp_hash || !r.otp_expires_at) throw new Error("No active code");
    if (new Date(r.otp_expires_at).getTime() < Date.now()) throw new Error("Code expired");
    if ((r.otp_attempts ?? 0) >= 5) throw new Error("Too many attempts");
    const hash = await sha256(data.code);
    if (hash !== r.otp_hash) {
      await sb.from("luxury_access_requests").update({ otp_attempts: (r.otp_attempts ?? 0) + 1 }).eq("id", r.id);
      throw new Error("Incorrect code");
    }
    await sb.from("luxury_access_requests").update({ email_verified: true, otp_hash: null, otp_expires_at: null }).eq("id", r.id);
    // Notify IT/Admin
    const { data: staff } = await sb.from("user_roles").select("user_id, role").in("role", ["it", "admin"]);
    if (staff?.length) {
      const rows = staff.map((s: any) => ({
        recipient_id: s.user_id,
        kind: "luxury_request",
        title: "New luxury access request",
        body: `${r.full_name} (${r.email}) verified their email and is awaiting approval.`,
      }));
      await sb.from("staff_notifications").insert(rows);
    }
    return { ok: true };
  });

/** Staff: list pending requests */
export const listLuxuryRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("luxury_access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

/** Staff: approve and email the access token */
export const approveLuxuryRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: r, error } = await context.supabase
      .from("luxury_access_requests")
      .update({ status: "approved", access_token: token, approved_by: context.userId, approved_at: new Date().toISOString(), expires_at: expires })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw error;
    const origin = process.env.PUBLIC_SITE_URL ?? "https://novaworks.rw";
    const link = `${origin}/verify-access?token=${token}`;
    await sendMail(r.email, "Your luxury access is approved", `<p>Hello ${r.full_name},</p><p>Your access to luxury listings has been approved.</p><p><a href="${link}" style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Unlock luxury listings</a></p><p style="color:#666;font-size:13px">This link expires in 30 days.</p>`, "luxury_approved");
    return { ok: true };
  });

export const denyLuxuryRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: r, error } = await context.supabase
      .from("luxury_access_requests")
      .update({ status: "denied", approved_by: context.userId })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw error;
    await sendMail(r.email, "Luxury access request update", `<p>Hello ${r.full_name},</p><p>We were unable to approve your luxury access request at this time. Please contact us if you have any questions.</p>`, "luxury_denied");
    return { ok: true };
  });

/** Public: validate a token (used by the verify-access page) */
export const verifyLuxuryToken = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { data: r } = await sb.from("luxury_access_requests").select("id,status,expires_at").eq("access_token", data.token).maybeSingle();
    if (!r) return { valid: false };
    if (r.status !== "approved") return { valid: false };
    if (r.expires_at && new Date(r.expires_at).getTime() < Date.now()) return { valid: false };
    return { valid: true };
  });
