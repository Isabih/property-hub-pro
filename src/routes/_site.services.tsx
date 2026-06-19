import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Key, TrendingUp, Building2, Sparkles, ShieldCheck, FileText, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_site/services")({
  head: () => ({
    meta: [
      { title: "Services — NOVAWORKS Real Estate" },
      { name: "description", content: "Property sales, rentals, management, valuation, investment advisory and concierge services across Rwanda." },
    ],
  }),
  component: ServicesPage,
});

const SERVICES = [
  { i: Home, t: "Property Sales", d: "Buy or sell properties with expert guidance, marketing reach, and proven market intel." },
  { i: Key, t: "Property Rentals", d: "Find your perfect rental or list your property to vetted, qualified tenants." },
  { i: TrendingUp, t: "Investment Advisory", d: "Strategic guidance for maximum returns across residential and commercial portfolios." },
  { i: Building2, t: "Property Management", d: "Full-service management for absentee and institutional owners — tenants, maintenance, reporting." },
  { i: Sparkles, t: "Luxury Sourcing", d: "Off-market access to Rwanda's most exclusive estates and penthouses." },
  { i: ShieldCheck, t: "Property Valuation", d: "Certified valuations for sale, mortgage, insurance and corporate transactions." },
  { i: FileText, t: "Legal & Contracts", d: "Lease, sale and corporate leasing contracts handled end-to-end with vetted partners." },
  { i: Users, t: "Corporate Leasing", d: "Bespoke housing solutions for executives, embassies and multinational teams." },
];

function ServicesPage() {
  return (
    <div>
      <section className="bg-noir-deep text-white py-24">
        <div className="container-luxe text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">What We Offer</div>
          <h1 className="mt-4 font-display text-5xl md:text-6xl">Our Services</h1>
          <p className="mt-4 text-white/60">Comprehensive real estate services to guide you through every step of your property journey.</p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container-luxe">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { n: "500+", l: "Properties Listed" },
              { n: "2,000+", l: "Happy Clients" },
              { n: "15+", l: "Years Experience" },
              { n: "50+", l: "Locations" },
            ].map((s) => (
              <div key={s.l} className="text-center bg-card border border-border rounded-xl p-6">
                <div className="font-display text-4xl text-foreground">{s.n}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.t} className="bg-card border border-border rounded-xl p-7 hover:border-gold/50 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-lg bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-noir-deep transition-colors">
                  <s.i className="w-6 h-6" />
                </div>
                <div className="mt-5 font-display text-2xl text-foreground">{s.t}</div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</div>
                <Link to="/contact" className="mt-5 inline-flex items-center gap-1.5 text-gold text-sm font-medium hover:gap-2 transition-all">
                  Learn More <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}