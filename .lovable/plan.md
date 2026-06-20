# All Dashboards + Property Registration

## Scope
Build out all role dashboards to match the reference (NOVAWORKS sidebar, gold accent, stat cards, analytics chart, quick actions, dashboard switcher at bottom) and wire real property data so Owners/Agents/Admin/IT can register and manage listings.

**Note on "six dashboards":** we currently have 5 roles (Buyer/Customer, Agent, Owner, Admin, IT). I'll treat the sixth as a **Super Admin** view OR confirm with you — for now I'll build 5 and add a 6th only if you name it. Tell me the 6th role name in your reply and I'll add it in the same pass.

## 1. Shared Dashboard Shell (refactor)
Replace current `DashboardShell` with a layout matching the screenshot:
- Left sidebar: NOVAWORKS logo + role label, grouped nav (Overview / Content / Management / System), bottom "Switch Dashboard" grid, user card at bottom.
- Top bar: global search, notifications bell.
- Page header: title + subtitle + action buttons (Sync Data, primary CTA per role).
- Reusable `StatCard` with icon tile, delta chip (green/red), value, label, sublabel.
- Reusable `AnalyticsChart` (recharts area chart, 7/30/90 day toggle).
- Reusable `QuickActions` 2×2 grid.
- Gold/black palette via design tokens (no hardcoded colors).

## 2. Real Property Data (backend)
Migration adding:
- `properties` (owner_id, agent_id, slug, title, description, type, status [draft/active/sold/archived], price, currency, bedrooms, bathrooms, area_sqm, address, city, district, lat, lng, featured, views_count).
- `property_images` (property_id, url, position, is_cover).
- `property_inquiries` (property_id, user_id, message, status, scheduled_at).
- `saved_properties` (user_id, property_id).
- `property_views` (property_id, user_id nullable, viewed_at) for analytics.
- Storage bucket `property-media` (public read, owner write).
- RLS: public read of active properties; owners manage their own; agents manage assigned; admin/IT manage all (IT no money ops).
- GRANTs per public-schema rule.

## 3. Property Registration Flow
- `/dashboard/owner/properties/new` and `/dashboard/agent/properties/new`: multi-step form (basics → location with map picker → media upload → review/publish).
- Server fns: `createProperty`, `updateProperty`, `uploadPropertyImage`, `setPropertyStatus`.
- Owner/Agent property list with edit/delete/publish.
- Public `/properties` and `/properties/$slug` switch from static `src/lib/properties.ts` to DB-backed reads via a public server fn.

## 4. Per-Role Dashboards (real queries)
- **Buyer/Customer**: saved properties, my inquiries, scheduled visits, recommendations.
- **Agent**: assigned listings, leads/inquiries, scheduled visits, conversion stats.
- **Owner**: my properties, views/inquiries chart, earnings (placeholder until payments), quick "Add Property".
- **Admin**: totals across system, users, revenue, approvals queue, full management.
- **IT**: same shell as admin but no money widgets — system health, user/role management, media library, content management, analytics.

## 5. Dashboard Switcher
Bottom-of-sidebar grid lets users with multiple roles jump between dashboards. For users with one role, shows only their dashboard (others greyed/hidden).

## Technical notes
- Server fns under `src/lib/properties.functions.ts` with `requireSupabaseAuth`; public reads via server publishable client.
- Image uploads through `supabase.storage` from the browser (RLS on bucket).
- Map picker reuses existing Leaflet setup from property detail page.
- Migration follows CREATE → GRANT → RLS → POLICY order.

## What I need from you
1. **Name of the 6th dashboard** (or confirm 5 is correct).
2. OK to seed the new `properties` table by migrating the current static listings in `src/lib/properties.ts` so the site doesn't go empty?
