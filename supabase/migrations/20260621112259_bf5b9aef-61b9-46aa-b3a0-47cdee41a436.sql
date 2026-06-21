ALTER TABLE public.property_images DROP CONSTRAINT IF EXISTS property_images_section_check;
ALTER TABLE public.property_images ADD CONSTRAINT property_images_section_check
  CHECK (section IN ('main','kitchen','living_room','bedroom','bathroom','gym','other'));
ALTER TABLE public.property_images ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'lovable';
ALTER TABLE public.property_images DROP CONSTRAINT IF EXISTS property_images_provider_check;
ALTER TABLE public.property_images ADD CONSTRAINT property_images_provider_check CHECK (provider IN ('lovable','r2'));