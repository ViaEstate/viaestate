-- Manual SQL Migration for English Translations
-- Run this in your Supabase SQL Editor

-- Add english_description field to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS english_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.english_description IS 'English translation of the property description';

-- Create translation function (optional - for manual translation)
CREATE OR REPLACE FUNCTION translate_property_descriptions()
RETURNS TEXT AS $$
BEGIN
    -- This function can be called to trigger translation of existing properties
    -- The actual translation logic would need to be implemented in an Edge Function
    RETURN 'Translation function created. Use the admin panel or Edge Function for actual translation.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION translate_property_descriptions() TO authenticated;