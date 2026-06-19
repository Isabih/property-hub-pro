
# NOVAWORKS Backend & Auth Build Plan

Lovable Cloud is now enabled. Because this is large (auth, OTP, Google, 5 dashboards, redesigned login + welcome animation), I'll ship it in 3 phases so each phase is testable.

## Phase 1 — Foundation (this turn)

**Database**
- `app_role` enum: `buyer`, `agent`, `owner`, `admin`, `it`
- `profiles` (id → auth.users, full_name, phone, avatar_url, created_at)
- `user_roles` (user_id, role) — separate table, never on profiles (security)
- `has_role(user_id, role)` security-definer function
- `email_verifications` (user_id, code_hash, expires_at, attempts)
- Trigger: auto-create profile + default `buyer` role on signup
- RLS + GRANTs on every table

**Auth pages (redesigned to match your reference)**
- `/auth` — split-screen: left = form with NOVAWORKS logo, right = property image + testimonial overlay (matches login-page.png exactly)
- Tabs: Sign in / Create account
- Email + password, "Remember me 30 days", "Forgot password"
- Google sign-in button (managed OAuth — works out of the box)
- `/auth/verify` — 6-digit OTP code entry (replaces existing verify-access page)
- `/auth/welcome` — black screen with animated logo circle, "Welcome Back!" / "Welcome [Name]!", progress bar, auto-redirects to role dashboard (matches login-animation.png)
- Inactivity modal "Are you still there?" with 4s countdown (matches login-delay-counter.png) on auth pages

**Auth infrastructure**
- Email OTP sent via edge function using Lovable AI? No — using Resend-style: we'll generate code, store hash, send via a simple email edge function (or use Supabase's built-in email with custom template containing the code)
- `_authenticated/` route gate (managed)
- Role-based redirect after login → `/dashboard/{role}`

## Phase 2 — Role dashboards (next turn)

Each role gets its own dashboard layout under `/dashboard/`:

- **Buyer** — saved properties, scheduled visits, messages with agents, recently viewed
- **Agent** — my listings, leads (visit requests), messages, performance stats
- **Owner** — my properties, inquiries on my properties, earnings/visits stats
- **Admin** — users, properties (approve/reject), verifications, all bookings, revenue (full money access)
- **IT** — users, properties (approve/reject), system health, verifications, audit logs (NO money/revenue widgets)

Shared dashboard shell: collapsible sidebar, top bar with user menu, role badge.

## Phase 3 — Wire-up & polish

- Property registration form connected to DB (replaces mock data)
- Visit scheduling form writes to DB and notifies agent
- Profile page (avatar upload via Cloud storage)
- Role management for admin (assign/revoke roles)

---

## Technical notes

- Storage: roles in separate `user_roles` table (never on profiles) — prevents privilege escalation
- OTP: 6-digit code, 10-min expiry, hashed at rest (bcrypt-style via pgcrypto), max 5 attempts
- Welcome animation: pure CSS/Framer Motion, 2-3s display before redirect
- Google: managed Lovable Cloud OAuth — no client credentials needed
- All routes under `_authenticated/` automatically gated
- Money widgets gated by `has_role(uid, 'admin')` so IT role can't see them even if they reach admin routes

## What I need from you

Confirm Phase 1 scope and I'll start building. Phase 2 and 3 happen on your "continue" signal.
