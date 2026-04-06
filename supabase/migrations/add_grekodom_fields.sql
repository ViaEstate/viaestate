-- Migration: Add Grekodom extra fields to properties table
-- Run this in Supabase SQL Editor to enable Grekodom XML import

-- Add source field (to track which XML feed the property came from)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS source TEXT;

-- Add url field (link to original listing)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS url TEXT;

-- Add distance to airport (in km)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS distance_airport INTEGER;

-- Add agent name
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_name TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('source', 'url', 'distance_airport', 'agent_name');
