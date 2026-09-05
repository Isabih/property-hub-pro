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
      {/* Cinematic hero */}
      <section className="relative">
        <div className="relative h-[68vh] min-h-[460px] w-full overflow-hidden">
          <img
            src={heroMain.src}
            alt={heroMain.label ?? ROOM_META[heroMain.room].label}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-noir-deep/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-deep via-noir-deep/25 to-noir-deep/60" />

          <div className="relative h-full container-luxe flex flex-col justify-between py-7">
            <div className="flex items-start justify-between gap-4">
              <Link to="/properties" className="inline-flex items-center gap-2 glass-dark text-white/85 hover:text-gold text-sm px-4 py-2 rounded-full">
                <ArrowLeft className="w-4 h-4" /> Back to properties
              </Link>
              <div className="flex gap-2">
                <GlassIconBtn label="Save"><Heart className="w-4 h-4" /></GlassIconBtn>
                <GlassIconBtn label="Share"><Share2 className="w-4 h-4" /></GlassIconBtn>
                <GlassIconBtn label="Print"><Printer className="w-4 h-4" /></GlassIconBtn>
              </div>
            </div>

            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {p.luxury && (
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gold-soft to-gold text-noir-deep text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                    <Crown className="w-3 h-3" /> Luxury
                  </span>
                )}
                <span className="glass-dark text-white/85 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                  {CATEGORY_META[p.category].label}
                </span>
                <span className="glass-dark text-white/85 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full capitalize">
                  {p.status}
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-6xl text-white leading-[1.05]">{p.title}</h1>
              <div className="mt-3 flex items-center gap-1.5 text-white/70 text-sm">
                <MapPin className="w-4 h-4 text-gold" /> {p.address ?? p.location}, {p.district}
              </div>
            </div>

            {/* Floating glass bar */}
            <div className="glass-dark rounded-2xl px-6 py-5 flex flex-wrap items-center gap-6 justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/55">
                  {p.priceUnit === "month" ? "Monthly rent" : "Sale price"}
                </div>
                <div className="font-display text-3xl text-white">{formatPrice(p)}</div>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-white/80 text-sm">
                {p.beds != null && <HeroFact icon={<Bed className="w-4 h-4" />} value={`${p.beds} Beds`} />}
                {p.baths != null && <HeroFact icon={<Bath className="w-4 h-4" />} value={`${p.baths} Baths`} />}
                <HeroFact icon={<Maximize2 className="w-4 h-4" />} value={`${p.area} m²`} />
                {p.parking != null && p.parking > 0 && <HeroFact icon={<Car className="w-4 h-4" />} value={`${p.parking} Parking`} />}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openLightbox(roomGallery, heroMain.src)}
                  className="inline-flex items-center gap-2 glass text-white text-sm px-4 py-2.5 rounded-full hover:text-gold"
                >
                  <ImageIcon className="w-4 h-4" /> View all {roomGallery.length} photos
                </button>
                <a
                  href={`mailto:${p.agent?.email ?? "info@novaworks.rw"}`}
                  className="btn-luxury inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep text-sm font-medium px-5 py-2.5 rounded-full"
                >
                  <Mail className="w-4 h-4" /> Inquire Now
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {heroSide.length > 0 && (
          <div className="container-luxe -mt-8 relative z-10">
            <div className="glass-panel rounded-2xl p-2 grid grid-cols-4 gap-2">
              {heroSide.map((g, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => openLightbox(roomGallery, g.src)}
                  onMouseEnter={() => prefetchImage(g.src)}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-zoom-in group"
                >
                  <img src={g.src} alt={g.label ?? ROOM_META[g.room].label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {i === heroSide.length - 1 && extraCount > 0 && (
                    <div className="absolute inset-0 bg-noir-deep/60 flex items-center justify-center text-white text-sm">
                      <Maximize2 className="w-4 h-4 mr-1.5" /> +{extraCount} more
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>


      <section className="pt-14 pb-8">
        <div className="container-luxe grid lg:grid-cols-[1fr_380px] gap-10">
          {/* MAIN */}
          <div className="space-y-12">
            {/* Media & Tours */}
            <Section title="Media & Tours">
              <div className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-full glass-panel">
                <MediaTab active={mediaTab === "photos"} onClick={() => setMediaTab("photos")} icon={<ImageIcon className="w-4 h-4" />} label="Photos" />
                <MediaTab active={mediaTab === "video"} onClick={() => setMediaTab("video")} icon={<Play className="w-4 h-4" />} label="Video" />
                <MediaTab active={mediaTab === "tour"} onClick={() => setMediaTab("tour")} icon={<Box className="w-4 h-4" />} label="3D Tour" />
                <MediaTab active={mediaTab === "floorplan"} onClick={() => setMediaTab("floorplan")} icon={<FileText className="w-4 h-4" />} label="Floor Plan" />
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
              {mediaTab === "video" && (
                <div className="mt-5">
                  {p.videoUrl ? (
                    <VideoPlayer url={p.videoUrl} title={p.title} />
                  ) : (
                    <MediaEmpty icon={<Play className="w-5 h-5" />} title="Video walkthrough coming soon" hint="The agent hasn’t uploaded a video tour for this property yet." />
                  )}
                </div>
              )}
              {mediaTab === "tour" && (
                <div className="mt-5">
                  {p.tourUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-noir">
                      <iframe src={p.tourUrl} className="w-full h-full" allowFullScreen title="3D tour" />
                    </div>
                  ) : (
                    <MediaEmpty icon={<Box className="w-5 h-5" />} title="3D tour coming soon" hint="A virtual walkthrough will be published here once it’s ready." />
                  )}
                </div>
              )}
              {mediaTab === "floorplan" && (
                <div className="mt-5 rounded-xl glass-panel p-6">
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
                    <div key={a} className="flex items-center gap-3 glass-panel p-3 rounded-lg">
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
          <aside className="space-y-5 lg:sticky lg:top-24 self-start">
            <BookingCard p={p} />
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

function HeroFact({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-gold">{icon}</span> {value}
    </span>
  );
}

function GlassIconBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="glass-dark w-10 h-10 inline-flex items-center justify-center rounded-full text-white/85 hover:text-gold transition-colors"
    >
      {children}
    </button>
  );
}

function BookingCard({ p }: { p: Property }) {
  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {p.priceUnit === "month" ? "From / month" : "Sale price"}
          </div>
          <div className="font-display text-3xl text-foreground">{formatPrice(p)}</div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider bg-gold/15 text-gold px-2.5 py-1 rounded-full capitalize">
          {p.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {p.beds != null && <MiniFact icon={<Bed className="w-4 h-4" />} value={p.beds} label="Beds" />}
        {p.baths != null && <MiniFact icon={<Bath className="w-4 h-4" />} value={p.baths} label="Baths" />}
        <MiniFact icon={<Maximize2 className="w-4 h-4" />} value={p.area} label="m²" />
      </div>

      <div className="mt-5 grid gap-2">
        <Link
          to="/contact"
          className="btn-luxury flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep font-medium py-3 rounded-full text-sm"
        >
          Book a viewing
        </Link>
        <a
          href={`mailto:${p.agent?.email ?? "info@novaworks.rw"}`}
          className="glass-field flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium hover:text-gold transition-colors"
        >
          <Mail className="w-4 h-4" /> Ask a question
        </a>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <Check className="w-3.5 h-3.5 text-gold" /> Verified NOVAWORKS listing
      </div>
    </div>
  );
}

function MiniFact({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="glass-field rounded-2xl py-3">
      <div className="text-gold flex justify-center">{icon}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
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
      className={`inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 rounded-full transition-all ${
        active
          ? "bg-gradient-to-r from-gold-soft to-gold text-noir-deep shadow-lg"
          : disabled
            ? "text-muted-foreground/50 cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function MediaEmpty({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 text-gold flex items-center justify-center">{icon}</div>
      <div className="mt-3 font-medium">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
    </div>
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
    <div className="flex items-start gap-3 glass-panel rounded-xl p-4">
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
    <div className="glass-panel rounded-2xl p-6">
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
    <div className="glass-panel rounded-2xl p-6">
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