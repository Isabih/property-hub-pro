import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Bed, Bath, Maximize2, MapPin, Crown, Heart, Share2, Phone, Mail, Check, ArrowLeft, Play } from "lucide-react";
import { getProperty, formatPrice, CATEGORY_META, properties, type Property } from "@/lib/properties";
import { PropertyCard } from "@/components/site/PropertyCard";

export const Route = createFileRoute("/_site/properties/$slug")({
  loader: ({ params }) => {
    const property = getProperty(params.slug);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.property.title} — NOVAWORKS` },
      { name: "description", content: loaderData.property.description },
      { property: "og:title", content: loaderData.property.title },
      { property: "og:description", content: loaderData.property.description },
      { property: "og:image", content: loaderData.property.image },
    ] : [],
  }),
  component: PropertyDetail,
  notFoundComponent: () => (
    <div className="container-luxe py-32 text-center">
      <h1 className="font-display text-4xl">Property not found</h1>
      <Link to="/properties" className="mt-6 inline-block text-gold">← Back to properties</Link>
    </div>
  ),
});

function PropertyDetail() {
  const { property: p } = Route.useLoaderData() as { property: Property };
  const gallery: { label: string; src: string }[] = p.gallery ?? [{ label: "Main", src: p.image }];
  const [active, setActive] = useState(0);
  const related = properties.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 3);

  return (
    <div>
      {/* Hero gallery */}
      <section className="bg-noir-deep pt-8 pb-16">
        <div className="container-luxe">
          <Link to="/properties" className="inline-flex items-center gap-2 text-white/60 hover:text-gold text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to properties
          </Link>

          <div className="grid lg:grid-cols-[1fr_320px] gap-3 mb-6">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              <img src={gallery[active].src} alt={gallery[active].label} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                {p.luxury && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gold-soft to-gold text-noir-deep text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md">
                    <Crown className="w-3 h-3" /> Luxury
                  </span>
                )}
                <span className="bg-emerald-500 text-white text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md capitalize">
                  {p.status}
                </span>
              </div>
              {p.videoUrl && (
                <button className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-white/90 text-noir-deep px-4 py-2 rounded-md text-sm font-medium">
                  <Play className="w-3.5 h-3.5 fill-current" /> Play Tour
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 max-h-[500px] overflow-auto pr-1">
              {gallery.map((g: { label: string; src: string }, i: number) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`relative aspect-square lg:aspect-[4/3] rounded-lg overflow-hidden group ${active === i ? "ring-2 ring-gold" : "opacity-70 hover:opacity-100"}`}
                >
                  <img src={g.src} alt={g.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir-deep/80 to-transparent" />
                  <div className="absolute bottom-1 left-2 text-[10px] uppercase tracking-wider text-white">{g.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detail */}
      <section className="py-12">
        <div className="container-luxe grid lg:grid-cols-[1fr_380px] gap-12">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">{CATEGORY_META[p.category].label} · For {p.listing === "rent" ? "Rent" : "Sale"}</div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl text-foreground">{p.title}</h1>
            <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4 text-gold" /> {p.location}, {p.district} District, Rwanda
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {p.beds != null && <Stat icon={<Bed className="w-5 h-5" />} value={p.beds} label="Bedrooms" />}
              {p.baths != null && <Stat icon={<Bath className="w-5 h-5" />} value={p.baths} label="Bathrooms" />}
              <Stat icon={<Maximize2 className="w-5 h-5" />} value={`${p.area}`} label="Square m²" />
            </div>

            <div className="mt-10">
              <h2 className="font-display text-2xl mb-3">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">{p.description}</p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                This residence has been curated by NOVAWORKS for clients who value discretion, design integrity, and locations that hold value. Each detail — from the joinery to the lighting plan — has been considered.
              </p>
            </div>

            {p.amenities && (
              <div className="mt-10">
                <h2 className="font-display text-2xl mb-4">Amenities & Features</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(p.amenities as string[]).map((a: string) => (
                    <div key={a} className="flex items-center gap-3 bg-card border border-border p-3 rounded-md">
                      <div className="w-7 h-7 rounded-md bg-gold/15 text-gold flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-display text-2xl mb-4">Location</h2>
              <div className="aspect-[16/9] rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gold mx-auto" />
                  <div className="mt-2 text-sm">{p.location}, {p.district}, Kigali</div>
                  <div className="text-xs">Map preview</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Price</div>
              <div className="mt-1 font-display text-4xl text-foreground">{formatPrice(p)}</div>

              <div className="mt-5 flex items-center gap-3">
                <img src="https://i.pravatar.cc/120?img=12" alt="Agent" className="w-12 h-12 rounded-full" />
                <div>
                  <div className="text-xs text-muted-foreground">Listing Agent</div>
                  <div className="text-sm font-medium">Diane Uwase</div>
                </div>
              </div>

              <div className="mt-6 grid gap-2">
                <a href="tel:+250793300080" className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-5 py-3 rounded-md font-medium text-sm">
                  <Phone className="w-4 h-4" /> Call Agent
                </a>
                <a href="mailto:info@novaworks.rw" className="flex items-center justify-center gap-2 bg-noir-deep text-white px-5 py-3 rounded-md font-medium text-sm hover:bg-noir transition-colors">
                  <Mail className="w-4 h-4" /> Request Viewing
                </a>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button className="flex items-center justify-center gap-2 border border-border rounded-md py-2.5 text-sm hover:border-gold/50">
                    <Heart className="w-4 h-4" /> Save
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-border rounded-md py-2.5 text-sm hover:border-gold/50">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground space-y-1.5">
                <div className="flex justify-between"><span>Reference</span><span className="text-foreground font-medium">NW-{p.id.toUpperCase()}</span></div>
                <div className="flex justify-between"><span>Category</span><span className="text-foreground">{CATEGORY_META[p.category].label}</span></div>
                <div className="flex justify-between"><span>Listing</span><span className="text-foreground capitalize">For {p.listing}</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-foreground capitalize">{p.status}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 bg-muted/40">
          <div className="container-luxe">
            <h2 className="font-display text-3xl mb-8">Similar Properties</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r) => <PropertyCard key={r.id} property={r} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className="w-10 h-10 mx-auto rounded-md bg-gold/10 text-gold flex items-center justify-center">{icon}</div>
      <div className="mt-2 font-display text-2xl text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}