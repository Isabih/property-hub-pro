import { useMemo } from "react";
import { CheckCircle2, AlertCircle, Youtube, Film } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** When true allow empty string (treated as valid) */
  allowEmpty?: boolean;
}

export type VideoKind = "youtube" | "vimeo" | "mp4" | "webm" | null;

export function parseVideoUrl(url: string): { kind: VideoKind; embed: string | null; id?: string } {
  const u = url.trim();
  if (!u) return { kind: null, embed: null };
  // YouTube
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", id: yt[1], embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  // Vimeo
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", id: vm[1], embed: `https://player.vimeo.com/video/${vm[1]}` };
  // Direct file
  if (/\.mp4(\?|$)/i.test(u)) return { kind: "mp4", embed: u };
  if (/\.webm(\?|$)/i.test(u)) return { kind: "webm", embed: u };
  return { kind: null, embed: null };
}

export function VideoUrlInput({ value, onChange, placeholder, allowEmpty = true }: Props) {
  const parsed = useMemo(() => parseVideoUrl(value), [value]);
  const isEmpty = !value.trim();
  const valid = isEmpty ? allowEmpty : parsed.kind !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {parsed.kind === "youtube" ? (
          <Youtube className="w-5 h-5 text-red-600 shrink-0" />
        ) : (
          <Film className="w-5 h-5 text-noir/60 shrink-0" />
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "YouTube, Vimeo, or .mp4 URL"}
          className={`flex-1 bg-white border rounded-md px-3 py-2 text-sm ${valid ? "border-noir/10" : "border-red-400"}`}
        />
        {!isEmpty && (
          valid ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> {parsed.kind}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-4 h-4" /> invalid
            </span>
          )
        )}
      </div>
      {!valid && !isEmpty && (
        <p className="text-xs text-red-600">
          Supported: youtube.com / youtu.be links, vimeo.com links, or direct .mp4 / .webm URLs.
        </p>
      )}
      {valid && !isEmpty && parsed.embed && (
        <div className="aspect-video w-full max-w-md bg-noir rounded overflow-hidden">
          {parsed.kind === "mp4" || parsed.kind === "webm" ? (
            <video src={parsed.embed} controls muted playsInline className="w-full h-full object-cover" />
          ) : (
            <iframe
              src={parsed.embed}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video preview"
            />
          )}
        </div>
      )}
    </div>
  );
}