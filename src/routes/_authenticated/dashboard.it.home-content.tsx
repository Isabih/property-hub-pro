import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Image as ImageIcon, Plus, Trash2, Youtube, Save, Loader2 } from "lucide-react";
import { DashboardShell, Panel } from "@/components/dashboard/DashboardShell";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { getHomeContent, updateHomeContent, type HeroSlide } from "@/lib/home-content.functions";
import { CATEGORY_META, type PropertyCategory } from "@/lib/properties";
import { toast } from "sonner";

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
  { to: "/dashboard/it/home-content", label: "Homepage Content", icon: ImageIcon, group: "Content" },
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
          <Panel title="Watch Story (YouTube)" subtitle="Played when visitors click 'Watch Story' on the hero">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600 shrink-0" />
              <input
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-white border border-noir/10 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-noir/50 mt-2">Paste any YouTube share link. Vimeo and direct .mp4 URLs also work.</p>
          </Panel>

          <Panel title="Hero background video (optional)" subtitle="If set, a looping muted background video replaces the slideshow image">
            <input
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              placeholder="https://...mp4 (leave empty to use image slideshow)"
              className="w-full bg-white border border-noir/10 rounded-md px-3 py-2 text-sm"
            />
          </Panel>

          <Panel title="Hero slideshow" subtitle="These rotate on the homepage hero">
            <div className="space-y-4">
              {slides.map((s, i) => (
                <div key={i} className="grid md:grid-cols-[160px_1fr_auto] gap-4 p-4 rounded-lg border border-noir/10 bg-white">
                  <div className="aspect-[4/3] bg-noir/5 rounded overflow-hidden">
                    {s.image && <img src={s.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input value={s.image} onChange={(e) => updateSlide(i, "image", e.target.value)} placeholder="Image URL" className="sm:col-span-2 bg-noir/5 rounded px-3 py-2 text-sm" />
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
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(CATEGORY_META) as PropertyCategory[]).map((cat) => (
                <div key={cat} className="flex items-center gap-3 p-3 rounded-lg border border-noir/10 bg-white">
                  <div className="w-16 h-12 rounded bg-noir/5 overflow-hidden shrink-0">
                    {cats[cat] && <img src={cats[cat]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-noir/60">{CATEGORY_META[cat].plural}</div>
                    <input
                      value={cats[cat] ?? ""}
                      onChange={(e) => setCats((c) => ({ ...c, [cat]: e.target.value }))}
                      placeholder="Image URL"
                      className="w-full bg-noir/5 rounded px-2 py-1.5 text-sm mt-0.5"
                    />
                  </div>
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