-- Migration: Add missing columns for Grekodom Cyprus import
-- Run this in Supabase SQL Editor to fix the import issues

-- Add agent contact columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_email TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_phone TEXT;

-- Add reference column for property reference numbers
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE;

-- Add additional property details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS distance_sea INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS distance_airport INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS xml_object_id TEXT UNIQUE;

-- Make seller_id nullable if it exists
ALTER TABLE properties ALTER COLUMN seller_id DROP NOT NULL;

-- Create index on xml_object_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_xml_object_id ON properties(xml_object_id);
CREATE INDEX IF NOT EXISTS idx_properties_reference ON properties(reference);

-- Create the property-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;
