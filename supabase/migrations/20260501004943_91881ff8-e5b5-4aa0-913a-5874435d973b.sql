-- Add image support to messages
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Add read tracking on tickets
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS read_by_admin boolean NOT NULL DEFAULT false;

-- Allow admin to delete tickets and messages
CREATE POLICY "Admins can delete tickets"
ON public.support_tickets FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete messages"
ON public.support_messages FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for support images
INSERT INTO storage.buckets (id, name, public) VALUES ('support-images', 'support-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own support images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own support images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'support-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Admins delete support images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'support-images' AND has_role(auth.uid(), 'admin'::app_role));
