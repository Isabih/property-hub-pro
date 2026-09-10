import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { X, MapPin, ArrowUpRight } from "lucide-react";
import { fetchActiveProperties } from "@/lib/properties-public";
import type { Property } from "@/lib/properties";
import { getPopupSettings, POPUP_DEFAULTS, type PopupSettings } from "@/lib/popup-settings.functions";
import { ProgressiveImage } from "./ProgressiveImage";

export function PropertyCornerPopup() {
  const [settings, setSettings] = useState<PopupSettings>(POPUP_DEFAULTS);
  const [properties, setProperties] = useState<Property[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getPopupSettings(), fetchActiveProperties()])
      .then(([s, rows]) => {
        if (!active) return;
        setSettings(s);
        if (!s.enabled) return;
        const pool = s.property_ids.length > 0 ? rows.filter((r) => s.property_ids.includes(r.id)) : rows;
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, s.max_items);
        setProperties(shuffled);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const showNext = useCallback(() => {
    if (properties.length === 0) return;
    setIndex((i) => (i + 1) % properties.length);
    setVisible(true);
    setProgress(0);
  }, [properties.length]);

  useEffect(() => {
    if (properties.length === 0 || dismissed || !settings.enabled) return;
    setVisible(true);
    const cycle = setInterval(showNext, settings.cycle_ms);
    return () => clearInterval(cycle);
  }, [properties.length, dismissed, showNext, settings.enabled, settings.cycle_ms]);

  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / settings.visible_ms) * 100, 100);
      setProgress(pct);
      if (elapsed >= settings.visible_ms) {
        setVisible(false);
        clearInterval(tick);
      }
    }, 60);
    return () => clearInterval(tick);
  }, [visible, settings.visible_ms]);

  const close = () => {
    setVisible(false);
    setDismissed(true);
  };

  if (!visible || properties.length === 0) return null;

  const p = properties[index];
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] w-[220px] max-w-[calc(100vw-2rem)] animate-nova-fade-up"
      role="dialog"
      aria-label="Featured property"
    >
      <Link
        to="/properties/$slug"
        params={{ slug: p.slug }}
        className="group block relative overflow-hidden rounded-xl glass-dark text-white shadow-xl shadow-black/50 hover:border-gold/60 transition-all duration-300"
      >
        <button
          onClick={(e) => { e.preventDefault(); close(); }}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="relative h-20 overflow-hidden">
          <ProgressiveImage
            src={p.image}
            alt={p.title}
            width={300}
            height={160}
            sizes="220px"
            widths={[220, 300, 440]}
            containerClassName="absolute inset-0"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-deep via-noir-deep/30 to-transparent" />
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 bg-gold text-noir-deep text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded">
            <ArrowUpRight className="w-2.5 h-2.5" /> Featured
          </span>
        </div>

        <div className="p-2.5">
          <div className="font-display text-sm leading-tight group-hover:text-gold transition-colors line-clamp-1">
            {p.title}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/60">
            <MapPin className="w-2.5 h-2.5 text-gold" />
            <span className="line-clamp-1">{p.location}{p.district ? `, ${p.district}` : ""}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="font-display text-sm text-white">
              {p.currency === "USD" ? "$" : "RWF "}
              {p.price.toLocaleString()}
              {p.priceUnit === "month" && <span className="text-[10px] text-white/60">/mo</span>}
            </div>
            <span className="text-[9px] uppercase tracking-wider text-gold border border-gold/40 rounded-full px-1.5 py-0.5">
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
