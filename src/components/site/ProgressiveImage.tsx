import { useState } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  containerClassName?: string;
};

export function ProgressiveImage({ src, alt, className = "", containerClassName = "", ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && <div className="absolute inset-0 shimmer-loader" aria-hidden />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`${className} ${loaded ? "animate-img-fade-in" : "opacity-0"}`}
        {...rest}
      />
    </div>
  );
}
