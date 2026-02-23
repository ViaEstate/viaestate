-- Add english_description field to properties table for translations
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS english_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.english_description IS 'English translation of the property description';