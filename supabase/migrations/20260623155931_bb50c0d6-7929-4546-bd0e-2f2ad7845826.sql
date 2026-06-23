ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS contact_ceo jsonb DEFAULT '{
    "name": "Jean-Paul Habimana",
    "title": "Chief Executive Officer",
    "quote": "We don''t just sell properties — we build the future of how Rwandans live, invest and call a place home.",
    "image": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=85",
    "since": "Leading NOVAWORKS since 2014"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_team jsonb DEFAULT '[
    {"name":"Aline Mukamana","role":"Head of Sales","image":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=85"},
    {"name":"Eric Niyonzima","role":"Property Manager","image":"https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=85"},
    {"name":"Sandrine Uwase","role":"Client Relations","image":"https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=85"}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_info jsonb DEFAULT '{
    "phone":"+250 793 300 080",
    "phone_hours":"Mon – Sat, 8am – 6pm",
    "email":"info@novaworks.rw",
    "email_note":"Replies within 24 hours",
    "address":"Kigali Heights, KG 7 Ave",
    "address_note":"Kimihurura, Kigali, Rwanda",
    "hours":"Mon – Sat",
    "hours_note":"8:00am – 6:00pm"
  }'::jsonb;