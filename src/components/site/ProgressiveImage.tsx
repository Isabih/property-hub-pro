import { useState } from "react";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt: string;
  containerClassName?: string;
  /** Set to "high" / eager for above-the-fold LCP images. */
  priority?: boolean;
};

/**
 * Lightweight image with skeleton + fade-in.
 * Uses native lazy-loading and async decoding so the browser's
 * image preloader, HTTP cache, and progressive decoding all work.
 */
export function ProgressiveImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  priority = false,
  loading,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && !errored && (
        <div className="absolute inset-0 shimmer-loader" aria-hidden />
      )}
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70 bg-noir-deep/60 z-10">
          Image unavailable
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading ?? (priority ? "eager" : "lazy")}
        decoding="async"
        // @ts-expect-error - fetchpriority is valid HTML, not yet in React types in all versions
        fetchpriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`${className} ${loaded ? "animate-img-fade-in" : "opacity-0"}`}
        {...rest}
      />
    </div>
  );
}