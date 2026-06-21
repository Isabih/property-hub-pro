import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MediaCheckResult {
  url: string;
  kind: "image" | "video";
  section: string | null;
  property_id: string;
  property_title: string | null;
  status: number;
  ok: boolean;
  content_type: string | null;
  bytes: number | null;
  error?: string;
}

async function headCheck(url: string): Promise<Pick<MediaCheckResult, "status" | "ok" | "content_type" | "bytes" | "error">> {
  try {
    let r = await fetch(url, { method: "HEAD", redirect: "follow" });
    // Some CDNs (R2 dev) don't fully implement HEAD; fall back to ranged GET
    if (r.status === 405 || r.status === 501) {
      r = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, redirect: "follow" });
    }
    const len = r.headers.get("content-length");
    return {
      status: r.status,
      ok: r.ok || r.status === 206,
      content_type: r.headers.get("content-type"),
      bytes: len ? Number(len) : null,
    };
  } catch (e: any) {
    return { status: 0, ok: false, content_type: null, bytes: null, error: String(e?.message ?? e) };
  }
}

export const verifyPropertyMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { propertyId?: string }) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Authorize: it or admin only
    const [{ data: isIt }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "it" as any }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" as any }),
    ]);
    if (!isIt && !isAdmin) throw new Error("Forbidden");

    // Gather properties (optionally filter to one)
    const propsQuery = supabase.from("properties").select("id, title, video_url").order("created_at", { ascending: false });
    const { data: props, error: pErr } = data.propertyId
      ? await propsQuery.eq("id", data.propertyId)
      : await propsQuery.limit(200);
    if (pErr) throw pErr;

    const propIds = (props ?? []).map((p) => p.id);
    if (propIds.length === 0) return { checked: 0, broken: 0, results: [] as MediaCheckResult[] };

    const { data: images, error: iErr } = await supabase
      .from("property_images")
      .select("property_id, url, section, sort_order")
      .in("property_id", propIds);
    if (iErr) throw iErr;

    const propMap = new Map((props ?? []).map((p) => [p.id, p]));

    const tasks: Promise<MediaCheckResult>[] = [];

    for (const img of images ?? []) {
      const p = propMap.get(img.property_id);
      tasks.push(
        headCheck(img.url).then((c) => ({
          url: img.url,
          kind: "image" as const,
          section: img.section ?? null,
          property_id: img.property_id,
          property_title: p?.title ?? null,
          ...c,
        })),
      );
    }

    for (const p of props ?? []) {
      if (!p.video_url) continue;
      // YouTube/Vimeo iframes can't be HEAD-checked reliably; mark known providers as ok by URL pattern
      const isYouTube = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(p.video_url);
      const isVimeo = /vimeo\.com/i.test(p.video_url);
      if (isYouTube || isVimeo) {
        tasks.push(
          Promise.resolve({
            url: p.video_url,
            kind: "video" as const,
            section: "video",
            property_id: p.id,
            property_title: p.title,
            status: 200,
            ok: true,
            content_type: isYouTube ? "video/youtube" : "video/vimeo",
            bytes: null,
          }),
        );
      } else {
        tasks.push(
          headCheck(p.video_url).then((c) => ({
            url: p.video_url!,
            kind: "video" as const,
            section: "video",
            property_id: p.id,
            property_title: p.title,
            ...c,
          })),
        );
      }
    }

    const results = await Promise.all(tasks);
    const broken = results.filter((r) => !r.ok).length;
    return { checked: results.length, broken, results };
  });
