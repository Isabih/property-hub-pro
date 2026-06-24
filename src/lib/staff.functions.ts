import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "owner" | "agent" | "receptionist" | "admin" | "buyer" | "it";

async function assertRole(context: any, allowed: Role[]) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw error;
  const mine: Role[] = (data ?? []).map((r: any) => r.role);
  if (!mine.some((r) => allowed.includes(r))) throw new Error("Forbidden");
  return mine;
}

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** STEP 1 — Validate inputs, generate a 6-digit code, email it to the new staff address,
 * and stash the pending row. No auth user is created at this stage. */
export const startCreateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: Role;
    avatar_url?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const mine = await assertRole(context, ["it", "admin"]);
    const isIT = mine.includes("it");
    const isAdmin = mine.includes("admin");
    if (data.role === "admin" && !isIT) throw new Error("Only IT can create admins.");
    if (data.role === "it" && !isIT) throw new Error("Only IT can create IT users.");
    if (["owner", "agent", "receptionist"].includes(data.role) && !(isIT || isAdmin))
      throw new Error("Forbidden");
    if (!data.password || data.password.length < 8) throw new Error("Password must be 8+ chars");
    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Reject if a confirmed account already exists for this email
    const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existingProfile) throw new Error("A user with this email already exists.");
    // Clear any stale pending row for the same email
    await supabaseAdmin.from("pending_staff").delete().eq("email", email);
    const code = sixDigit();
    const otp_hash = await sha256(code);
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data: pending, error: pErr } = await supabaseAdmin
      .from("pending_staff")
      .insert({
        email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone ?? null,
        role: data.role,
        avatar_url: data.avatar_url ?? null,
        otp_hash,
        otp_expires_at: expires,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);
    // Send the OTP via Resend (existing, working connector)
    const { sendCustomEmail } = await import("./email.functions");
    const html = `<p>Hello ${data.full_name},</p>
      <p>You have been invited to the NOVAWORKS staff portal as <strong>${data.role}</strong>.</p>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f5f5f5;padding:14px 18px;border-radius:6px;display:inline-block">${code}</p>
      <p>This code expires in <strong>5 minutes</strong>. Enter it on the invitation screen to activate your account.</p>`;
    await sendCustomEmail({ data: { to: email, subject: "Your NOVAWORKS verification code", html, kind: "staff_otp" } });
    return { pending_id: pending.id, email };
  });

/** STEP 2 — Verify the code; on success create the auth user (already email-confirmed). */
export const verifyAndCreateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pending_id: string; code: string }) => d)
  .handler(async ({ data, context }) => {
    await assertRole(context, ["it", "admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("pending_staff").select("*").eq("id", data.pending_id).maybeSingle();
    if (!p) throw new Error("No pending invitation. Please restart.");
    if (new Date(p.otp_expires_at).getTime() < Date.now()) throw new Error("Code expired. Please restart.");
    if ((p.otp_attempts ?? 0) >= 5) throw new Error("Too many attempts. Please restart.");
    const hash = await sha256(data.code);
    if (hash !== p.otp_hash) {
      await supabaseAdmin.from("pending_staff").update({ otp_attempts: (p.otp_attempts ?? 0) + 1 }).eq("id", p.id);
      throw new Error("Incorrect code.");
    }
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: p.email,
      password: p.password,
      email_confirm: true, // verified via our OTP
      user_metadata: { full_name: p.full_name, phone: p.phone, requested_role: p.role },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      avatar_url: p.avatar_url,
    });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: p.role });
    await supabaseAdmin.from("pending_staff").delete().eq("id", p.id);
    return { id: uid, email: p.email, role: p.role };
  });

/** Resend the OTP for an existing pending invitation. */
export const resendStaffOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pending_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertRole(context, ["it", "admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("pending_staff").select("*").eq("id", data.pending_id).maybeSingle();
    if (!p) throw new Error("No pending invitation.");
    const code = sixDigit();
    const otp_hash = await sha256(code);
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabaseAdmin.from("pending_staff").update({ otp_hash, otp_expires_at: expires, otp_attempts: 0 }).eq("id", p.id);
    const { sendCustomEmail } = await import("./email.functions");
    const html = `<p>Hello ${p.full_name},</p>
      <p>Your new verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f5f5f5;padding:14px 18px;border-radius:6px;display:inline-block">${code}</p>
      <p>This code expires in <strong>5 minutes</strong>.</p>`;
    await sendCustomEmail({ data: { to: p.email, subject: "Your NOVAWORKS verification code", html, kind: "staff_otp" } });
    return { ok: true };
  });

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context, ["it", "admin"]);
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const byUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
      byUser.get(r.user_id)!.push(r.role);
    });
    // Pull email_confirmed_at from auth.users (paginated)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const verifiedMap = new Map<string, string | null>();
    try {
      const { data: au } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      (au?.users ?? []).forEach((u: any) => verifiedMap.set(u.id, u.email_confirmed_at ?? null));
    } catch {}
    return (profiles ?? []).map((p: any) => ({
      ...p,
      roles: byUser.get(p.id) ?? [],
      email_confirmed_at: verifiedMap.get(p.id) ?? null,
    }));
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; full_name?: string; phone?: string; avatar_url?: string | null; active?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertRole(context, ["it", "admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (data.active !== undefined) patch.active = data.active;
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.user_id);
    if (error) throw error;
    // If deactivated, ban the user in auth
    if (data.active === false) {
      await supabaseAdmin.auth.admin.updateUserById(data.user_id, { ban_duration: "876000h" });
    } else if (data.active === true) {
      await supabaseAdmin.auth.admin.updateUserById(data.user_id, { ban_duration: "none" });
    }
    return { ok: true };
  });

export const updateUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; roles: Role[] }) => d)
  .handler(async ({ data, context }) => {
    const mine = await assertRole(context, ["it", "admin"]);
    if (!mine.includes("it") && data.roles.some((r) => r === "it" || r === "admin"))
      throw new Error("Only IT can grant IT or admin roles.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    if (data.roles.length) {
      await supabaseAdmin.from("user_roles").insert(
        data.roles.map((role) => ({ user_id: data.user_id, role })),
      );
    }
    return { ok: true };
  });

/** IT triggers a password reset for a user — creates a pending request the user can then complete. */
export const itTriggerPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertRole(context, ["it", "admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("email").eq("id", data.user_id).maybeSingle();
    if (!prof?.email) throw new Error("User has no email");
    const { data: req, error } = await supabaseAdmin.from("password_reset_requests").insert({
      email: prof.email,
      user_id: data.user_id,
      email_verified: true,
      status: "verified",
    }).select("id").single();
    if (error) throw error;
    return { ok: true, id: req.id };
  });

/** Permanently delete a user (auth + profile + roles). IT only. */
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => d)
  .handler(async ({ data, context }) => {
    const mine = await assertRole(context, ["it", "admin"]);
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Guard: only IT can delete admins or other IT users
    const { data: targetRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user_id);
    const tRoles = (targetRoles ?? []).map((r: any) => r.role);
    if ((tRoles.includes("admin") || tRoles.includes("it")) && !mine.includes("it")) {
      throw new Error("Only IT can delete admin or IT users.");
    }
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("profiles").delete().eq("id", data.user_id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
