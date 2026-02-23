-- Add policy for public to view published properties
CREATE POLICY "Anyone can view published properties"
ON public.properties
FOR SELECT
USING (status = 'published');