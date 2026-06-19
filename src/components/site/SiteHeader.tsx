import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search, Phone, ChevronDown, Home, Building2, Castle, Building, Briefcase, MapPin, Square, Store } from "lucide-react";
import logo from "@/assets/novaworks-logo.png";
import { CATEGORY_META, type PropertyCategory } from "@/lib/properties";

const PROPERTY_ICONS: Record<PropertyCategory, any> = {
  apartment: Building2,
  "luxury-apartment": Castle,
  villa: Home,
  building: Building,
  office: Briefcase,
  land: MapPin,
  studio: Square,
  commercial: Store,
};

const MAIN_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/investors", label: "Investors" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-noir-deep/95 backdrop-blur-md border-b border-white/5">
      <div className="container-luxe flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="NOVAWORKS" className="h-12 w-12 rounded-md object-cover ring-1 ring-white/10" />
          <div className="leading-tight">
            <div className="font-display text-xl tracking-wide text-white">NOVAWORKS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Digital Real Estate</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm text-white/80">
          <Link to="/" className="hover:text-gold transition-colors [&.active]:text-gold">Home</Link>
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-gold transition-colors">
              Properties <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {megaOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-[720px] animate-nova-fade-up">
                <div className="bg-noir border border-white/10 rounded-2xl p-6 grid grid-cols-2 gap-2 shadow-2xl">
                  {(Object.keys(CATEGORY_META) as PropertyCategory[]).map((cat) => {
                    const Icon = PROPERTY_ICONS[cat];
                    return (
                      <Link
                        key={cat}
                        to="/properties"
                        search={{ category: cat }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-md bg-gold/15 text-gold flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-noir-deep transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{CATEGORY_META[cat].plural}</div>
                          <div className="text-xs text-white/50">{CATEGORY_META[cat].description}</div>
                        </div>
                      </Link>
                    );
                  })}
                  <div className="col-span-2 mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
                    <Link to="/properties" className="text-gold text-sm hover:underline">View all properties →</Link>
                    <Link to="/list-property" className="text-white/70 text-sm hover:text-gold">List your property</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          {MAIN_LINKS.slice(1).map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-gold transition-colors [&.active]:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:+250793300080"
            className="hidden xl:flex items-center gap-2 text-xs text-white/60 hover:text-gold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            +250 793 300 080
          </a>
          <button className="text-white/70 hover:text-gold p-2" aria-label="Search">
            <Search className="w-4 h-4" />
          </button>
          <Link
            to="/list-property"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-5 py-2.5 rounded-md font-medium text-sm hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            <Home className="w-4 h-4" /> List Property
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-white p-2"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-noir-deep">
          <div className="container-luxe py-4 flex flex-col gap-1">
            {MAIN_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-gold py-2 text-sm"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-white/10">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Properties</div>
              {(Object.keys(CATEGORY_META) as PropertyCategory[]).map((cat) => (
                <Link
                  key={cat}
                  to="/properties"
                  search={{ category: cat }}
                  onClick={() => setOpen(false)}
                  className="block text-white/70 hover:text-gold py-1.5 text-sm"
                >
                  {CATEGORY_META[cat].plural}
                </Link>
              ))}
            </div>
            <Link
              to="/list-property"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-5 py-3 rounded-md font-medium text-sm"
            >
              List Property
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}