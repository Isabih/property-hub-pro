import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, Pause, Search, MapPin, Building2, Castle, Home, Briefcase, Square, Store, Award, Globe, Users, Building, ShieldCheck, Sparkles, TrendingUp, Quote, Star, Bed, Bath, Maximize2, Crown, ChevronDown } from "lucide-react";
import { properties, CATEGORY_META, type PropertyCategory } from "@/lib/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPropertyOfTheDay } from "@/lib/property-of-day.functions";
import { WatchStoryModal } from "@/components/site/WatchStoryModal";
import { ProgressiveImage } from "@/components/site/ProgressiveImage";

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

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85",
    title: "Discover",
    titleAccent: "Exceptional Living",
    subtitle: "Curated luxury properties in Rwanda's most prestigious locations.",
  },
  {
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85",
    title: "Where Dreams",
    titleAccent: "Meet Reality",
    subtitle: "Premium apartments and exclusive villas designed for sophisticated living.",
  },
  {
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=85",
    title: "Invest in",
    titleAccent: "Excellence",
    subtitle: "High-return property investments with guaranteed appreciation.",
  },
] as const;

function HomePage() {
  const [tab, setTab] = useState<"rent" | "sale" | "all">("rent");
  const [storyOpen, setStoryOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const nextSlide = useCallback(() => {
    setSlide((p) => (p + 1) % HERO_SLIDES.length);
    setProgress(0);
  }, []);
  useEffect(() => { setLoaded(true); }, []);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { nextSlide(); return 0; }
        return p + 0.5;
      });
    }, 30);
    return () => clearInterval(id);
  }, [paused, nextSlide]);
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
      {/* HERO — cinematic slideshow with Ken Burns */}
      <section className="relative h-screen min-h-[700px] max-h-[1100px] overflow-hidden bg-noir-deep">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${slide === i ? "opacity-100" : "opacity-0"}`}
          >
            <div className={`absolute inset-0 ${slide === i ? "animate-ken-burns" : ""}`}>
              <ProgressiveImage
                src={s.image}
                alt={s.title}
                containerClassName="absolute inset-0"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          </div>
        ))}

        <div className="relative h-full container-luxe flex items-center pt-20">
          <div className="max-w-4xl">
            <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass mb-10 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
              </span>
              <span className="text-white/90 text-sm font-medium tracking-wide">Rwanda's Premier Luxury Real Estate</span>
            </div>

            <div className={`mb-8 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05]">
                <span className="block">{HERO_SLIDES[slide].title}</span>
                <span className="block gold-text italic">{HERO_SLIDES[slide].titleAccent}</span>
              </h1>
            </div>

            <p className={`text-xl md:text-2xl text-white/75 mb-12 max-w-2xl leading-relaxed font-light transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              {HERO_SLIDES[slide].subtitle}
            </p>

            <div className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <Link to="/properties" className="btn-luxury group inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep h-14 px-8 rounded-md text-base font-medium">
                Explore Properties <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button onClick={() => setStoryOpen(true)} className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 h-14 px-8 rounded-md text-base backdrop-blur-sm transition-colors">
                <Play className="w-5 h-5 fill-current" /> Watch Story
              </button>
            </div>

            <div className={`flex flex-wrap items-center gap-12 mt-16 pt-10 border-t border-white/10 transition-all duration-700 delay-400 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              {[
                { n: "500", l: "Premium Properties" },
                { n: "15", l: "Years Experience" },
                { n: "2K", l: "Happy Clients" },
              ].map((s, idx) => (
                <div key={s.l} className="flex items-center gap-12">
                  <div>
                    <p className="text-5xl font-display font-bold text-white mb-1">{s.n}<span className="text-gold">+</span></p>
                    <p className="text-white/50 text-sm uppercase tracking-wider">{s.l}</p>
                  </div>
                  {idx < 2 && <div className="w-px h-16 bg-white/10" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
          <div className="flex items-center gap-3">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSlide(i); setProgress(0); }}
                className="group relative h-1 w-12 rounded-full bg-white/20 overflow-hidden"
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gold rounded-full transition-all duration-150"
                  style={{ width: slide === i ? `${progress}%` : "0%" }}
                />
              </button>
            ))}
          </div>
          <button
            onClick={() => setPaused(!paused)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label={paused ? "Play" : "Pause"}
          >
            {paused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 right-8 hidden md:flex flex-col items-center gap-2 text-white/40 z-10">
          <span className="text-[10px] uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* SEARCH SECTION */}
      <section className="bg-background py-12 lg:py-16 border-b border-border">
        <div className="container-luxe">
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="flex border-b border-border">
              {(["rent", "sale", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                    tab === t ? "text-foreground border-b-2 border-gold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "rent" ? "For Rent" : t === "sale" ? "For Sale" : "All Properties"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_max-content] gap-3 p-6 items-end">
              <Field icon={<MapPin className="w-4 h-4" />} label="Location" placeholder="Select location" />
              <Field icon={<Home className="w-4 h-4" />} label="Property Type" placeholder="Select type" />
              <Field icon={<span className="text-base leading-none">$</span>} label="Price Range" placeholder="Select range" />
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-xs text-muted-foreground">Keyword</label>
                <input className="bg-muted rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/30 w-full min-w-0" placeholder="Search by name..." />
              </div>
              <Link
                to="/properties"
                className="btn-luxury inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep rounded-md h-[46px] px-6 font-medium whitespace-nowrap shrink-0"
              >
                <Search className="w-4 h-4" /> Search
              </Link>
            </div>
          </div>
        </div>
      </section>

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