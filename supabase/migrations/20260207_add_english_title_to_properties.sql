-- Add english_title field to properties table for translations
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS english_title TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.english_title IS 'English translation of the property title';
