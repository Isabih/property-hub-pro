import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requestLuxuryAccess, verifyLuxuryOtp } from "@/lib/luxury.functions";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Crown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/luxury-access")({
  head: () => ({ meta: [
    { title: "Request Luxury Access — NOVAWORKS" },
    { name: "description", content: "Verify your identity to browse our luxury portfolio." },
  ] }),
  component: LuxuryAccess,
});

function LuxuryAccess() {
  const req = useServerFn(requestLuxuryAccess);
  const ver = useServerFn(verifyLuxuryOtp);

  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [reqId, setReqId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", reason: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await req({ data: form });
      setReqId(r.id);
      setStep("otp");
      toast.success("Verification code sent to your email");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    if (!reqId || code.length !== 6) return toast.error("Enter the 6-digit code");
    setBusy(true);
    try {
      await ver({ data: { id: reqId, code } });
      setStep("done");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-[820px] bg-noir-deep text-white overflow-hidden flex items-center py-28">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=85" alt="Private luxury villa" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-noir-deep/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir-deep/95 via-noir-deep/60 to-noir-deep/30" />
      </div>
      <div className="container-luxe relative grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-xl hidden lg:block">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] text-gold"><Crown className="w-4 h-4" /> Private collection</div>
          <h1 className="font-display text-6xl mt-7 leading-none">A discreet gateway to exceptional homes.</h1>
          <p className="text-white/65 mt-6 max-w-lg text-lg">Verified clients receive private access to carefully selected residences and off-market opportunities.</p>
          <div className="mt-8 flex gap-6 text-sm text-white/65"><span className="flex items-center gap-2"><ShieldCheck className="text-gold w-4 h-4" /> Secure review</span><span className="flex items-center gap-2"><CheckCircle2 className="text-gold w-4 h-4" /> Verified listings</span></div>
        </div>
        <div className="cinematic-surface rounded-3xl p-7 sm:p-10 w-full max-w-xl lg:ml-auto">
          <h1 className="font-display text-4xl">Luxury access</h1>
          <p className="text-white/60 mt-2">Verify your email to request entry. Our team will review and respond by email.</p>

      {step === "form" && (
        <div className="mt-8 space-y-3">
          <input className="cinematic-field w-full rounded-xl px-4 py-3.5" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} />
          <input className="cinematic-field w-full rounded-xl px-4 py-3.5" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
          <input className="cinematic-field w-full rounded-xl px-4 py-3.5" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
          <textarea className="cinematic-field w-full min-h-28 rounded-xl px-4 py-3.5" placeholder="Reason for accessing luxury listings (optional)" value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} />
          <Button onClick={submit} disabled={busy} className="btn-luxury w-full h-12 bg-gradient-to-r from-gold-soft to-gold text-noir-deep hover:opacity-95">{busy ? "Sending…" : "Send verification code"}<ArrowRight /></Button>
        </div>
      )}

      {step === "otp" && (
        <div className="mt-8 space-y-3">
          <p className="text-sm">Enter the 6-digit code we just emailed to <strong>{form.email}</strong>.</p>
          <input className="cinematic-field w-full rounded-xl px-4 py-3.5 text-center text-2xl tracking-[10px] font-mono" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
          <Button onClick={verify} disabled={busy} className="w-full h-12">{busy ? "Verifying…" : "Verify"}</Button>
        </div>
      )}

      {step === "done" && (
        <div className="mt-8 rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-6">
          <h2 className="font-display text-2xl">Verified ✓</h2>
          <p className="mt-2 text-sm">Thank you. Your request is now with our team. When approved you'll receive an access link by email to unlock luxury listings.</p>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}