
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS sr_confirm_subject text NOT NULL DEFAULT 'We received your service request',
  ADD COLUMN IF NOT EXISTS sr_confirm_body text NOT NULL DEFAULT 'Hello {{name}},

Thank you for contacting us. We have received your {{urgency_label}} request:

"{{title}}"

Our team will follow up shortly. You can track the status anytime in your dashboard.',
  ADD COLUMN IF NOT EXISTS sr_urgent_label text NOT NULL DEFAULT 'URGENT — being handled with top priority',
  ADD COLUMN IF NOT EXISTS sr_normal_label text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS sr_reply_subject text NOT NULL DEFAULT 'Update on your service request';

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS service_requests_assigned_to_idx ON public.service_requests(assigned_to);
