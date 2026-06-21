import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendCustomerOtp } from "@/lib/email.functions";

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("*, properties(title)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    full_name: string;
    email: string;
    phone: string;
    property_id?: string | null;
    apartment_no?: string | null;
    agent_id?: string | null;
    stay_start?: string | null;
    stay_end?: string | null;
    amount_paid?: number | null;
    payment_method?: string | null;
    payment_status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
    const { data: row, error } = await context.supabase
      .from("customers")
      .insert({
        full_name: data.full_name.trim(),
        email,
        phone: data.phone.trim(),
        property_id: data.property_id ?? null,
        apartment_no: data.apartment_no ?? null,
        agent_id: data.agent_id ?? null,
        stay_start: data.stay_start ?? null,
        stay_end: data.stay_end ?? null,
        amount_paid: data.amount_paid ?? 0,
        payment_method: data.payment_method ?? null,
        payment_status: data.payment_status ?? "pending",
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await sendCustomerOtp({ data: { customerId: row.id } });
    return { id: row.id };
  });

export const listStaffForAssignment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("user_id, role, profiles!inner(id,full_name,email)")
      .in("role", ["agent", "owner"]);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.profiles.id,
      name: r.profiles.full_name ?? r.profiles.email,
      role: r.role,
    }));
  });

export const listPropertiesForBooking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("properties")
      .select("id,title,property_type,city,status")
      .in("status", ["active", "maintenance"])
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });