import { useEffect, useState } from "react";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt: string;
  containerClassName?: string;
};

export function ProgressiveImage({ src, alt, className = "", containerClassName = "", ...rest }: Props) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;
    setProgress(0);
    setLoaded(false);
    setErrored(false);

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const total = Number(res.headers.get("content-length")) || 0;
        if (!res.body || !total) {
          // Fallback: no streaming or unknown size — fake a quick progress
          const blob = await res.blob();
          if (cancelled) return;
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
          setProgress(100);
          return;
        }
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (!cancelled) setProgress(Math.min(99, Math.round((received / total) * 100)));
          }
        }
        if (cancelled) return;
        const blob = new Blob(chunks as BlobPart[]);
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setProgress(100);
      } catch {
        if (!cancelled) setErrored(true);
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [src]);

  const status = errored
    ? "Image unavailable"
    : progress < 100
    ? `Loading image… ${progress}%`
    : !loaded
    ? "Rendering…"
    : "";

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && (
        <div className="absolute inset-0 shimmer-loader" aria-hidden />
      )}
      {!loaded && !errored && (
        <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
          <div className="h-1 bg-black/30">
            <div
              className="h-full bg-gradient-to-r from-gold-soft to-gold transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/85 bg-gradient-to-b from-black/55 to-transparent">
            <span>{status}</span>
            <span className="font-mono">{progress}%</span>
          </div>
        </div>
      )}
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70 bg-noir-deep/60 z-10">
          {status}
        </div>
      )}
      {blobUrl && (
        <img
          src={blobUrl}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`${className} ${loaded ? "animate-img-fade-in" : "opacity-0"}`}
          {...rest}
        />
      )}
    </div>
  );
}
