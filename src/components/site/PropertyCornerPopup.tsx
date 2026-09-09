import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { X, MapPin, ArrowUpRight } from "lucide-react";
import { fetchActiveProperties } from "@/lib/properties-public";
import type { Property } from "@/lib/properties";
import { ProgressiveImage } from "./ProgressiveImage";

const CYCLE_MS = 20_000;
const VISIBLE_MS = 8_000;

export function PropertyCornerPopup() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchActiveProperties().then((rows) => {
      if (rows.length > 0) {
        const shuffled = [...rows].sort(() => Math.random() - 0.5);
        setProperties(shuffled);
      }
    }).catch(() => {});
  }, []);

  const showNext = useCallback(() => {
    if (properties.length === 0) return;
    setIndex((i) => (i + 1) % properties.length);
    setVisible(true);
    setProgress(0);
  }, [properties.length]);

  useEffect(() => {
    if (properties.length === 0 || dismissed) return;
    setVisible(true);
    const cycle = setInterval(showNext, CYCLE_MS);
    return () => clearInterval(cycle);
  }, [properties.length, dismissed, showNext]);

  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / VISIBLE_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= VISIBLE_MS) {
        setVisible(false);
        clearInterval(tick);
      }
    }, 60);
    return () => clearInterval(tick);
  }, [visible]);

  const close = () => {
    setVisible(false);
    setDismissed(true);
  };

  if (!visible || properties.length === 0) return null;

  const p = properties[index];
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] w-[320px] max-w-[calc(100vw-2rem)] animate-nova-fade-up"
      role="dialog"
      aria-label="Featured property"
    >
      <Link
        to="/properties/$slug"
        params={{ slug: p.slug }}
        className="group block relative overflow-hidden rounded-2xl glass-dark text-white shadow-2xl shadow-black/60 hover:border-gold/60 transition-all duration-300"
      >
        <button
          onClick={(e) => { e.preventDefault(); close(); }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative h-36 overflow-hidden">
          <ProgressiveImage
            src={p.image}
            alt={p.title}
            width={400}
            height={220}
            sizes="320px"
            widths={[320, 400, 600]}
            containerClassName="absolute inset-0"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-deep via-noir-deep/30 to-transparent" />
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-gold text-noir-deep text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md">
            <ArrowUpRight className="w-3 h-3" /> Featured
          </span>
        </div>

        <div className="p-4">
          <div className="font-display text-lg leading-tight group-hover:text-gold transition-colors line-clamp-1">
            {p.title}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-white/60">
            <MapPin className="w-3 h-3 text-gold" />
            {p.location}, {p.district}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="font-display text-xl text-white">
              {p.currency === "USD" ? "$" : "RWF "}
              {p.price.toLocaleString()}
              {p.priceUnit === "month" && <span className="text-sm text-white/60">/mo</span>}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-gold border border-gold/40 rounded-full px-2 py-0.5">
              View
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            className="h-full bg-gold transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Link>
    </div>
  );
}
