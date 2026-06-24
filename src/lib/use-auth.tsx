import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "agent" | "owner" | "admin" | "it" | "receptionist";

export interface AuthProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  roles: AppRole[];
  rolesLoaded: boolean;
  primaryRole: AppRole | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

const ROLE_PRIORITY: AppRole[] = ["admin", "it", "receptionist", "owner", "agent", "buyer"];

function pickPrimary(roles: AppRole[]): AppRole | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return roles[0] ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadExtras = async (uid: string) => {
    setRolesLoaded(false);
    try {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone,avatar_url").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      if (p.error) throw p.error;
      if (r.error) throw r.error;
      setProfile((p.data as AuthProfile | null) ?? null);
      setRoles(((r.data ?? []) as Array<{ role: AppRole }>).map((x) => x.role));
    } catch (error) {
      console.error("Failed to load auth profile/roles", error);
      setProfile(null);
      setRoles([]);
    } finally {
      setRolesLoaded(true);
    }
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      try {
        setSession(data.session);
        if (data.session?.user) await loadExtras(data.session.user.id);
        else setRolesLoaded(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT" || !s?.user) {
        setProfile(null);
        setRoles([]);
        setRolesLoaded(true);
        setLoading(false);
        return;
      }
      // defer to avoid deadlock
      setTimeout(() => loadExtras(s.user.id), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    roles,
    rolesLoaded,
    primaryRole: pickPrimary(roles),
    refresh: async () => {
      if (session?.user) await loadExtras(session.user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function dashboardPathFor(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "it":
      return "/dashboard/it";
    case "receptionist":
      return "/dashboard/receptionist";
    case "owner":
      return "/dashboard/owner";
    case "agent":
      return "/dashboard/agent";
    case "buyer":
      return "/dashboard/buyer";
    default:
      return "/auth/welcome";
  }
}