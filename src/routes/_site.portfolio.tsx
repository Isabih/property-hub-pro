import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Film, ArrowRight } from "lucide-react";
import { properties } from "@/lib/properties";
import { PropertyCard } from "@/components/site/PropertyCard";

export const Route = createFileRoute("/_site/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — NOVAWORKS Featured Projects" },
      { name: "description", content: "A selection of properties NOVAWORKS has marketed, sold and managed across Rwanda." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <div>
      <section className="bg-noir-deep text-white py-20">
        <div className="container-luxe max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Portfolio</div>
          <h1 className="mt-4 font-display text-5xl md:text-6xl">Selected work.</h1>
          <p className="mt-4 text-white/60">A curated look at residences and assets NOVAWORKS has marketed and managed.</p>
          <Link
            to="/portfolio/videos"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-to-r from-gold-soft to-gold text-noir-deep text-sm font-medium hover:brightness-110"
          >
            <Film className="w-4 h-4" /> Watch building videos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="container-luxe grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </section>
    </div>
  );
}