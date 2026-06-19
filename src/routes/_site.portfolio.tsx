import { createFileRoute } from "@tanstack/react-router";
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