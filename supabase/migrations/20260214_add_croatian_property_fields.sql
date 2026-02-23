-- Add Croatian language fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS croatian_title TEXT,
ADD COLUMN IF NOT EXISTS croatian_description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.croatian_title IS 'Croatian translation of the property title';
COMMENT ON COLUMN public.properties.croatian_description IS 'Croatian translation of the property description';
