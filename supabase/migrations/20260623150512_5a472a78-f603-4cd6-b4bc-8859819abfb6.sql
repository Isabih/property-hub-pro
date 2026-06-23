
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS hero_slides jsonb NOT NULL DEFAULT '[
    {"image":"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85","title":"Discover","titleAccent":"Exceptional Living","subtitle":"Curated luxury properties in Rwanda''s most prestigious locations."},
    {"image":"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85","title":"Where Dreams","titleAccent":"Meet Reality","subtitle":"Premium apartments and exclusive villas designed for sophisticated living."},
    {"image":"https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=85","title":"Invest in","titleAccent":"Excellence","subtitle":"High-return property investments with guaranteed appreciation."}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS category_images jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_story_video_url text NOT NULL DEFAULT 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  ADD COLUMN IF NOT EXISTS hero_video_bg_url text;

DROP POLICY IF EXISTS "Public can read homepage settings" ON public.app_settings;
CREATE POLICY "Public can read homepage settings" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.app_settings TO anon;
