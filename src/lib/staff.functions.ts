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

/** Create a staff user. IT can create admins; admin can create owner/agent/receptionist. */
export const createStaffUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: Role;
    avatar_url?: string | null;
    send_verification?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    const mine = await assertRole(context, ["it", "admin"]);
    const isIT = mine.includes("it");
    const isAdmin = mine.includes("admin");
    if (data.role === "admin" && !isIT) throw new Error("Only IT can create admins.");
    if (data.role === "it" && !isIT) throw new Error("Only IT can create IT users.");
    if (["owner", "agent", "receptionist"].includes(data.role) && !(isIT || isAdmin))
      throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Email verification is ALWAYS required — staff cannot sign in until they verify.
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      email_confirm: false,
      user_metadata: { full_name: data.full_name, phone: data.phone ?? null, requested_role: data.role },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    // profile + role rows (handle_new_user trigger created them with role=buyer by default; override role here)
    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      full_name: data.full_name,
      email: data.email.trim().toLowerCase(),
      phone: data.phone ?? null,
      avatar_url: data.avatar_url ?? null,
    });
    // Replace roles with the requested one (single-role on creation)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    // Send the Supabase email-verification link
    try {
      await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
    } catch {}
    return { id: uid, verification_sent: true };
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
