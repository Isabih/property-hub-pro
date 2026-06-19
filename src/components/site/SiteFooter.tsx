import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import logo from "@/assets/novaworks-logo.png";

export function SiteFooter() {
  return (
    <>
      {/* CTA strip */}
      <section className="bg-gradient-to-br from-gold-soft via-gold to-gold-soft py-20">
        <div className="container-luxe grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-noir-deep leading-tight">
              Ready to Find Your<br />Dream Property?
            </h2>
            <p className="mt-4 text-noir-deep/80 max-w-md">
              Let our expert team help you navigate the real estate market. Whether you're buying, selling, or investing — we're here to guide you every step of the way.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-xl">
              <a href="tel:+250793300080" className="flex items-center gap-3 bg-white/80 hover:bg-white p-4 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-md bg-noir-deep/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-noir-deep" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-noir-deep/60">Call Us</div>
                  <div className="text-sm font-medium text-noir-deep">+250 793 300 080</div>
                </div>
              </a>
              <a href="mailto:info@novaworks.rw" className="flex items-center gap-3 bg-white/80 hover:bg-white p-4 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-md bg-noir-deep/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-noir-deep" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-noir-deep/60">Email Us</div>
                  <div className="text-sm font-medium text-noir-deep">info@novaworks.rw</div>
                </div>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 bg-noir-deep text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-noir transition-colors">
                Contact Us Today <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/list-property" className="inline-flex items-center gap-2 bg-white text-noir-deep px-6 py-3 rounded-md text-sm font-medium hover:bg-white/90 transition-colors">
                List Your Property
              </Link>
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur p-8 rounded-2xl border border-white/50">
            <h3 className="font-display text-2xl text-noir-deep">Stay Updated</h3>
            <p className="text-sm text-noir-deep/70 mt-1">
              Subscribe to our newsletter and be the first to know about new properties, investment opportunities, and market insights.
            </p>
            <form className="mt-5 grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="bg-white/70 rounded-md px-4 py-3 text-sm placeholder:text-noir-deep/40 outline-none focus:ring-2 focus:ring-noir-deep/20" placeholder="First Name" />
                <input className="bg-white/70 rounded-md px-4 py-3 text-sm placeholder:text-noir-deep/40 outline-none focus:ring-2 focus:ring-noir-deep/20" placeholder="Last Name" />
              </div>
              <input type="email" className="bg-white/70 rounded-md px-4 py-3 text-sm placeholder:text-noir-deep/40 outline-none focus:ring-2 focus:ring-noir-deep/20" placeholder="Email Address" />
              <button type="submit" className="bg-noir-deep text-white rounded-md px-6 py-3 text-sm font-medium hover:bg-noir transition-colors flex items-center justify-center gap-2">
                Subscribe Now <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-center text-noir-deep/60">By subscribing, you agree to our <a className="underline">Privacy Policy</a></p>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-noir-deep text-white/80 pt-16 pb-8">
        <div className="container-luxe grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img src={logo} alt="NOVAWORKS" className="h-12 w-12 rounded-md object-cover" />
              <div>
                <div className="font-display text-xl text-white">NOVAWORKS</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Where Prime Property Meets Peace of Mind</div>
              </div>
            </div>
            <p className="mt-5 text-sm text-white/60 max-w-sm">
              Discover exceptional properties with NOVAWORKS. We specialise in luxury apartments, premium villas, commercial spaces, and investment opportunities in prime locations across Rwanda.
            </p>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Subscribe to our newsletter</div>
              <form className="flex">
                <input type="email" placeholder="Enter your email" className="flex-1 bg-white/5 border border-white/10 rounded-l-md px-4 py-3 text-sm placeholder:text-white/30 outline-none focus:border-gold/50" />
                <button className="bg-gold text-noir-deep px-4 rounded-r-md hover:bg-gold-soft transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            <div className="mt-6 flex gap-2">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-md bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-noir-deep hover:border-gold transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="font-display text-lg text-white mb-4">Properties</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/properties" search={{ category: "apartment" }} className="hover:text-gold">Apartments</Link></li>
              <li><Link to="/properties" search={{ category: "luxury-apartment" }} className="hover:text-gold">Luxury Apartments</Link></li>
              <li><Link to="/properties" search={{ category: "villa" }} className="hover:text-gold">Villas</Link></li>
              <li><Link to="/properties" search={{ category: "building" }} className="hover:text-gold">Buildings</Link></li>
              <li><Link to="/properties" search={{ category: "office" }} className="hover:text-gold">Offices</Link></li>
              <li><Link to="/properties" search={{ category: "land" }} className="hover:text-gold">Lands / Plots</Link></li>
              <li><Link to="/properties" search={{ category: "studio" }} className="hover:text-gold">Studios</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-display text-lg text-white mb-4">Company</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-gold">About Us</Link></li>
              <li><Link to="/services" className="hover:text-gold">Our Services</Link></li>
              <li><Link to="/portfolio" className="hover:text-gold">Portfolio</Link></li>
              <li><Link to="/investors" className="hover:text-gold">Investors</Link></li>
              <li><Link to="/blog" className="hover:text-gold">Blog / Insights</Link></li>
              <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-display text-lg text-white mb-4">Contact Us</div>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <Phone className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <div className="text-white">+250 793 300 080</div>
                  <div className="text-xs text-white/50">Mon – Sat, 8am – 6pm</div>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <div className="text-white">info@novaworks.rw</div>
                  <div className="text-xs text-white/50">Email us anytime</div>
                </div>
              </li>
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <div className="text-white">Kigali Heights</div>
                  <div className="text-xs text-white/50">KG 7 Ave, Kimihurura<br />Kigali, Rwanda</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="container-luxe mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row gap-4 justify-between text-xs text-white/50">
          <div>© {new Date().getFullYear()} NOVAWORKS Real Estate. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold">Privacy Policy</a>
            <a href="#" className="hover:text-gold">Terms of Service</a>
            <a href="#" className="hover:text-gold">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}