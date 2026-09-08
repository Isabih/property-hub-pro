import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, X, Crown, Building2, Castle, Home, Building, Briefcase, MapPin, Square, Store } from "lucide-react";
import { CATEGORY_META, type Property, type PropertyCategory } from "@/lib/properties";
import { fetchActiveProperties } from "@/lib/properties-public";
import { PropertyCard } from "@/components/site/PropertyCard";

type PropSearch = { category?: PropertyCategory; listing?: "sale" | "rent"; status?: "available" | "sold" };

export const Route = createFileRoute("/_site/properties/")({
  validateSearch: (s: Record<string, unknown>): PropSearch => ({
    category: (s.category as PropertyCategory) || undefined,
    listing: s.listing === "sale" || s.listing === "rent" ? s.listing : undefined,
    status: s.status === "available" || s.status === "sold" ? s.status : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse Properties — NOVAWORKS" },
      { name: "description", content: "Browse premium apartments, villas, offices, lands and luxury residences across Rwanda." },
    ],
  }),
  component: PropertiesPage,
});

const CAT_ICONS: Record<PropertyCategory, any> = {
  apartment: Building2, "luxury-apartment": Castle, villa: Home, building: Building,
  office: Briefcase, land: MapPin, studio: Square, commercial: Store,
};

function PropertiesPage() {
  const { category, listing, status } = Route.useSearch() as PropSearch;
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dbProps, setDbProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveProperties().then((rows) => { setDbProps(rows); setLoading(false); });
  }, []);

  const filtered = dbProps.filter((p) => {
    if (category && p.category !== category) return false;
    if (listing && p.listing !== listing) return false;
    if (status && p.status !== status) return false;
    if (query && !`${p.title} ${p.location}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const headerMeta = category ? CATEGORY_META[category as PropertyCategory] : { plural: "All Properties", description: "Discover the full NOVAWORKS portfolio" };

  return (
    <div>
      {/* Page hero */}
      <section className="bg-noir-deep text-white pt-20 pb-28 relative overflow-hidden">
        {dbProps[0]?.image && (
          <img src={dbProps[0].image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-noir-deep via-noir-deep/90 to-noir-deep/60" />
        <div className="container-luxe relative">
          <div className="text-xs text-white/50 mb-6">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/properties" className="hover:text-gold">Properties</Link>
            {category && (<><span className="mx-2">/</span><span className="text-white">{CATEGORY_META[category].plural}</span></>)}
          </div>
          <div className="flex items-start gap-5">
            <div className="glass w-16 h-16 rounded-xl text-gold flex items-center justify-center">
              {category ? (() => { const I = CAT_ICONS[category as PropertyCategory]; return <I className="w-7 h-7" />; })() : <Crown className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="font-display text-5xl md:text-6xl">{headerMeta.plural}</h1>
              <p className="mt-2 text-white/60">{headerMeta.description}</p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            <CatChip active={!category} onClick={() => navigate({ search: {} as PropSearch })} label="All Properties" />
            {(Object.keys(CATEGORY_META) as PropertyCategory[]).map((c) => {
              const I = CAT_ICONS[c];
              return (
                <CatChip
                  key={c}
                  active={category === c}
                  onClick={() => navigate({ search: (prev: PropSearch) => ({ ...prev, category: c }) })}
                  label={CATEGORY_META[c].plural}
                  icon={<I className="w-3.5 h-3.5" />}
                />
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <CatChip active={!listing && !status} onClick={() => navigate({ search: (p: PropSearch) => ({ ...p, listing: undefined, status: undefined }) })} label="Any status" />
            <CatChip active={listing === "sale"} onClick={() => navigate({ search: (p: PropSearch) => ({ ...p, listing: "sale", status: undefined }) })} label="For Sale" />
            <CatChip active={listing === "rent"} onClick={() => navigate({ search: (p: PropSearch) => ({ ...p, listing: "rent", status: undefined }) })} label="For Rent" />
            <CatChip active={status === "sold"} onClick={() => navigate({ search: (p: PropSearch) => ({ ...p, status: "sold", listing: undefined }) })} label="Sold" />
          </div>
        </div>
      </section>

      {/* Search/filter bar */}
      <section className="relative -mt-16 z-30 pb-4">
        <div className="container-luxe">
          <div className="cinematic-surface rounded-2xl p-4 flex items-center gap-3 flex-wrap text-white">
          <div className="cinematic-field flex-1 flex items-center gap-2 rounded-md px-4 py-2.5 min-w-[260px]">
            <Search className="w-4 h-4 text-gold" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, location..."
              className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-white/40"
            />
          </div>
          <button className="cinematic-field inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm hover:border-gold">
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {category && <span className="bg-gold text-noir-deep text-xs font-semibold px-1.5 rounded">1</span>}
          </button>
          <select className="cinematic-field rounded-md px-3 py-2.5 text-sm">
            <option>Newest First</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
          <div className="cinematic-field flex rounded-md overflow-hidden">
            <button onClick={() => setView("grid")} aria-label="Grid view" className={`p-2.5 ${view === "grid" ? "bg-gold text-noir-deep" : "text-white/60"}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView("list")} aria-label="List view" className={`p-2.5 ${view === "list" ? "bg-gold text-noir-deep" : "text-white/60"}`}><List className="w-4 h-4" /></button>
          </div>
          </div>
        </div>
        {category && (
          <div className="container-luxe pt-4 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Active filters:</span>
            <button
              onClick={() => navigate({ search: {} })}
              className="inline-flex items-center gap-2 bg-muted rounded-full px-3 py-1 text-xs hover:bg-gold/20"
            >
              {CATEGORY_META[category as PropertyCategory].plural} <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </section>

      <section className="py-12 bg-gradient-to-b from-background via-muted/25 to-background">
        <div className="container-luxe">
          <div className="text-sm text-muted-foreground mb-6">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> properties
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Crown className="w-12 h-12 mx-auto text-gold/40" />
              <p className="mt-4">No properties match your filters yet.</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CatChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-colors ${
        active ? "bg-gold text-noir-deep font-medium" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
      }`}
    >
      {icon} {label}
    </button>
  );
}