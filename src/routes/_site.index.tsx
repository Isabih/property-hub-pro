import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, Search, MapPin, Building2, Castle, Home, Briefcase, Square, Store, Award, Globe, Users, Building, ShieldCheck, Sparkles, TrendingUp, Quote, Star, Bed, Bath, Maximize2, Crown } from "lucide-react";
import { properties, CATEGORY_META, type PropertyCategory } from "@/lib/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPropertyOfTheDay } from "@/lib/property-of-day.functions";
import { WatchStoryModal } from "@/components/site/WatchStoryModal";

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
  const [storyOpen, setStoryOpen] = useState(false);
  const featured = properties.filter((p) => p.featured);
  const getPOD = useServerFn(getPropertyOfTheDay);
  const { data: pod } = useQuery({
    queryKey: ["property-of-the-day"],
    queryFn: () => getPOD(),
    staleTime: 60_000,
  });
  const storyVideo = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[100vh] flex flex-col justify-end overflow-hidden bg-noir-deep pb-40">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85"
            alt="Luxury interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-noir-deep/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-noir-deep via-noir-deep/80 to-noir-deep/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-deep via-noir-deep/70 to-noir-deep/60" />
        </div>

        <div className="container-luxe relative z-10 pt-32 pb-12 flex-1 flex flex-col justify-between">
          <div className="max-w-3xl animate-nova-fade-up">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 text-white/90 text-sm px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-gold" />
              Rwanda's Premier Luxury Real Estate
            </div>
            <h1 className="mt-8 font-display text-6xl md:text-7xl lg:text-8xl text-white leading-[1.0]">
              Invest in<br />
              <span className="text-gold italic">Excellence</span>
            </h1>
            <p className="mt-6 text-lg text-white/75 max-w-md">
              High-return property investments with guaranteed appreciation.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-7 py-4 rounded-md font-medium hover:shadow-2xl hover:shadow-gold/30 transition-all"
              >
                Explore Properties <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setStoryOpen(true)}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-7 py-4 rounded-md font-medium hover:bg-white/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" /> Watch Story
              </button>
            </div>

          </div>

          <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl">
            {[
              { n: "500+", l: "Premium Properties" },
              { n: "15+", l: "Years Experience" },
              { n: "2K+", l: "Property Managed" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl md:text-6xl text-white tracking-tight">
                  {s.n.replace(/(\D+)$/, "")}
                  <span className="text-gold">{s.n.match(/\D+$/)?.[0]}</span>
                </div>
                <div className="mt-2 text-[11px] tracking-[0.28em] uppercase text-white/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search bar overlay */}
        <div className="absolute bottom-0 translate-y-1/2 left-0 right-0 z-20">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-4 p-6 items-end">
                <Field icon={<MapPin className="w-4 h-4" />} label="Location" placeholder="Select location" />
                <Field icon={<Home className="w-4 h-4" />} label="Property Type" placeholder="Select type" />
                <Field icon={<span className="text-base leading-none">$</span>} label="Price Range" placeholder="Select range" />
                <div className="flex flex-col gap-1.5 min-w-0">
                  <label className="text-xs text-muted-foreground">Keyword</label>
                  <input className="bg-muted rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/30 w-full min-w-0" placeholder="Search by name..." />
                </div>
                <Link
                  to="/properties"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep rounded-md px-6 py-3 font-medium hover:shadow-lg hover:shadow-gold/30 transition-all whitespace-nowrap shrink-0"
                >
                  <Search className="w-4 h-4" /> Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* spacer for floating search */}
      <div className="h-32" />

      {/* PROPERTY OF THE DAY */}
      {pod && (
        <section className="py-24 bg-gradient-to-b from-noir-deep via-noir to-noir-deep text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--color-gold)_0%,_transparent_50%)]" />
          <div className="container-luxe relative">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold">
                <Crown className="w-4 h-4" /> Property of the Day
              </div>
              <h2 className="mt-4 font-display text-5xl md:text-6xl text-white">Luxury Living Redefined</h2>
              <p className="mt-4 text-white/60">Experience unparalleled elegance with our curated selection of premium properties</p>
            </div>

            <div className="mt-14 grid lg:grid-cols-2 gap-10 items-center">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-gold/30 to-transparent rounded-3xl blur-xl" />
                <div className="relative rounded-2xl overflow-hidden ring-1 ring-gold/20">
                  <img src={pod.cover ?? "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85"} alt={pod.title} className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 bg-gold/95 text-noir-deep text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-md">
                      <Crown className="w-3.5 h-3.5" /> Luxury Property
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir-deep via-noir-deep/80 to-transparent p-6 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-white/60">Starting from</div>
                      <div className="font-display text-2xl text-white">
                        ${pod.price.toLocaleString()}
                        {pod.listing_type === "rent" && <span className="text-base text-white/60">/mo</span>}
                      </div>
                    </div>
                    <Link to="/properties/$slug" params={{ slug: pod.slug }} className="inline-flex items-center gap-2 bg-white text-noir-deep text-sm font-medium px-4 py-2.5 rounded-md hover:bg-gold transition-colors">
                      View Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display text-4xl text-white">{pod.title}</h3>
                <div className="mt-3 flex items-center gap-2 text-white/60 text-sm">
                  <MapPin className="w-4 h-4 text-gold" />
                  {pod.district ? `${pod.district}, ${pod.city ?? ""}` : pod.city ?? "Kigali"}
                </div>
                <p className="mt-5 text-white/70 leading-relaxed">{pod.description}</p>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { i: Bed, v: pod.bedrooms ?? 0, l: "Bedrooms" },
                    { i: Bath, v: pod.bathrooms ?? 0, l: "Bathrooms" },
                    { i: Maximize2, v: pod.area_sqm ?? 0, l: "Sq. Meters" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                      <s.i className="w-5 h-5 text-gold mx-auto" />
                      <div className="mt-2 font-display text-3xl text-white">{s.v}</div>
                      <div className="text-xs text-white/50 uppercase tracking-wider mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>

                {pod.amenities.length > 0 && (
                  <div className="mt-7">
                    <div className="text-sm text-white/60 mb-3">Featured Amenities</div>
                    <div className="flex flex-wrap gap-2">
                      {pod.amenities.slice(0, 5).map((a) => (
                        <span key={a} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">{a}</span>
                      ))}
                      {pod.amenities.length > 5 && (
                        <span className="text-xs px-3 py-1.5 rounded-full bg-gold/20 border border-gold/40 text-gold">+{pod.amenities.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/properties" className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-6 py-3 rounded-md font-medium hover:shadow-lg hover:shadow-gold/30 transition-all">
                    Explore Luxury Collection <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/properties/$slug" params={{ slug: pod.slug }} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-md font-medium hover:bg-white/20 transition-colors">
                    View Property
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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

      <WatchStoryModal open={storyOpen} onClose={() => setStoryOpen(false)} src={storyVideo} />
    </div>
  );
}

function Field({ icon, label, placeholder }: { icon: React.ReactNode; label: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 bg-muted rounded-md px-4 py-3 text-sm min-w-0">
        <span className="text-gold shrink-0">{icon}</span>
        <span className="text-muted-foreground truncate">{placeholder}</span>
      </div>
    </div>
  );
}