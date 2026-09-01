import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight, Phone, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, dashboardPathFor } from "@/lib/use-auth";
import { VerifyOtpModal } from "@/components/auth/VerifyOtpModal";
import { useServerFn } from "@tanstack/react-start";
import { getHomeContent } from "@/lib/home-content.functions";

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Sign in — NOVAWORKS" },
      { name: "description", content: "Sign in or create your NOVAWORKS account to access exclusive luxury listings." },
    ],
  }),
  component: AuthPage,
});

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20).optional().or(z.literal("")),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, primaryRole, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const loadHome = useServerFn(getHomeContent);
  const [heroImage, setHeroImage] = useState<string>(DEFAULT_HERO_IMAGE);
  useEffect(() => {
    loadHome().then((d) => {
      if (d?.auth_hero_image_url) setHeroImage(d.auth_hero_image_url);
    }).catch(() => {});
  }, [loadHome]);

  // Sign-in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign-up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suPassword, setSuPassword] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      // Don't pre-compute destination here — roles may not be loaded yet,
      // which would default buyer. /auth/welcome waits for roles and routes correctly.
      navigate({ to: "/auth/welcome", search: {} });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signInSchema.safeParse({ email: siEmail, password: siPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { error: err, data } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);
    if (err) {
      if (err.message.toLowerCase().includes("email not confirmed")) {
        await supabase.auth.signInWithOtp({ email: parsed.data.email, options: { shouldCreateUser: false } });
        setVerifyEmail(parsed.data.email);
        return;
      }
      setError(err.message);
      return;
    }
    if (data.session) navigate({ to: "/auth/welcome", search: { to: "" } });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signUpSchema.safeParse({
      full_name: suName,
      email: suEmail,
      phone: suPhone,
      password: suPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/welcome`,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone || null,
        },
      },
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    // Send 6-digit OTP for email verification and open the popup
    await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { shouldCreateUser: false },
    });
    setVerifyEmail(parsed.data.email);
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth/welcome",
    });
    if (result.error) setError((result.error as Error).message ?? "Google sign-in failed");
  };

  const formCard = (
    <div className="glass-dark w-full max-w-md rounded-3xl p-7 sm:p-9 text-white shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      <h1 className="font-display text-3xl">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-white/65">
        {mode === "signin"
          ? "Sign in to manage your properties, bookings and saved listings."
          : "Join NOVAWORKS to save listings, schedule visits, and list your own properties."}
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      {mode === "signin" ? (
        <form onSubmit={handleSignIn} className="mt-7 space-y-4">
          <Field label="Email address">
            <InputWithIcon icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                required
                autoComplete="email"
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/40"
              />
            </InputWithIcon>
          </Field>
          <Field
            label="Password"
            right={
              <button type="button" className="text-xs font-medium text-gold hover:underline">
                Forgot password?
              </button>
            }
          >
            <InputWithIcon icon={<Lock className="h-4 w-4" />}>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={siPassword}
                onChange={(e) => setSiPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/40"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-white/50 hover:text-white">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </InputWithIcon>
          </Field>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[color:var(--color-gold)]" />
            Remember me for 30 days
          </label>
          <button
            disabled={submitting}
            className="btn-luxury w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold text-noir-deep font-semibold py-3.5 uppercase tracking-[0.12em] text-sm disabled:opacity-60"
          >
            {submitting ? "Signing in…" : <>Sign in <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="mt-7 space-y-4">
          <Field label="Full name">
            <InputWithIcon icon={<UserIcon className="h-4 w-4" />}>
              <input required value={suName} onChange={(e) => setSuName(e.target.value)} placeholder="Your full name" className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/40" />
            </InputWithIcon>
          </Field>
          <Field label="Email address">
            <InputWithIcon icon={<Mail className="h-4 w-4" />}>
              <input required type="email" autoComplete="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/40" />
            </InputWithIcon>
          </Field>
          <Field label="Phone (optional)">
            <InputWithIcon icon={<Phone className="h-4 w-4" />}>
              <input value={suPhone} onChange={(e) => setSuPhone(e.target.value)} placeholder="+250 7XX XXX XXX" className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/40" />
            </InputWithIcon>
          </Field>
          <Field label="Password">
            <InputWithIcon icon={<Lock className="h-4 w-4" />}>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/40"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-white/50 hover:text-white">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </InputWithIcon>
          </Field>
          <button
            disabled={submitting}
            className="btn-luxury w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold text-noir-deep font-semibold py-3.5 uppercase tracking-[0.12em] text-sm disabled:opacity-60"
          >
            {submitting ? "Creating account…" : <>Create account <ArrowRight className="h-4 w-4" /></>}
          </button>
          <p className="text-xs text-white/50">
            By creating an account you agree to our terms and privacy policy. We'll email you a 6-digit code to verify your address.
          </p>
        </form>
      )}

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/15" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Or continue with</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleGoogle} className="glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition">
          <GoogleIcon /> Google
        </button>
        <button disabled className="glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white/40">
          Apple
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-white/60">
        {mode === "signin" ? (
          <>Don't have an account?{" "}
            <button type="button" onClick={() => { setError(null); setMode("signup"); }} className="text-gold font-medium hover:underline">
              Create account
            </button>
          </>
        ) : (
          <>Already have an account?{" "}
            <button type="button" onClick={() => { setError(null); setMode("signin"); }} className="text-gold font-medium hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-noir-deep">
      {/* Full-bleed cinematic background */}
      <img src={heroImage} alt="Luxury NOVAWORKS property at dusk" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-noir-deep/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-noir-deep via-noir-deep/70 to-noir-deep/40" />
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-gold/20 blur-3xl" />

      {/* Floating glass nav */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-6">
        <Link to="/" className="inline-flex items-center gap-3 w-fit">
          <div className="h-10 w-10 rounded-xl bg-gold text-noir-deep flex items-center justify-center">
            <Home className="h-5 w-5" />
          </div>
          <div className="leading-tight text-white">
            <div className="font-display text-xl tracking-wide">NOVAWORKS</div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/50">Where Prime Property Meets Peace of Mind</div>
          </div>
        </Link>
        <Link to="/" className="glass hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/15 transition">
          Back to site
        </Link>
      </header>

      {/* Split content */}
      <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-12 px-6 sm:px-10 lg:px-16 pb-16 pt-4 lg:grid-cols-2 lg:pt-10">
        <div className="hidden lg:block text-white">
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
            Premium Real Estate
          </div>
          <h2 className="mt-7 font-display text-5xl xl:text-6xl leading-[1.05]">
            Discover Your <span className="gold-text">Perfect</span><br />Address
          </h2>
          <p className="mt-6 max-w-md text-white/70 leading-relaxed">
            Sign in to access exclusive listings, manage your bookings and follow your property journey with NOVAWORKS — Kigali's trusted luxury real estate atelier.
          </p>
          <div className="mt-10 flex items-center gap-8 text-sm text-white/70">
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> Verified listings</div>
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> Secure payments</div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">{formCard}</div>
      </div>

      {verifyEmail && (
        <VerifyOtpModal
          email={verifyEmail}
          onClose={() => setVerifyEmail(null)}
          onSuccess={() => {
            setVerifyEmail(null);
            navigate({ to: "/auth/welcome", search: { to: "" } });
          }}
        />
      )}
    </div>
  );
}


function Field({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-noir-deep">{label}</span>
        {right}
      </div>
      {children}
    </label>
  );
}

function InputWithIcon({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-field flex items-center gap-2 rounded-md px-3 py-2.5">
      <span className="text-noir/40">{icon}</span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.25-1.7 3.66-5.5 3.66-3.31 0-6.02-2.74-6.02-6.12s2.71-6.12 6.02-6.12c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.86 2.94 14.66 2 12 2 6.86 2 2.7 6.16 2.7 11.3S6.86 20.6 12 20.6c6.93 0 11.5-4.87 11.5-11.72 0-.79-.09-1.39-.2-1.98H12z"/>
    </svg>
  );
}