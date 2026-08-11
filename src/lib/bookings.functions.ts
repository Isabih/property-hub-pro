import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const PAYMENT_METHODS = [
  { value: "momo", label: "MTN Mobile Money" },
  { value: "airtel", label: "Airtel Money" },
  { value: "card", label: "Visa / Mastercard" },
  { value: "cash", label: "Cash at reception" },
] as const;

const CreateSchema = z.object({
  property_id: z.string().uuid(),
  apartment_id: z.string().uuid().nullable().optional(),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  check_in: z.string().min(8).max(10),
  check_out: z.string().min(8).max(10),
  payment_method: z.enum(["momo", "airtel", "card", "cash"]),
  notes: z.string().max(600).optional().nullable(),
});

function nightsBetween(a: string, b: string) {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

/** Customer creates a booking. Amount is always computed server-side. */
export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const nights = nightsBetween(data.check_in, data.check_out);
    const { data: prop, error: pErr } = await context.supabase
      .from("properties")
      .select("id,title,price,currency,status")
      .eq("id", data.property_id)
      .maybeSingle();
    if (pErr || !prop) throw new Error("Property not found");
    if (prop.status !== "active") throw new Error("This property is not available for booking right now.");

    const nightly = Number(prop.price ?? 0);
    const { data: row, error } = await context.supabase
      .from("bookings")
      .insert({
        user_id: context.userId,
        property_id: data.property_id,
        apartment_id: data.apartment_id ?? null,
        full_name: data.full_name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        check_in: data.check_in,
        check_out: data.check_out,
        nights,
        nightly_rate: nightly,
        amount: nightly * nights,
        currency: prop.currency ?? "RWF",
        payment_method: data.payment_method,
        payment_status: data.payment_method === "cash" ? "pending" : "pending",
        status: "pending",
        notes: data.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const { sendCustomEmail } = await import("./email.functions");
    await sendCustomEmail({
      data: {
        to: row.email,
        subject: `Booking request received — ${prop.title}`,
        kind: "booking_created",
        html: `<p>Hello ${row.full_name},</p>
          <p>We received your booking request for <strong>${prop.title}</strong>.</p>
          <ul>
            <li>Check-in: <strong>${row.check_in}</strong></li>
            <li>Check-out: <strong>${row.check_out}</strong></li>
            <li>Nights: <strong>${row.nights}</strong></li>
            <li>Total: <strong>${row.currency} ${Number(row.amount).toLocaleString()}</strong></li>
          </ul>
          <p>Your stay begins once our reception team confirms your payment. We will email you the apartment details right after confirmation.</p>`,
      },
    }).catch(() => {});

    return row;
  });

/** Create a Flutterwave hosted-checkout link for a pending booking. */
export const startBookingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { booking_id: string; redirect_url: string }) => d)
  .handler(async ({ data, context }) => {
    const secret = process.env["FLUTTERWAVE_SECRET_KEY"];
    if (!secret) throw new Error("Online payment is not configured yet. Please choose Cash at reception.");

    const { data: b, error } = await context.supabase
      .from("bookings")
      .select("*")
      .eq("id", data.booking_id)
      .maybeSingle();
    if (error || !b) throw new Error("Booking not found");
    if (b.payment_status === "paid") throw new Error("This booking is already paid.");

    const tx_ref = `nw-${b.id}-${Date.now()}`;
    const options =
      b.payment_method === "card" ? "card" : "mobilemoneyrwanda,mobilemoneyuganda,card";

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify({
        tx_ref,
        amount: Number(b.amount),
        currency: b.currency || "RWF",
        redirect_url: data.redirect_url,
        payment_options: options,
        customer: { email: b.email, phonenumber: b.phone, name: b.full_name },
        customizations: { title: "NOVAWORKS", description: `Booking ${b.check_in} → ${b.check_out}` },
        meta: { booking_id: b.id },
      }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json?.status !== "success" || !json?.data?.link) {
      console.error("Flutterwave init failed", res.status, JSON.stringify(json).slice(0, 400));
      throw new Error(`Could not start payment (${res.status}): ${json?.message ?? "gateway error"}`);
    }

    await context.supabase.from("bookings").update({ payment_reference: tx_ref }).eq("id", b.id);
    return { link: json.data.link as string, tx_ref };
  });

/** Called when the gateway redirects back — verifies the transaction and marks it paid. */
export const verifyBookingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tx_ref: string }) => d)
  .handler(async ({ data, context }) => {
    const secret = process.env["FLUTTERWAVE_SECRET_KEY"];
    if (!secret) throw new Error("Online payment is not configured.");
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(data.tx_ref)}`,
      { headers: { authorization: `Bearer ${secret}` } },
    );
    const json: any = await res.json().catch(() => ({}));
    const tx = json?.data;
    const ok = res.ok && json?.status === "success" && tx?.status === "successful";
    const { data: b } = await context.supabase
      .from("bookings")
      .select("id,email,full_name,amount,currency,payment_status")
      .eq("payment_reference", data.tx_ref)
      .maybeSingle();
    if (!b) throw new Error("Booking not found for this payment.");
    if (!ok) {
      await context.supabase.from("bookings").update({ payment_status: "failed" }).eq("id", b.id);
      return { paid: false };
    }
    if (b.payment_status !== "paid") {
      await context.supabase
        .from("bookings")
        .update({ payment_status: "paid", gateway_tx_id: String(tx.id ?? "") })
        .eq("id", b.id);
      const { sendCustomEmail } = await import("./email.functions");
      await sendCustomEmail({
        data: {
          to: b.email,
          subject: "Payment received — NOVAWORKS",
          kind: "booking_paid",
          html: `<p>Hello ${b.full_name},</p>
            <p>We received your payment of <strong>${b.currency} ${Number(b.amount).toLocaleString()}</strong>.</p>
            <p>Our reception team will confirm it shortly. Your stay clock starts the moment reception confirms.</p>`,
        },
      }).catch(() => {});
    }
    return { paid: true };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*, properties(title,slug,city)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*, properties(title,slug,city,address)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

async function assertStaff(context: any) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const mine = (data ?? []).map((r: any) => r.role);
  if (!mine.some((r: string) => ["receptionist", "admin", "it"].includes(r))) throw new Error("Forbidden");
}

/** Receptionist confirms payment → the stay clock starts now and expiry is computed. */
export const confirmBookingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { booking_id: string; apartment_no?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: b, error } = await context.supabase
      .from("bookings")
      .select("*, properties(title,address,city)")
      .eq("id", data.booking_id)
      .maybeSingle();
    if (error || !b) throw new Error("Booking not found");
    if (b.status === "confirmed") throw new Error("Already confirmed.");

    const start = new Date();
    const end = new Date(start.getTime() + (b.nights ?? 1) * 86_400_000);
    const { error: uErr } = await context.supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        confirmed_by: context.userId,
        confirmed_at: start.toISOString(),
        stay_start: start.toISOString(),
        stay_end: end.toISOString(),
        notes: data.apartment_no ? `${b.notes ? b.notes + " | " : ""}Unit ${data.apartment_no}` : b.notes,
      })
      .eq("id", b.id);
    if (uErr) throw new Error(uErr.message);

    const prop: any = (b as any).properties ?? {};
    const fmt = (d: Date) => d.toLocaleString("en-GB", { timeZone: "Africa/Kigali", dateStyle: "full", timeStyle: "short" });
    const { sendCustomEmail } = await import("./email.functions");
    await sendCustomEmail({
      data: {
        to: b.email,
        subject: `Your stay is confirmed — ${prop.title ?? "NOVAWORKS"}`,
        kind: "booking_confirmed",
        html: `<p>Hello ${b.full_name},</p>
          <p>Your payment has been confirmed by our reception team. Welcome!</p>
          <h3 style="margin:18px 0 6px">Apartment details</h3>
          <ul>
            <li>Property: <strong>${prop.title ?? "-"}</strong></li>
            ${data.apartment_no ? `<li>Unit: <strong>${data.apartment_no}</strong></li>` : ""}
            <li>Address: ${prop.address ?? ""} ${prop.city ?? ""}</li>
          </ul>
          <h3 style="margin:18px 0 6px">Stay period</h3>
          <ul>
            <li>Starts: <strong>${fmt(start)}</strong></li>
            <li>Expires: <strong>${fmt(end)}</strong></li>
            <li>Duration: <strong>${b.nights} night(s)</strong></li>
            <li>Paid: <strong>${b.currency} ${Number(b.amount).toLocaleString()}</strong> via ${b.payment_method}</li>
          </ul>
          <p>Please check out before the expiry time above. Need anything during your stay? Raise a service request from your dashboard.</p>
          <p>We would love your feedback after your stay — simply reply to this email.</p>`,
      },
    }).catch(() => {});

    return { ok: true, stay_start: start.toISOString(), stay_end: end.toISOString() };
  });

export const rejectBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { booking_id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: b } = await context.supabase.from("bookings").select("email,full_name").eq("id", data.booking_id).maybeSingle();
    const { error } = await context.supabase.from("bookings").update({ status: "cancelled" }).eq("id", data.booking_id);
    if (error) throw new Error(error.message);
    if (b) {
      const { sendCustomEmail } = await import("./email.functions");
      await sendCustomEmail({
        data: {
          to: b.email, kind: "booking_cancelled",
          subject: "Your booking could not be confirmed",
          html: `<p>Hello ${b.full_name},</p><p>Unfortunately your booking was not confirmed.${data.reason ? ` Reason: ${data.reason}` : ""}</p><p>Any payment made will be reviewed and refunded where applicable.</p>`,
        },
      }).catch(() => {});
    }
    return { ok: true };
  });
