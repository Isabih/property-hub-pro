import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Bed, Bath, Maximize2, Car, MapPin, Crown, Heart, Share2, Phone, Mail, MessageCircle,
  Check, ArrowLeft, Play, Image as ImageIcon, Box, FileText, Lock, Star, Printer,
  Bell, Download, ShoppingBag, Utensils, Hospital, School, Train, Trees, Landmark, ExternalLink,
} from "lucide-react";
import {
  formatPrice, CATEGORY_META, ROOM_META,
  type Property, type RoomCategory, type RoomImage, type NeighborhoodPlace,
} from "@/lib/properties";
import { fetchPropertyForView } from "@/lib/properties-view.functions";
import { PropertyCard } from "@/components/site/PropertyCard";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import { Lightbox } from "@/components/site/Lightbox";
import { LuxuryGate, hasLuxuryAccess } from "@/components/site/LuxuryGate";
import { prefetchImage, prefetchImages } from "@/lib/image-prefetch";

export const Route = createFileRoute("/_site/properties/$slug")({
  loader: async ({ params }) => {
    const property = await fetchPropertyForView({ data: { slug: params.slug } });
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
  const { property: initial } = Route.useLoaderData() as { property: Property & { locked?: boolean } };
  const [p, setP] = useState<Property & { locked?: boolean }>(initial);
  const unlock = useServerFn(fetchPropertyForView);
  // If visitor has a luxury access token, re-fetch the unlocked version server-side.
  useEffect(() => {
    if (!p.luxury || !p.locked) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("nw_luxury_token");
    if (!token) return;
    unlock({ data: { slug: p.slug, luxuryToken: token } })
      .then((fresh) => { if (fresh) setP(fresh); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.slug]);
  const roomGallery: RoomImage[] = p.roomGallery
    ?? (p.gallery?.map((g) => ({ room: "other" as RoomCategory, label: g.label, src: g.src })))
    ?? [{ room: "main", src: p.image }];
  const rooms = Array.from(new Set(roomGallery.map((g) => g.room)));
  const [activeRoom, setActiveRoom] = useState<RoomCategory | "all">("all");
  const [mediaTab, setMediaTab] = useState<"photos" | "video" | "tour" | "floorplan">("photos");
  const [lightbox, setLightbox] = useState<{ images: { src: string; label?: string }[]; idx: number } | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  // Luxury gate: if property is luxury and visitor has no access token, block content
  useEffect(() => {
    if (p.luxury && p.locked && !hasLuxuryAccess()) setGateOpen(true);
    else setGateOpen(false);
  }, [p.luxury, p.locked]);
  const filtered = activeRoom === "all" ? roomGallery : roomGallery.filter((g) => g.room === activeRoom);
  const toLightboxImages = (set: RoomImage[]) =>
    set.map((g) => ({ src: g.src, label: g.label ?? ROOM_META[g.room].label }));
  const openLightbox = (set: RoomImage[], src: string) => {
    const images = toLightboxImages(set);
    const idx = Math.max(0, set.findIndex((g) => g.src === src));
    setLightbox({ images, idx });
  };
  // Warm the cache with the first few images of a given section.
  const warmSection = (room: RoomCategory | "all") => {
    const set = room === "all" ? roomGallery : roomGallery.filter((g) => g.room === room);
    prefetchImages(set.slice(0, 4).map((g) => g.src));
  };
  // When a section is active, also warm the first images of adjacent sections
  // so switching tabs feels instant.
  useEffect(() => {
    if (rooms.length <= 1) return;
    const order: (RoomCategory | "all")[] = ["all", ...rooms];
    const i = order.indexOf(activeRoom);
    if (i === -1) return;
    const prev = order[(i - 1 + order.length) % order.length];
    const next = order[(i + 1) % order.length];
    warmSection(prev);
    warmSection(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom]);
  const related: Property[] = [];
  const heroMain = roomGallery[0];
  const heroSide = roomGallery.slice(1, 5);
  const extraCount = Math.max(0, roomGallery.length - 5);

  return (
    <div className="bg-background">
      {gateOpen && <LuxuryGate slug={p.slug} />}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.idx}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((l) => (l ? { ...l, idx: i } : l))}
        />
      )}
      {/* Hero collage */}
      <section className="bg-noir-deep pt-6">
        <div className="container-luxe">
          <Link to="/properties" className="inline-flex items-center gap-2 text-white/60 hover:text-gold text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to properties
          </Link>

          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => openLightbox(roomGallery, heroMain.src)}
              className="col-span-2 row-span-2 relative group cursor-zoom-in"
            >
              <img src={heroMain.src} alt={heroMain.label ?? ROOM_META[heroMain.room].label} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                {p.luxury && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gold-soft to-gold text-noir-deep text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md">
                    <Crown className="w-3 h-3" /> Luxury
                  </span>
                )}
              </div>
            </button>
            {heroSide.map((g, i) => (
              <button
                type="button"
                key={i}
                onClick={() => openLightbox(roomGallery, g.src)}
                className="relative cursor-zoom-in group"
              >
                <img src={g.src} alt={g.label ?? ROOM_META[g.room].label} className="w-full h-full object-cover" />
                {i === heroSide.length - 1 && extraCount > 0 && (
                  <div className="absolute inset-0 bg-noir-deep/55 flex items-center justify-center text-white">
                    <Maximize2 className="w-5 h-5 mr-1" /> +{extraCount} more
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Title + price band */}
          <div className="relative -mb-12 mt-8">
            <div className="bg-card text-foreground rounded-2xl shadow-2xl p-7 grid lg:grid-cols-[1fr_auto] gap-6 items-start border border-border">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {p.luxury && <Pill icon={<Crown className="w-3 h-3" />} className="bg-gold/15 text-gold">Luxury</Pill>}
                  <Pill className="bg-muted text-foreground">{CATEGORY_META[p.category].label}</Pill>
                  <Pill className="bg-emerald-500/15 text-emerald-600 capitalize">{p.status}</Pill>
                </div>
                <h1 className="font-display text-3xl md:text-4xl">{p.title}</h1>
                <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4 text-gold" /> {p.address}, {p.district}
                </div>
              </div>
              <div className="lg:text-right">
                <div className="font-display text-3xl">{formatPrice(p)}</div>
                <div className="text-xs text-muted-foreground">{p.priceUnit === "month" ? "Monthly" : "Sale Price"}</div>
                <div className="mt-4 flex lg:justify-end gap-2">
                  <IconBtn><Heart className="w-4 h-4" /></IconBtn>
                  <IconBtn><Share2 className="w-4 h-4" /></IconBtn>
                  <IconBtn><Printer className="w-4 h-4" /></IconBtn>
                  <a href={`mailto:${p.agent?.email ?? "info@novaworks.rw"}`} className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep text-sm font-medium px-5 py-2 rounded-md">
                    <Mail className="w-4 h-4" /> Inquire Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-20 pb-8">
        <div className="container-luxe grid lg:grid-cols-[1fr_380px] gap-10">
          {/* MAIN */}
          <div className="space-y-12">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {p.beds != null && <Stat icon={<Bed className="w-5 h-5" />} value={p.beds} label="Bedrooms" />}
              {p.baths != null && <Stat icon={<Bath className="w-5 h-5" />} value={p.baths} label="Bathrooms" />}
              <Stat icon={<Maximize2 className="w-5 h-5" />} value={p.area} label="Sq. Meters" />
              {p.parking != null && p.parking > 0 && <Stat icon={<Car className="w-5 h-5" />} value={p.parking} label="Parking" />}
            </div>

            {/* Media & Tours */}
            <Section title="Media & Tours">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 rounded-xl bg-muted">
                <MediaTab active={mediaTab === "photos"} onClick={() => setMediaTab("photos")} icon={<ImageIcon className="w-4 h-4" />} label="Photos" />
                <MediaTab active={mediaTab === "video"} disabled={!p.videoUrl} onClick={() => setMediaTab("video")} icon={<Play className="w-4 h-4" />} label="Video" />
                <MediaTab active={mediaTab === "tour"} disabled={!p.tourUrl} onClick={() => setMediaTab("tour")} icon={<Box className="w-4 h-4" />} label="3D Tour" />
                <MediaTab active={mediaTab === "floorplan"} disabled={!p.floorPlanUrl} onClick={() => setMediaTab("floorplan")} icon={<FileText className="w-4 h-4" />} label="Floor Plan" />
              </div>

              {mediaTab === "photos" && (
                <>
                  {rooms.length > 1 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <RoomChip active={activeRoom === "all"} onClick={() => setActiveRoom("all")}>All ({roomGallery.length})</RoomChip>
                      {rooms.map((r) => (
                        <RoomChip
                          key={r}
                          active={activeRoom === r}
                          onClick={() => setActiveRoom(r)}
                          onMouseEnter={() => warmSection(r)}
                          onFocus={() => warmSection(r)}
                        >
                          {ROOM_META[r].label} ({roomGallery.filter((g) => g.room === r).length})
                        </RoomChip>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filtered.map((g, i) => (
                      <figure
                        key={i}
                        onClick={() => openLightbox(filtered, g.src)}
                        onMouseEnter={() => {
                          prefetchImage(g.src);
                          // Also warm the next couple of images in this section
                          // so opening the lightbox here is instant.
                          prefetchImages(filtered.slice(i, i + 3).map((x) => x.src));
                        }}
                        onFocus={() => prefetchImage(g.src)}
                        tabIndex={0}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-zoom-in"
                      >
                        <img src={g.src} alt={g.label ?? ROOM_META[g.room].label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <figcaption className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wider text-white bg-noir-deep/70 px-2 py-1 rounded">
                          {ROOM_META[g.room].label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </>
              )}
              {mediaTab === "video" && p.videoUrl && (
                <div className="mt-5">
                  <VideoPlayer url={p.videoUrl} title={p.title} />
                </div>
              )}
              {mediaTab === "tour" && p.tourUrl && (
                <div className="mt-5 aspect-video rounded-xl overflow-hidden bg-noir">
                  <iframe src={p.tourUrl} className="w-full h-full" allowFullScreen title="3D tour" />
                </div>
              )}
              {mediaTab === "floorplan" && (
                <div className="mt-5 rounded-xl border border-border bg-card p-6">
                  {p.floorPlanUrl ? (
                    <>
                      <iframe src={p.floorPlanUrl} className="w-full h-[600px] rounded" title="Floor plan" />
                      <a href={p.floorPlanUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-gold">
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm">Floor plan coming soon.</div>
                  )}
                </div>
              )}
            </Section>

            {/* About */}
            <Section title="About This Property">
              <p className="text-muted-foreground leading-relaxed">{p.description}</p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                This residence has been curated by NOVAWORKS for clients who value discretion, design integrity, and locations that hold long-term value.
              </p>
            </Section>

            {/* Property Details */}
            <Section title="Property Details">
              <div className="grid md:grid-cols-2 gap-x-10 gap-y-1">
                <DetailRow label="Property ID" value={p.reference} />
                <DetailRow label="Category" value={CATEGORY_META[p.category].label} />
                {p.furnishing && <DetailRow label="Furnishing" value={p.furnishing} />}
                {p.yearBuilt && <DetailRow label="Year Built" value={p.yearBuilt} />}
                {p.floor != null && <DetailRow label="Floor" value={p.floor} />}
                {p.facing && <DetailRow label="Facing" value={p.facing} />}
                <DetailRow label="Total Area" value={`${p.area} Sqm`} />
                <DetailRow label="Listing" value={`For ${p.listing === "rent" ? "Rent" : "Sale"}`} />
              </div>
            </Section>

            {/* Amenities */}
            {p.amenities && p.amenities.length > 0 && (
              <Section title="Amenities & Features">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-3 bg-card border border-border p-3 rounded-lg">
                      <span className="w-7 h-7 rounded-md bg-gold/15 text-gold flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </span>
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Neighborhood */}
            {p.neighborhood && p.neighborhood.length > 0 && (
              <Section title="Neighborhood">
                <div className="grid md:grid-cols-2 gap-3">
                  {p.neighborhood.map((n) => <NeighborCard key={n.name} place={n} />)}
                </div>
              </Section>
            )}

            {/* Location map */}
            <Section title="Location">
              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                <div className="aspect-[16/9] relative">
                  <iframe
                    title="Map"
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.lng! - 0.01}%2C${p.lat! - 0.01}%2C${p.lng! + 0.01}%2C${p.lat! + 0.01}&layer=mapnik&marker=${p.lat}%2C${p.lng}`}
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gold" />
                    <div>
                      <div className="font-medium">{p.address}</div>
                      <div className="text-xs text-muted-foreground">{p.location}, {p.district}, Kigali</div>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm bg-noir-deep text-white px-4 py-2 rounded-md hover:bg-noir"
                  >
                    <ExternalLink className="w-4 h-4" /> Open in Google Maps
                  </a>
                </div>
              </div>
            </Section>

            {p.luxury && (
              <div className="flex items-start gap-3 bg-gold/10 border border-gold/30 rounded-xl p-4 text-sm">
                <Lock className="w-4 h-4 text-gold mt-0.5" />
                <div className="flex-1">
                  <div className="text-foreground font-medium">Exclusive Luxury Listing</div>
                  <div className="text-muted-foreground">Full media & pricing require verified-member access.</div>
                </div>
                <Link to="/verify-access" search={{ slug: p.slug }} className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-4 py-2 rounded-md">
                  Request Access
                </Link>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-5 lg:sticky lg:top-28 self-start">
            {p.agent && <AgentCard agent={p.agent} />}
            <ScheduleVisitCard />
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <button className="inline-flex items-center gap-1.5 hover:text-gold"><Download className="w-3.5 h-3.5" /> Brochure</button>
              <button className="inline-flex items-center gap-1.5 hover:text-gold"><Bell className="w-3.5 h-3.5" /> Alerts</button>
              <button className="inline-flex items-center gap-1.5 hover:text-gold"><Printer className="w-3.5 h-3.5" /> Print</button>
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
    <div className="bg-card border border-border rounded-xl p-5 text-center">
      <div className="w-10 h-10 mx-auto rounded-md bg-gold/10 text-gold flex items-center justify-center">{icon}</div>
      <div className="mt-2 font-display text-2xl text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RoomChip({ active, onClick, onMouseEnter, onFocus, children }: { active: boolean; onClick: () => void; onMouseEnter?: () => void; onFocus?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-gold text-noir-deep border-gold"
          : "border-border text-muted-foreground hover:text-foreground hover:border-gold/50"
      }`}
    >
      {children}
    </button>
  );
}

function MediaTab({ active, disabled, onClick, icon, label }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg transition-colors ${
        active
          ? "bg-gradient-to-r from-gold-soft to-gold text-noir-deep shadow"
          : disabled
            ? "text-muted-foreground/50 cursor-not-allowed"
            : "text-foreground hover:bg-background"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-display text-2xl">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-gold/60 to-transparent" />
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Pill({ icon, className = "", children }: { icon?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${className}`}>
      {icon} {children}
    </span>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-gold/50">
      {children}
    </button>
  );
}

const PLACE_ICON: Record<NeighborhoodPlace["type"], React.ReactNode> = {
  shopping: <ShoppingBag className="w-4 h-4" />,
  dining: <Utensils className="w-4 h-4" />,
  hospital: <Hospital className="w-4 h-4" />,
  school: <School className="w-4 h-4" />,
  transit: <Train className="w-4 h-4" />,
  park: <Trees className="w-4 h-4" />,
  landmark: <Landmark className="w-4 h-4" />,
};

function NeighborCard({ place }: { place: NeighborhoodPlace }) {
  return (
    <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
      <div className="w-10 h-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
        {PLACE_ICON[place.type]}
      </div>
      <div className="min-w-0">
        <div className="font-medium text-sm">{place.name}</div>
        <div className="text-xs text-gold mt-0.5">{place.distance}</div>
        {place.note && <div className="text-xs text-muted-foreground mt-0.5">{place.note}</div>}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: NonNullable<Property["agent"]> }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <img src={agent.avatar} alt={agent.name} className="w-14 h-14 rounded-full object-cover" />
        <div>
          <div className="font-medium">{agent.name}</div>
          <div className="text-xs text-muted-foreground">{agent.title}</div>
          {agent.rating && (
            <div className="flex items-center gap-1 mt-0.5 text-xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(agent.rating!) ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
              ))}
              <span className="text-muted-foreground ml-1">({agent.reviews} reviews)</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        <a href={`tel:${agent.phone}`} className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-4 py-2.5 rounded-md text-sm font-medium">
          <Phone className="w-4 h-4" /> Call Now
        </a>
        {agent.whatsapp && (
          <a href={`https://wa.me/${agent.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 rounded-md text-sm font-medium hover:border-gold/60">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        )}
        <a href={`mailto:${agent.email}`} className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 rounded-md text-sm font-medium hover:border-gold/60">
          <Mail className="w-4 h-4" /> Send Email
        </a>
      </div>
    </div>
  );
}

function ScheduleVisitCard() {
  const [sent, setSent] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="font-display text-xl mb-4">Schedule a Visit</h3>
      {sent ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          <Check className="w-6 h-6 text-gold mx-auto" />
          <div className="mt-2">Request sent — our team will confirm your viewing shortly.</div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-3">
          <Field label="Full Name"><input required className="input-luxe" placeholder="Your name" /></Field>
          <Field label="Email"><input required type="email" className="input-luxe" placeholder="your@email.com" /></Field>
          <Field label="Phone Number"><input required className="input-luxe" placeholder="+250 7XX XXX XXX" /></Field>
          <Field label="Preferred Date"><input required type="date" className="input-luxe" /></Field>
          <Field label="Message (Optional)">
            <textarea rows={3} className="input-luxe" placeholder="Tell us about your requirements…" />
          </Field>
          <button className="w-full bg-gradient-to-r from-gold-soft to-gold text-noir-deep font-medium py-2.5 rounded-md">
            Request Visit
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}