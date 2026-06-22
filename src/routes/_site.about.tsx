import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Users, Building2, Sparkles, ArrowRight, Quote } from "lucide-react";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "Who We Are — NOVAWORKS Real Estate Rwanda" },
      { name: "description", content: "NOVAWORKS is Rwanda's leading luxury real estate company — 15+ years curating exceptional properties, with a discreet, design-first approach." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="relative bg-noir-deep text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container-luxe relative max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Who We Are</div>
          <h1 className="mt-4 font-display text-5xl md:text-7xl">A discreet atelier for prime property.</h1>
          <p className="mt-6 text-white/70 text-lg">
            NOVAWORKS is a Rwanda-rooted luxury real estate company. We curate, broker and manage exceptional properties for individuals, families and institutions who value design, discretion and durable value.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-luxe grid lg:grid-cols-2 gap-16 items-center">
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80" className="rounded-2xl aspect-[4/3] object-cover" alt="NOVAWORKS team" />
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Our Story</div>
            <h2 className="mt-3 font-display text-4xl text-foreground">Built on trust. Refined by craft.</h2>
            <p className="mt-4 text-muted-foreground">
              Founded in 2010, NOVAWORKS started with a single brief: find a private buyer a residence that didn't exist on any portal. Fifteen years later, off-market sourcing, white-glove management and patient capital advice remain the heart of what we do.
            </p>
            <p className="mt-3 text-muted-foreground">
              We work with a curated network of architects, lenders and legal partners — so our clients move through every transaction with clarity and confidence.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div><div className="font-display text-3xl text-gold">15+</div><div className="text-xs text-muted-foreground">Years</div></div>
              <div><div className="font-display text-3xl text-gold">500+</div><div className="text-xs text-muted-foreground">Properties</div></div>
              <div><div className="font-display text-3xl text-gold">98%</div><div className="text-xs text-muted-foreground">Retention</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="container-luxe">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Our Values</div>
            <h2 className="mt-3 font-display text-4xl">What guides every transaction.</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { i: Award, t: "Excellence", d: "Uncompromising standards on every listing, every meeting, every detail." },
              { i: Users, t: "Discretion", d: "Confidentiality is the default for clients and properties alike." },
              { i: Building2, t: "Stewardship", d: "We care for assets as if they were our own — long term." },
              { i: Sparkles, t: "Design", d: "Architecture and aesthetics inform every recommendation." },
            ].map((v) => (
              <div key={v.t} className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                  <v.i className="w-6 h-6" />
                </div>
                <div className="mt-4 font-display text-xl">{v.t}</div>
                <div className="mt-2 text-sm text-muted-foreground">{v.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-luxe max-w-3xl text-center">
          <Quote className="w-10 h-10 text-gold mx-auto" />
          <p className="mt-6 font-display text-3xl md:text-4xl italic">"Real estate isn't about transactions — it's about the lives that unfold inside the walls."</p>
          <div className="mt-6 text-sm text-muted-foreground">NOVAWORKS Founding Principle</div>
          <Link to="/contact" className="mt-10 inline-flex items-center gap-2 bg-noir-deep text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-noir transition-colors">
            Speak with our team <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}