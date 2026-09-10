import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { X, ArrowRight, ArrowLeft, Check, Compass, Home, Building2, KeyRound, Wrench, TrendingUp, BedDouble } from "lucide-react";
import { subscribeAndSendOtp } from "@/lib/email.functions";
import { toast } from "sonner";

type Service = {
  id: string;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: { title: string; body: string }[];
};

const SERVICES: Service[] = [
  {
    id: "rent",
    label: "Rent a home",
    blurb: "Find a long-term apartment or house",
    icon: Home,
    steps: [
      { title: "Browse rentals", body: "Open Properties and filter by 'For rent', then choose your neighbourhood, budget and bedrooms." },
      { title: "Compare homes", body: "Open a listing to see the photo gallery, floor plan, amenities and the exact location on the map." },
      { title: "Reserve your dates", body: "Use the booking card on the listing to pick your move-in date. Our reception team confirms your payment and your stay starts counting from then." },
      { title: "Move in", body: "You get a confirmation email with your apartment details, payment receipt and the date your stay ends." },
    ],
  },
  {
    id: "buy",
    label: "Buy a property",
    blurb: "Apartments, villas and whole buildings",
    icon: Building2,
    steps: [
      { title: "Pick a category", body: "From the Properties menu choose apartments, villas, buildings, offices or land." },
      { title: "Shortlist", body: "Save the homes you like and compare price, size and location." },
      { title: "Request a viewing", body: "Send an inquiry from the listing page — an agent replies with viewing times." },
      { title: "Close the deal", body: "Our team handles paperwork, valuation and transfer end to end." },
    ],
  },
  {
    id: "sell",
    label: "Sell or list",
    blurb: "Put your property on NOVAWORKS",
    icon: KeyRound,
    steps: [
      { title: "Tell us about the property", body: "Use 'List your property' and fill in type, location, size and price." },
      { title: "Add photos", body: "Upload up to 15 photos per building. Our team verifies the media before it goes live." },
      { title: "Go live", body: "Once approved your listing appears on the site and in our corner adverts and newsletters." },
    ],
  },
  {
    id: "manage",
    label: "Property management",
    blurb: "We run your building for you",
    icon: Wrench,
    steps: [
      { title: "Hand over", body: "We take on tenants, rent collection, maintenance and reporting." },
      { title: "Tenants get support", body: "Residents raise service requests online and our team responds and tracks them to completion." },
      { title: "You get clarity", body: "See your income per apartment and per building in your owner dashboard." },
    ],
  },
  {
    id: "shortstay",
    label: "Short stay",
    blurb: "Furnished apartments by the night",
    icon: BedDouble,
    steps: [
      { title: "Choose your dates", body: "Pick a furnished apartment and select check-in and check-out." },
      { title: "Pay your way", body: "Pay with MoMo, Airtel Money or card. Reception confirms and your stay starts." },
      { title: "Arrive", body: "You receive your apartment number, access details and expiry date by email." },
    ],
  },
  {
    id: "invest",
    label: "Invest",
    blurb: "Returns on Kigali real estate",
    icon: TrendingUp,
    steps: [
      { title: "See the portfolio", body: "Review our completed and ongoing developments in Portfolio." },
      { title: "Study the numbers", body: "The Invest page shows yields, occupancy and growth areas." },
      { title: "Talk to us", body: "Book a call with our investment desk through Contact." },
    ],
  },
];

export function TourGuide({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const subscribe = useServerFn(subscribeAndSendOtp);
  const [service, setService] = useState<Service | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const total = service?.steps.length ?? 0;

  const next = () => {
    if (!service) return;
    if (step < total - 1) setStep(step + 1);
    else setDone(true);
  };

  const back = () => {
    if (done) { setDone(false); return; }
    if (step > 0) setStep(step - 1);
    else setService(null);
  };

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await subscribe({ data: { email: email.trim(), full_name: name.trim() || undefined } });
      toast.success("You're subscribed — check your email to confirm.");
      onClose();
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not subscribe");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-dark text-white rounded-2xl overflow-hidden shadow-2xl shadow-black/60 animate-nova-fade-up">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-gold text-[10px] uppercase tracking-[0.2em]">
            <Compass className="w-3.5 h-3.5" /> Guided tour
          </div>

          {!service && (
            <>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl">What would you like to do?</h2>
              <p className="text-white/60 text-sm mt-1">Pick one and we'll walk you through it step by step.</p>
              <div className="mt-5 grid sm:grid-cols-2 gap-2.5">
                {SERVICES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setService(s); setStep(0); }}
                      className="text-left flex items-start gap-3 p-3 rounded-xl border border-white/10 hover:border-gold/60 hover:bg-white/5 transition-colors"
                    >
                      <span className="w-9 h-9 shrink-0 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
                        <Icon className="w-4.5 h-4.5" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{s.label}</span>
                        <span className="block text-xs text-white/50">{s.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {service && !done && (
            <>
              <div className="mt-2 flex items-center justify-between">
                <h2 className="font-display text-2xl">{service.label}</h2>
                <span className="text-xs text-white/50">Step {step + 1} of {total}</span>
              </div>
              <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gold transition-all duration-300" style={{ width: `${((step + 1) / total) * 100}%` }} />
              </div>
              <div className="mt-5">
                <div className="font-display text-xl text-gold">{service.steps[step].title}</div>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{service.steps[step].body}</p>
              </div>
              <div className="mt-7 flex items-center justify-between">
                <button onClick={back} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 bg-gold text-noir-deep text-sm font-medium px-5 py-2.5 rounded-full hover:brightness-110 transition"
                >
                  {step === total - 1 ? "Finish" : "Next"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {service && done && (
            <>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl">Stay in the loop</h2>
              <p className="text-white/60 text-sm mt-1">
                That's the {service.label.toLowerCase()} journey. Subscribe and we'll send you new listings and offers.
              </p>
              <form onSubmit={onSubscribe} className="mt-5 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-gold/60"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-gold/60"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gold text-noir-deep font-medium px-5 py-3 rounded-full hover:brightness-110 transition disabled:opacity-60"
                >
                  {sending ? "Subscribing…" : <>Subscribe &amp; return home <Check className="w-4 h-4" /></>}
                </button>
              </form>
              <button onClick={back} className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to steps
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
