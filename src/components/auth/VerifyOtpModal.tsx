import { useEffect, useRef, useState } from "react";
import { Mail, ArrowRight, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function VerifyOtpModal({
  email,
  onSuccess,
  onClose,
}: {
  email: string;
  onSuccess: () => void;
  onClose?: () => void;
}) {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(45);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const updateDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setCode(Array(6).fill("").map((_, i) => text[i] ?? ""));
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const token = code.join("");
    if (token.length !== 6) return setError("Enter all 6 digits");
    setSubmitting(true);
    const { error: err, data } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setSubmitting(false);
    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes("expired") || msg.includes("invalid")) {
        const { error: rerr } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (!rerr) {
          setError(null);
          setInfo("That code expired — a new one was sent.");
          setCooldown(45);
          setCode(Array(6).fill(""));
          inputs.current[0]?.focus();
        } else setError(rerr.message);
      } else setError(err.message);
      return;
    }
    if (data.session) onSuccess();
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    setCooldown(45);
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (err) setError(err.message);
    else setInfo("A new code was sent.");
  };

  useEffect(() => {
    if (code.every((d) => d !== "") && !submitting) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-noir-deep/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-noir/10 bg-white p-8 shadow-2xl">
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 text-noir/40 hover:text-noir" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="mx-auto h-14 w-14 rounded-full bg-gold/15 text-gold flex items-center justify-center">
          <Mail className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-center font-display text-2xl text-noir-deep">Verify your email</h2>
        <p className="mt-2 text-center text-sm text-noir/60">
          We sent a 6-digit code to <span className="font-medium text-noir-deep">{email}</span>.
          Your account will be activated once you enter it.
        </p>

        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {info && !error && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}

        <form onSubmit={verify} className="mt-6 space-y-5">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => updateDigit(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus(); }}
                className="h-14 w-12 rounded-md border border-noir/20 bg-white text-center text-2xl font-semibold text-noir-deep outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            ))}
          </div>

          <button disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gold py-3 font-semibold text-noir-deep hover:bg-gold-soft transition disabled:opacity-60">
            {submitting ? "Verifying…" : <>Confirm registration <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-noir/60">
          Didn't receive it?{" "}
          <button type="button" disabled={cooldown > 0} onClick={resend} className="inline-flex items-center gap-1 font-medium text-gold disabled:text-noir/30">
            <RefreshCw className="h-3 w-3" /> {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}