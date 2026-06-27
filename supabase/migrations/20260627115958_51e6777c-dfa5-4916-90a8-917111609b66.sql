
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS property_categories jsonb NOT NULL DEFAULT '[
  {"key":"apartment","label":"Apartment","plural":"Apartments","description":"Modern apartments in prime locations","enabled":true},
  {"key":"luxury-apartment","label":"Luxury Apartment","plural":"Luxury Apartments","description":"Penthouses & premium residences","enabled":true},
  {"key":"villa","label":"Villa","plural":"Villas","description":"Private villas with exclusive amenities","enabled":true},
  {"key":"building","label":"Building","plural":"Buildings","description":"Full buildings & developments","enabled":true},
  {"key":"office","label":"Office","plural":"Offices","description":"Corporate spaces & headquarters","enabled":true},
  {"key":"land","label":"Land / Plot","plural":"Lands / Plots","description":"Investment land & development plots","enabled":true},
  {"key":"studio","label":"Studio","plural":"Studios","description":"Compact, refined studio living","enabled":true},
  {"key":"commercial","label":"Commercial","plural":"Commercial","description":"Retail & mixed-use commercial assets","enabled":true}
]'::jsonb;
