-- Create storage bucket for baby photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('baby-photos', 'baby-photos', true);

-- RLS policies for storage.objects
CREATE POLICY "Users can view baby photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'baby-photos');

CREATE POLICY "Editors can upload baby photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'baby-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Editors can update baby photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'baby-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Editors can delete baby photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'baby-photos' AND auth.uid() IS NOT NULL);