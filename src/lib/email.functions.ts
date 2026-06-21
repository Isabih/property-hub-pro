import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function adminClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getSettings() {
  const sb = adminClient();
  const { data } = await sb.from("app_settings").select("*").eq("id", true).maybeSingle();
  return data ?? {
    sender_name: "Novaworks",
    from_email: "no-reply@novaworks.rw",
    reply_to: null,
    signature: "Regards,\nNovaworks Team",
    brand_color: "#0f766e",
    site_url: "https://novaworks.rw",
  };
}

function wrap(html: string, opts: { brand_color: string; signature: string; site_url: string; sender_name: string }) {
  const sig = opts.signature.replace(/\n/g, "<br/>");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #eee">
    <div style="background:${opts.brand_color};color:#fff;padding:20px 28px;font-size:18px;font-weight:600">${opts.sender_name}</div>
    <div style="padding:28px;font-size:15px;line-height:1.55">${html}</div>
    <div style="padding:20px 28px;border-top:1px solid #eee;color:#666;font-size:13px;line-height:1.5">${sig}<br/><br/><a href="${opts.site_url}" style="color:${opts.brand_color}">${opts.site_url}</a></div>
  </div></body></html>`;
}

async function sendViaResend(to: string, subject: string, html: string, kind: string) {
  const settings = await getSettings();
  const wrapped = wrap(html, settings as any);
  const from = `${settings.sender_name} <${settings.from_email}>`;
  const body: any = { from, to: [to], subject, html: wrapped };
  if (settings.reply_to) body.reply_to = settings.reply_to;
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "x-connection-api-key": process.env.RESEND_API_KEY ?? "",
    },
    body: JSON.stringify(body),
  });
  const sb = adminClient();
  if (!res.ok) {
    const text = await res.text();
    await sb.from("email_log").insert({ to_email: to, subject, kind, status: "failed", error: text.slice(0, 500) });
    throw new Error(`Email failed (${res.status}): ${text.slice(0, 200)}`);
  }
  await sb.from("email_log").insert({ to_email: to, subject, kind, status: "sent" });
  return { ok: true };
}

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Send a custom email — called by IT/Admin (e.g. property notifications). */
export const sendCustomEmail = createServerFn({ method: "POST" })
  .inputValidator((d: { to: string; subject: string; html: string; kind?: string }) => d)
  .handler(async ({ data }) => sendViaResend(data.to, data.subject, data.html, data.kind ?? "custom"));

/** Send OTP to a customer (called server-side from registerCustomer). Public-callable for resend. */
export const sendCustomerOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { customerId: string }) => d)
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { data: c, error } = await sb.from("customers").select("id,email,full_name").eq("id", data.customerId).maybeSingle();
    if (error || !c) throw new Error("Customer not found");
    const code = sixDigit();
    const hash = await sha256(code);
    await sb.from("customers").update({
      otp_hash: hash,
      otp_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      otp_attempts: 0,
    }).eq("id", c.id);
    const html = `<p>Hello ${c.full_name},</p><p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f5f5f5;padding:14px 18px;border-radius:6px;display:inline-block">${code}</p><p>This code expires in <strong>5 minutes</strong>.</p>`;
    await sendViaResend(c.email, "Your verification code", html, "customer_otp");
    return { ok: true };
  });

/** Verify customer OTP. */
export const verifyCustomerOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { customerId: string; code: string }) => d)
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { data: c } = await sb.from("customers").select("*, properties(title, apartment_no:title)").eq("id", data.customerId).maybeSingle();
    if (!c) throw new Error("Customer not found");
    if (c.email_verified) return { ok: true, alreadyVerified: true };
    if (!c.otp_hash || !c.otp_expires_at) throw new Error("No active code. Please resend.");
    if (new Date(c.otp_expires_at).getTime() < Date.now()) throw new Error("Code expired. Please resend.");
    if ((c.otp_attempts ?? 0) >= 5) throw new Error("Too many attempts. Please resend.");
    const hash = await sha256(data.code);
    if (hash !== c.otp_hash) {
      await sb.from("customers").update({ otp_attempts: (c.otp_attempts ?? 0) + 1 }).eq("id", c.id);
      throw new Error("Incorrect code.");
    }
    await sb.from("customers").update({ email_verified: true, otp_hash: null, otp_expires_at: null }).eq("id", c.id);

    // Welcome email
    const settings = await getSettings();
    const propTitle = (c as any).properties?.title ?? "your booking";
    const html = `<p>Hello ${c.full_name},</p>
      <p>Welcome to ${settings.sender_name}! Your email has been verified.</p>
      <p><strong>Booking summary</strong><br/>
      Property / Apartment: ${propTitle}${c.apartment_no ? ` — ${c.apartment_no}` : ""}<br/>
      Stay: ${c.stay_start ?? "—"} → ${c.stay_end ?? "—"}<br/>
      Amount paid: ${c.amount_paid ?? 0} (${c.payment_method ?? "n/a"} — ${c.payment_status})</p>
      <p>We're delighted to host you. Reach us anytime if you need anything.</p>`;
    await sendViaResend(c.email, "Welcome to " + settings.sender_name, html, "customer_welcome");
    return { ok: true };
  });

/** Subscribe + send OTP (public). */
export const subscribeAndSendOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; full_name?: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
    const sb = adminClient();
    const code = sixDigit();
    const hash = await sha256(code);
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data: existing } = await sb.from("subscribers").select("id,verified").eq("email", email).maybeSingle();
    let id: string;
    if (existing) {
      id = existing.id;
      await sb.from("subscribers").update({ otp_hash: hash, otp_expires_at: expires, otp_attempts: 0, full_name: data.full_name ?? null }).eq("id", id);
    } else {
      const { data: ins, error } = await sb.from("subscribers").insert({ email, full_name: data.full_name ?? null, otp_hash: hash, otp_expires_at: expires }).select("id").single();
      if (error) throw error;
      id = ins.id;
    }
    const html = `<p>Hello,</p><p>Your subscription verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f5f5f5;padding:14px 18px;border-radius:6px;display:inline-block">${code}</p><p>This code expires in <strong>5 minutes</strong>.</p>`;
    await sendViaResend(email, "Confirm your subscription", html, "subscriber_otp");
    return { ok: true, id };
  });

export const verifySubscriberOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; code: string }) => d)
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { data: s } = await sb.from("subscribers").select("*").eq("id", data.id).maybeSingle();
    if (!s) throw new Error("Subscription not found");
    if (s.verified) return { ok: true };
    if (!s.otp_hash || !s.otp_expires_at) throw new Error("No active code. Please resend.");
    if (new Date(s.otp_expires_at).getTime() < Date.now()) throw new Error("Code expired.");
    if ((s.otp_attempts ?? 0) >= 5) throw new Error("Too many attempts.");
    const hash = await sha256(data.code);
    if (hash !== s.otp_hash) {
      await sb.from("subscribers").update({ otp_attempts: (s.otp_attempts ?? 0) + 1 }).eq("id", s.id);
      throw new Error("Incorrect code.");
    }
    await sb.from("subscribers").update({ verified: true, otp_hash: null, otp_expires_at: null }).eq("id", s.id);
    return { ok: true };
  });

/** Notify all verified, opted-in subscribers about a new property. */
export const notifySubscribersOfProperty = createServerFn({ method: "POST" })
  .inputValidator((d: { propertyId: string }) => d)
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { data: p } = await sb.from("properties").select("id,title,slug,price,currency,city,property_type").eq("id", data.propertyId).maybeSingle();
    if (!p) throw new Error("Property not found");
    const { data: subs } = await sb.from("subscribers").select("email,full_name").eq("verified", true).eq("notify", true);
    if (!subs || !subs.length) return { ok: true, sent: 0 };
    const settings = await getSettings();
    const link = `${settings.site_url.replace(/\/$/, "")}/properties/${p.slug}`;
    const html = `<p>A new property is now available on ${settings.sender_name}:</p>
      <h2 style="margin:8px 0">${p.title}</h2>
      <p>${p.property_type} · ${p.city ?? ""} · <strong>${p.currency} ${Number(p.price).toLocaleString()}</strong></p>
      <p><a href="${link}" style="background:${settings.brand_color};color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">View Property</a></p>
      <p style="color:#666;font-size:13px">Or visit: <a href="${settings.site_url}">${settings.site_url}</a></p>`;
    let sent = 0;
    for (const s of subs) {
      try { await sendViaResend(s.email, `New property: ${p.title}`, html, "property_notify"); sent++; } catch {}
    }
    return { ok: true, sent };
  });