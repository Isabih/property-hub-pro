import { Play } from "lucide-react";

/**
 * Parses a YouTube URL (watch, short, embed, youtu.be) and returns the video id, or null.
 */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|v|live)\/([^/?#]+)/);
      if (m) return m[2];
    }
  } catch {
    // not a url — try raw id
    if (/^[A-Za-z0-9_-]{6,}$/.test(url)) return url;
  }
  return null;
}

export function toYouTubeEmbed(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
}

/**
 * Professional video frame for property pages.
 * - YouTube/Vimeo: embeds in a polished bezel
 * - direct .mp4/.webm: native <video> player with controls
 */
export function VideoPlayer({ url, title = "Property video", poster }: { url: string; title?: string; poster?: string }) {
  const yt = toYouTubeEmbed(url);
  const isDirect = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

  return (
    <figure className="group relative rounded-2xl overflow-hidden bg-noir-deep shadow-2xl ring-1 ring-white/5">
      <div className="relative aspect-video bg-noir">
        {yt ? (
          <iframe
            src={yt}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : isDirect ? (
          <video
            src={url}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          >
            Your browser doesn't support embedded video.
          </video>
        ) : (
          <iframe
            src={url}
            title={title}
            loading="lazy"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
      <figcaption className="flex items-center justify-between px-4 py-3 bg-noir-deep text-white/80 text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-gold/15 text-gold flex items-center justify-center">
            <Play className="h-3 w-3 fill-current" />
          </span>
          {title}
        </span>
        <span className="uppercase tracking-[0.18em] text-[10px] text-white/40">NOVAWORKS</span>
      </figcaption>
    </figure>
  );
}
