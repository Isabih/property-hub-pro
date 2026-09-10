ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS popup_settings jsonb NOT NULL DEFAULT '{"enabled": true, "cycle_ms": 20000, "visible_ms": 8000, "max_items": 6, "property_ids": []}'::jsonb;