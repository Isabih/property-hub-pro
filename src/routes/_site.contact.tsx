import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Clock, Send, Quote } from "lucide-react";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "Contact NOVAWORKS — Speak With Our Team" },
      { name: "description", content: "Get in touch with NOVAWORKS Real Estate. Our team is available to discuss listings, valuations and bespoke property requirements." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div>
      <section className="bg-noir-deep text-white py-20">
        <div className="container-luxe max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Get In Touch</div>
          <h1 className="mt-4 font-display text-5xl md:text-6xl">Let's start a conversation.</h1>
          <p className="mt-4 text-white/60 max-w-xl">Whether you're searching for a home, listing a property or exploring investment, our team responds within 24 hours.</p>
        </div>
      </section>

      {/* CEO + Team */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container-luxe">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Meet The Team</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground">The people behind NOVAWORKS</h2>
            <p className="mt-3 text-muted-foreground">A small team obsessed with delivering Rwanda's finest real estate experience.</p>
          </div>

          {/* CEO card */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold via-gold-soft to-gold rounded-2xl opacity-60 blur-sm group-hover:opacity-90 transition-opacity" />
              <div className="relative grid md:grid-cols-[280px_1fr] gap-8 bg-card border border-gold/30 rounded-2xl p-8 shadow-2xl">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-gold/40 to-transparent" />
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=85"
                    alt="CEO"
                    className="relative w-full aspect-square rounded-xl object-cover ring-2 ring-gold/50"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-xs uppercase tracking-[0.2em] text-gold">Chief Executive Officer</div>
                  <div className="mt-2 font-display text-3xl text-foreground">Jean-Paul Habimana</div>
                  <Quote className="w-8 h-8 text-gold/60 mt-5" />
                  <blockquote className="mt-2 font-display italic text-xl text-foreground leading-relaxed">
                    "We don't just sell properties — we build the future of how Rwandans live, invest and call a place home."
                  </blockquote>
                  <div className="mt-5 text-sm text-muted-foreground">Leading NOVAWORKS since 2014</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team grid */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Aline Mukamana",
                role: "Head of Sales",
                img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=85",
              },
              {
                name: "Eric Niyonzima",
                role: "Property Manager",
                img: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=85",
              },
              {
                name: "Sandrine Uwase",
                role: "Client Relations",
                img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=85",
              },
            ].map((m) => (
              <div key={m.name} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-gold/50 to-transparent rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-card border border-gold/20 rounded-2xl p-6 text-center">
                  <div className="mx-auto w-32 h-32 rounded-full overflow-hidden ring-2 ring-gold/40 ring-offset-4 ring-offset-card">
                    <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-5 font-display text-xl text-foreground">{m.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-gold">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-luxe grid lg:grid-cols-[1fr_1.2fr] gap-12">
          <div className="space-y-4">
            {[
              { i: Phone, t: "Call us", v: "+250 793 300 080", s: "Mon – Sat, 8am – 6pm" },
              { i: Mail, t: "Email us", v: "info@novaworks.rw", s: "Replies within 24 hours" },
              { i: MapPin, t: "Visit us", v: "Kigali Heights, KG 7 Ave", s: "Kimihurura, Kigali, Rwanda" },
              { i: Clock, t: "Office hours", v: "Mon – Sat", s: "8:00am – 6:00pm" },
            ].map((c) => (
              <div key={c.t} className="flex gap-4 p-5 bg-card border border-border rounded-xl">
                <div className="w-11 h-11 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                  <c.i className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{c.t}</div>
                  <div className="font-medium text-foreground">{c.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.s}</div>
                </div>
              </div>
            ))}
          </div>

          <form className="bg-card border border-border rounded-2xl p-8">
            <div className="font-display text-2xl mb-6">Send us a message</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="First name" placeholder="John" />
              <Input label="Last name" placeholder="Doe" />
              <Input label="Email" placeholder="you@example.com" type="email" />
              <Input label="Phone" placeholder="+250 …" type="tel" />
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Interest</label>
              <select className="bg-muted rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/30">
                <option>Buy a property</option><option>Rent a property</option><option>List my property</option>
                <option>Investment advisory</option><option>Property management</option><option>Other</option>
              </select>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Message</label>
              <textarea rows={5} className="bg-muted rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/30" placeholder="Tell us a little about what you're looking for..." />
            </div>
            <button type="submit" className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-6 py-3.5 rounded-md font-medium">
              <Send className="w-4 h-4" /> Send message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Input({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input {...rest} className="bg-muted rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/30" />
    </div>
  );
}