import { Link } from "@tanstack/react-router";
import { Bed, Bath, Maximize2, MapPin, Heart, ArrowUpRight, Crown } from "lucide-react";
import { type Property, formatPrice, CATEGORY_META } from "@/lib/properties";
import { ProgressiveImage } from "@/components/site/ProgressiveImage";

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-600",
  sold: "bg-red-500/15 text-red-600",
  rented: "bg-blue-500/15 text-blue-600",
  maintenance: "bg-amber-500/15 text-amber-700",
};

export function PropertyCard({ property: p }: { property: Property }) {
  return (
    <Link
      to="/properties/$slug"
      params={{ slug: p.slug }}
      className="cinematic-surface group relative block min-h-[440px] overflow-hidden rounded-2xl border-white/15 bg-noir-deep shadow-2xl hover:-translate-y-1 hover:border-gold/60 transition-all duration-500"
    >
      <div className="absolute inset-0 overflow-hidden">
        <ProgressiveImage
          src={p.image}
          alt={p.title}
          width={800}
          height={600}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          widths={[400, 600, 800, 1200]}
          containerClassName="absolute inset-0"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {p.luxury && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gold-soft to-gold text-noir-deep text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md">
              <Crown className="w-3 h-3" /> Luxury
            </span>
          )}
          {p.featured && (
            <span className="glass-dark text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md">
              Featured
            </span>
          )}
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${STATUS_STYLES[p.status]}`}>
            {p.status}
          </span>
        </div>
        <button
          aria-label="Save"
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <Heart className="w-4 h-4 text-white" />
        </button>
        <div className="absolute top-14 left-3 glass-dark px-3 py-1.5 rounded-md text-xs font-medium text-white/80 backdrop-blur-xl">
          {CATEGORY_META[p.category].label} · For {p.listing === "rent" ? "Rent" : "Sale"}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 pt-32 bg-gradient-to-t from-noir-deep via-noir-deep/90 to-transparent text-white backdrop-blur-[2px]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl text-white leading-snug group-hover:text-gold transition-colors">
            {p.title}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0 mt-1" />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/60">
          <MapPin className="w-3 h-3 text-gold" />
          {p.location}, {p.district}
        </div>
        <div className="mt-3 font-display text-2xl text-white">{formatPrice(p)}</div>
        <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/65">
          <div className="flex items-center gap-3">
            {p.beds != null && (
              <span className="flex items-center gap-1.5"><Bed className="w-3.5 h-3.5 text-gold" /> {p.beds} Beds</span>
            )}
            {p.baths != null && (
              <span className="flex items-center gap-1.5"><Bath className="w-3.5 h-3.5 text-gold" /> {p.baths} Baths</span>
            )}
          </div>
          <span className="flex items-center gap-1.5"><Maximize2 className="w-3.5 h-3.5 text-gold" /> {p.area} m²</span>
        </div>
      </div>
    </Link>
  );
}