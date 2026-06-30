/**
 * Shared in-memory image prefetch cache with a strict concurrency cap.
 *
 * - `prefetched` records URLs that already started loading so we never
 *   issue a duplicate request, even across separate components or
 *   when the user closes and reopens the lightbox for the same section.
 * - `queue` + `active` enforce a small concurrent-download budget so we
 *   don't saturate mobile connections.
 * - `HTMLImageElement` instances are kept alive in `cache` so the
 *   browser's HTTP cache won't evict the decoded bytes too aggressively.
 */

const MAX_CONCURRENT = 3;

const cache = new Map<string, HTMLImageElement>();
const inflight = new Set<string>();
const queue: string[] = [];
let active = 0;

function pump() {
  if (typeof window === "undefined") return;
  while (active < MAX_CONCURRENT && queue.length) {
    const src = queue.shift()!;
    if (cache.has(src)) continue;
    active++;
    const img = new Image();
    img.decoding = "async";
    const done = () => {
      active--;
      inflight.delete(src);
      pump();
    };
    img.onload = done;
    img.onerror = () => {
      cache.delete(src);
      done();
    };
    cache.set(src, img);
    img.src = src;
  }
}

/** Queue a single URL for prefetch. No-op if already cached/in flight. */
export function prefetchImage(src: string | undefined | null) {
  if (!src || typeof window === "undefined") return;
  if (cache.has(src) || inflight.has(src)) return;
  inflight.add(src);
  queue.push(src);
  pump();
}

/** Queue many URLs at once, in order. */
export function prefetchImages(srcs: Array<string | undefined | null>) {
  for (const s of srcs) prefetchImage(s);
}

/** True when the URL is fully decoded in our cache. */
export function isImageReady(src: string): boolean {
  const img = cache.get(src);
  return !!img && img.complete && img.naturalWidth > 0;
}

/** Test-only / hard reset. */
export function _clearPrefetchCache() {
  cache.clear();
  inflight.clear();
  queue.length = 0;
  active = 0;
}
