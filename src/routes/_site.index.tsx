import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, Search, MapPin, Building2, Castle, Home, Briefcase, Square, Store, Award, Globe, Users, Building, ShieldCheck, Sparkles, TrendingUp, Quote, Star } from "lucide-react";
import { properties, CATEGORY_META, type PropertyCategory } from "@/lib/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useState } from "react";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "NOVAWORKS — Where Dreams Meet Reality | Luxury Real Estate Rwanda" },
      { name: "description", content: "Premium apartments, villas and investment properties in Kigali's most prestigious locations. Curated by NOVAWORKS, Rwanda's leading luxury real estate platform." },
      { property: "og:title", content: "NOVAWORKS — Luxury Real Estate Rwanda" },
      { property: "og:description", content: "Where prime property meets peace of mind." },
    ],
  }),
  component: HomePage,
});

const CATEGORY_ICONS: Record<PropertyCategory, any> = {
  apartment: Building2,
  "luxury-apartment": Castle,
  villa: Home,
  building: Building,
  office: Briefcase,
  land: MapPin,
  studio: Square,
  commercial: Store,
};

function HomePage() {
  const [tab, setTab] = useState<"rent" | "sale" | "all">("rent");
  const featured = properties.filter((p) => p.featured);

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-noir-deep">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85"
            alt="Luxury interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-noir-deep via-noir-deep/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-deep via-transparent to-noir-deep/30" />
        </div>

        <div className="container-luxe relative z-10 py-20">
          <div className="max-w-3xl animate-nova-fade-up">
            <div className="inline-flex items-center gap-2 bg-gold/15 backdrop-blur border border-gold/30 text-gold text-xs uppercase tracking-[0.18em] px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Rwanda's Premier Luxury Real Estate
            </div>
            <h1 className="mt-6 font-display text-6xl md:text-7xl lg:text-8xl text-white leading-[0.95]">
              Where Dreams<br />
              <span className="text-gold italic">Meet Reality</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl">
              Premium apartments and exclusive villas designed for sophisticated living — curated by Kigali's most trusted real-estate atelier.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-7 py-4 rounded-md font-medium hover:shadow-2xl hover:shadow-gold/30 transition-all"
              >
                Explore Properties <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-7 py-4 rounded-md font-medium hover:bg-white/20 transition-all">
                <Play className="w-4 h-4 fill-current" /> Watch Story
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl border-t border-white/10 pt-8">
              {[
                { n: "500+", l: "Premium Properties" },
                { n: "15+", l: "Years Experience" },
                { n: "2K+", l: "Properties Managed" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-4xl md:text-5xl text-white">
                    {s.n.replace(/(\D+)$/, "")}
                    <span className="text-gold">{s.n.match(/\D+$/)?.[0]}</span>
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search bar overlay */}
        <div className="absolute -bottom-12 left-0 right-0 z-20">
          <div className="container-luxe">
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
              <div className="flex border-b border-border">
                {(["rent", "sale", "all"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${
                      tab === t ? "text-foreground border-b-2 border-gold" : "text-muted-foreground"
                    }`}
                  >
                    {t === "rent" ? "For Rent" : t === "sale" ? "For Sale" : "All Properties"}
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-5 gap-4 p-6">
                <Field icon={<MapPin className="w-4 h-4" />} label="Location" placeholder="Select location" />
                <Field icon={<Home className="w-4 h-4" />} label="Property Type" placeholder="Select type" />
                <Field icon={<span className="text-base leading-none">$</span>} label="Price Range" placeholder="Select range" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Keyword</label>
                  <input className="bg-muted rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/30" placeholder="Search by name..." />
                </div>
                <Link
                  to="/properties"
                  className="self-end inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep rounded-md px-5 py-3 font-medium hover:shadow-lg hover:shadow-gold/30 transition-all"
                >
                  <Search className="w-4 h-4" /> Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* spacer for floating search */}
      <div className="h-24" />

      {/* CATEGORIES */}
      <section className="py-20">
        <div className="container-luxe">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Browse by Category</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground">Curated Collections</h2>
            <p className="mt-3 text-muted-foreground">From sun-drenched studios to private estates, find the home that matches your standard.</p>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(CATEGORY_META) as PropertyCategory[]).map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const count = properties.filter((p) => p.category === cat).length;
              return (
                <Link
                  key={cat}
                  to="/properties"
                  search={{ category: cat }}
                  className="group relative bg-card border border-border rounded-2xl p-6 hover:border-gold/50 hover:shadow-xl transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-noir-deep transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="mt-5 font-display text-xl text-foreground">{CATEGORY_META[cat].plural}</div>
                  <div className="text-xs text-muted-foreground mt-1">{count} listings</div>
                  <ArrowRight className="absolute top-6 right-6 w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-20 bg-muted/40">
        <div className="container-luxe">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gold">Featured Properties</div>
              <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground">Hand-Picked Residences</h2>
            </div>
            <Link to="/properties" className="text-sm text-foreground hover:text-gold inline-flex items-center gap-2">
              View all properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 relative overflow-hidden">
        <div className="container-luxe grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">What We Do</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight">
              A full-spectrum<br />real estate atelier.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              From sourcing off-market estates to managing your portfolio income, NOVAWORKS handles every detail with discretion.
            </p>
            <Link to="/services" className="mt-8 inline-flex items-center gap-2 bg-noir-deep text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-noir transition-colors">
              Explore Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { i: Home, t: "Property Sales", d: "Buy and sell with expert guidance and market intel." },
              { i: Sparkles, t: "Luxury Sourcing", d: "Off-market access to Rwanda's most exclusive estates." },
              { i: Building2, t: "Property Management", d: "Full-service management for absentee owners." },
              { i: TrendingUp, t: "Investment Advisory", d: "Strategic guidance for maximum returns." },
            ].map((s) => (
              <div key={s.t} className="bg-card border border-border rounded-xl p-6 hover:border-gold/50 transition-colors group">
                <div className="w-11 h-11 rounded-lg bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-noir-deep transition-colors">
                  <s.i className="w-5 h-5" />
                </div>
                <div className="mt-4 font-display text-xl text-foreground">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / STATS */}
      <section className="py-20 bg-noir-deep text-white">
        <div className="container-luxe grid md:grid-cols-4 gap-10 text-center">
          {[
            { i: Building2, n: "500+", l: "Properties Listed" },
            { i: Users, n: "2,000+", l: "Happy Clients" },
            { i: Award, n: "15+", l: "Years Experience" },
            { i: Globe, n: "50+", l: "Locations" },
          ].map((s) => (
            <div key={s.l}>
              <div className="w-14 h-14 mx-auto rounded-xl bg-gold/15 text-gold flex items-center justify-center">
                <s.i className="w-6 h-6" />
              </div>
              <div className="mt-5 font-display text-5xl">{s.n}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-24">
        <div className="container-luxe max-w-4xl text-center">
          <Quote className="w-10 h-10 text-gold mx-auto" />
          <p className="mt-6 font-display text-3xl md:text-4xl text-foreground italic leading-snug">
            "NOVAWORKS found us a home we didn't know existed — discreet, beautifully renovated, and perfectly priced. Their team operates at a different level."
          </p>
          <div className="mt-8 flex items-center justify-center gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Aline K.</span> · Private client, Kimihurura
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="pb-20">
        <div className="container-luxe grid sm:grid-cols-3 gap-4">
          {[
            { i: ShieldCheck, t: "Verified Listings", d: "Every property inspected by our team." },
            { i: Award, t: "15 Years of Trust", d: "Operating in Rwanda since 2010." },
            { i: Sparkles, t: "Concierge Service", d: "White-glove support, end to end." },
          ].map((b) => (
            <div key={b.t} className="flex gap-4 p-6 bg-card border border-border rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <b.i className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-lg text-foreground">{b.t}</div>
                <div className="text-sm text-muted-foreground">{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ icon, label, placeholder }: { icon: React.ReactNode; label: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 bg-muted rounded-md px-4 py-3 text-sm">
        <span className="text-gold">{icon}</span>
        <span className="text-muted-foreground">{placeholder}</span>
      </div>
    </div>
  );
}