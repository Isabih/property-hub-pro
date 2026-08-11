import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/flutterwave-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["FLUTTERWAVE_WEBHOOK_HASH"];
        const got = request.headers.get("verif-hash");
        if (!expected || !got || got !== expected) {
          return new Response("Invalid signature", { status: 401 });
        }
        const payload: any = await request.json().catch(() => null);
        const tx = payload?.data;
        const txRef: string | undefined = tx?.tx_ref;
        if (!txRef) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select("id,email,full_name,amount,currency,payment_status")
          .eq("payment_reference", txRef)
          .maybeSingle();
        if (!booking) return new Response("ok");

        const paid = tx?.status === "successful";
        if (!paid) {
          await supabaseAdmin.from("bookings").update({ payment_status: "failed" }).eq("id", booking.id);
          return new Response("ok");
        }
        if (booking.payment_status !== "paid") {
          await supabaseAdmin
            .from("bookings")
            .update({ payment_status: "paid", gateway_tx_id: String(tx?.id ?? "") })
            .eq("id", booking.id);
          const { sendCustomEmail } = await import("@/lib/email.functions");
          await sendCustomEmail({
            data: {
              to: booking.email,
              subject: "Payment received — NOVAWORKS",
              kind: "booking_paid",
              html: `<p>Hello ${booking.full_name},</p><p>Your payment of <strong>${booking.currency} ${Number(booking.amount).toLocaleString()}</strong> was received. Reception will confirm it shortly and your stay clock will start then.</p>`,
            },
          }).catch(() => {});
        }
        return new Response("ok");
      },
    },
  },
});
