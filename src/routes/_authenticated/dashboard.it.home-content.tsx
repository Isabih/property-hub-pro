import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Image as ImageIcon, Plus, Trash2, Save, Loader2, Star, Building2 } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { getHomeContent, updateHomeContent, type HeroSlide } from "@/lib/home-content.functions";
import { CATEGORY_META, type PropertyCategory } from "@/lib/properties";
import { toast } from "sonner";
import { MediaInput } from "@/components/dashboard/MediaInput";
import { VideoUrlInput, parseVideoUrl } from "@/components/dashboard/VideoUrlInput";

export const Route = createFileRoute("/_authenticated/dashboard/it/home-content")({
  head: () => ({ meta: [{ title: "Homepage Content — NOVAWORKS" }] }),
  component: () => (
    <RoleGate allow={["it", "admin"]}>
      <Page />
    </RoleGate>
  ),
});

const NAV = [
  { to: "/dashboard/it", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/dashboard/properties", label: "Properties", icon: Building2, group: "Content" },
  { to: "/dashboard/it/home-content", label: "Homepage Content", icon: ImageIcon, group: "Content" },
  { to: "/dashboard/it/property-of-the-day", label: "Property of the Day", icon: Star, group: "Content" },
];

function Page() {
  const load = useServerFn(getHomeContent);
  const save = useServerFn(updateHomeContent);

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [cats, setCats] = useState<Record<string, string>>({});
  const [video, setVideo] = useState("");
  const [bg, setBg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load()
      .then((d) => {
        setSlides(d.hero_slides);
        setCats(d.category_images);
        setVideo(d.hero_story_video_url);
        setBg(d.hero_video_bg_url ?? "");
      })
      .finally(() => setLoading(false));
  }, [load]);

  const updateSlide = (i: number, k: keyof HeroSlide, v: string) =>
    setSlides((s) => s.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));

  const addSlide = () =>
    setSlides((s) => [...s, { image: "", title: "New", titleAccent: "Slide", subtitle: "Edit this slide." }]);

  const removeSlide = (i: number) => setSlides((s) => s.filter((_, idx) => idx !== i));

  const onSave = async () => {
    if (video.trim() && parseVideoUrl(video).kind === null) {
      toast.error("Watch Story URL is not a supported video link");
      return;
    }
    if (bg.trim() && parseVideoUrl(bg).kind === null) {
      toast.error("Hero background video URL is not supported");
      return;
    }
    setSaving(true);
    try {
      await save({ data: { hero_slides: slides, category_images: cats, hero_story_video_url: video, hero_video_bg_url: bg || "" } });
      toast.success("Homepage content saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="Homepage Content" subtitle="Manage hero images, category images and the Watch Story video" role="it" nav={NAV}>
      {loading ? (
        <div className="flex items-center gap-2 text-noir/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-6">
          <Panel title="Watch Story video" subtitle="Played when visitors click 'Watch Story' on the hero">
            <VideoUrlInput value={video} onChange={setVideo} placeholder="https://www.youtube.com/watch?v=..." />
          </Panel>

          <Panel title="Hero background video (optional)" subtitle="If set, replaces the slideshow image with a looping muted video">
            <VideoUrlInput value={bg} onChange={setBg} placeholder="https://...mp4 (leave empty to use image slideshow)" />
          </Panel>

          <Panel title="Hero slideshow" subtitle="These rotate on the homepage hero">
            <div className="space-y-4">
              {slides.map((s, i) => (
                <div key={i} className="grid md:grid-cols-[160px_1fr_auto] gap-4 p-4 rounded-lg border border-noir/10 bg-white">
                  <MediaInput value={s.image} onChange={(v) => updateSlide(i, "image", v)} subdir="hero" aspect="aspect-[4/3]" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input value={s.title} onChange={(e) => updateSlide(i, "title", e.target.value)} placeholder="Title line 1" className="bg-noir/5 rounded px-3 py-2 text-sm" />
                    <input value={s.titleAccent} onChange={(e) => updateSlide(i, "titleAccent", e.target.value)} placeholder="Title accent (gold)" className="bg-noir/5 rounded px-3 py-2 text-sm" />
                    <input value={s.subtitle} onChange={(e) => updateSlide(i, "subtitle", e.target.value)} placeholder="Subtitle" className="sm:col-span-2 bg-noir/5 rounded px-3 py-2 text-sm" />
                  </div>
                  <button onClick={() => removeSlide(i)} className="text-red-600 hover:text-red-700 self-start" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addSlide} className="inline-flex items-center gap-2 text-sm text-gold hover:underline">
                <Plus className="w-4 h-4" /> Add slide
              </button>
            </div>
          </Panel>

          <Panel title="Explore Property Types — images" subtitle="Image shown on each category tile (leave empty to use icon only)">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(CATEGORY_META) as PropertyCategory[]).map((cat) => (
                <div key={cat} className="p-3 rounded-lg border border-noir/10 bg-white">
                  <MediaInput
                    value={cats[cat] ?? ""}
                    onChange={(v) => setCats((c) => ({ ...c, [cat]: v }))}
                    subdir={`category/${cat}`}
                    aspect="aspect-[16/10]"
                    label={CATEGORY_META[cat].plural}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <div className="sticky bottom-4 flex justify-end">
            <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold text-noir-deep px-5 py-2.5 rounded-md font-medium shadow-lg disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}