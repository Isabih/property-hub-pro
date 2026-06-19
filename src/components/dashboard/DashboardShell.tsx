import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, X, Bell, Home as HomeIcon } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/use-auth";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardShell({
  title,
  role,
  nav,
  children,
}: {
  title: string;
  role: AppRole;
  nav: NavItem[];
  children: ReactNode;
}) {
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const name = profile?.full_name ?? user?.email ?? "Account";
  const initial = name.trim().charAt(0).toUpperCase();
  const path = router.state.location.pathname;

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-noir-deep">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-noir-deep text-white transform transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="h-9 w-9 rounded-md bg-gold/15 text-gold flex items-center justify-center">
            <HomeIcon className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg">NOVAWORKS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">{title}</div>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  active ? "bg-gold/15 text-gold" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link to="/" className="block text-xs text-white/50 hover:text-gold mb-3">← Back to site</Link>
          <button
            onClick={signOut}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-noir/10">
          <div className="flex items-center justify-between px-4 sm:px-8 py-4">
            <button onClick={() => setOpen((v) => !v)} className="lg:hidden p-2 -ml-2">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <div className="text-xs uppercase tracking-wider text-noir/50">{title}</div>
              <div className="text-sm font-medium text-noir-deep">Welcome back, {name.split(" ")[0]}</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-md hover:bg-noir/5">
                <Bell className="h-4 w-4" />
              </button>
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-noir-deep">
                <span className="h-2 w-2 rounded-full bg-gold" /> {role.toUpperCase()}
              </span>
              <div className="h-9 w-9 rounded-full bg-noir-deep text-gold flex items-center justify-center text-sm font-semibold">{initial}</div>
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-8 py-8">{children}</main>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl bg-white border border-noir/10 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-noir/50">{label}</span>
        <span className="h-9 w-9 rounded-md bg-gold/15 text-gold flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-display text-noir-deep">{value}</div>
      {delta && <div className="mt-1 text-xs text-emerald-600">{delta}</div>}
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white border border-noir/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-noir-deep">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}