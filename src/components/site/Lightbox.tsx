import { useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxImage {
  src: string;
  label?: string;
}

export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const total = images.length;
  const go = useCallback(
    (delta: number) => onIndexChange((index + delta + total) % total),
    [index, total, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  // Prefetch neighbouring images so prev/next feels instant within the current set.
  useEffect(() => {
    if (typeof window === "undefined" || !images.length) return;
    const neighbours = [1, -1, 2, -2]
      .map((d) => images[(index + d + total) % total]?.src)
      .filter((src): src is string => !!src);
    const preloaded: HTMLImageElement[] = neighbours.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      return img;
    });
    return () => {
      preloaded.forEach((img) => { img.src = ""; });
    };
  }, [index, images, total]);

  if (!images.length) return null;
  const current = images[index];

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" role="dialog" aria-modal="true">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 text-white">
        <div className="text-sm">
          <span className="font-medium">{index + 1}</span>
          <span className="text-white/50"> / {total}</span>
          {current.label && <span className="ml-3 text-white/70">{current.label}</span>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 relative flex items-center justify-center px-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous image"
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <img
          src={current.src}
          alt={current.label ?? `Image ${index + 1}`}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />
        <button
          onClick={() => go(1)}
          aria-label="Next image"
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-2 justify-center min-w-max mx-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`w-20 h-14 rounded-md overflow-hidden border-2 transition ${
                i === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}