-- Add multi-language fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS swedish_title TEXT,
ADD COLUMN IF NOT EXISTS swedish_description TEXT,
ADD COLUMN IF NOT EXISTS norwegian_title TEXT,
ADD COLUMN IF NOT EXISTS norwegian_description TEXT,
ADD COLUMN IF NOT EXISTS danish_title TEXT,
ADD COLUMN IF NOT EXISTS danish_description TEXT,
ADD COLUMN IF NOT EXISTS finnish_title TEXT,
ADD COLUMN IF NOT EXISTS finnish_description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.swedish_title IS 'Swedish translation of the property title';
COMMENT ON COLUMN public.properties.swedish_description IS 'Swedish translation of the property description';
COMMENT ON COLUMN public.properties.norwegian_title IS 'Norwegian translation of the property title';
COMMENT ON COLUMN public.properties.norwegian_description IS 'Norwegian translation of the property description';
COMMENT ON COLUMN public.properties.danish_title IS 'Danish translation of the property title';
COMMENT ON COLUMN public.properties.danish_description IS 'Danish translation of the property description';
COMMENT ON COLUMN public.properties.finnish_title IS 'Finnish translation of the property title';
COMMENT ON COLUMN public.properties.finnish_description IS 'Finnish translation of the property description';
