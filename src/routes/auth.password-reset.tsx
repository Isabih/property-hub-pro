import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requestPasswordReset, verifyPasswordResetOtp } from "@/lib/password-reset.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/password-reset")({
  head: () => ({ meta: [{ title: "Reset password — NOVAWORKS" }] }),
  component: ResetPage,
});

function ResetPage() {
  const req = useServerFn(requestPasswordReset);
  const ver = useServerFn(verifyPasswordResetOtp);

  const [email, setEmail] = useState("");
  const [reqId, setReqId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "waiting">("email");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await req({ data: { email } });
      if (r.id) {
        setReqId(r.id);
        setStep("otp");
        toast.success("If the email exists, we've sent a code");
      } else {
        // We don't reveal whether the email exists; pretend to be at OTP step
        setReqId("unknown");
        setStep("otp");
        toast.success("If the email exists, we've sent a code");
      }
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    if (!reqId || reqId === "unknown") {
      // No real request — still pretend to succeed so attackers can't enumerate
      setStep("waiting");
      return;
    }
    setBusy(true);
    try {
      await ver({ data: { id: reqId, code } });
      setStep("waiting");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display text-3xl">Reset your password</h1>
      <p className="text-noir/60 mt-2 text-sm">Verify your email, then wait for our IT team to issue a one-time password.</p>

      {step === "email" && (
        <div className="mt-6 space-y-3">
          <input className="input-luxe" type="email" placeholder="Your account email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={submit} disabled={busy || !email} className="w-full px-5 py-2.5 rounded-md bg-noir-deep text-white text-sm disabled:opacity-60">{busy ? "Sending…" : "Send verification code"}</button>
          <p className="text-xs"><Link to="/auth" className="underline">Back to sign in</Link></p>
        </div>
      )}

      {step === "otp" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm">Enter the 6-digit code we emailed to <strong>{email}</strong>.</p>
          <input className="input-luxe text-center text-2xl tracking-[10px] font-mono" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
          <button onClick={verify} disabled={busy || code.length !== 6} className="w-full px-5 py-2.5 rounded-md bg-noir-deep text-white text-sm disabled:opacity-60">{busy ? "Verifying…" : "Verify"}</button>
        </div>
      )}

      {step === "waiting" && (
        <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-6">
          <h2 className="font-display text-xl">Waiting for IT approval</h2>
          <p className="text-sm mt-2">Your request is in our queue. Once approved, you'll receive a one-time password by email. Use it to sign in, then change your password from your account.</p>
          <p className="text-xs mt-4"><Link to="/auth" className="underline">Back to sign in</Link></p>
        </div>
      )}
    </div>
  );
}